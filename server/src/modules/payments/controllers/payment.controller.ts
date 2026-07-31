import type { Request, Response } from "express";
import asyncHandler from "../../../middleware/asyncHandler.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import * as paymentService from "../services/payment.service.js";
import {
    createPaymentSchema,
    listPaymentsQuerySchema
} from "../validators/payment.validators.js";

/**
 * POST /api/payments
 * Record a premium payment.
 */
export const recordPayment = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = createPaymentSchema.parse(req.body);

    const payment = await paymentService.recordPayment(validatedData, req.user);

    return res.status(201).json(
        new ApiResponse(201, payment, "Premium payment recorded successfully.")
    );
});

/**
 * GET /api/payments
 * Return payment history with pagination, filters, search, and sorting.
 */
export const getPayments = asyncHandler(async (req: Request, res: Response) => {
    const validatedQuery = listPaymentsQuerySchema.parse(req.query);

    const result = await paymentService.getPaymentsList(validatedQuery, req.user);

    return res.status(200).json(
        new ApiResponse(200, result, "Payments retrieved successfully.")
    );
});

/**
 * GET /api/payments/:id
 * Return complete payment details.
 */
export const getPayment = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const payment = await paymentService.getPaymentDetails(id, req.user);

    return res.status(200).json(
        new ApiResponse(200, payment, "Payment details retrieved successfully.")
    );
});
