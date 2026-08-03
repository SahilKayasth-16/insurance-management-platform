import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { FiUploadCloud, FiInfo, FiTrash2, FiFile, FiLock, FiLink, FiDownload } from "react-icons/fi";
import { useForm } from "react-hook-form";

import PageHeader from "../../components/PageHeader.js";
import Card from "../../components/Card.js";
import DataTable, { Column } from "../../components/DataTable.js";
import SearchBar from "../../components/SearchBar.js";
import Pagination from "../../components/Pagination.js";
import Modal from "../../components/Modal.js";
import ConfirmDialog from "../../components/ConfirmDialog.js";
import { SelectInput, FormInput } from "../../components/FormFields.js";

import { getDocumentsApi, uploadDocumentApi, deleteDocumentApi, getDocumentApi } from "../../api/documents.api.js";
import { getPaymentsApi, getPaymentApi } from "../../api/payments.api.js";
import { getClaimsApi } from "../../api/claims.api.js";
import { getCustomersApi } from "../../api/customers.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import type { DocumentRecord, DocumentType, PaginationInfo } from "../../types/business.js";
import type { Claim } from "../../types/business.js";

export const DocumentsList: React.FC = () => {
    const { role } = useAuth();
    const [documents, setDocuments] = useState<DocumentRecord[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    // Query states
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("");
    const [sortField, setSortField] = useState("uploadedAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [loading, setLoading] = useState(false);

    // Detail/Modal states
    const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
    const [selectedDocDetails, setSelectedDocDetails] = useState<any | null>(null);
    const [selectedDocLoading, setSelectedDocLoading] = useState(false);

    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [deletingDoc, setDeletingDoc] = useState<DocumentRecord | null>(null);

    const [uploadLoading, setUploadLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Resolved Customer ID for logged-in CUSTOMER role
    const [resolvedCustomerId, setResolvedCustomerId] = useState<string>("");
    
    // Lists for upload mappings
    const [policies, setPolicies] = useState<{ id: string; policyNumber: string }[]>([]);
    const [claims, setClaims] = useState<{ id: string; policyNumber: string }[]>([]);
    const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
        defaultValues: {
            documentType: "" as DocumentType,
            customerId: "",
            policyId: "",
            claimId: "",
            file: null as any
        }
    });

    const watchDocType = watch("documentType");

    const fetchDocuments = useCallback(async () => {
        setLoading(true);
        try {
            const query: any = {
                page: pagination.page,
                limit: pagination.limit,
                search,
                sort: sortField,
                order: sortOrder
            };
            if (typeFilter) query.documentType = typeFilter;

            const response = await getDocumentsApi(query);
            if (response.success && response.data.documents) {
                setDocuments(response.data.documents);
                setPagination(response.data.pagination);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to load documents.");
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, search, typeFilter, sortField, sortOrder]);

    const resolveCustomerId = useCallback(async () => {
        if (role !== "CUSTOMER" || resolvedCustomerId) return;
        try {
            const paymentsRes = await getPaymentsApi({ limit: 1 });
            if (paymentsRes.success && paymentsRes.data.payments && paymentsRes.data.payments.length > 0) {
                const detailRes = await getPaymentApi(paymentsRes.data.payments[0].id);
                if (detailRes.success && detailRes.data.policy?.customer) {
                    setResolvedCustomerId(detailRes.data.policy.customer.id);
                }
            }
        } catch (e) {
            console.warn("Could not auto-resolve customer ID.");
        }
    }, [role, resolvedCustomerId]);

    const fetchMappingsForUpload = useCallback(async () => {
        try {
            if (role === "CUSTOMER") {
                // Load policy list
                const paymentsRes = await getPaymentsApi({ limit: 50 });
                if (paymentsRes.success && paymentsRes.data.payments) {
                    const uniquePoliciesMap = new Map<string, string>();
                    paymentsRes.data.payments.forEach(p => {
                        if (p.policyId && p.policyNumber) uniquePoliciesMap.set(p.policyId, p.policyNumber);
                    });
                    setPolicies(Array.from(uniquePoliciesMap.entries()).map(([id, num]) => ({ id, policyNumber: num })));
                }
                
                // Load claims list
                const claimsRes = await getClaimsApi({ limit: 50 });
                if (claimsRes.success && claimsRes.data.claims) {
                    setClaims(claimsRes.data.claims.map(c => ({ id: c.id, policyNumber: c.policy?.policyNumber || "Claim" })));
                }
            } else {
                // Admin or Agent
                const custRes = await getCustomersApi({ limit: 50 });
                if (custRes.success && custRes.data.customers) {
                    setCustomers(custRes.data.customers.map(c => ({ id: c.id, name: c.user?.name || "Client" })));
                }

                // Load all claims to display
                const claimsRes = await getClaimsApi({ limit: 50 });
                if (claimsRes.success && claimsRes.data.claims) {
                    setClaims(claimsRes.data.claims.map(c => ({ id: c.id, policyNumber: c.policy?.policyNumber || "Claim" })));
                }
            }
        } catch (err) {
            console.warn("Dropdown mapping load failed.");
        }
    }, [role]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    useEffect(() => {
        if (isUploadOpen) {
            resolveCustomerId();
            fetchMappingsForUpload();
        }
    }, [isUploadOpen, resolveCustomerId, fetchMappingsForUpload]);

    const handleSort = (field: string) => {
        const order = sortField === field && sortOrder === "desc" ? "asc" : "desc";
        setSortField(field);
        setSortOrder(order);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handleViewDetails = async (doc: DocumentRecord) => {
        setSelectedDocLoading(true);
        try {
            const res = await getDocumentApi(doc.id);
            if (res.success) {
                setSelectedDocDetails(res.data);
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to fetch document details.");
        } finally {
            setSelectedDocLoading(false);
        }
    };

    const onUpload = async (data: any) => {
        if (!data.file || data.file.length === 0) {
            toast.error("Please select a file to upload.");
            return;
        }

        setUploadLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", data.file[0]);
            formData.append("documentType", data.documentType);
            
            // Set associated relations
            if (role === "CUSTOMER") {
                if (data.documentType === "ID_PROOF" || data.documentType === "ADDRESS_PROOF") {
                    formData.append("customerId", resolvedCustomerId);
                }
            } else {
                if (data.customerId) formData.append("customerId", data.customerId);
            }

            if (data.policyId) formData.append("policyId", data.policyId);
            if (data.claimId) formData.append("claimId", data.claimId);

            const response = await uploadDocumentApi(formData);
            if (response.success) {
                toast.success("Document uploaded successfully!");
                reset();
                setIsUploadOpen(false);
                fetchDocuments();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to upload document.");
        } finally {
            setUploadLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingDoc) return;
        setDeleteLoading(true);
        try {
            const response = await deleteDocumentApi(deletingDoc.id);
            if (response.success) {
                toast.success("Document deleted successfully.");
                setDeletingDoc(null);
                fetchDocuments();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to delete document.");
        } finally {
            setDeleteLoading(false);
        }
    };

    const formatBytes = (bytes: number, decimals = 2) => {
        if (!bytes) return "0 Bytes";
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ["Bytes", "KB", "MB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
    };

    const columns: Column<DocumentRecord>[] = [
        { key: "fileName", label: "File Name", sortable: true },
        { 
            key: "documentType", 
            label: "Category", 
            sortable: true,
            render: (item) => (
                <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-inset ring-sky-600/20">
                    {item.documentType}
                </span>
            )
        },
        { key: "fileType", label: "Format", sortable: true },
        { 
            key: "uploadedAt", 
            label: "Upload Date", 
            sortable: true,
            render: (item) => new Date(item.uploadedAt).toLocaleDateString()
        },
        {
            key: "actions",
            label: "Actions",
            align: "center",
            render: (item) => (
                <div className="flex items-center justify-center space-x-2">
                    <button
                        onClick={() => handleViewDetails(item)}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                        title="View Metadata"
                    >
                        <FiInfo className="h-4.5 w-4.5" />
                    </button>
                    <button
                        onClick={() => setDeletingDoc(item)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-800 transition-colors"
                        title="Delete Document"
                    >
                        <FiTrash2 className="h-4.5 w-4.5" />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Document Vault"
                description="Upload KYC identity credentials, sign policy coverage forms, and index claim support reports."
                action={
                    <button
                        onClick={() => setIsUploadOpen(true)}
                        className="flex items-center space-x-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-600/10 hover:bg-sky-700 transition-all duration-200"
                    >
                        <FiUploadCloud className="h-4 w-4" />
                        <span>Upload File</span>
                    </button>
                }
            />

            <Card>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                    <SearchBar
                        value={search}
                        onChange={(val) => {
                            setSearch(val);
                            setPagination(prev => ({ ...prev, page: 1 }));
                        }}
                        placeholder="Search by file name..."
                    />

                    <div className="flex items-center gap-3">
                        <select
                            value={typeFilter}
                            onChange={(e) => {
                                setTypeFilter(e.target.value);
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                            className="rounded-xl border border-slate-200/60 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/10 backdrop-blur-md"
                        >
                            <option value="">All Categories</option>
                            <option value="ID_PROOF">ID_PROOF</option>
                            <option value="ADDRESS_PROOF">ADDRESS_PROOF</option>
                            <option value="POLICY">POLICY</option>
                            <option value="CLAIM">CLAIM</option>
                            <option value="OTHER">OTHER</option>
                        </select>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={documents}
                    loading={loading || selectedDocLoading}
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                />

                <Pagination
                    pagination={pagination}
                    onPageChange={handlePageChange}
                />
            </Card>

            {/* DETAILS METADATA MODAL */}
            {selectedDocDetails && (
                <Modal
                    isOpen={!!selectedDocDetails}
                    onClose={() => setSelectedDocDetails(null)}
                    title="Document Profile Dossier"
                >
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <span className="text-xs font-bold text-slate-400 uppercase">Document Class</span>
                            <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-inset ring-sky-600/20">
                                {selectedDocDetails.documentType}
                            </span>
                        </div>

                        <div className="flex items-start space-x-3 p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                            <FiFile className="h-6 w-6 text-sky-600 mt-0.5" />
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Registered File Name</span>
                                <span className="text-sm font-bold text-slate-800 block break-all">{selectedDocDetails.fileName}</span>
                                <span className="text-xs font-semibold text-slate-500">
                                    {selectedDocDetails.fileType}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Uploaded Date</span>
                                <span className="text-sm font-bold text-slate-800">{new Date(selectedDocDetails.uploadedAt).toLocaleString()}</span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Document ID</span>
                                <span className="text-xs font-bold text-slate-500 truncate block select-all">{selectedDocDetails.id}</span>
                            </div>
                        </div>

                        {/* Associated Relations */}
                        <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100 space-y-3">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center space-x-1">
                                <FiLink className="h-3 w-3" />
                                <span>Entity Connections</span>
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-600">
                                {selectedDocDetails.customer && (
                                    <>
                                        <span>Customer Profile:</span>
                                        <span className="text-slate-800 text-right font-bold">{selectedDocDetails.customer.user?.name}</span>
                                    </>
                                )}
                                {selectedDocDetails.policy && (
                                    <>
                                        <span>Policy Number:</span>
                                        <span className="text-slate-800 text-right font-bold">{selectedDocDetails.policy.policyNumber}</span>
                                    </>
                                )}
                                {selectedDocDetails.claim && (
                                    <>
                                        <span>Claim Reason:</span>
                                        <span className="text-slate-800 text-right font-bold">{selectedDocDetails.claim.reason}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Preview / Download Warning */}
                        <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-100 flex items-start space-x-3">
                            <FiLock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <h5 className="text-xs font-bold text-amber-800 m-0">Private Storage Isolation</h5>
                                <p className="text-[11px] text-amber-700 m-0 mt-1 font-medium leading-relaxed">
                                    Files are stored in private secure folders. Direct viewing is disabled. Please contact your system administrator to access file backups directly at:
                                </p>
                                <code className="block mt-2 text-[10px] text-slate-700 font-bold bg-white/80 p-2 rounded border border-amber-200/40 break-all select-all">
                                    {selectedDocDetails.filePath}
                                </code>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* UPLOAD MODAL */}
            <Modal
                isOpen={isUploadOpen}
                onClose={() => {
                    setIsUploadOpen(false);
                    reset();
                }}
                title="Upload Document"
            >
                <form onSubmit={handleSubmit(onUpload)} className="space-y-4">
                    <SelectInput
                        label="Document Category"
                        options={[
                            { value: "ID_PROOF", label: "ID PROOF" },
                            { value: "ADDRESS_PROOF", label: "ADDRESS PROOF" },
                            { value: "POLICY", label: "POLICY FORM" },
                            { value: "CLAIM", label: "CLAIM DOCUMENT" },
                            { value: "OTHER", label: "OTHER / MISC" }
                        ]}
                        error={errors.documentType?.message}
                        {...register("documentType", { required: "Document category is required" })}
                    />

                    {/* Conditional Relations mapping */}
                    {(watchDocType === "ID_PROOF" || watchDocType === "ADDRESS_PROOF" || watchDocType === "OTHER") && role !== "CUSTOMER" && (
                        <div className="flex flex-col space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Link to Customer Profile <span className="text-rose-500">*</span>
                            </label>
                            <select
                                {...register("customerId", { required: "Customer connection is required for identity proofs" })}
                                className="block w-full rounded-xl border border-slate-200/60 bg-white/70 px-4 py-2.5 text-sm text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/10 backdrop-blur-md transition-all font-medium"
                            >
                                <option value="">Select customer...</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            {errors.customerId && <span className="text-xs font-medium text-rose-500">{errors.customerId.message}</span>}
                        </div>
                    )}

                    {watchDocType === "POLICY" && (
                        <div className="flex flex-col space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Link to Policy <span className="text-rose-500">*</span>
                            </label>
                            {role === "CUSTOMER" ? (
                                <select
                                    {...register("policyId", { required: "Policy link is required" })}
                                    className="block w-full rounded-xl border border-slate-200/60 bg-white/70 px-4 py-2.5 text-sm text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/10 backdrop-blur-md transition-all font-medium"
                                >
                                    <option value="">Select policy...</option>
                                    {policies.map(p => (
                                        <option key={p.id} value={p.id}>{p.policyNumber}</option>
                                    ))}
                                </select>
                            ) : (
                                <FormInput
                                    label="Policy CUID"
                                    placeholder="Enter policy identifier (CUID)"
                                    error={errors.policyId?.message}
                                    {...register("policyId", { required: "Policy link is required" })}
                                />
                            )}
                            {errors.policyId && <span className="text-xs font-medium text-rose-500">{errors.policyId.message}</span>}
                        </div>
                    )}

                    {watchDocType === "CLAIM" && (
                        <div className="flex flex-col space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Link to Claim <span className="text-rose-500">*</span>
                            </label>
                            <select
                                {...register("claimId", { required: "Claim link is required" })}
                                className="block w-full rounded-xl border border-slate-200/60 bg-white/70 px-4 py-2.5 text-sm text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/10 backdrop-blur-md transition-all font-medium"
                            >
                                <option value="">Select claim...</option>
                                {claims.map(c => (
                                    <option key={c.id} value={c.id}>Policy: {c.policyNumber} (ID: {c.id})</option>
                                ))}
                            </select>
                            {errors.claimId && <span className="text-xs font-medium text-rose-500">{errors.claimId.message}</span>}
                        </div>
                    )}

                    <div className="flex flex-col space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Select Document File <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            {...register("file", { required: "Please upload a document file" })}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 transition-all cursor-pointer font-medium"
                        />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Allowed formats: PDF, PNG, JPG, JPEG (Max size: 5 MB)</span>
                        {errors.file && <span className="text-xs font-medium text-rose-500">{errors.file.message?.toString()}</span>}
                    </div>

                    <div className="mt-6 flex justify-end space-x-3 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setIsUploadOpen(false);
                                reset();
                            }}
                            disabled={uploadLoading}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={uploadLoading}
                            className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-600/10 hover:bg-sky-700 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                        >
                            {uploadLoading ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            ) : (
                                "Upload Document"
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* DELETE DOCUMENT CONFIRM */}
            {deletingDoc && (
                <ConfirmDialog
                    isOpen={!!deletingDoc}
                    title="Delete Secure Document"
                    message={`Are you sure you want to delete document "${deletingDoc.fileName}"? This operation completely unlinks the record and removes the file from secure storage.`}
                    confirmText="Delete Document"
                    onConfirm={handleDelete}
                    onCancel={() => setDeletingDoc(null)}
                    loading={deleteLoading}
                />
            )}
        </div>
    );
};

export default DocumentsList;
