import type { Request, Response } from "express";
import asyncHandler from "../../../middleware/asyncHandler.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import * as customerService from "../services/customer.service.js";
import {
    createCustomerSchema,
    updateCustomerSchema,
    getCustomersQuerySchema
} from "../validators/customer.validators.js";

/**
 * POST /api/customers
 * Create a new Customer Profile. Accessible by ADMIN, AGENT.
 */
export const createCustomer = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = createCustomerSchema.parse(req.body);

    const customer = await customerService.createCustomerProfile(validatedData);

    return res.status(201).json(
        new ApiResponse(201, customer, "Customer profile created successfully.")
    );
});

/**
 * GET /api/customers
 * List customer profiles with pagination, search, and sorting. Accessible by ADMIN, AGENT.
 */
export const getCustomers = asyncHandler(async (req: Request, res: Response) => {
    const validatedQuery = getCustomersQuerySchema.parse(req.query);

    const result = await customerService.getCustomersList(validatedQuery);

    return res.status(200).json(
        new ApiResponse(200, result, "Customers retrieved successfully.")
    );
});

/**
 * GET /api/customers/:id
 * Retrieve details and history of a single customer. Accessible by ADMIN, AGENT.
 */
export const getCustomer = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const customer = await customerService.getCustomerDetails(id);

    return res.status(200).json(
        new ApiResponse(200, customer, "Customer details retrieved successfully.")
    );
});

/**
 * PATCH /api/customers/:id
 * Update customer profile details. Accessible by ADMIN, AGENT.
 */
export const updateCustomer = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const validatedData = updateCustomerSchema.parse(req.body);

    const customer = await customerService.updateCustomerProfile(id, validatedData);

    return res.status(200).json(
        new ApiResponse(200, customer, "Customer profile updated successfully.")
    );
});
