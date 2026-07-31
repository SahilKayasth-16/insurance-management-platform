import { Router } from "express";
import {
    recordPayment,
    getPayments,
    getPayment
} from "../controllers/payment.controller.js";
import authenticate from "../../../middleware/auth.middleware.js";
import authorize from "../../../middleware/role.middleware.js";

const router = Router();

// Apply authentication and authorization for ADMIN, AGENT, and CUSTOMER roles to all payment routes
router.use(authenticate, authorize("ADMIN", "AGENT", "CUSTOMER"));

// Route definitions
router.post("/", recordPayment);
router.get("/", getPayments);
router.get("/:id", getPayment);

export default router;
