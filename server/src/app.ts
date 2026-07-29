import express from "express";
import errorHandler from "./middleware/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

//MIDDLEWARE
app.use(
    cors({
        origin: "http://localhost:5173",
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

//GLOBAL ERROR HANDLER
app.use(errorHandler);

export default app;