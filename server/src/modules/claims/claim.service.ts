import prisma from "../../lib/prisma.js";
import ApiError from "../../utils/ApiError.js";
import type {
    SubmitClaimInput,
    ReviewClaimInput,
    GetClaimsQueryInput
} from "./claim.validators.js";

/**
 * Format a Prisma Claim structure into the response Claim format.
 */
const formatClaim = (claim: any) => {
    return {
        id: claim.id,
        policyId: claim.policyId,
        claimAmount: Number(claim.claimAmount),
        reason: claim.reason,
        description: claim.description,
        incidentDate: claim.incidentDate,
        status: claim.status,
        reviewedBy: claim.reviewedBy,
        reviewedAt: claim.reviewedAt,
        remarks: claim.remarks,
        submissionDate: claim.submissionDate,
        createdAt: claim.createdAt,
        updatedAt: claim.updatedAt,
        policy: claim.policy ? {
            id: claim.policy.id,
            policyNumber: claim.policy.policyNumber,
            policyType: claim.policy.policyType,
            coverageAmount: Number(claim.policy.coverageAmount),
            premiumAmount: Number(claim.policy.premiumAmount),
            startDate: claim.policy.startDate,
            endDate: claim.policy.endDate,
            status: claim.policy.status
        } : null,
        customer: claim.policy?.customer ? {
            id: claim.policy.customer.id,
            dob: claim.policy.customer.dob,
            phone: claim.policy.customer.phone,
            address: claim.policy.customer.address,
            city: claim.policy.customer.city,
            state: claim.policy.customer.state,
            pincode: claim.policy.customer.pincode,
            user: claim.policy.customer.user ? {
                id: claim.policy.customer.user.id,
                name: claim.policy.customer.user.name,
                email: claim.policy.customer.user.email,
                role: claim.policy.customer.user.role,
                isActive: claim.policy.customer.user.isActive
            } : null
        } : null,
        agent: claim.policy?.agent ? {
            id: claim.policy.agent.id,
            name: claim.policy.agent.name,
            email: claim.policy.agent.email,
            role: claim.policy.agent.role,
            isActive: claim.policy.agent.isActive
        } : null
    };
};

/**
 * Submit a claim.
 */
export const submitClaim = async (data: SubmitClaimInput, userId: string) => {
    // 1. Verify Customer profile exists for the logged in user
    const customer = await prisma.customer.findUnique({
        where: { userId }
    });

    if (!customer) {
        throw new ApiError(404, "Customer profile not found.");
    }

    // 2. Verify Policy exists
    const policy = await prisma.policy.findUnique({
        where: { id: data.policyId }
    });

    if (!policy) {
        throw new ApiError(404, "Policy not found.");
    }

    // 3. Verify Customer owns the policy
    if (policy.customerId !== customer.id) {
        throw new ApiError(403, "You can only submit claims for your own policies.");
    }

    // 4. Verify Policy status (Cannot claim if CANCELLED)
    if (policy.status === "CANCELLED") {
        throw new ApiError(400, "Cannot submit a claim for a CANCELLED policy.");
    }

    // Automatically expire active policies with past end dates
    const today = new Date();
    if (policy.status === "ACTIVE" && new Date(policy.endDate) < today) {
        await prisma.policy.update({
            where: { id: policy.id },
            data: { status: "EXPIRED" }
        });
        throw new ApiError(400, "Cannot submit a claim for an EXPIRED policy.");
    }

    if (policy.status === "EXPIRED" || new Date(policy.endDate) < today) {
        throw new ApiError(400, "Cannot submit a claim for an EXPIRED policy.");
    }

    if (policy.status !== "ACTIVE") {
        throw new ApiError(400, `Cannot submit a claim for a ${policy.status} policy.`);
    }

    // 5. Ensure no other pending claim exists for the same incident date on this policy
    const pendingClaim = await prisma.claim.findFirst({
        where: {
            policyId: data.policyId,
            incidentDate: data.incidentDate,
            status: "PENDING"
        }
    });

    if (pendingClaim) {
        throw new ApiError(409, "A pending claim already exists for this incident date.");
    }

    // 6. Create the claim record
    const claim = await prisma.claim.create({
        data: {
            policyId: data.policyId,
            claimAmount: data.claimAmount,
            reason: data.reason,
            description: data.description,
            incidentDate: data.incidentDate,
            status: "PENDING"
        },
        include: {
            policy: {
                include: {
                    customer: {
                        include: {
                            user: true
                        }
                    },
                    agent: true
                }
            }
        }
    });

    return formatClaim(claim);
};

/**
 * Return claims list with pagination, search, sorting, and filtering.
 */
export const getClaimsList = async (query: GetClaimsQueryInput, user: any) => {
    const { page, limit, search, sort, order, status, policyId, customerId, agentId } = query;

    const where: any = {};

    // 1. Role-based scoping
    if (user.role === "CUSTOMER") {
        where.policy = { customer: { userId: user.id } };
    } else if (user.role === "AGENT") {
        where.policy = { agentId: user.id };
    }

    // 2. Query filters
    if (status) {
        where.status = status;
    }
    if (policyId) {
        where.policyId = policyId;
    }
    if (customerId) {
        where.policy = { ...where.policy, customerId };
    }
    if (agentId) {
        where.policy = { ...where.policy, agentId };
    }

    // 3. Search filter
    if (search) {
        const searchFilter = { contains: search, mode: "insensitive" as const };
        where.OR = [
            { reason: searchFilter },
            { policy: { policyNumber: searchFilter } },
            { policy: { customer: { user: { name: searchFilter } } } },
            { policy: { customer: { user: { email: searchFilter } } } }
        ];
    }

    // 4. Sorting configuration
    const validSortFields = [
        "id",
        "claimAmount",
        "status",
        "incidentDate",
        "submissionDate",
        "createdAt",
        "updatedAt"
    ];

    let orderBy: any = {};
    if (sort === "customerName") {
        orderBy = { policy: { customer: { user: { name: order } } } };
    } else if (sort === "policyNumber") {
        orderBy = { policy: { policyNumber: order } };
    } else if (sort === "agentName") {
        orderBy = { policy: { agent: { name: order } } };
    } else {
        const sortBy = validSortFields.includes(sort) ? sort : "createdAt";
        orderBy = { [sortBy]: order };
    }

    // 5. Pagination
    const skip = (page - 1) * limit;

    const [total, claims] = await Promise.all([
        prisma.claim.count({ where }),
        prisma.claim.findMany({
            where,
            orderBy,
            skip,
            take: limit,
            include: {
                policy: {
                    include: {
                        customer: {
                            include: {
                                user: true
                            }
                        },
                        agent: true
                    }
                },
                reviewedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            }
        })
    ]);

    const formattedClaims = claims.map(formatClaim);
    const totalPages = Math.ceil(total / limit);

    return {
        claims: formattedClaims,
        pagination: {
            page,
            limit,
            total,
            totalPages
        }
    };
};

/**
 * Return complete claim details.
 */
export const getClaimDetails = async (id: string, user: any) => {
    const claim = await prisma.claim.findUnique({
        where: { id },
        include: {
            policy: {
                include: {
                    customer: {
                        include: {
                            user: true
                        }
                    },
                    agent: true
                },
                reviewedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            }
        }
    });

    if (!claim) {
        throw new ApiError(404, "Claim not found.");
    }

    // Role-based authorization check
    if (user.role === "CUSTOMER" && claim.policy.customer.userId !== user.id) {
        throw new ApiError(403, "You are not authorized to view this claim.");
    }
    if (user.role === "AGENT" && claim.policy.agentId !== user.id) {
        throw new ApiError(403, "You are not authorized to view this claim.");
    }

    return formatClaim(claim);
};

/**
 * Review a claim (APPROVE or REJECT).
 */
export const reviewClaim = async (id: string, data: ReviewClaimInput, user: any) => {
    const claim = await prisma.claim.findUnique({
        where: { id },
        include: {
            policy: true
        }
    });

    if (!claim) {
        throw new ApiError(404, "Claim not found.");
    }

    // Role-based authorization check: Only ADMIN or AGENT assigned to policy
    if (user.role === "AGENT" && claim.policy.agentId !== user.id) {
        throw new ApiError(403, "You can only review claims for policies assigned to you.");
    }

    // Prevent reviewing already reviewed claims
    if (claim.status !== "PENDING") {
        throw new ApiError(400, "This claim has already been reviewed.");
    }

    // Update claim status, remarks, and audit fields
    const updatedClaim = await prisma.claim.update({
        where: { id },
        data: {
            status: data.status,
            remarks: data.remarks,
            reviewedById: user.id,
            reviewedAt: new Date()
        },
        include: {
            policy: {
                include: {
                    customer: {
                        include: {
                            user: true
                        }
                    },
                    agent: true
                }
            },
            reviewedBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true
                }
            }
        }
    });

    return formatClaim(updatedClaim);
};
