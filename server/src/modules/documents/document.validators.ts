import { z } from "zod";
import { DocumentType } from "../../generated/prisma/enums.js";

// Helper regex to validate CUID or UUID
const idRegex = /^[a-z0-9-]{24,36}$/i;

// Custom validator for optional CUID/UUID fields
const optionalIdSchema = z.string().trim().optional()
    .transform(val => val === "" ? undefined : val)
    .pipe(z.string().refine(val => idRegex.test(val), { message: "Invalid ID format. Must be a valid CUID or UUID." }).optional());

// DOCUMENT UPLOAD VALIDATOR
export const uploadDocumentSchema = z.object({
    documentType: z.nativeEnum(DocumentType, {
        message: "Invalid documentType. Must be ID_PROOF, ADDRESS_PROOF, POLICY, CLAIM, or OTHER."
    }),
    customerId: optionalIdSchema,
    policyId: optionalIdSchema,
    claimId: optionalIdSchema,
}).refine(data => {
    // Reject requests without at least one relation
    return data.customerId !== undefined || data.policyId !== undefined || data.claimId !== undefined;
}, {
    message: "At least one relation (customerId, policyId, or claimId) must be provided.",
    path: ["customerId"]
}).superRefine((data, ctx) => {
    // Business Rules:
    // Identity document -> linked to Customer.
    if ((data.documentType === "ID_PROOF" || data.documentType === "ADDRESS_PROOF") && !data.customerId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Identity documents (ID_PROOF or ADDRESS_PROOF) must be linked to a Customer.",
            path: ["customerId"]
        });
    }

    // Policy document -> linked to Policy.
    if (data.documentType === "POLICY" && !data.policyId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Policy documents must be linked to a Policy.",
            path: ["policyId"]
        });
    }

    // Claim document -> linked to Claim.
    if (data.documentType === "CLAIM" && !data.claimId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Claim documents must be linked to a Claim.",
            path: ["claimId"]
        });
    }
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;

// PAGINATION AND FILTER QUERY VALIDATOR
export const getDocumentsQuerySchema = z.object({
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
    sort: z.string().trim().default("uploadedAt"),
    order: z.enum(["asc", "desc"] as const).default("desc"),
    documentType: z.nativeEnum(DocumentType).optional(),
    customerId: z.string().trim().optional(),
    policyId: z.string().trim().optional(),
    claimId: z.string().trim().optional()
});

export type GetDocumentsQueryInput = z.infer<typeof getDocumentsQuerySchema>;
