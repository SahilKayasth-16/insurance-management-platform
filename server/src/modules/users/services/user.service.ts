import bcrypt from "bcrypt";
import prisma from "../../../lib/prisma.js";
import ApiError from "../../../utils/ApiError.js";
import type { CreateAgentInput, GetUsersQueryInput } from "../validators/user.validators.js";

/**
 * List all users with pagination, search, and sorting.
 */
export const getUsersList = async (query: GetUsersQueryInput) => {
    const { page, limit, search, sort, order } = query;

    const where: any = {};
    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } }
        ];
    }

    const validSortFields = ["id", "name", "email", "role", "isActive", "createdAt", "updatedAt"];
    const sortBy = validSortFields.includes(sort) ? sort : "createdAt";

    const skip = (page - 1) * limit;

    const [total, users] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
            where,
            orderBy: {
                [sortBy]: order
            },
            skip,
            take: limit,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true
            }
        })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
        users,
        pagination: {
            page,
            limit,
            total,
            totalPages
        }
    };
};

/**
 * Get a single user by ID.
 */
export const getUserById = async (id: string) => {
    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true
        }
    });

    if (!user) {
        throw new ApiError(404, "User not found.");
    }

    return user;
};

/**
 * Create a new Insurance Agent.
 */
export const createAgent = async (data: CreateAgentInput) => {
    const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
    });

    if (existingUser) {
        throw new ApiError(409, "Email already registered.");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const agent = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: hashedPassword,
            role: "AGENT",
            isActive: true
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true
        }
    });

    return agent;
};

/**
 * Activate or deactivate a user.
 */
export const updateUserStatus = async (id: string, isActive: boolean) => {
    const user = await prisma.user.findUnique({
        where: { id }
    });

    if (!user) {
        throw new ApiError(404, "User not found.");
    }

    const updatedUser = await prisma.user.update({
        where: { id },
        data: { isActive },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true
        }
    });

    return updatedUser;
};
