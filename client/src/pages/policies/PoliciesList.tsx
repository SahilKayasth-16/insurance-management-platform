import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { FiPlus, FiEdit3, FiInfo, FiRefreshCw, FiAlertOctagon, FiUser, FiCalendar, FiDollarSign } from "react-icons/fi";
import { useForm } from "react-hook-form";

import PageHeader from "../../components/PageHeader.js";
import Card from "../../components/Card.js";
import DataTable, { Column } from "../../components/DataTable.js";
import SearchBar from "../../components/SearchBar.js";
import Pagination from "../../components/Pagination.js";
import StatusBadge from "../../components/StatusBadge.js";
import Modal from "../../components/Modal.js";
import ConfirmDialog from "../../components/ConfirmDialog.js";
import { FormInput, SelectInput, DatePicker, CurrencyField, SectionHeader } from "../../components/FormFields.js";

import { getPoliciesApi, createPolicyApi, updatePolicyApi, renewPolicyApi, cancelPolicyApi, getPolicyApi } from "../../api/policies.api.js";
import { getPaymentsApi, getPaymentApi } from "../../api/payments.api.js";
import { getCustomersApi } from "../../api/customers.api.js";
import { getUsersApi } from "../../api/users.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import type { Policy, PolicyType, PolicyStatus, PaginationInfo } from "../../types/business.js";
import type { Customer } from "../../types/business.js";
import type { User } from "../../types/auth.js";

export const PoliciesList: React.FC = () => {
    const { user, role } = useAuth();
    const [policies, setPolicies] = useState<any[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    // Query state
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [typeFilter, setTypeFilter] = useState<string>("");
    const [loading, setLoading] = useState(false);

    // Detail / Modal state
    const [selectedPolicy, setSelectedPolicy] = useState<any | null>(null);
    const [selectedPolicyLoading, setSelectedPolicyLoading] = useState(false);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
    const [renewingPolicy, setRenewingPolicy] = useState<Policy | null>(null);
    const [cancellingPolicy, setCancellingPolicy] = useState<Policy | null>(null);

    const [createLoading, setCreateLoading] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [renewLoading, setRenewLoading] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);

    // Lists for select dropdowns
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [agents, setAgents] = useState<User[]>([]);

    const { register: registerCreate, handleSubmit: handleSubmitCreate, reset: resetCreate, formState: { errors: errorsCreate }, watch: watchCreate } = useForm({
        defaultValues: {
            customerId: "",
            agentId: "",
            policyType: "" as any,
            coverageAmount: 0,
            premiumAmount: 0,
            startDate: "",
            endDate: ""
        }
    });

    const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, formState: { errors: errorsEdit } } = useForm({
        defaultValues: {
            coverageAmount: 0,
            premiumAmount: 0,
            endDate: ""
        }
    });

    const { register: registerRenew, handleSubmit: handleSubmitRenew, reset: resetRenew, formState: { errors: errorsRenew } } = useForm({
        defaultValues: {
            endDate: ""
        }
    });

    // Load data based on user role
    const fetchPolicies = useCallback(async () => {
        setLoading(true);
        try {
            if (role === "CUSTOMER") {
                // Fetch customer's payments to compile unique policies (workaround for 403)
                const response = await getPaymentsApi({
                    page: 1,
                    limit: 100 // Fetch a larger limit to get all policies
                });
                if (response.success && response.data.payments) {
                    const uniquePoliciesMap = new Map<string, any>();
                    response.data.payments.forEach((payment) => {
                        if (payment.policyId && !uniquePoliciesMap.has(payment.policyId)) {
                            uniquePoliciesMap.set(payment.policyId, {
                                id: payment.policyId,
                                policyNumber: payment.policyNumber,
                                customerName: payment.customerName || user?.name || "Customer",
                                // We store the payment ID so we can fetch full policy details via getPaymentApi
                                samplePaymentId: payment.id,
                                status: payment.status === "OVERDUE" ? "ACTIVE" : "ACTIVE" // default to active as fallback
                            });
                        }
                    });
                    
                    const compiledPolicies = Array.from(uniquePoliciesMap.values());
                    
                    // For each compiled policy, let's fetch its full details asynchronously to populate columns!
                    const detailsPromises = compiledPolicies.map(async (cp) => {
                        try {
                            const detailRes = await getPaymentApi(cp.samplePaymentId);
                            if (detailRes.success && detailRes.data.policy) {
                                return {
                                    ...cp,
                                    ...detailRes.data.policy,
                                    agent: detailRes.data.agent
                                };
                            }
                        } catch (err) {
                            console.error("Failed to load nested policy detail for", cp.id);
                        }
                        return cp;
                    });
                    
                    const fullyLoadedPolicies = await Promise.all(detailsPromises);
                    
                    // Apply client-side search and filters
                    let filtered = fullyLoadedPolicies;
                    if (search) {
                        const s = search.toLowerCase();
                        filtered = filtered.filter(p => p.policyNumber?.toLowerCase().includes(s));
                    }
                    if (statusFilter) {
                        filtered = filtered.filter(p => p.status === statusFilter);
                    }
                    if (typeFilter) {
                        filtered = filtered.filter(p => p.policyType === typeFilter);
                    }

                    setPolicies(filtered);
                    setPagination({
                        page: 1,
                        limit: 100,
                        total: filtered.length,
                        totalPages: 1
                    });
                }
            } else {
                // Admin or Agent
                const query: any = {
                    page: pagination.page,
                    limit: pagination.limit,
                    search,
                    sort: sortField,
                    order: sortOrder
                };
                if (statusFilter) query.status = statusFilter;
                if (typeFilter) query.policyType = typeFilter;
                if (role === "AGENT") query.agentId = user?.id;

                const response = await getPoliciesApi(query);
                if (response.success && response.data.policies) {
                    setPolicies(response.data.policies);
                    setPagination(response.data.pagination);
                }
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to load policies.");
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, search, sortField, sortOrder, statusFilter, typeFilter, role, user?.id, user?.name]);

    const fetchDropdowns = useCallback(async () => {
        if (role === "CUSTOMER") return;
        try {
            const customerRes = await getCustomersApi({ limit: 100 });
            if (customerRes.success && customerRes.data.customers) {
                setCustomers(customerRes.data.customers);
            }
            if (role === "ADMIN") {
                const userRes = await getUsersApi({ limit: 100 });
                if (userRes.success && userRes.data.users) {
                    setAgents(userRes.data.users.filter(u => u.role === "AGENT"));
                }
            }
        } catch (err) {
            console.warn("Dropdown loading failed.");
        }
    }, [role]);

    useEffect(() => {
        fetchPolicies();
    }, [fetchPolicies]);

    useEffect(() => {
        if (isCreateOpen) {
            fetchDropdowns();
        }
    }, [isCreateOpen, fetchDropdowns]);

    const handleSort = (field: string) => {
        const order = sortField === field && sortOrder === "desc" ? "asc" : "desc";
        setSortField(field);
        setSortOrder(order);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handleViewDetails = async (policy: any) => {
        setSelectedPolicyLoading(true);
        try {
            if (role === "CUSTOMER") {
                // Fetch full details via one of the payment slots
                const detailRes = await getPaymentApi(policy.samplePaymentId || policy.id);
                if (detailRes.success) {
                    setSelectedPolicy({
                        ...detailRes.data.policy,
                        agent: detailRes.data.agent,
                        customer: detailRes.data.customer
                    });
                }
            } else {
                const res = await getPolicyApi(policy.id);
                if (res.success) {
                    setSelectedPolicy(res.data);
                }
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to fetch policy details.");
        } finally {
            setSelectedPolicyLoading(false);
        }
    };

    const handleOpenEdit = (policy: Policy) => {
        setEditingPolicy(policy);
        resetEdit({
            coverageAmount: policy.coverageAmount,
            premiumAmount: policy.premiumAmount,
            endDate: new Date(policy.endDate).toISOString().split("T")[0]
        });
    };

    const handleOpenRenew = (policy: Policy) => {
        setRenewingPolicy(policy);
        resetRenew({
            endDate: ""
        });
    };

    const onCreatePolicy = async (data: any) => {
        setCreateLoading(true);
        try {
            const body = {
                ...data,
                agentId: role === "AGENT" ? user?.id : data.agentId,
                coverageAmount: Number(data.coverageAmount),
                premiumAmount: Number(data.premiumAmount)
            };
            const response = await createPolicyApi(body);
            if (response.success) {
                toast.success("Policy created successfully.");
                resetCreate();
                setIsCreateOpen(false);
                fetchPolicies();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to create policy.");
        } finally {
            setCreateLoading(false);
        }
    };

    const onEditPolicy = async (data: any) => {
        if (!editingPolicy) return;
        setEditLoading(true);
        try {
            const response = await updatePolicyApi(editingPolicy.id, {
                coverageAmount: Number(data.coverageAmount),
                premiumAmount: Number(data.premiumAmount),
                endDate: data.endDate
            });
            if (response.success) {
                toast.success("Policy updated successfully.");
                setEditingPolicy(null);
                fetchPolicies();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to update policy.");
        } finally {
            setEditLoading(false);
        }
    };

    const onRenewPolicy = async (data: any) => {
        if (!renewingPolicy) return;
        setRenewLoading(true);
        try {
            const response = await renewPolicyApi(renewingPolicy.id, data.endDate);
            if (response.success) {
                toast.success("Policy renewed successfully.");
                setRenewingPolicy(null);
                fetchPolicies();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to renew policy.");
        } finally {
            setRenewLoading(false);
        }
    };

    const handleCancelPolicy = async () => {
        if (!cancellingPolicy) return;
        setCancelLoading(true);
        try {
            const response = await cancelPolicyApi(cancellingPolicy.id);
            if (response.success) {
                toast.success("Policy cancelled successfully.");
                setCancellingPolicy(null);
                fetchPolicies();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to cancel policy.");
        } finally {
            setCancelLoading(false);
        }
    };

    const columns: Column<any>[] = [
        { key: "policyNumber", label: "Policy Number", sortable: true },
        { 
            key: "customerName", 
            label: "Customer", 
            render: (item) => item.customer?.user?.name || item.customerName || "Loading..."
        },
        { key: "policyType", label: "Type", sortable: true },
        { 
            key: "coverageAmount", 
            label: "Coverage", 
            sortable: true,
            render: (item) => item.coverageAmount ? `$${Number(item.coverageAmount).toLocaleString()}` : "-"
        },
        { 
            key: "premiumAmount", 
            label: "Premium", 
            sortable: true,
            render: (item) => item.premiumAmount ? `$${Number(item.premiumAmount).toLocaleString()}` : "-"
        },
        { 
            key: "status", 
            label: "Status", 
            sortable: true,
            render: (item) => <StatusBadge status={item.status || "ACTIVE"} />
        },
        { 
            key: "endDate", 
            label: "Expiry Date", 
            sortable: true,
            render: (item) => item.endDate ? new Date(item.endDate).toLocaleDateString() : "-"
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
                    {role !== "CUSTOMER" && item.status === "ACTIVE" && (
                        <>
                            <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 hover:text-sky-800 transition-colors"
                                title="Edit Policy"
                            >
                                <FiEdit3 className="h-4.5 w-4.5" />
                            </button>
                            <button
                                onClick={() => handleOpenRenew(item)}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                                title="Renew Policy"
                            >
                                <FiRefreshCw className="h-4.5 w-4.5" />
                            </button>
                            <button
                                onClick={() => setCancellingPolicy(item)}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-800 transition-colors"
                                title="Cancel Policy"
                            >
                                <FiAlertOctagon className="h-4.5 w-4.5" />
                            </button>
                        </>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Insurance Policies"
                description="Manage policy coverages, issue new certificates, and monitor renewals."
                action={
                    role !== "CUSTOMER" && (
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className="flex items-center space-x-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-600/10 hover:bg-sky-700 transition-all duration-200"
                        >
                            <FiPlus className="h-4 w-4" />
                            <span>Create Policy</span>
                        </button>
                    )
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
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="EXPIRED">EXPIRED</option>
                            <option value="CANCELLED">CANCELLED</option>
                        </select>

                        <select
                            value={typeFilter}
                            onChange={(e) => {
                                setTypeFilter(e.target.value);
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                            className="rounded-xl border border-slate-200/60 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/10 backdrop-blur-md"
                        >
                            <option value="">All Types</option>
                            <option value="LIFE">LIFE</option>
                            <option value="HEALTH">HEALTH</option>
                            <option value="VEHICLE">VEHICLE</option>
                            <option value="HOME">HOME</option>
                            <option value="TRAVEL">TRAVEL</option>
                        </select>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={policies}
                    loading={loading || selectedPolicyLoading}
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                />

                {role !== "CUSTOMER" && (
                    <Pagination
                        pagination={pagination}
                        onPageChange={handlePageChange}
                    />
                )}
            </Card>

            {/* DETAILS MODAL */}
            {selectedPolicy && (
                <Modal
                    isOpen={!!selectedPolicy}
                    onClose={() => setSelectedPolicy(null)}
                    title={`Policy Details: ${selectedPolicy.policyNumber}`}
                >
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <span className="text-xs font-bold text-slate-400 uppercase">Policy Status</span>
                            <StatusBadge status={selectedPolicy.status} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Coverage Type</span>
                                <span className="text-sm font-bold text-slate-800">{selectedPolicy.policyType}</span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Policy CUID</span>
                                <span className="text-xs font-bold text-slate-500 truncate block select-all">{selectedPolicy.id}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                                <FiDollarSign className="h-5 w-5 text-sky-600 mt-0.5" />
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Coverage Value</span>
                                    <span className="text-sm font-bold text-slate-800">${Number(selectedPolicy.coverageAmount).toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                                <FiDollarSign className="h-5 w-5 text-sky-600 mt-0.5" />
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monthly Premium</span>
                                    <span className="text-sm font-bold text-slate-800">${Number(selectedPolicy.premiumAmount).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                                <FiCalendar className="h-5 w-5 text-sky-600 mt-0.5" />
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Start Date</span>
                                    <span className="text-sm font-bold text-slate-800">{new Date(selectedPolicy.startDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                                <FiCalendar className="h-5 w-5 text-sky-600 mt-0.5" />
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">End / Expiry Date</span>
                                    <span className="text-sm font-bold text-slate-800">{new Date(selectedPolicy.endDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                            <div className="flex items-center space-x-3">
                                <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center">
                                    <FiUser className="h-5 w-5 text-slate-500" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Policy Holder</span>
                                    <span className="text-sm font-bold text-slate-800">{selectedPolicy.customer?.user?.name || "Holder"}</span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center">
                                    <FiUser className="h-5 w-5 text-slate-500" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Assigned Agent</span>
                                    <span className="text-sm font-bold text-slate-800">{selectedPolicy.agent?.name || "Agent"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* CREATE POLICY MODAL */}
            <Modal
                isOpen={isCreateOpen}
                onClose={() => {
                    setIsCreateOpen(false);
                    resetCreate();
                }}
                title="Create New Insurance Policy"
            >
                <form onSubmit={handleSubmitCreate(onCreatePolicy)} className="space-y-4">
                    <div className="flex flex-col space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Select Customer Profile <span className="text-rose-500">*</span>
                        </label>
                        <select
                            {...registerCreate("customerId", { required: "Customer is required" })}
                            className="block w-full rounded-xl border border-slate-200/60 bg-white/70 px-4 py-2.5 text-sm text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/10 backdrop-blur-md transition-all font-medium"
                        >
                            <option value="">Select customer...</option>
                            {customers.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.user?.name || "Customer"} (ID: {c.id})
                                </option>
                            ))}
                        </select>
                        {errorsCreate.customerId && <span className="text-xs font-medium text-rose-500">{errorsCreate.customerId.message}</span>}
                    </div>

                    {role === "ADMIN" && (
                        <div className="flex flex-col space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Assign Agent <span className="text-rose-500">*</span>
                            </label>
                            <select
                                {...registerCreate("agentId", { required: "Agent assignment is required" })}
                                className="block w-full rounded-xl border border-slate-200/60 bg-white/70 px-4 py-2.5 text-sm text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/10 backdrop-blur-md transition-all font-medium"
                            >
                                <option value="">Select agent...</option>
                                {agents.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.name} ({a.email})
                                    </option>
                                ))}
                            </select>
                            {errorsCreate.agentId && <span className="text-xs font-medium text-rose-500">{errorsCreate.agentId.message}</span>}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <SelectInput
                            label="Policy Type"
                            options={[
                                { value: "LIFE", label: "LIFE" },
                                { value: "HEALTH", label: "HEALTH" },
                                { value: "VEHICLE", label: "VEHICLE" },
                                { value: "HOME", label: "HOME" },
                                { value: "TRAVEL", label: "TRAVEL" }
                            ]}
                            error={errorsCreate.policyType?.message}
                            {...registerCreate("policyType", { required: "Policy type is required" })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <CurrencyField
                            label="Coverage Amount"
                            placeholder="500000"
                            error={errorsCreate.coverageAmount?.message}
                            {...registerCreate("coverageAmount", { required: "Coverage value is required", min: { value: 1, message: "Must be positive" } })}
                        />
                        <CurrencyField
                            label="Monthly Premium"
                            placeholder="250"
                            error={errorsCreate.premiumAmount?.message}
                            {...registerCreate("premiumAmount", { required: "Premium value is required", min: { value: 1, message: "Must be positive" } })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <DatePicker
                            label="Start Date"
                            error={errorsCreate.startDate?.message}
                            {...registerCreate("startDate", { required: "Start date is required" })}
                        />
                        <DatePicker
                            label="End Date"
                            error={errorsCreate.endDate?.message}
                            {...registerCreate("endDate", { required: "End date is required" })}
                        />
                    </div>

                    <div className="mt-6 flex justify-end space-x-3 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setIsCreateOpen(false);
                                resetCreate();
                            }}
                            disabled={createLoading}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createLoading}
                            className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-600/10 hover:bg-sky-700 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                        >
                            {createLoading ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            ) : (
                                "Save Policy"
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* EDIT POLICY MODAL */}
            <Modal
                isOpen={!!editingPolicy}
                onClose={() => setEditingPolicy(null)}
                title="Modify Policy Parameters"
            >
                <form onSubmit={handleSubmitEdit(onEditPolicy)} className="space-y-4">
                    <CurrencyField
                        label="Coverage Amount"
                        error={errorsEdit.coverageAmount?.message}
                        {...registerEdit("coverageAmount", { required: "Coverage amount is required", min: { value: 1, message: "Must be positive" } })}
                    />
                    
                    <CurrencyField
                        label="Monthly Premium"
                        error={errorsEdit.premiumAmount?.message}
                        {...registerEdit("premiumAmount", { required: "Premium amount is required", min: { value: 1, message: "Must be positive" } })}
                    />

                    <DatePicker
                        label="Expiry / End Date"
                        error={errorsEdit.endDate?.message}
                        {...registerEdit("endDate", { required: "End date is required" })}
                    />

                    <div className="mt-6 flex justify-end space-x-3 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={() => setEditingPolicy(null)}
                            disabled={editLoading}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={editLoading}
                            className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-600/10 hover:bg-sky-700 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                        >
                            {editLoading ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            ) : (
                                "Save Changes"
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* RENEW POLICY MODAL */}
            <Modal
                isOpen={!!renewingPolicy}
                onClose={() => setRenewingPolicy(null)}
                title="Renew Policy Certificate"
            >
                <form onSubmit={handleSubmitRenew(onRenewPolicy)} className="space-y-4">
                    <p className="text-sm font-medium text-slate-500">
                        Provide the new expiration date to extend policy duration. This will re-synchronize billing cycles.
                    </p>
                    <DatePicker
                        label="Extended Expiry Date"
                        error={errorsRenew.endDate?.message}
                        {...registerRenew("endDate", { required: "New end date is required" })}
                    />

                    <div className="mt-6 flex justify-end space-x-3 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={() => setRenewingPolicy(null)}
                            disabled={renewLoading}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={renewLoading}
                            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/10 hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                        >
                            {renewLoading ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            ) : (
                                "Renew Policy"
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* CANCEL POLICY CONFIRM */}
            {cancellingPolicy && (
                <ConfirmDialog
                    isOpen={!!cancellingPolicy}
                    title="Revoke Insurance Policy"
                    message={`Are you sure you want to terminate policy ${cancellingPolicy.policyNumber}? This action stops coverage and is irreversible.`}
                    confirmText="Cancel Policy"
                    onConfirm={handleCancelPolicy}
                    onCancel={() => setCancellingPolicy(null)}
                    loading={cancelLoading}
                />
            )}
        </div>
    );
};

export default PoliciesList;
