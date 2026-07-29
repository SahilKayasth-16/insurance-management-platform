import { Router } from "express";
import {
    getUsers,
    getUser,
    createAgent,
    updateStatus
} from "../controllers/user.controller.js";
import authenticate from "../../../middleware/auth.middleware.js";
import authorize from "../../../middleware/role.middleware.js";

const router = Router();

// Apply authentication and ADMIN authorization to all routes in this module
router.use(authenticate, authorize("ADMIN"));

// Route mappings
router.get("/", getUsers);
router.get("/:id", getUser);
router.post("/agents", createAgent);
router.patch("/:id/status", updateStatus);

export default router;
