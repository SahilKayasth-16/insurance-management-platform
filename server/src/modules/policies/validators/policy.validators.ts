import { z } from "zod";
import { PolicyType } from "../../../generated/prisma/enums.js";

// Helper to preprocess numeric fields from string/number to Number
const numericField = (fieldName: string) =>
    z.preprocess(
        (val) => {
            if (typeof val === "string" && val.trim() !== "") {
                const parsed = Number(val);
                return isNaN(parsed) ? val : parsed;
            }
            return val;
        },
        z.number({ message: `${fieldName} must be a number` }).positive(`${fieldName} must be a positive number`)
    );

// CREATE POLICY VALIDATOR
export const createPolicySchema = z
    .object({
        customerId: z.string({ message: "customerId is required" }).trim().min(1, "customerId is required"),
        agentId: z.string({ message: "agentId is required" }).trim().min(1, "agentId is required"),
        policyType: z.nativeEnum(PolicyType, { message: "Invalid policy type" }),
        coverageAmount: numericField("Coverage amount"),
        premiumAmount: numericField("Premium amount"),
        startDate: z
            .string({ message: "Start date is required" })
            .refine((val) => !isNaN(Date.parse(val)), "Invalid start date format")
            .transform((val) => new Date(val)),
        endDate: z
            .string({ message: "End date is required" })
            .refine((val) => !isNaN(Date.parse(val)), "Invalid end date format")
            .transform((val) => new Date(val)),
    })
    .refine((data) => data.endDate > data.startDate, {
        message: "End date must be after start date",
        path: ["endDate"],
    });

export type CreatePolicyInput = z.infer<typeof createPolicySchema>;

// UPDATE POLICY VALIDATOR
export const updatePolicySchema = z.object({
    coverageAmount: numericField("Coverage amount").optional(),
    premiumAmount: numericField("Premium amount").optional(),
    endDate: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), "Invalid end date format")
        .transform((val) => new Date(val))
        .optional(),
});

export type UpdatePolicyInput = z.infer<typeof updatePolicySchema>;

// RENEW POLICY VALIDATOR
export const renewPolicySchema = z.object({
    endDate: z
        .string({ message: "End date is required" })
        .refine((val) => !isNaN(Date.parse(val)), "Invalid end date format")
        .transform((val) => new Date(val)),
});

export type RenewPolicyInput = z.infer<typeof renewPolicySchema>;

// PAGINATION AND FILTER QUERY VALIDATOR
export const getPoliciesQuerySchema = z.object({
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
    status: z.enum(["ACTIVE", "EXPIRED", "CANCELLED"]).optional(),
    policyType: z.enum(["LIFE", "HEALTH", "VEHICLE", "HOME", "TRAVEL"]).optional(),
    agentId: z.string().trim().optional(),
    customerId: z.string().trim().optional(),
});

export type GetPoliciesQueryInput = z.infer<typeof getPoliciesQuerySchema>;
