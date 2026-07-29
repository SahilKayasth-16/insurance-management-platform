import bcrypt from "bcrypt";
import prisma from "../lib/prisma.js";
import ApiError from "../utils/ApiError.js";

import type { RegisterInput } from "../validators/auth.validators.js";

import { generateToken } from "../utils/jwt.js";
import { LoginInput } from "../validators/auth.validators.js";

export const registerUser = async (data: RegisterInput) => {
    const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
    });

    if (existingUser) {
        throw new ApiError(409, "Email already registered.");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: hashedPassword,
            role: "CUSTOMER"
        },
    });

    return user;
}

export const loginUser = async (data: LoginInput) => {
    const user = await prisma.user.findUnique({
        where: {
            email: data.email
        },
    });

    if (!user) {
        throw new ApiError(401, "Invalid email or password.");
    }

    const isPasswordValid = await bcrypt.compare (
        data.password,
        user.password
    );

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid email or password.");
    }

    const token = generateToken(
        user.id,
        user.role
    );

    return {
        token, 
        user
    };
};

export const logoutUser = () => {
    return true;
}

export const getCurrentUser = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
        },
    });

    if (!user) {
        throw new ApiError(404, "User not found.");
    }

    return user;
};