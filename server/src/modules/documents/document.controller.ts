import type { Request, Response } from "express";
import asyncHandler from "../../middleware/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";
import * as documentService from "./document.service.js";
import {
    uploadDocumentSchema,
    getDocumentsQuerySchema
} from "./document.validators.js";
import fs from "fs";

/**
 * POST /api/documents
 * Upload a document.
 */
export const uploadDocument = asyncHandler(async (req: Request, res: Response) => {
    let fileUploaded = false;
    let uploadedFilePath = "";

    try {
        if (req.file) {
            fileUploaded = true;
            uploadedFilePath = req.file.path;
        } else {
            throw new ApiError(400, "No file uploaded. Please upload a document file.");
        }

        // Validate text fields using Zod
        const validatedData = uploadDocumentSchema.parse(req.body);
        const user = req.user!;

        const document = await documentService.uploadDocument(
            validatedData,
            {
                filename: req.file.filename,
                path: req.file.path,
                mimetype: req.file.mimetype
            },
            user
        );

        return res.status(201).json(
            new ApiResponse(201, document, "Document uploaded successfully.")
        );
    } catch (error) {
        // Clean up the uploaded file from disk if anything fails (validation or service error)
        if (fileUploaded && uploadedFilePath) {
            try {
                if (fs.existsSync(uploadedFilePath)) {
                    fs.unlinkSync(uploadedFilePath);
                }
            } catch (unlinkError) {
                console.error("Failed to clean up uploaded file after error:", unlinkError);
            }
        }
        throw error;
    }
});

/**
 * GET /api/documents
 * Return list of paginated, role-scoped documents.
 */
export const getDocuments = asyncHandler(async (req: Request, res: Response) => {
    const validatedQuery = getDocumentsQuerySchema.parse(req.query);
    const user = req.user!;

    const result = await documentService.getDocumentsList(validatedQuery, user);

    return res.status(200).json(
        new ApiResponse(200, result, "Documents retrieved successfully.")
    );
});

/**
 * GET /api/documents/:id
 * Return complete document details.
 */
export const getDocument = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const user = req.user!;

    const document = await documentService.getDocumentDetails(id, user);

    return res.status(200).json(
        new ApiResponse(200, document, "Document details retrieved successfully.")
    );
});

/**
 * DELETE /api/documents/:id
 * Delete a document's record and file.
 */
export const deleteDocument = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const user = req.user!;

    await documentService.deleteDocument(id, user);

    return res.status(200).json(
        new ApiResponse(200, null, "Document deleted successfully.")
    );
});
