import { z } from "zod";
import { ClaimStatus } from "../../generated/prisma/enums.js";

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

// CLAIM SUBMISSION VALIDATOR
export const submitClaimSchema = z.object({
    policyId: z.string({ message: "policyId is required" }).trim().min(1, "policyId is required"),
    claimAmount: numericField("Claim amount"),
    reason: z
        .string({ message: "Reason is required" })
        .trim()
        .min(3, "Reason must be at least 3 characters")
        .max(100, "Reason cannot exceed 100 characters"),
    incidentDate: z
        .string({ message: "Incident date is required" })
        .refine((val) => !isNaN(Date.parse(val)), "Invalid incident date format")
        .transform((val) => new Date(val))
        .refine((val) => val <= new Date(), "Incident date cannot be in the future"),
    description: z
        .string({ message: "Description is required" })
        .trim()
        .min(10, "Description must be at least 10 characters")
        .max(1000, "Description cannot exceed 1000 characters"),
});

export type SubmitClaimInput = z.infer<typeof submitClaimSchema>;

// CLAIM REVIEW VALIDATOR
export const reviewClaimSchema = z.object({
    status: z.enum(["APPROVED", "REJECTED"]),
    remarks: z
        .string({ message: "Remarks are required" })
        .trim()
        .min(3, "Remarks must be at least 3 characters")
        .max(500, "Remarks cannot exceed 500 characters")
});

export type ReviewClaimInput = z.infer<typeof reviewClaimSchema>;

// PAGINATION AND FILTER QUERY VALIDATOR
export const getClaimsQuerySchema = z.object({
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
    order: z.enum(["asc", "desc"] as const).default("desc"),
    status: z.nativeEnum(ClaimStatus).optional(),
    policyId: z.string().trim().optional(),
    customerId: z.string().trim().optional(),
    agentId: z.string().trim().optional()
});

export type GetClaimsQueryInput = z.infer<typeof getClaimsQuerySchema>;
