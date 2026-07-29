import { Router } from "express";
import {
    createCustomer,
    getCustomers,
    getCustomer,
    updateCustomer
} from "../controllers/customer.controller.js";
import authenticate from "../../../middleware/auth.middleware.js";
import authorize from "../../../middleware/role.middleware.js";

const router = Router();

// Apply authentication and check authorization for ADMIN and AGENT for all routes
router.use(authenticate, authorize("ADMIN", "AGENT"));

// Route mappings
router.post("/", createCustomer);
router.get("/", getCustomers);
router.get("/:id", getCustomer);
router.patch("/:id", updateCustomer);

export default router;
