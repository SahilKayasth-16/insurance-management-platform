import { z } from "zod";

//REGISTRATION SCHEMA
export const registerSchema = z.object({
    name: z
        .string()
        .trim()
        .min(3, "Name must be atleat 3 characters.")
        .max(100),

    email: z.email().transform((email) => email.toLowerCase()),

    password: z
        .string()
        .min(8, "Password must be atleat 8 characters.")
        .regex(/[A-Z]/, "Password must contain one uppercase letter.")
        .regex(/[a-z]/, "Password must contain one lowercase letter.")
        .regex(/[0-9]/, "Password must contain one number.")
        .regex(/[^A-Za-z0-9]/, "Password must contain one special character."),
});

export type RegisterInput = z.infer<typeof registerSchema>;

//LOGIN SCHEMA
export const loginSchema = z.object({
    email: z.email().transform((email) => email.toLowerCase()),

    password: z
        .string()
        .min(1, "Password is required."),
});

export type LoginInput = z.infer<typeof loginSchema>;