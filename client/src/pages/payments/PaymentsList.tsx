import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { FiDollarSign, FiInfo, FiPlus, FiCalendar, FiCheckCircle } from "react-icons/fi";
import { useForm } from "react-hook-form";

import PageHeader from "../../components/PageHeader.js";
import Card from "../../components/Card.js";
import DataTable, { Column } from "../../components/DataTable.js";
import SearchBar from "../../components/SearchBar.js";
import Pagination from "../../components/Pagination.js";
import StatusBadge from "../../components/StatusBadge.js";
import Modal from "../../components/Modal.js";
import { FormInput, SelectInput, DatePicker, CurrencyField } from "../../components/FormFields.js";

import { getPaymentsApi, getPaymentApi, recordPaymentApi } from "../../api/payments.api.js";
import { getPoliciesApi } from "../../api/policies.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import type { PremiumPayment, PaymentStatus, PaymentMethod, PaginationInfo } from "../../types/business.js";
import type { Policy } from "../../types/business.js";

export const PaymentsList: React.FC = () => {
    const { role } = useAuth();
    const [payments, setPayments] = useState<PremiumPayment[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    // Query states
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [methodFilter, setMethodFilter] = useState<string>("");
    const [sortField, setSortField] = useState("dueDate");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [loading, setLoading] = useState(false);

    // Detail/Modal states
    const [selectedPayment, setSelectedPayment] = useState<PremiumPayment | null>(null);
    const [selectedPaymentDetails, setSelectedPaymentDetails] = useState<any | null>(null);
    const [selectedPaymentLoading, setSelectedPaymentLoading] = useState(false);
    
    const [isRecordOpen, setIsRecordOpen] = useState(false);
    const [recordLoading, setCreateLoading] = useState(false);

    // List of policies for dropdown
    const [policies, setPolicies] = useState<Policy[]>([]);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
        defaultValues: {
            policyId: "",
            amount: 0,
            paymentDate: new Date().toISOString().split("T")[0],
            paymentMethod: "" as any,
            transactionId: ""
        }
    });

    const fetchPayments = useCallback(async () => {
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
            if (methodFilter) query.paymentMethod = methodFilter;

            const response = await getPaymentsApi(query);
            if (response.success && response.data.payments) {
                setPayments(response.data.payments);
                setPagination(response.data.pagination);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to load payments.");
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, search, statusFilter, methodFilter, sortField, sortOrder]);

    const fetchPoliciesList = useCallback(async () => {
        if (role === "CUSTOMER") {
            // For customers, let's load all their unique policies from payments or let them select.
            // Since customers can't list `/api/policies` directly (403), they can enter/use the pre-fill action on pending rows!
            return;
        }
        try {
            const response = await getPoliciesApi({ limit: 100, status: "ACTIVE" });
            if (response.success && response.data.policies) {
                setPolicies(response.data.policies);
            }
        } catch (err) {
            console.warn("Failed to load policies for dropdown.");
        }
    }, [role]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    useEffect(() => {
        if (isRecordOpen) {
            fetchPoliciesList();
        }
    }, [isRecordOpen, fetchPoliciesList]);

    const handleSort = (field: string) => {
        const order = sortField === field && sortOrder === "desc" ? "asc" : "desc";
        setSortField(field);
        setSortOrder(order);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handleViewDetails = async (payment: PremiumPayment) => {
        setSelectedPaymentLoading(true);
        try {
            const res = await getPaymentApi(payment.id);
            if (res.success) {
                setSelectedPaymentDetails(res.data);
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to fetch payment details.");
        } finally {
            setSelectedPaymentLoading(false);
        }
    };

    const handleQuickPay = (payment: PremiumPayment) => {
        reset({
            policyId: payment.policyId,
            amount: payment.amount,
            paymentDate: new Date().toISOString().split("T")[0],
            paymentMethod: "" as any,
            transactionId: ""
        });
        setIsRecordOpen(true);
    };

    const onRecordPayment = async (data: any) => {
        setCreateLoading(true);
        try {
            const response = await recordPaymentApi({
                ...data,
                amount: Number(data.amount),
                transactionId: data.transactionId || undefined
            });
            if (response.success) {
                toast.success("Payment recorded successfully!");
                reset();
                setIsRecordOpen(false);
                fetchPayments();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to record payment.");
        } finally {
            setCreateLoading(false);
        }
    };

    const columns: Column<PremiumPayment>[] = [
        { 
            key: "policyNumber", 
            label: "Policy Number", 
            sortable: true 
        },
        { 
            key: "customerName", 
            label: "Customer", 
            sortable: true,
            render: (item) => item.customerName || "-"
        },
        { 
            key: "amount", 
            label: "Due Amount", 
            sortable: true,
            render: (item) => `$${Number(item.amount).toLocaleString()}`
        },
        { 
            key: "dueDate", 
            label: "Due Date", 
            sortable: true,
            render: (item) => new Date(item.dueDate).toLocaleDateString()
        },
        { 
            key: "status", 
            label: "Status", 
            sortable: true,
            render: (item) => <StatusBadge status={item.status} />
        },
        { 
            key: "paymentDate", 
            label: "Paid Date", 
            sortable: true,
            render: (item) => item.paymentDate ? new Date(item.paymentDate).toLocaleDateString() : "-"
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
                        title="View Receipt"
                    >
                        <FiInfo className="h-4.5 w-4.5" />
                    </button>
                    {(item.status === "PENDING" || item.status === "OVERDUE") && (
                        <button
                            onClick={() => handleQuickPay(item)}
                            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-sky-50 text-sky-700 border border-sky-100 hover:bg-sky-100 transition-colors"
                        >
                            <FiCheckCircle className="h-3 w-3" />
                            <span>Pay Now</span>
                        </button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Premium Payments"
                description="Monitor premium billing invoices, submit payments, and track client transaction history."
                action={
                    <button
                        onClick={() => setIsRecordOpen(true)}
                        className="flex items-center space-x-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-600/10 hover:bg-sky-700 transition-all duration-200"
                    >
                        <FiDollarSign className="h-4 w-4" />
                        <span>Record Payment</span>
                    </button>
                }
            />

            <Card>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                    <SearchBar
                        value={search}
                        onChange={(val) => {
                            setSearch(val);
                            setPagination(prev => ({ ...prev, page: 1 }));
                        }}
                        placeholder="Search by policy number..."
                    />

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                            className="rounded-xl border border-slate-200/60 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/10 backdrop-blur-md"
                        >
                            <option value="">All Statuses</option>
                            <option value="PAID">PAID</option>
                            <option value="PENDING">PENDING</option>
                            <option value="OVERDUE">OVERDUE</option>
                            <option value="FAILED">FAILED</option>
                        </select>

                        <select
                            value={methodFilter}
                            onChange={(e) => {
                                setMethodFilter(e.target.value);
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                            className="rounded-xl border border-slate-200/60 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/10 backdrop-blur-md"
                        >
                            <option value="">All Methods</option>
                            <option value="CASH">CASH</option>
                            <option value="CARD">CARD</option>
                            <option value="UPI">UPI</option>
                            <option value="NET_BANKING">NET_BANKING</option>
                            <option value="CHEQUE">CHEQUE</option>
                        </select>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={payments}
                    loading={loading || selectedPaymentLoading}
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                />

                <Pagination
                    pagination={pagination}
                    onPageChange={handlePageChange}
                />
            </Card>

            {/* DETAILS RECEIPT MODAL */}
            {selectedPaymentDetails && (
                <Modal
                    isOpen={!!selectedPaymentDetails}
                    onClose={() => setSelectedPaymentDetails(null)}
                    title="Premium Payment Receipt"
                >
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <span className="text-xs font-bold text-slate-400 uppercase">Payment Status</span>
                            <StatusBadge status={selectedPaymentDetails.status} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Amount Paid</span>
                                <span className="text-sm font-bold text-slate-800">${Number(selectedPaymentDetails.amount).toLocaleString()}</span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Invoice ID</span>
                                <span className="text-xs font-bold text-slate-500 truncate block select-all">{selectedPaymentDetails.id}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                                <FiCalendar className="h-5 w-5 text-sky-600 mt-0.5" />
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Due Date</span>
                                    <span className="text-sm font-bold text-slate-800">{new Date(selectedPaymentDetails.dueDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                                <FiCalendar className="h-5 w-5 text-sky-600 mt-0.5" />
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Payment Date</span>
                                    <span className="text-sm font-bold text-slate-800">
                                        {selectedPaymentDetails.paymentDate ? new Date(selectedPaymentDetails.paymentDate).toLocaleDateString() : "Pending"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4">
                            <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Payment Method</span>
                                <span className="text-sm font-bold text-slate-800">{selectedPaymentDetails.paymentMethod || "N/A"}</span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Transaction Reference No</span>
                                <span className="text-sm font-bold text-slate-800 truncate block select-all">{selectedPaymentDetails.transactionId || "N/A"}</span>
                            </div>
                        </div>

                        {selectedPaymentDetails.policy && (
                            <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Linked Policy Info</h4>
                                <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                                    <span className="text-slate-400">Policy Number:</span>
                                    <span className="text-slate-800 text-right font-bold">{selectedPaymentDetails.policy.policyNumber}</span>
                                    
                                    <span className="text-slate-400">Policy Type:</span>
                                    <span className="text-slate-800 text-right font-bold">{selectedPaymentDetails.policy.policyType}</span>

                                    <span className="text-slate-400">Policy Holder:</span>
                                    <span className="text-slate-800 text-right font-bold">{selectedPaymentDetails.customer?.user?.name || "Client"}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {/* RECORD PAYMENT MODAL */}
            <Modal
                isOpen={isRecordOpen}
                onClose={() => {
                    setIsRecordOpen(false);
                    reset();
                }}
                title="Record Policy Payment"
            >
                <form onSubmit={handleSubmit(onRecordPayment)} className="space-y-4">
                    {role === "CUSTOMER" ? (
                        <FormInput
                            label="Policy CUID / Reference"
                            placeholder="Enter your policy identifier"
                            error={errors.policyId?.message}
                            {...register("policyId", { required: "Policy ID is required" })}
                        />
                    ) : (
                        <div className="flex flex-col space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Select Active Policy <span className="text-rose-500">*</span>
                            </label>
                            <select
                                {...register("policyId", { required: "Policy CUID is required" })}
                                className="block w-full rounded-xl border border-slate-200/60 bg-white/70 px-4 py-2.5 text-sm text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/10 backdrop-blur-md transition-all font-medium"
                                onChange={(e) => {
                                    const selected = policies.find(p => p.id === e.target.value);
                                    if (selected) {
                                        setValue("amount", Number(selected.premiumAmount));
                                    }
                                }}
                            >
                                <option value="">Select policy...</option>
                                {policies.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.policyNumber} - {p.customer?.user?.name || "Customer"} (${Number(p.premiumAmount).toLocaleString()})
                                    </option>
                                ))}
                            </select>
                            {errors.policyId && <span className="text-xs font-medium text-rose-500">{errors.policyId.message}</span>}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <CurrencyField
                            label="Payment Amount"
                            placeholder="120.00"
                            error={errors.amount?.message}
                            {...register("amount", { 
                                required: "Amount is required", 
                                min: { value: 0.01, message: "Amount must be greater than zero" } 
                            })}
                        />
                        <DatePicker
                            label="Transaction Date"
                            error={errors.paymentDate?.message}
                            {...register("paymentDate", { required: "Date is required" })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <SelectInput
                            label="Payment Channel"
                            options={[
                                { value: "CARD", label: "CARD" },
                                { value: "UPI", label: "UPI" },
                                { value: "NET_BANKING", label: "NET_BANKING" },
                                { value: "CASH", label: "CASH" },
                                { value: "CHEQUE", label: "CHEQUE" }
                            ]}
                            error={errors.paymentMethod?.message}
                            {...register("paymentMethod", { required: "Payment method is required" })}
                        />
                        <FormInput
                            label="Transaction ID / Ref"
                            placeholder="TXN98102381"
                            error={errors.transactionId?.message}
                            {...register("transactionId")}
                        />
                    </div>

                    <div className="mt-6 flex justify-end space-x-3 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setIsRecordOpen(false);
                                reset();
                            }}
                            disabled={recordLoading}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={recordLoading}
                            className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-600/10 hover:bg-sky-700 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                        >
                            {recordLoading ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            ) : (
                                "Record Transaction"
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default PaymentsList;
