import express from "express";
import errorHandler from "./middleware/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./modules/users/routes/user.routes.js";
import customerRoutes from "./modules/customers/routes/customer.routes.js";
import policyRoutes from "./modules/policies/routes/policy.routes.js";
import paymentRoutes from "./modules/payments/routes/payment.routes.js";
import claimRoutes from "./modules/claims/claim.routes.js";
import documentRoutes from "./modules/documents/document.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

//MIDDLEWARE
app.use(
    cors({
        origin: [ "http://localhost:5173", "https://insurance-management-platform-mu.vercel.app" ],
        credentials: true
    })
);

//PARSE REQUEST BODY FIRST
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//HEALTH CHECK
app.get("/", (_, res) => {
    res.json({
        message: "Insurance Management Platform API."
    });
});

//ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api", dashboardRoutes);

//GLOBAL ERROR HANDLER
app.use(errorHandler);

export default app;