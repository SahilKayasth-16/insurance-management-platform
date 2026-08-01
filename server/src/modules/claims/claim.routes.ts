import { Router } from "express";
import {
    submitClaim,
    getClaims,
    getClaim,
    reviewClaim
} from "./claim.controller.js";
import authenticate from "../../middleware/auth.middleware.js";
import authorize from "../../middleware/role.middleware.js";

const router = Router();

// Apply authentication middleware to all claims routes
router.use(authenticate);

// Route definitions
// Only CUSTOMER can submit claims
router.post("/", authorize("CUSTOMER"), submitClaim);

// Admin, Agent, and Customer can list/get claims (with scoping logic in service layer)
router.get("/", authorize("ADMIN", "AGENT", "CUSTOMER"), getClaims);

// Admin, Agent, and Customer can view a specific claim (with scoping logic in service layer)
router.get("/:id", authorize("ADMIN", "AGENT", "CUSTOMER"), getClaim);

// Only ADMIN and AGENT can review claims
router.patch("/:id/review", authorize("ADMIN", "AGENT"), reviewClaim);

export default router;
