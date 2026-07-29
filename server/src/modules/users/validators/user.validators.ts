import { z } from "zod";

// CREATE AGENT VALIDATOR
export const createAgentSchema = z.object({
    name: z
        .string()
        .trim()
        .min(3, "Name must be at least 3 characters.")
        .max(100),

    email: z.email().transform((email) => email.toLowerCase()),

    password: z
        .string()
        .min(8, "Password must be at least 8 characters.")
        .regex(/[A-Z]/, "Password must contain one uppercase letter.")
        .regex(/[a-z]/, "Password must contain one lowercase letter.")
        .regex(/[0-9]/, "Password must contain one number.")
        .regex(/[^A-Za-z0-9]/, "Password must contain one special character."),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;

// UPDATE STATUS VALIDATOR
export const updateUserStatusSchema = z.object({
    isActive: z.boolean({
        message: "isActive must be a boolean"
    })
});

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;

// PAGINATION QUERY VALIDATOR
export const getUsersQuerySchema = z.object({
    page: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 1))
        .refine((val) => !isNaN(val) && val >= 1, "Page must be a positive integer"),
    limit: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 10))
        .refine((val) => !isNaN(val) && val >= 1, "Limit must be a positive integer"),
    search: z.string().trim().optional(),
    sort: z.string().trim().default("createdAt"),
    order: z.enum(["asc", "desc"]).default("desc"),
});

export type GetUsersQueryInput = z.infer<typeof getUsersQuerySchema>;
