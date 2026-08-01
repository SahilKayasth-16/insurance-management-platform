import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import authenticate from "../../middleware/auth.middleware.js";
import authorize from "../../middleware/role.middleware.js";
import ApiError from "../../utils/ApiError.js";
import {
    uploadDocument,
    getDocuments,
    getDocument,
    deleteDocument
} from "./document.controller.js";

const router = Router();

// Configure disk storage for Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = "uploads/documents/";
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const nameWithoutExt = path.basename(file.originalname, ext)
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "_");
        const timestamp = Date.now();
        cb(null, `${nameWithoutExt}_${timestamp}${ext}`);
    }
});

// Configure file filter for allowed and rejected extensions
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimeTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    const forbiddenExtensions = [".exe", ".zip", ".js", ".ts", ".bat", ".apk"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (forbiddenExtensions.includes(ext)) {
        return cb(new ApiError(400, `File upload rejected: files with extension '${ext}' are not allowed.`));
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new ApiError(400, "Invalid file type. Only PDF, PNG, JPEG, and JPG are allowed."));
    }

    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB limit
    }
});

// Wrapper middleware to intercept and convert multer-specific limits/errors
const uploadSingleDocument = (req: any, res: any, next: any) => {
    upload.single("file")(req, res, (err: any) => {
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return next(new ApiError(400, "File size exceeds the 5 MB limit."));
            }
            return next(new ApiError(400, `File upload error: ${err.message}`));
        } else if (err) {
            return next(err);
        }
        next();
    });
};

// All document management routes require authentication
router.use(authenticate);

// Endpoint registration
router.post("/", authorize("ADMIN", "AGENT", "CUSTOMER"), uploadSingleDocument, uploadDocument);
router.get("/", authorize("ADMIN", "AGENT", "CUSTOMER"), getDocuments);
router.get("/:id", authorize("ADMIN", "AGENT", "CUSTOMER"), getDocument);
router.delete("/:id", authorize("ADMIN", "AGENT", "CUSTOMER"), deleteDocument);

export default router;
