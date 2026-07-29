import { z } from "zod";

// CREATE CUSTOMER SCHEMA
export const createCustomerSchema = z.object({
    userId: z.string({ message: "userId is required" }).trim().min(1, "userId is required"),
    dob: z
        .string({ message: "Date of birth is required" })
        .refine((val) => !isNaN(Date.parse(val)), "Invalid date format")
        .transform((val) => new Date(val)),
    phone: z
        .string({ message: "Phone number is required" })
        .trim()
        .regex(/^\+?[\d\s-]{10,15}$/, "Phone number must be between 10 and 15 digits (optional leading +)"),
    address: z
        .string({ message: "Address is required" })
        .trim()
        .min(5, "Address must be at least 5 characters"),
    city: z
        .string({ message: "City is required" })
        .trim()
        .min(2, "City must be at least 2 characters"),
    state: z
        .string({ message: "State is required" })
        .trim()
        .min(2, "State must be at least 2 characters"),
    pincode: z
        .string({ message: "Pincode is required" })
        .trim()
        .regex(/^\d{5,6}$/, "Pincode must be 5 or 6 digits"),
    identityNumber: z
        .string()
        .trim()
        .min(5, "Identity number must be at least 5 characters")
        .optional()
        .nullable()
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

// UPDATE CUSTOMER SCHEMA
export const updateCustomerSchema = z.object({
    phone: z
        .string()
        .trim()
        .regex(/^\+?[\d\s-]{10,15}$/, "Phone number must be between 10 and 15 digits (optional leading +)")
        .optional(),
    address: z
        .string()
        .trim()
        .min(5, "Address must be at least 5 characters")
        .optional(),
    city: z
        .string()
        .trim()
        .min(2, "City must be at least 2 characters")
        .optional(),
    state: z
        .string()
        .trim()
        .min(2, "State must be at least 2 characters")
        .optional(),
    pincode: z
        .string()
        .trim()
        .regex(/^\d{5,6}$/, "Pincode must be 5 or 6 digits")
        .optional(),
    identityNumber: z
        .string()
        .trim()
        .min(5, "Identity number must be at least 5 characters")
        .optional()
        .nullable()
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

// CUSTOMER PAGINATION QUERY SCHEMA
export const getCustomersQuerySchema = z.object({
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
    order: z.enum(["asc", "desc"]).default("desc")
});

export type GetCustomersQueryInput = z.infer<typeof getCustomersQuerySchema>;
