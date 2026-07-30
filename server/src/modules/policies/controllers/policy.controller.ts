import type { Request, Response } from "express";
import asyncHandler from "../../../middleware/asyncHandler.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import * as policyService from "../services/policy.service.js";
import {
    createPolicySchema,
    updatePolicySchema,
    renewPolicySchema,
    getPoliciesQuerySchema
} from "../validators/policy.validators.js";

/**
 * POST /api/policies
 * Create a new insurance policy.
 */
export const createPolicy = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = createPolicySchema.parse(req.body);

    const policy = await policyService.createPolicy(validatedData);

    return res.status(201).json(
        new ApiResponse(201, policy, "Insurance policy created successfully.")
    );
});

/**
 * GET /api/policies
 * Return all policies with pagination, filters, search, and sorting.
 */
export const getPolicies = asyncHandler(async (req: Request, res: Response) => {
    const validatedQuery = getPoliciesQuerySchema.parse(req.query);

    const result = await policyService.getPoliciesList(validatedQuery);

    return res.status(200).json(
        new ApiResponse(200, result, "Policies retrieved successfully.")
    );
});

/**
 * GET /api/policies/:id
 * Return complete policy details.
 */
export const getPolicy = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const policy = await policyService.getPolicyDetails(id);

    return res.status(200).json(
        new ApiResponse(200, policy, "Policy details retrieved successfully.")
    );
});

/**
 * PATCH /api/policies/:id
 * Update policy details.
 */
export const updatePolicy = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const validatedData = updatePolicySchema.parse(req.body);

    const updatedPolicy = await policyService.updatePolicy(id, validatedData);

    return res.status(200).json(
        new ApiResponse(200, updatedPolicy, "Policy updated successfully.")
    );
});

/**
 * PATCH /api/policies/:id/renew
 * Renew an existing policy.
 */
export const renewPolicy = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const validatedData = renewPolicySchema.parse(req.body);

    const renewedPolicy = await policyService.renewPolicy(id, validatedData);

    return res.status(200).json(
        new ApiResponse(200, renewedPolicy, "Policy renewed successfully.")
    );
});

/**
 * PATCH /api/policies/:id/cancel
 * Cancel a policy.
 */
export const cancelPolicy = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const cancelledPolicy = await policyService.cancelPolicy(id);

    return res.status(200).json(
        new ApiResponse(200, cancelledPolicy, "Policy cancelled successfully.")
    );
});
