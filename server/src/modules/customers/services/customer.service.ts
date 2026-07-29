import prisma from "../../../lib/prisma.js";
import ApiError from "../../../utils/ApiError.js";
import type {
    CreateCustomerInput,
    UpdateCustomerInput,
    GetCustomersQueryInput
} from "../validators/customer.validators.js";

/**
 * Create a new Customer Profile.
 */
export const createCustomerProfile = async (data: CreateCustomerInput) => {
    // Verify that the referenced User exists
    const referencedUser = await prisma.user.findUnique({
        where: { id: data.userId }
    });

    if (!referencedUser) {
        throw new ApiError(404, "Referenced user does not exist.");
    }

    // Verify that a customer profile does not already exist for this user
    const existingProfile = await prisma.customer.findUnique({
        where: { userId: data.userId }
    });

    if (existingProfile) {
        throw new ApiError(409, "Customer profile already exists for this user.");
    }

    const customer = await prisma.customer.create({
        data: {
            userId: data.userId,
            dob: data.dob,
            phone: data.phone,
            address: data.address,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
            identityNumber: data.identityNumber
        },
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
    });

    return customer;
};

/**
 * List all customer profiles with pagination, search, and sorting.
 */
export const getCustomersList = async (query: GetCustomersQueryInput) => {
    const { page, limit, search, sort, order } = query;

    const where: any = {};
    if (search) {
        where.OR = [
            { phone: { contains: search, mode: "insensitive" } },
            { user: { name: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } }
        ];
    }

    // Support nested sorting for User fields (name, email)
    let orderBy: any = {};
    if (sort === "name") {
        orderBy = { user: { name: order } };
    } else if (sort === "email") {
        orderBy = { user: { email: order } };
    } else {
        const validSortFields = [
            "id",
            "dob",
            "phone",
            "address",
            "city",
            "state",
            "pincode",
            "identityNumber",
            "createdAt",
            "updatedAt"
        ];
        const sortBy = validSortFields.includes(sort) ? sort : "createdAt";
        orderBy = { [sortBy]: order };
    }

    const skip = (page - 1) * limit;

    const [total, customers] = await Promise.all([
        prisma.customer.count({ where }),
        prisma.customer.findMany({
            where,
            orderBy,
            skip,
            take: limit,
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
        })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
        customers,
        pagination: {
            page,
            limit,
            total,
            totalPages
        }
    };
};

/**
 * Get single customer details with profile, user info, and policy/claim/payment counts.
 */
export const getCustomerDetails = async (id: string) => {
    const customer = await prisma.customer.findUnique({
        where: { id },
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
    });

    if (!customer) {
        throw new ApiError(404, "Customer profile not found.");
    }

    // Retrieve policy, claim, and payment counts for history
    const policyCount = await prisma.policy.count({
        where: { customerId: customer.id }
    });

    const claimCount = await prisma.claim.count({
        where: { policy: { customerId: customer.id } }
    });

    const paymentCount = await prisma.premiumPayment.count({
        where: { policy: { customerId: customer.id } }
    });

    return {
        ...customer,
        policyCount,
        claimCount,
        paymentCount,
        history: {
            policyCount,
            claimCount,
            paymentCount,
            createdAt: customer.createdAt,
            updatedAt: customer.updatedAt
        }
    };
};

/**
 * Partial update for customer profile.
 */
export const updateCustomerProfile = async (id: string, data: UpdateCustomerInput) => {
    const customerExists = await prisma.customer.findUnique({
        where: { id }
    });

    if (!customerExists) {
        throw new ApiError(404, "Customer profile not found.");
    }

    const updatedCustomer = await prisma.customer.update({
        where: { id },
        data: {
            phone: data.phone,
            address: data.address,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
            identityNumber: data.identityNumber
        },
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
    });

    return updatedCustomer;
};
