import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";
import ApiError from "../utils/ApiError.js";
import { verifyToken } from "../utils/jwt.js";

interface JwtPayload {
    id: string,
    role: string,
}

const authenticate = async (req: Request, _res: Response, next: NextFunction ) => {
    try {
        const token = req.cookies.accessToken;

        if (!token) {
            throw new ApiError(401, "Unauthorized");
        }

        const decoded = verifyToken(token) as JwtPayload;

        const user = await prisma.user.findUnique({
            where: {
                id: decoded.id,
            },
        });

        if (!user) {
            throw new ApiError(401, "User not found");
        }

        req.user = {
            id: user.id,
            email: user.email,
            role: user.role
        };

        next();
    } catch(error) {
        next(new ApiError(401, "Invalid or expired token"));
    }
};

export default authenticate;