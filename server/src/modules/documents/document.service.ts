import prisma from "../../lib/prisma.js";
import ApiError from "../../utils/ApiError.js";
import type { UploadDocumentInput, GetDocumentsQueryInput } from "./document.validators.js";
import fs from "fs";

/**
 * Format a Prisma Document structure into the response Document format.
 */
const formatDocument = (doc: any) => {
    if (!doc) return null;
    return {
        id: doc.id,
        customerId: doc.customerId,
        policyId: doc.policyId,
        claimId: doc.claimId,
        documentType: doc.documentType,
        fileName: doc.fileName,
        filePath: doc.filePath,
        fileType: doc.fileType,
        uploadedAt: doc.uploadedAt,
        customer: doc.customer ? {
            id: doc.customer.id,
            dob: doc.customer.dob,
            phone: doc.customer.phone,
            address: doc.customer.address,
            city: doc.customer.city,
            state: doc.customer.state,
            pincode: doc.customer.pincode,
            user: doc.customer.user ? {
                id: doc.customer.user.id,
                name: doc.customer.user.name,
                email: doc.customer.user.email,
                role: doc.customer.user.role,
                isActive: doc.customer.user.isActive
            } : null
        } : null,
        policy: doc.policy ? {
            id: doc.policy.id,
            policyNumber: doc.policy.policyNumber,
            policyType: doc.policy.policyType,
            coverageAmount: Number(doc.policy.coverageAmount),
            premiumAmount: Number(doc.policy.premiumAmount),
            startDate: doc.policy.startDate,
            endDate: doc.policy.endDate,
            status: doc.policy.status
        } : null,
        claim: doc.claim ? {
            id: doc.claim.id,
            policyId: doc.claim.policyId,
            claimAmount: Number(doc.claim.claimAmount),
            reason: doc.claim.reason,
            description: doc.claim.description,
            incidentDate: doc.claim.incidentDate,
            status: doc.claim.status,
            submissionDate: doc.claim.submissionDate
        } : null
    };
};

/**
 * Upload a document record.
 */
export const uploadDocument = async (
    data: UploadDocumentInput,
    file: { filename: string; path: string; mimetype: string },
    user: any
) => {
    // 1. Verify existence of the specified entities
    let customerEntity: any = null;
    let policyEntity: any = null;
    let claimEntity: any = null;

    if (data.customerId) {
        customerEntity = await prisma.customer.findUnique({
            where: { id: data.customerId }
        });
        if (!customerEntity) {
            throw new ApiError(404, "Customer profile not found.");
        }
    }

    if (data.policyId) {
        policyEntity = await prisma.policy.findUnique({
            where: { id: data.policyId }
        });
        if (!policyEntity) {
            throw new ApiError(404, "Policy not found.");
        }
    }

    if (data.claimId) {
        claimEntity = await prisma.claim.findUnique({
            where: { id: data.claimId },
            include: { policy: true }
        });
        if (!claimEntity) {
            throw new ApiError(404, "Claim not found.");
        }
    }

    // 2. Perform role-based authorization check
    if (user.role === "CUSTOMER") {
        const customer = await prisma.customer.findUnique({
            where: { userId: user.id }
        });
        if (!customer) {
            throw new ApiError(404, "Customer profile not found.");
        }

        if (data.customerId && data.customerId !== customer.id) {
            throw new ApiError(403, "You can only upload documents for your own profile.");
        }
        if (policyEntity && policyEntity.customerId !== customer.id) {
            throw new ApiError(403, "You can only upload documents for your own policies.");
        }
        if (claimEntity && claimEntity.policy.customerId !== customer.id) {
            throw new ApiError(403, "You can only upload documents for your own claims.");
        }
    } else if (user.role === "AGENT") {
        // Agent can upload policy/claim/customer identity documents only if assigned to them.
        if (policyEntity && policyEntity.agentId !== user.id) {
            throw new ApiError(403, "You can only upload documents for policies assigned to you.");
        }
        if (claimEntity && claimEntity.policy.agentId !== user.id) {
            throw new ApiError(403, "You can only upload documents for claims assigned to you.");
        }
        if (data.customerId) {
            const assignedPolicy = await prisma.policy.findFirst({
                where: {
                    customerId: data.customerId,
                    agentId: user.id
                }
            });
            if (!assignedPolicy) {
                throw new ApiError(403, "You can only upload documents for customers assigned to you.");
            }
        }
    }

    // 3. Create the Document record
    const document = await prisma.document.create({
        data: {
            customerId: data.customerId || null,
            policyId: data.policyId || null,
            claimId: data.claimId || null,
            documentType: data.documentType,
            fileName: file.filename,
            filePath: file.path.replace(/\\/g, "/"),
            fileType: file.mimetype
        },
        include: {
            customer: {
                include: {
                    user: true
                }
            },
            policy: true,
            claim: true
        }
    });

    return formatDocument(document);
};

/**
 * Return paginated documents list with filters, search, and sorting.
 */
export const getDocumentsList = async (query: GetDocumentsQueryInput, user: any) => {
    const { page, limit, search, sort, order, documentType, customerId, policyId, claimId } = query;

    const where: any = {};

    // 1. Role-based scoping
    if (user.role === "CUSTOMER") {
        where.OR = [
            { customer: { userId: user.id } },
            { policy: { customer: { userId: user.id } } },
            { claim: { policy: { customer: { userId: user.id } } } }
        ];
    } else if (user.role === "AGENT") {
        where.OR = [
            { policy: { agentId: user.id } },
            { claim: { policy: { agentId: user.id } } },
            { customer: { policies: { some: { agentId: user.id } } } }
        ];
    }

    // 2. Query filters
    if (documentType) {
        where.documentType = documentType;
    }
    if (customerId) {
        where.customerId = customerId;
    }
    if (policyId) {
        where.policyId = policyId;
    }
    if (claimId) {
        where.claimId = claimId;
    }

    // 3. Search filter
    if (search) {
        const searchFilter = { contains: search, mode: "insensitive" as const };
        where.AND = [
            ...(where.AND || []),
            {
                OR: [
                    { fileName: searchFilter },
                    { fileType: searchFilter },
                    { policy: { policyNumber: searchFilter } },
                    { customer: { user: { name: searchFilter } } },
                    { customer: { user: { email: searchFilter } } }
                ]
            }
        ];
    }

    // 4. Sorting configuration
    const validSortFields = ["id", "documentType", "fileName", "fileType", "uploadedAt"];
    const sortBy = validSortFields.includes(sort) ? sort : "uploadedAt";
    const orderBy = { [sortBy]: order };

    // 5. Pagination
    const skip = (page - 1) * limit;

    const [total, documents] = await Promise.all([
        prisma.document.count({ where }),
        prisma.document.findMany({
            where,
            orderBy,
            skip,
            take: limit,
            include: {
                customer: {
                    include: {
                        user: true
                    }
                },
                policy: true,
                claim: true
            }
        })
    ]);

    const formattedDocuments = documents.map(formatDocument);
    const totalPages = Math.ceil(total / limit);

    return {
        documents: formattedDocuments,
        pagination: {
            page,
            limit,
            total,
            totalPages
        }
    };
};

/**
 * Return complete details of a single document.
 */
export const getDocumentDetails = async (id: string, user: any) => {
    const document = await prisma.document.findUnique({
        where: { id },
        include: {
            customer: {
                include: {
                    user: true
                }
            },
            policy: true,
            claim: {
                include: {
                    policy: true
                }
            }
        }
    });

    if (!document) {
        throw new ApiError(404, "Document not found.");
    }

    // Verify permissions
    await checkDocumentPermission(document, user);

    return formatDocument(document);
};

/**
 * Delete a document's record and file.
 */
export const deleteDocument = async (id: string, user: any) => {
    const document = await prisma.document.findUnique({
        where: { id },
        include: {
            policy: true,
            claim: {
                include: {
                    policy: true
                }
            }
        }
    });

    if (!document) {
        throw new ApiError(404, "Document not found.");
    }

    // Verify permissions
    await checkDocumentPermission(document, user);

    // Delete the file from the filesystem first
    const filePath = document.filePath;
    try {
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
        }
    } catch (error) {
        console.warn(`Warning: Failed to delete physical file: ${filePath}`, error);
    }

    // Delete the database record
    await prisma.document.delete({
        where: { id }
    });
};

/**
 * Helper function to check role-based permissions on a specific document.
 */
const checkDocumentPermission = async (document: any, user: any) => {
    if (user.role === "ADMIN") {
        return; // Full access
    }

    if (user.role === "CUSTOMER") {
        const customer = await prisma.customer.findUnique({
            where: { userId: user.id }
        });
        if (!customer) {
            throw new ApiError(403, "You do not have permission to access this document.");
        }

        let hasAccess = false;
        if (document.customerId === customer.id) hasAccess = true;
        if (document.policy && document.policy.customerId === customer.id) hasAccess = true;
        if (document.claim && document.claim.policy && document.claim.policy.customerId === customer.id) hasAccess = true;

        if (!hasAccess) {
            throw new ApiError(403, "You do not have permission to access this document.");
        }
        return;
    }

    if (user.role === "AGENT") {
        let hasAccess = false;
        if (document.policy && document.policy.agentId === user.id) hasAccess = true;
        if (document.claim && document.claim.policy && document.claim.policy.agentId === user.id) hasAccess = true;
        if (document.customerId) {
            const hasAgentPolicy = await prisma.policy.findFirst({
                where: {
                    customerId: document.customerId,
                    agentId: user.id
                }
            });
            if (hasAgentPolicy) hasAccess = true;
        }

        if (!hasAccess) {
            throw new ApiError(403, "You do not have permission to access this document.");
        }
        return;
    }

    throw new ApiError(403, "Unknown role. Permission denied.");
};
