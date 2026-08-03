import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { FiUserPlus, FiInfo, FiUserCheck, FiUserX } from "react-icons/fi";
import { useForm } from "react-hook-form";

import PageHeader from "../../components/PageHeader.js";
import Card from "../../components/Card.js";
import DataTable, { Column } from "../../components/DataTable.js";
import SearchBar from "../../components/SearchBar.js";
import Pagination from "../../components/Pagination.js";
import RoleBadge from "../../components/RoleBadge.js";
import Modal from "../../components/Modal.js";
import ConfirmDialog from "../../components/ConfirmDialog.js";
import { FormInput } from "../../components/FormFields.js";

import { getUsersApi, createAgentApi, updateUserStatusApi } from "../../api/users.api.js";
import type { User } from "../../types/auth.js";
import type { PaginationInfo } from "../../types/business.js";

export const UsersList: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
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
    const [loading, setLoading] = useState(false);

    // Modal state
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [statusConfirmUser, setStatusConfirmUser] = useState<User | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            name: "",
            email: "",
            password: ""
        }
    });

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getUsersApi({
                page: pagination.page,
                limit: pagination.limit,
                search,
                sort: sortField,
                order: sortOrder
            });
            if (response.success && response.data.users) {
                setUsers(response.data.users);
                setPagination(response.data.pagination);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to load users.");
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, search, sortField, sortOrder]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSort = (field: string) => {
        const order = sortField === field && sortOrder === "desc" ? "asc" : "desc";
        setSortField(field);
        setSortOrder(order);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handleStatusToggle = async () => {
        if (!statusConfirmUser) return;
        setStatusLoading(true);
        try {
            const nextState = !statusConfirmUser.isActive;
            const response = await updateUserStatusApi(statusConfirmUser.id, nextState);
            if (response.success) {
                toast.success(`User status updated to ${nextState ? "Active" : "Inactive"}.`);
                fetchUsers();
                setStatusConfirmUser(null);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to update user status.");
        } finally {
            setStatusLoading(false);
        }
    };

    const onCreateAgent = async (data: any) => {
        setCreateLoading(true);
        try {
            const response = await createAgentApi(data);
            if (response.success) {
                toast.success("Agent created successfully.");
                reset();
                setIsCreateOpen(false);
                fetchUsers();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to create agent.");
        } finally {
            setCreateLoading(false);
        }
    };

    const columns: Column<User>[] = [
        { key: "name", label: "Name", sortable: true },
        { key: "email", label: "Email Address", sortable: true },
        { 
            key: "role", 
            label: "Role", 
            sortable: true,
            render: (item) => <RoleBadge role={item.role} />
        },
        { 
            key: "isActive", 
            label: "Status", 
            sortable: true,
            render: (item) => (
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                    item.isActive 
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" 
                    : "bg-rose-50 text-rose-700 ring-rose-600/20"
                }`}>
                    {item.isActive ? "Active" : "Inactive"}
                </span>
            )
        },
        { 
            key: "createdAt", 
            label: "Created Date", 
            sortable: true,
            render: (item) => item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"
        },
        {
            key: "actions",
            label: "Actions",
            align: "center",
            render: (item) => (
                <div className="flex items-center justify-center space-x-2">
                    <button
                        onClick={() => setSelectedUser(item)}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                        title="View Details"
                    >
                        <FiInfo className="h-4.5 w-4.5" />
                    </button>
                    <button
                        onClick={() => setStatusConfirmUser(item)}
                        className={`p-1.5 rounded-lg transition-colors ${
                            item.isActive 
                            ? "text-rose-600 hover:bg-rose-50 hover:text-rose-800" 
                            : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800"
                        }`}
                        title={item.isActive ? "Deactivate User" : "Activate User"}
                    >
                        {item.isActive ? <FiUserX className="h-4.5 w-4.5" /> : <FiUserCheck className="h-4.5 w-4.5" />}
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="User Accounts"
                description="Manage global access permissions, review system users, and register field agents."
                action={
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center space-x-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-600/10 hover:bg-sky-700 transition-all duration-200"
                    >
                        <FiUserPlus className="h-4 w-4" />
                        <span>Register Agent</span>
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
                        placeholder="Search by name or email..."
                    />
                </div>

                <DataTable
                    columns={columns}
                    data={users}
                    loading={loading}
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
            {selectedUser && (
                <Modal
                    isOpen={!!selectedUser}
                    onClose={() => setSelectedUser(null)}
                    title="User Profile Details"
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
                            <span className="text-xs font-semibold text-slate-400 uppercase">User Name</span>
                            <span className="text-sm font-bold text-slate-800 text-right">{selectedUser.name}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
                            <span className="text-xs font-semibold text-slate-400 uppercase">Email Address</span>
                            <span className="text-sm font-bold text-slate-800 text-right">{selectedUser.email}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
                            <span className="text-xs font-semibold text-slate-400 uppercase">System Role</span>
                            <span className="text-right"><RoleBadge role={selectedUser.role} /></span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
                            <span className="text-xs font-semibold text-slate-400 uppercase">Status</span>
                            <span className="text-right">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                                    selectedUser.isActive 
                                    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" 
                                    : "bg-rose-50 text-rose-700 ring-rose-600/20"
                                }`}>
                                    {selectedUser.isActive ? "Active" : "Inactive"}
                                </span>
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pb-1">
                            <span className="text-xs font-semibold text-slate-400 uppercase">Created Date</span>
                            <span className="text-sm font-bold text-slate-800 text-right">
                                {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : "-"}
                            </span>
                        </div>
                    </div>
                </Modal>
            )}

            {/* REGISTER AGENT MODAL */}
            <Modal
                isOpen={isCreateOpen}
                onClose={() => {
                    setIsCreateOpen(false);
                    reset();
                }}
                title="Register Insurance Agent"
            >
                <form onSubmit={handleSubmit(onCreateAgent)} className="space-y-4">
                    <FormInput
                        label="Full Name"
                        placeholder="Enter agent's name"
                        error={errors.name?.message}
                        {...register("name", {
                            required: "Name is required",
                            minLength: { value: 3, message: "Name must be at least 3 characters" }
                        })}
                    />
                    <FormInput
                        label="Email Address"
                        type="email"
                        placeholder="agent@company.com"
                        error={errors.email?.message}
                        {...register("email", {
                            required: "Email is required",
                            pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" }
                        })}
                    />
                    <FormInput
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        error={errors.password?.message}
                        {...register("password", {
                            required: "Password is required",
                            minLength: { value: 8, message: "Password must be at least 8 characters" },
                            validate: {
                                uppercase: (v) => /[A-Z]/.test(v) || "Must contain one uppercase letter",
                                lowercase: (v) => /[a-z]/.test(v) || "Must contain one lowercase letter",
                                number: (v) => /[0-9]/.test(v) || "Must contain one number",
                                special: (v) => /[^A-Za-z0-9]/.test(v) || "Must contain one special character"
                            }
                        })}
                    />
                    <div className="mt-6 flex justify-end space-x-3 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setIsCreateOpen(false);
                                reset();
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
                                "Create Agent"
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* STATUS TOGGLE CONFIRMATION */}
            {statusConfirmUser && (
                <ConfirmDialog
                    isOpen={!!statusConfirmUser}
                    title={statusConfirmUser.isActive ? "Deactivate Account" : "Activate Account"}
                    message={`Are you sure you want to ${statusConfirmUser.isActive ? "deactivate" : "activate"} user account "${statusConfirmUser.name}" (${statusConfirmUser.email})?`}
                    confirmText={statusConfirmUser.isActive ? "Deactivate" : "Activate"}
                    onConfirm={handleStatusToggle}
                    onCancel={() => setStatusConfirmUser(null)}
                    loading={statusLoading}
                />
            )}
        </div>
    );
};

export default UsersList;
