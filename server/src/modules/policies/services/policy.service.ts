import prisma from "../../../lib/prisma.js";
import ApiError from "../../../utils/ApiError.js";
import type {
    CreatePolicyInput,
    UpdatePolicyInput,
    RenewPolicyInput,
    GetPoliciesQueryInput
} from "../validators/policy.validators.js";

/**
 * Generate a YYYYMMDD string for policy number generation.
 */
const getTodayDateString = (): string => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}${mm}${dd}`;
};

/**
 * Helper to generate the next unique sequential policy number for today.
 */
const generateNextPolicyNumber = async (): Promise<string> => {
    const todayStr = getTodayDateString();
    const prefix = `POL-${todayStr}-`;

    const latestPolicy = await prisma.policy.findFirst({
        where: {
            policyNumber: {
                startsWith: prefix,
            },
        },
        orderBy: {
            policyNumber: "desc",
        },
        select: {
            policyNumber: true,
        },
    });

    let nextSeq = 1;
    if (latestPolicy) {
        const parts = latestPolicy.policyNumber.split("-");
        const suffixStr = parts[parts.length - 1];
        const currentSeq = parseInt(suffixStr, 10);
        if (!isNaN(currentSeq)) {
            nextSeq = currentSeq + 1;
        }
    }

    const nextSeqStr = String(nextSeq).padStart(4, "0");
    return `${prefix}${nextSeqStr}`;
};

/**
 * Create a new insurance policy.
 */
export const createPolicy = async (data: CreatePolicyInput) => {
    // Verify Customer exists
    const customer = await prisma.customer.findUnique({
        where: { id: data.customerId }
    });

    if (!customer) {
        throw new ApiError(404, "Customer profile not found.");
    }

    // Verify Agent exists
    const agent = await prisma.user.findUnique({
        where: { id: data.agentId }
    });

    if (!agent) {
        throw new ApiError(404, "Agent not found.");
    }

    if (agent.role !== "AGENT") {
        throw new ApiError(400, "Assigned user must be an AGENT.");
    }

    // Concurrency handling loop
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
        try {
            const policyNumber = await generateNextPolicyNumber();

            const policy = await prisma.policy.create({
                data: {
                    customerId: data.customerId,
                    agentId: data.agentId,
                    policyNumber,
                    policyType: data.policyType,
                    coverageAmount: data.coverageAmount,
                    premiumAmount: data.premiumAmount,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    status: "ACTIVE"
                },
                include: {
                    customer: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    role: true,
                                    isActive: true
                                }
                            }
                        }
                    },
                    agent: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                            isActive: true
                        }
                    }
                }
            });

            return policy;
        } catch (error: any) {
            // Prisma code P2002 represents unique constraint violation
            if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
                attempts++;
                if (attempts >= maxAttempts) {
                    throw new ApiError(409, "Failed to generate a unique policy number due to high concurrency. Please try again.");
                }
            } else {
                throw error;
            }
        }
    }
};

/**
 * Return all policies with pagination, search, sorting, and filters.
 */
export const getPoliciesList = async (query: GetPoliciesQueryInput) => {
    const { page, limit, search, sort, order, status, policyType, agentId, customerId } = query;

    // Automatically expire active policies with past end dates
    const today = new Date();
    await prisma.policy.updateMany({
        where: {
            status: "ACTIVE",
            endDate: {
                lt: today
            }
        },
        data: {
            status: "EXPIRED"
        }
    });

    const where: any = {};

    if (status) {
        where.status = status;
    }
    if (policyType) {
        where.policyType = policyType;
    }
    if (agentId) {
        where.agentId = agentId;
    }
    if (customerId) {
        where.customerId = customerId;
    }

    if (search) {
        where.OR = [
            { policyNumber: { contains: search, mode: "insensitive" } },
            { customer: { user: { name: { contains: search, mode: "insensitive" } } } },
            { customer: { user: { email: { contains: search, mode: "insensitive" } } } },
            { agent: { name: { contains: search, mode: "insensitive" } } },
            { agent: { email: { contains: search, mode: "insensitive" } } }
        ];
    }

    const validSortFields = [
        "id",
        "policyNumber",
        "policyType",
        "coverageAmount",
        "premiumAmount",
        "startDate",
        "endDate",
        "status",
        "createdAt",
        "updatedAt"
    ];

    let orderBy: any = {};
    if (sort === "customerName") {
        orderBy = { customer: { user: { name: order } } };
    } else if (sort === "agentName") {
        orderBy = { agent: { name: order } };
    } else {
        const sortBy = validSortFields.includes(sort) ? sort : "createdAt";
        orderBy = { [sortBy]: order };
    }

    const skip = (page - 1) * limit;

    const [total, policies] = await Promise.all([
        prisma.policy.count({ where }),
        prisma.policy.findMany({
            where,
            orderBy,
            skip,
            take: limit,
            include: {
                customer: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true,
                                isActive: true
                            }
                        }
                    }
                },
                agent: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        isActive: true
                    }
                }
            }
        })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
        policies,
        pagination: {
            page,
            limit,
            total,
            totalPages
        }
    };
};

/**
 * Return complete policy details.
 */
export const getPolicyDetails = async (id: string) => {
    // Automatically expire active policies with past end dates
    const today = new Date();
    await prisma.policy.updateMany({
        where: {
            status: "ACTIVE",
            endDate: {
                lt: today
            }
        },
        data: {
            status: "EXPIRED"
        }
    });

    const policy = await prisma.policy.findUnique({
        where: { id },
        include: {
            customer: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                            isActive: true
                        }
                    }
                }
            },
            agent: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    isActive: true
                }
            },
            _count: {
                select: {
                    payments: true,
                    claims: true
                }
            }
        }
    });

    if (!policy) {
        throw new ApiError(404, "Policy not found.");
    }

    return {
        ...policy,
        premiumCount: policy._count?.payments ?? 0,
        claimCount: policy._count?.claims ?? 0,
        _count: undefined
    };
};

/**
 * Update policy information.
 */
export const updatePolicy = async (id: string, data: UpdatePolicyInput) => {
    const policy = await prisma.policy.findUnique({
        where: { id }
    });

    if (!policy) {
        throw new ApiError(404, "Policy not found.");
    }

    if (data.endDate) {
        const startDate = new Date(policy.startDate);
        if (data.endDate <= startDate) {
            throw new ApiError(400, "End date must be after the policy start date.");
        }
    }

    const updatedPolicy = await prisma.policy.update({
        where: { id },
        data: {
            coverageAmount: data.coverageAmount,
            premiumAmount: data.premiumAmount,
            endDate: data.endDate
        },
        include: {
            customer: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                            isActive: true
                        }
                    }
                }
            },
            agent: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    isActive: true
                }
            }
        }
    });

    return updatedPolicy;
};

/**
 * Renew an existing policy.
 */
export const renewPolicy = async (id: string, data: RenewPolicyInput) => {
    const policy = await prisma.policy.findUnique({
        where: { id }
    });

    if (!policy) {
        throw new ApiError(404, "Policy not found.");
    }

    if (policy.status === "CANCELLED") {
        throw new ApiError(400, "Cancelled policies cannot be renewed.");
    }

    const currentEndDate = new Date(policy.endDate);
    const newEndDate = new Date(data.endDate);

    if (newEndDate <= currentEndDate) {
        throw new ApiError(400, "New end date must be after the current policy end date.");
    }

    const updatedPolicy = await prisma.policy.update({
        where: { id },
        data: {
            endDate: data.endDate,
            status: "ACTIVE"
        },
        include: {
            customer: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                            isActive: true
                        }
                    }
                }
            },
            agent: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    isActive: true
                }
            }
        }
    });

    return updatedPolicy;
};

/**
 * Cancel a policy.
 */
export const cancelPolicy = async (id: string) => {
    const policy = await prisma.policy.findUnique({
        where: { id }
    });

    if (!policy) {
        throw new ApiError(404, "Policy not found.");
    }

    if (policy.status === "CANCELLED") {
        throw new ApiError(400, "Policy is already cancelled.");
    }

    const updatedPolicy = await prisma.policy.update({
        where: { id },
        data: {
            status: "CANCELLED"
        },
        include: {
            customer: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                            isActive: true
                        }
                    }
                }
            },
            agent: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    isActive: true
                }
            }
        }
    });

    return updatedPolicy;
};
