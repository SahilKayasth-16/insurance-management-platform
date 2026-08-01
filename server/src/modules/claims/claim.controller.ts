import type { Request, Response } from "express";
import asyncHandler from "../../middleware/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import * as claimService from "./claim.service.js";
import {
    submitClaimSchema,
    reviewClaimSchema,
    getClaimsQuerySchema
} from "./claim.validators.js";

/**
 * POST /api/claims
 * Customer submits a claim.
 */
export const submitClaim = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = submitClaimSchema.parse(req.body);
    const userId = req.user!.id;

    const claim = await claimService.submitClaim(validatedData, userId);

    return res.status(201).json(
        new ApiResponse(201, claim, "Claim submitted successfully.")
    );
});

/**
 * GET /api/claims
 * Return claims list with pagination, search, sorting, and filtering.
 */
export const getClaims = asyncHandler(async (req: Request, res: Response) => {
    const validatedQuery = getClaimsQuerySchema.parse(req.query);
    const user = req.user!;

    const result = await claimService.getClaimsList(validatedQuery, user);

    return res.status(200).json(
        new ApiResponse(200, result, "Claims retrieved successfully.")
    );
});

/**
 * GET /api/claims/:id
 * Return complete claim details.
 */
export const getClaim = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const user = req.user!;

    const claim = await claimService.getClaimDetails(id, user);

    return res.status(200).json(
        new ApiResponse(200, claim, "Claim details retrieved successfully.")
    );
});

/**
 * PATCH /api/claims/:id/review
 * Agent or Admin reviews a claim (Approve/Reject).
 */
export const reviewClaim = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const validatedBody = reviewClaimSchema.parse(req.body);
    const user = req.user!;

    const updatedClaim = await claimService.reviewClaim(id, validatedBody, user);

    return res.status(200).json(
        new ApiResponse(200, updatedClaim, "Claim reviewed successfully.")
    );
});
