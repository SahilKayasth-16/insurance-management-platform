import { Router } from "express";
import {
    getAdminDashboard,
    getAgentDashboard,
    getMonthlyReport
} from "./dashboard.controller.js";
import authenticate from "../../middleware/auth.middleware.js";
import authorize from "../../middleware/role.middleware.js";

const router = Router();

// Apply authentication middleware to all dashboard/report routes
router.use(authenticate);

// Admin Dashboard - Accessible only by ADMIN
router.get("/dashboard/admin", authorize("ADMIN"), getAdminDashboard);

// Agent Dashboard - Accessible only by AGENT
router.get("/dashboard/agent", authorize("AGENT"), getAgentDashboard);

// Monthly Reports - Accessible only by ADMIN
router.get("/reports/monthly", authorize("ADMIN"), getMonthlyReport);

export default router;
