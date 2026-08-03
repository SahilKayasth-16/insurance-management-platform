import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { FiFileText, FiInfo, FiPlusCircle, FiCheck, FiX, FiCalendar, FiDollarSign } from "react-icons/fi";
import { useForm } from "react-hook-form";

import PageHeader from "../../components/PageHeader.js";
import Card from "../../components/Card.js";
import DataTable, { Column } from "../../components/DataTable.js";
import SearchBar from "../../components/SearchBar.js";
import Pagination from "../../components/Pagination.js";
import StatusBadge from "../../components/StatusBadge.js";
import Modal from "../../components/Modal.js";
import { FormInput, SelectInput, DatePicker, CurrencyField } from "../../components/FormFields.js";

import { getClaimsApi, getClaimApi, submitClaimApi, reviewClaimApi } from "../../api/claims.api.js";
import { getPaymentsApi, getPaymentApi } from "../../api/payments.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import type { Claim, ClaimStatus, PaginationInfo } from "../../types/business.js";

export const ClaimsList: React.FC = () => {
    const { user, role } = useAuth();
    const [claims, setClaims] = useState<Claim[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    // Query states
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [sortField, setSortField] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [loading, setLoading] = useState(false);

    // Detail/Modal states
    const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
    const [selectedClaimDetails, setSelectedClaimDetails] = useState<any | null>(null);
    const [selectedClaimLoading, setSelectedClaimLoading] = useState(false);

    const [isSubmitOpen, setIsSubmitOpen] = useState(false);
    const [reviewingClaim, setReviewingClaim] = useState<Claim | null>(null);
    
    const [submitLoading, setSubmitLoading] = useState(false);
    const [reviewLoading, setReviewLoading] = useState(false);

    // Customer policies for dropdown
    const [customerPolicies, setCustomerPolicies] = useState<{ id: string; policyNumber: string }[]>([]);

    const { register: registerSubmit, handleSubmit: handleSubmitSubmit, reset: resetSubmit, formState: { errors: errorsSubmit } } = useForm({
        defaultValues: {
            policyId: "",
            claimAmount: 0,
            incidentDate: new Date().toISOString().split("T")[0],
            reason: "",
            description: ""
        }
    });

    const { register: registerReview, handleSubmit: handleSubmitReview, reset: resetReview, formState: { errors: errorsReview } } = useForm({
        defaultValues: {
            status: "" as any,
            remarks: ""
        }
    });

    const fetchClaims = useCallback(async () => {
        setLoading(true);
        try {
            const query: any = {
                page: pagination.page,
                limit: pagination.limit,
                search,
                sort: sortField,
                order: sortOrder
            };
            if (statusFilter) query.status = statusFilter;

            const response = await getClaimsApi(query);
            if (response.success && response.data.claims) {
                setClaims(response.data.claims);
                setPagination(response.data.pagination);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to load claims.");
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, search, statusFilter, sortField, sortOrder]);

    const fetchCustomerPolicies = useCallback(async () => {
        if (role !== "CUSTOMER") return;
        try {
            // Fetch customer's payments to identify unique policies
            const response = await getPaymentsApi({ page: 1, limit: 100 });
            if (response.success && response.data.payments) {
                const uniquePoliciesMap = new Map<string, string>();
                response.data.payments.forEach(p => {
                    if (p.policyId && p.policyNumber && !uniquePoliciesMap.has(p.policyId)) {
                        uniquePoliciesMap.set(p.policyId, p.policyNumber);
                    }
                });
                
                const list = Array.from(uniquePoliciesMap.entries()).map(([id, policyNumber]) => ({
                    id,
                    policyNumber
                }));
                setCustomerPolicies(list);
            }
        } catch (err) {
            console.warn("Failed to load customer policies for claims filing.");
        }
    }, [role]);

    useEffect(() => {
        fetchClaims();
    }, [fetchClaims]);

    useEffect(() => {
        if (isSubmitOpen) {
            fetchCustomerPolicies();
        }
    }, [isSubmitOpen, fetchCustomerPolicies]);

    const handleSort = (field: string) => {
        const order = sortField === field && sortOrder === "desc" ? "asc" : "desc";
        setSortField(field);
        setSortOrder(order);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handleViewDetails = async (claim: Claim) => {
        setSelectedClaimLoading(true);
        try {
            const res = await getClaimApi(claim.id);
            if (res.success) {
                setSelectedClaimDetails(res.data);
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to fetch claim details.");
        } finally {
            setSelectedClaimLoading(false);
        }
    };

    const handleOpenReview = (claim: Claim) => {
        setReviewingClaim(claim);
        resetReview({
            status: "" as any,
            remarks: ""
        });
    };

    const onSubmitClaim = async (data: any) => {
        setSubmitLoading(true);
        try {
            const response = await submitClaimApi({
                ...data,
                claimAmount: Number(data.claimAmount)
            });
            if (response.success) {
                toast.success("Claim submitted successfully for review.");
                resetSubmit();
                setIsSubmitOpen(false);
                fetchClaims();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to file claim.");
        } finally {
            setSubmitLoading(false);
        }
    };

    const onReviewClaim = async (data: any) => {
        if (!reviewingClaim) return;
        setReviewLoading(true);
        try {
            const response = await reviewClaimApi(reviewingClaim.id, data);
            if (response.success) {
                toast.success(`Claim reviewed successfully: status set to ${data.status}`);
                setReviewingClaim(null);
                fetchClaims();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to submit claim review.");
        } finally {
            setReviewLoading(false);
        }
    };

    const columns: Column<Claim>[] = [
        { 
            key: "policyNumber", 
            label: "Policy Number", 
            render: (item) => item.policy?.policyNumber || "-"
        },
        { 
            key: "customerName", 
            label: "Customer", 
            render: (item) => item.customer?.user?.name || "-"
        },
        { 
            key: "claimAmount", 
            label: "Claim Value", 
            sortable: true,
            render: (item) => `$${Number(item.claimAmount).toLocaleString()}`
        },
        { key: "reason", label: "Reason" },
        { 
            key: "status", 
            label: "Status", 
            sortable: true,
            render: (item) => <StatusBadge status={item.status} />
        },
        { 
            key: "submissionDate", 
            label: "Filing Date", 
            sortable: true,
            render: (item) => new Date(item.submissionDate).toLocaleDateString()
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
                        title="View Details"
                    >
                        <FiInfo className="h-4.5 w-4.5" />
                    </button>
                    {role !== "CUSTOMER" && item.status === "PENDING" && (
                        <button
                            onClick={() => handleOpenReview(item)}
                            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-sky-50 text-sky-700 border border-sky-100 hover:bg-sky-100 transition-colors"
                        >
                            <span>Review</span>
                        </button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Insurance Claims"
                description="Submit coverage claims, view processing cycles, and review remark logs."
                action={
                    role === "CUSTOMER" && (
                        <button
                            onClick={() => setIsSubmitOpen(true)}
                            className="flex items-center space-x-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-600/10 hover:bg-sky-700 transition-all duration-200"
                        >
                            <FiPlusCircle className="h-4 w-4" />
                            <span>File Claim</span>
                        </button>
                    )
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
                        placeholder="Search by reason or policy..."
                    />

                    <div className="flex items-center gap-3">
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                            className="rounded-xl border border-slate-200/60 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/10 backdrop-blur-md"
                        >
                            <option value="">All Statuses</option>
                            <option value="PENDING">PENDING</option>
                            <option value="APPROVED">APPROVED</option>
                            <option value="REJECTED">REJECTED</option>
                        </select>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={claims}
                    loading={loading || selectedClaimLoading}
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                />

                <Pagination
                    pagination={pagination}
                    onPageChange={handlePageChange}
                />
            </Card>

            {/* DETAILS MODAL */}
            {selectedClaimDetails && (
                <Modal
                    isOpen={!!selectedClaimDetails}
                    onClose={() => setSelectedClaimDetails(null)}
                    title={`Claim details: ${selectedClaimDetails.policy?.policyNumber || "Claim Record"}`}
                >
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <span className="text-xs font-bold text-slate-400 uppercase">Processing Status</span>
                            <StatusBadge status={selectedClaimDetails.status} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Claim Value Requested</span>
                                <span className="text-sm font-bold text-slate-800">${Number(selectedClaimDetails.claimAmount).toLocaleString()}</span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Incident Date</span>
                                <span className="text-sm font-bold text-slate-800">{new Date(selectedClaimDetails.incidentDate).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Reason for Claim</span>
                            <span className="text-sm font-bold text-slate-800">{selectedClaimDetails.reason}</span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Detailed Incident Description</span>
                            <span className="text-sm font-semibold text-slate-600 block leading-relaxed whitespace-pre-wrap">{selectedClaimDetails.description}</span>
                        </div>

                        {selectedClaimDetails.status !== "PENDING" && (
                            <div className={`p-4 rounded-xl border ${
                                selectedClaimDetails.status === "APPROVED" ? "bg-emerald-50/40 border-emerald-100" : "bg-rose-50/40 border-rose-100"
                            }`}>
                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Review Summary</h4>
                                <div className="space-y-1.5 text-xs font-semibold text-slate-600">
                                    <div className="flex justify-between">
                                        <span>Reviewed By:</span>
                                        <span className="text-slate-800 font-bold">{selectedClaimDetails.reviewedBy?.name || "Officer"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Remarks / Decision Reason:</span>
                                        <span className="text-slate-800 font-bold max-w-[240px] text-right">{selectedClaimDetails.remarks || "No remarks logged"}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {/* SUBMIT CLAIM MODAL */}
            <Modal
                isOpen={isSubmitOpen}
                onClose={() => {
                    setIsSubmitOpen(false);
                    resetSubmit();
                }}
                title="File Insurance Claim"
            >
                <form onSubmit={handleSubmitSubmit(onSubmitClaim)} className="space-y-4">
                    <div className="flex flex-col space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Select Covered Policy <span className="text-rose-500">*</span>
                        </label>
                        <select
                            {...registerSubmit("policyId", { required: "Policy is required" })}
                            className="block w-full rounded-xl border border-slate-200/60 bg-white/70 px-4 py-2.5 text-sm text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/10 backdrop-blur-md transition-all font-medium"
                        >
                            <option value="">Select policy...</option>
                            {customerPolicies.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.policyNumber}
                                </option>
                            ))}
                        </select>
                        {errorsSubmit.policyId && <span className="text-xs font-medium text-rose-500">{errorsSubmit.policyId.message}</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <CurrencyField
                            label="Estimated Loss / Claim Value"
                            placeholder="5000"
                            error={errorsSubmit.claimAmount?.message}
                            {...registerSubmit("claimAmount", { required: "Claim value is required", min: { value: 1, message: "Must be positive" } })}
                        />
                        <DatePicker
                            label="Incident Occurred Date"
                            error={errorsSubmit.incidentDate?.message}
                            {...registerSubmit("incidentDate", { required: "Date is required" })}
                        />
                    </div>

                    <FormInput
                        label="Brief Reason"
                        placeholder="e.g. Car accident, medical surgery, water damage"
                        error={errorsSubmit.reason?.message}
                        maxLength={100}
                        {...registerSubmit("reason", { required: "Reason is required", minLength: { value: 3, message: "Too short" } })}
                    />

                    <div className="flex flex-col space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Accident Description <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            {...registerSubmit("description", { required: "Detailed description is required", minLength: { value: 10, message: "Provide at least 10 characters" } })}
                            rows={4}
                            placeholder="Describe step by step what happened..."
                            maxLength={1000}
                            className="block w-full rounded-xl border border-slate-200/60 bg-white/70 px-4 py-2.5 text-sm text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/10 backdrop-blur-md transition-all font-medium"
                        />
                        {errorsSubmit.description && <span className="text-xs font-medium text-rose-500">{errorsSubmit.description.message}</span>}
                    </div>

                    <div className="mt-6 flex justify-end space-x-3 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setIsSubmitOpen(false);
                                resetSubmit();
                            }}
                            disabled={submitLoading}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitLoading}
                            className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-600/10 hover:bg-sky-700 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                        >
                            {submitLoading ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            ) : (
                                "Submit Claim"
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* REVIEW CLAIM MODAL */}
            <Modal
                isOpen={!!reviewingClaim}
                onClose={() => setReviewingClaim(null)}
                title="Evaluate Claim Request"
            >
                <form onSubmit={handleSubmitReview(onReviewClaim)} className="space-y-4">
                    <p className="text-sm font-medium text-slate-500">
                        Select a decision status and log feedback remarks for claim: **{reviewingClaim?.policy?.policyNumber}** (${Number(reviewingClaim?.claimAmount).toLocaleString()}).
                    </p>

                    <SelectInput
                        label="Evaluation Decision"
                        options={[
                            { value: "APPROVED", label: "APPROVE CLAIM" },
                            { value: "REJECTED", label: "REJECT CLAIM" }
                        ]}
                        error={errorsReview.status?.message?.toString()}
                        {...registerReview("status", { required: "Status decision is required" })}
                    />

                    <div className="flex flex-col space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Evaluation Remarks / Reason <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            {...registerReview("remarks", { required: "Review remarks are required", minLength: { value: 3, message: "Provide at least 3 characters" } })}
                            rows={3}
                            placeholder="Add evaluation remarks for the record..."
                            maxLength={500}
                            className="block w-full rounded-xl border border-slate-200/60 bg-white/70 px-4 py-2.5 text-sm text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/10 backdrop-blur-md transition-all font-medium"
                        />
                        {errorsReview.remarks && <span className="text-xs font-medium text-rose-500">{errorsReview.remarks.message}</span>}
                    </div>

                    <div className="mt-6 flex justify-end space-x-3 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={() => setReviewingClaim(null)}
                            disabled={reviewLoading}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={reviewLoading}
                            className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-600/10 hover:bg-sky-700 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                        >
                            {reviewLoading ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            ) : (
                                "Record Review"
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ClaimsList;
