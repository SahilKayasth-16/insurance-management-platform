import { NextFunction, Request, Response } from "express";
import ApiError from "../utils/ApiError.js";
import { ZodError, type ZodIssue } from "zod";

const errorHandler = (
    err: Error | ApiError | ZodError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let statusCode = err instanceof ApiError ? err.statusCode : 500;
    let message = err.message || "Internal Server Error";
    let errors: unknown[] = [];

    if (err instanceof ApiError) {
        errors = err.errors;
    } else if (err instanceof ZodError) {
        statusCode = 400;
        message = "Validation Error";
        errors = err.issues.map((e: ZodIssue) => ({
            field: e.path.join("."),
            message: e.message
        }));
    }

    res.status(statusCode).json({
        success: false,
        message,
        errors,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
};

export default errorHandler;