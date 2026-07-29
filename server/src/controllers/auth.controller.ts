import type { Request, Response } from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import env from "../config/env.js";

import { registerSchema } from "../validators/auth.validators.js";
import { registerUser } from "../services/auth.service.js";

import { loginSchema } from "../validators/auth.validators.js";
import { loginUser } from "../services/auth.service.js";

import { getCurrentUser } from "../services/auth.service.js";

export const register = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = registerSchema.parse(req.body);

    const user = await registerUser(validatedData);

    return res.status(201).json(
        new ApiResponse(201, {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        },
        "User registered successfully.")
    );
});

export const login = asyncHandler(
    async (req: Request, res: Response) => {
        const validatedData = loginSchema.parse(req.body);

        const { token, user } = await loginUser(validatedData);

        const cookieOptions = {
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        } as const;

        res.cookie("accessToken", token, cookieOptions);

        return res.status(200).json(
            new ApiResponse(200, {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                "Login successful."
            )
        );
    }
);

export const logout = asyncHandler(async (_req: Request, res: Response) => {
    res.clearCookie("accessToken", {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax"
    });

    return res.status(200).json(
        new ApiResponse(200, null, "Logged out successfully.")
    );
});

export const me = asyncHandler(async (req: Request, res: Response) => {
    const user = await getCurrentUser(req.user!.id);

    return res.status(200).json(
        new ApiResponse(200,
            user,
            "Current user fetched successfully."
        )
    );
});