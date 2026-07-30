import { Router } from "express";
import {
    createPolicy,
    getPolicies,
    getPolicy,
    updatePolicy,
    renewPolicy,
    cancelPolicy
} from "../controllers/policy.controller.js";
import authenticate from "../../../middleware/auth.middleware.js";
import authorize from "../../../middleware/role.middleware.js";

const router = Router();

// Apply authentication and ADMIN/AGENT authorization to all endpoints in this module
router.use(authenticate, authorize("ADMIN", "AGENT"));

// Route definitions
router.post("/", createPolicy);
router.get("/", getPolicies);
router.get("/:id", getPolicy);
router.patch("/:id", updatePolicy);
router.patch("/:id/renew", renewPolicy);
router.patch("/:id/cancel", cancelPolicy);

export default router;
