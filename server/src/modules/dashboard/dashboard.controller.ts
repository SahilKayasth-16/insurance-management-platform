import type { Request, Response } from "express";
import asyncHandler from "../../middleware/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import * as dashboardService from "./dashboard.service.js";
import { getMonthlyReportQuerySchema } from "./dashboard.validators.js";

/**
 * GET /api/dashboard/admin
 * Retrieve statistics and trends for the admin dashboard.
 */
export const getAdminDashboard = asyncHandler(async (req: Request, res: Response) => {
    const stats = await dashboardService.getAdminDashboardStats();
    
    return res.status(200).json(
        new ApiResponse(200, stats, "Admin dashboard data retrieved successfully.")
    );
});

/**
 * GET /api/dashboard/agent
 * Retrieve statistics and trends for the logged-in agent's dashboard.
 */
export const getAgentDashboard = asyncHandler(async (req: Request, res: Response) => {
    const agentId = req.user!.id;
    const stats = await dashboardService.getAgentDashboardStats(agentId);

    return res.status(200).json(
        new ApiResponse(200, stats, "Agent dashboard data retrieved successfully.")
    );
});

/**
 * GET /api/reports/monthly
 * Retrieve monthly metrics report for a specific year.
 */
export const getMonthlyReport = asyncHandler(async (req: Request, res: Response) => {
    const validatedQuery = getMonthlyReportQuerySchema.parse(req.query);
    const report = await dashboardService.getMonthlyReport(validatedQuery.year);

    return res.status(200).json(
        new ApiResponse(200, report, "Monthly report retrieved successfully.")
    );
});
