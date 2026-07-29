import { Role } from "../generated/prisma/enums.js";

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string,
                role: Role,
                email: string
            };
        }
    }
}

export {};