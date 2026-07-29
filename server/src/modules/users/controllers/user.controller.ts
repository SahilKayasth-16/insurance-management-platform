import type { Request, Response } from "express";
import asyncHandler from "../../../middleware/asyncHandler.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import * as userService from "../services/user.service.js";
import {
    getUsersQuerySchema,
    createAgentSchema,
    updateUserStatusSchema
} from "../validators/user.validators.js";

/**
 * GET /api/users
 * List all users. Only accessible by Admins.
 */
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
    const validatedQuery = getUsersQuerySchema.parse(req.query);

    const result = await userService.getUsersList(validatedQuery);

    return res.status(200).json(
        new ApiResponse(200, result, "Users retrieved successfully.")
    );
});

/**
 * GET /api/users/:id
 * Retrieve details of a single user. Only accessible by Admins.
 */
export const getUser = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const user = await userService.getUserById(id);

    return res.status(200).json(
        new ApiResponse(200, user, "User retrieved successfully.")
    );
});

/**
 * POST /api/users/agents
 * Create a new Insurance Agent. Only accessible by Admins.
 */
export const createAgent = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = createAgentSchema.parse(req.body);

    const agent = await userService.createAgent(validatedData);

    return res.status(201).json(
        new ApiResponse(201, agent, "Insurance Agent created successfully.")
    );
});

/**
 * PATCH /api/users/:id/status
 * Soft activate/deactivate a user. Only accessible by Admins.
 */
export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const validatedData = updateUserStatusSchema.parse(req.body);

    const updatedUser = await userService.updateUserStatus(id, validatedData.isActive);

    return res.status(200).json(
        new ApiResponse(200, updatedUser, "User status updated successfully.")
    );
});
