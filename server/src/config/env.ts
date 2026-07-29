import type { SignOptions } from "jsonwebtoken";

const env = {
    DATABASE_URL: process.env.DATABASE_URL!,
    PORT: Number(process.env.PORT) || 5040,
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_EXPIRES_IN: (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"],
    NODE_ENV: process.env.NODE_ENV || "development",
};

export default env;