import { z } from "zod";
import { PaymentMethod } from "../../../generated/prisma/enums.js";

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

// CREATE PAYMENT VALIDATOR
export const createPaymentSchema = z.object({
    policyId: z.string({ message: "policyId is required" }).trim(),
    amount: numericField("Amount"),
    paymentDate: z
        .string({ message: "paymentDate is required" })
        .refine((val) => !isNaN(Date.parse(val)), "Invalid payment date format")
        .transform((val) => new Date(val)),
    paymentMethod: z.nativeEnum(PaymentMethod, { message: "Invalid payment method" }),
    transactionId: z.string().trim().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

// LIST/FILTER PAYMENTS QUERY VALIDATOR
export const listPaymentsQuerySchema = z.object({
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
    sort: z.string().trim().default("dueDate"),
    order: z.enum(["asc", "desc"]).default("desc"),
    status: z.enum(["PAID", "PENDING", "OVERDUE", "FAILED"]).optional(),
    paymentMethod: z.nativeEnum(PaymentMethod).optional(),
    policyId: z.string().trim().cuid("Invalid policyId format").optional(),
    customerId: z.string().trim().cuid("Invalid customerId format").optional(),
    agentId: z.string().trim().cuid("Invalid agentId format").optional(),
    fromDate: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), "Invalid fromDate format")
        .transform((val) => new Date(val))
        .optional(),
    toDate: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), "Invalid toDate format")
        .transform((val) => new Date(val))
        .optional(),
});

export type ListPaymentsQueryInput = z.infer<typeof listPaymentsQuerySchema>;
