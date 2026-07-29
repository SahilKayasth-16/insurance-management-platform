import { Router } from "express";
import { register, login, logout, me } from "../controllers/auth.controller.js";
import authenticate from "../middleware/auth.middleware.js";
import authorize from "../middleware/role.middleware.js";

const router = Router();

router.post("/register", register);

router.post("/login", login)

router.get("/admin", authenticate, authorize("ADMIN"), (_, res) => {
    res.json({
        message: "Welcome Admin."
    });
});

router.get("/agent", authenticate, authorize("AGENT"), (_, res) => {
    res.json({
        message: "Welcome Agent."
    });
});

router.get("/customer", authenticate, authorize("CUSTOMER"), (_, res) => {
    res.json({
        message: "Welcome Customer."
    });
});

router.post("/logout", authenticate, logout);

router.get("/me", authenticate, me);

export default router;