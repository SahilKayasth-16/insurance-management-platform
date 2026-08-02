import { z } from "zod";

export const getMonthlyReportQuerySchema = z.object({
    year: z
        .string({ message: "Year is required" })
        .trim()
        .min(1, "Year is required")
        .transform((val) => parseInt(val, 10))
        .refine((val) => !isNaN(val), "Year must be an integer")
        .refine((val) => val >= 2000, "Year must be at least 2000")
        .refine(
            (val) => val <= new Date().getFullYear(),
            `Year cannot exceed the current year (${new Date().getFullYear()})`
        )
});

export type GetMonthlyReportQueryInput = z.infer<typeof getMonthlyReportQuerySchema>;
