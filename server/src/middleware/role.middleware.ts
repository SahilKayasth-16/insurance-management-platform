import type { Request, Response, NextFunction } from "express";
import type { Role } from "../generated/prisma/enums.js";
import ApiError from "../utils/ApiError.js";
import authenticate from "./auth.middleware.js";

const authorize = (...roles: Role[]) => {
    return (
        req: Request,
        _res: Response,
        next: NextFunction
    ) => {
        if (!req.user) {
            return next(new ApiError(401, "Unauthorized"));
        }

        if (!roles.includes(req.user.role)) {
            return next(new ApiError(403, "You are not authorized to access this resource."));
        }

        next();
    };
};

export default authorize;