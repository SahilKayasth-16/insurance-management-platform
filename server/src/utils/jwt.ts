import jwt from "jsonwebtoken";
import env from "../config/env.js";

export const generateToken = (userId: string, role: string) => {
    return jwt.sign(
        { id: userId, role },
        env.JWT_SECRET,
        {  
            expiresIn: env.JWT_EXPIRES_IN, 
        }
    );
};

export const verifyToken = (token: string) => {
    return jwt.verify(token, env.JWT_SECRET);
}