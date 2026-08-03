import prisma from "../../../lib/prisma.js";
import ApiError from "../../../utils/ApiError.js";
import type {
    CreatePaymentInput,
    ListPaymentsQueryInput
} from "../validators/payment.validators.js";

/**
 * Safe helper to generate monthly due dates from startDate to endDate.
 */
export const getPolicyDueDates = (startDate: Date, endDate: Date): Date[] => {
    const dueDates: Date[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const year = start.getFullYear();
    const month = start.getMonth();
    const day = start.getDate();
    
    let index = 0;
    while (true) {
        // Calculate the expected date for this month offset
        const date = new Date(year, month + index, day);
        
        // Handle month-end day overflow (e.g. Jan 31 + 1 month -> Feb 28/29)
        const targetMonth = (month + index) % 12;
        const normalizedTargetMonth = targetMonth < 0 ? targetMonth + 12 : targetMonth;
        if (date.getMonth() !== normalizedTargetMonth) {
            date.setDate(0);
        }
        
        if (date > end) {
            break;
        }
        dueDates.push(date);
        index++;
    }
    return dueDates;
};

/**
 * Format date to YYYY-MM.
 */
const getBillingCycleString = (date: Date): string => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}`;
};

/**
 * Synchronize policy payment slots in the database.
 * Generates PENDING payment records for all expected monthly due dates.
 */
export const syncPolicySchedule = async (policyId: string) => {
    const policy = await prisma.policy.findUnique({
        where: { id: policyId }
    });
    if (!policy) return;

    const expectedDueDates = getPolicyDueDates(policy.startDate, policy.endDate);

    // Fetch existing payments
    const existingPayments = await prisma.premiumPayment.findMany({
        where: { policyId }
    });

    const existingDueDatesSet = new Set(
        existingPayments.map((p) => p.dueDate.toISOString())
    );

    const missingPaymentsData = expectedDueDates
        .filter((dueDate) => !existingDueDatesSet.has(dueDate.toISOString()))
        .map((dueDate) => ({
            policyId,
            amount: policy.premiumAmount,
            dueDate,
            status: "PENDING" as const,
            billingCycle: getBillingCycleString(dueDate)
        }));

    if (missingPaymentsData.length > 0) {
        await prisma.premiumPayment.createMany({
            data: missingPaymentsData
        });
    }
};

/**
 * Helper to sync schedules for policies within a user's scope.
 */
const syncPoliciesForUser = async (user: any, filterPolicyId?: string, filterCustomerId?: string, filterAgentId?: string) => {
    const policyWhere: any = {};
    if (user.role === "CUSTOMER") {
        policyWhere.customer = { userId: user.id };
    } else if (user.role === "AGENT") {
        policyWhere.agentId = user.id;
    }

    if (filterPolicyId) {
        policyWhere.id = filterPolicyId;
    }
    if (filterCustomerId) {
        policyWhere.customerId = filterCustomerId;
    }
    if (filterAgentId) {
        policyWhere.agentId = filterAgentId;
    }

    // Only sync ACTIVE policies
    policyWhere.status = "ACTIVE";

    const policies = await prisma.policy.findMany({
        where: policyWhere,
        select: { id: true }
    });

    await Promise.all(policies.map((p) => syncPolicySchedule(p.id)));
};

/**
 * Map Prisma PremiumPayment structure to Response Payment format.
 */
const formatPayment = (payment: any) => {
    let currentStatus = payment.status;
    if (payment.status === "PENDING" && new Date(payment.dueDate) < new Date()) {
        currentStatus = "OVERDUE";
    }

    return {
        id: payment.id,
        amount: Number(payment.amount),
        dueDate: payment.dueDate,
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId,
        status: currentStatus,
        policyId: payment.policyId,
        policyNumber: payment.policy?.policyNumber ?? null,
        customerName: payment.policy?.customer?.user?.name ?? null,
        createdAt: payment.createdAt
    };
};

/**
 * Record a premium payment.
 */
export const recordPayment = async (data: CreatePaymentInput, user: any) => {
    // 1. Verify policy exists
    const policy = await prisma.policy.findFirst({
        where: {
            OR: [
                { id: data.policyId },
                { policyNumber: data.policyId }
            ]
        },
        include: {
            customer: {
                select: {
                    id: true,
                    userId: true
                }
            }
        }
    });

    if (!policy) {
        throw new ApiError(404, "Policy not found.");
    }

    // 2. Verify customer profile exists
    if (!policy.customer) {
        throw new ApiError(404, "Customer associated with this policy not found.");
    }

    // 3. Authorization check for Customer
    if (user.role === "CUSTOMER") {
        if (policy.customer.userId !== user.id) {
            throw new ApiError(403, "You can only pay premiums for your own policies.");
        }
    }

    // 4. Verify policy status (Cannot pay if CANCELLED)
    if (policy.status === "CANCELLED") {
        throw new ApiError(400, "Cannot record payment for a CANCELLED policy.");
    }
    if (policy.status !== "ACTIVE") {
        throw new ApiError(400, `Cannot record payment for a ${policy.status} policy.`);
    }

    // 5. Ensure schedules are synchronized
    await syncPolicySchedule(policy.id);

    // 6. Find oldest PENDING payment slot
    const oldestPending = await prisma.premiumPayment.findFirst({
        where: {
            policyId: policy.id,
            status: "PENDING"
        },
        orderBy: {
            dueDate: "asc"
        }
    });

    if (!oldestPending) {
        throw new ApiError(400, "All scheduled premiums for this policy have already been paid.");
    }

    // 7. Update slot to PAID
    const updatedPayment = await prisma.premiumPayment.update({
        where: { id: oldestPending.id },
        data: {
            amount: data.amount,
            paymentDate: data.paymentDate,
            paymentMethod: data.paymentMethod,
            status: "PAID",
            transactionId: data.transactionId
        },
        include: {
            policy: {
                include: {
                    customer: {
                        include: {
                            user: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    return formatPayment(updatedPayment);
};

/**
 * Return payment history with pagination, search, sorting, and filtering.
 */
export const getPaymentsList = async (query: ListPaymentsQueryInput, user: any) => {
    const {
        page,
        limit,
        search,
        sort,
        order,
        status,
        paymentMethod,
        policyId,
        customerId,
        agentId,
        fromDate,
        toDate
    } = query;

    // 1. Sync schedules for scope before querying
    await syncPoliciesForUser(user, policyId, customerId, agentId);

    // 2. Build where filter clauses
    const where: any = {};

    // Role-based security filters
    if (user.role === "CUSTOMER") {
        where.policy = { customer: { userId: user.id } };
    } else if (user.role === "AGENT") {
        where.policy = { agentId: user.id };
    }

    // Query filters
    if (policyId) {
        where.policyId = policyId;
    }
    if (paymentMethod) {
        where.paymentMethod = paymentMethod;
    }
    if (customerId) {
        where.policy = { ...where.policy, customerId };
    }
    if (agentId) {
        where.policy = { ...where.policy, agentId };
    }

    // Status filter (PAID, FAILED, PENDING, OVERDUE)
    if (status) {
        if (status === "PAID") {
            where.status = "PAID";
        } else if (status === "FAILED") {
            where.status = "FAILED";
        } else if (status === "PENDING") {
            where.status = "PENDING";
            where.dueDate = { gte: new Date() };
        } else if (status === "OVERDUE") {
            where.status = "PENDING";
            where.dueDate = { lt: new Date() };
        }
    }

    // Date range filter (paymentDate for PAID, dueDate for PENDING/OVERDUE/FAILED)
    if (fromDate || toDate) {
        const rangeFilter: any = {};
        if (fromDate) rangeFilter.gte = new Date(fromDate);
        if (toDate) rangeFilter.lte = new Date(toDate);

        where.OR = [
            {
                status: "PAID",
                paymentDate: rangeFilter
            },
            {
                status: { not: "PAID" },
                dueDate: rangeFilter
            }
        ];
    }

    // Search filter (policy number, customer name/email, agent name/email)
    if (search) {
        const searchFilter = { contains: search, mode: "insensitive" as const };
        const searchCondition = {
            OR: [
                { policy: { policyNumber: searchFilter } },
                { policy: { customer: { user: { name: searchFilter } } } },
                { policy: { customer: { user: { email: searchFilter } } } },
                { policy: { agent: { name: searchFilter } } },
                { policy: { agent: { email: searchFilter } } }
            ]
        };

        if (where.OR) {
            where.AND = [
                { OR: where.OR },
                searchCondition
            ];
            delete where.OR;
        } else {
            where.OR = searchCondition.OR;
        }
    }

    // 3. Sorting configuration
    const validSortFields = ["id", "amount", "dueDate", "paymentDate", "status", "createdAt"];
    let orderBy: any = {};
    if (sort === "policyNumber") {
        orderBy = { policy: { policyNumber: order } };
    } else if (sort === "customerName") {
        orderBy = { policy: { customer: { user: { name: order } } } };
    } else {
        const sortBy = validSortFields.includes(sort) ? sort : "dueDate";
        orderBy = { [sortBy]: order };
    }

    // 4. Pagination
    const skip = (page - 1) * limit;

    const [total, payments] = await Promise.all([
        prisma.premiumPayment.count({ where }),
        prisma.premiumPayment.findMany({
            where,
            orderBy,
            skip,
            take: limit,
            include: {
                policy: {
                    include: {
                        customer: {
                            include: {
                                user: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })
    ]);

    const formattedPayments = payments.map(formatPayment);
    const totalPages = Math.ceil(total / limit);

    return {
        payments: formattedPayments,
        pagination: {
            page,
            limit,
            total,
            totalPages
        }
    };
};

/**
 * Return complete payment details by ID.
 */
export const getPaymentDetails = async (id: string, user: any) => {
    const payment = await prisma.premiumPayment.findUnique({
        where: { id },
        include: {
            policy: {
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
            }
        }
    });

    if (!payment) {
        throw new ApiError(404, "Payment record not found.");
    }

    // Role-based authorization check
    if (user.role === "CUSTOMER") {
        if (payment.policy.customer.userId !== user.id) {
            throw new ApiError(403, "You are not authorized to view this payment.");
        }
    } else if (user.role === "AGENT") {
        if (payment.policy.agentId !== user.id) {
            throw new ApiError(403, "You are not authorized to view this payment.");
        }
    }

    // Dynamic status determination
    let currentStatus: string = payment.status;
    if (payment.status === "PENDING" && new Date(payment.dueDate) < new Date()) {
        currentStatus = "OVERDUE";
    }

    return {
        id: payment.id,
        amount: Number(payment.amount),
        dueDate: payment.dueDate,
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId,
        status: currentStatus,
        createdAt: payment.createdAt,
        policy: {
            id: payment.policy.id,
            policyNumber: payment.policy.policyNumber,
            policyType: payment.policy.policyType,
            coverageAmount: Number(payment.policy.coverageAmount),
            premiumAmount: Number(payment.policy.premiumAmount),
            startDate: payment.policy.startDate,
            endDate: payment.policy.endDate,
            status: payment.policy.status
        },
        customer: {
            id: payment.policy.customer.id,
            dob: payment.policy.customer.dob,
            phone: payment.policy.customer.phone,
            address: payment.policy.customer.address,
            city: payment.policy.customer.city,
            state: payment.policy.customer.state,
            pincode: payment.policy.customer.pincode,
            user: payment.policy.customer.user
        },
        agent: payment.policy.agent
    };
};
