import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { FiUserPlus, FiEdit2, FiInfo, FiMapPin, FiPhone, FiCalendar, FiFileText } from "react-icons/fi";
import { useForm } from "react-hook-form";

import PageHeader from "../../components/PageHeader.js";
import Card from "../../components/Card.js";
import DataTable, { Column } from "../../components/DataTable.js";
import SearchBar from "../../components/SearchBar.js";
import Pagination from "../../components/Pagination.js";
import Modal from "../../components/Modal.js";
import { FormInput } from "../../components/FormFields.js";

import { getCustomersApi, createCustomerApi, updateCustomerApi, getCustomerApi } from "../../api/customers.api.js";
import { getUsersApi } from "../../api/users.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import type { Customer, PaginationInfo } from "../../types/business.js";
import type { User } from "../../types/auth.js";

export const CustomersList: React.FC = () => {
    const { role } = useAuth();
    const [customers, setCustomers] = useState<Customer[]>([]);
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
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [createLoading, setCreateLoading] = useState(false);
    const [editLoading, setEditLoading] = useState(false);

    // Potential users (for admin user matching)
    const [users, setUsers] = useState<User[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);

    const { register: registerCreate, handleSubmit: handleSubmitCreate, reset: resetCreate, formState: { errors: errorsCreate } } = useForm({
        defaultValues: {
            userId: "",
            dob: "",
            phone: "",
            address: "",
            city: "",
            state: "",
            pincode: "",
            identityNumber: ""
        }
    });

    const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, formState: { errors: errorsEdit } } = useForm({
        defaultValues: {
            phone: "",
            address: "",
            city: "",
            state: "",
            pincode: "",
            identityNumber: ""
        }
    });

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getCustomersApi({
                page: pagination.page,
                limit: pagination.limit,
                search,
                sort: sortField,
                order: sortOrder
            });
            if (response.success && response.data.customers) {
                setCustomers(response.data.customers);
                setPagination(response.data.pagination);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to load customers.");
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, search, sortField, sortOrder]);

    const fetchEligibleUsers = useCallback(async () => {
        if (role !== "ADMIN") return;
        setUsersLoading(true);
        try {
            const response = await getUsersApi({ limit: 100 });
            if (response.success && response.data.users) {
                // Filter out non-customers or users who already have customer records (in a real system, backend handles it, but let's filter what we can)
                const customerUsers = response.data.users.filter(u => u.role === "CUSTOMER");
                setUsers(customerUsers);
            }
        } catch (err) {
            console.log("Failed to fetch users (might be unauthorized or empty).");
        } finally {
            setUsersLoading(false);
        }
    }, [role]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    useEffect(() => {
        if (isCreateOpen) {
            fetchEligibleUsers();
        }
    }, [isCreateOpen, fetchEligibleUsers]);

    const handleSort = (field: string) => {
        const order = sortField === field && sortOrder === "desc" ? "asc" : "desc";
        setSortField(field);
        setSortOrder(order);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handleViewDetails = async (customer: Customer) => {
        try {
            const res = await getCustomerApi(customer.id);
            if (res.success) {
                setSelectedCustomer(res.data);
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to fetch customer details.");
        }
    };

    const handleOpenEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        resetEdit({
            phone: customer.phone,
            address: customer.address,
            city: customer.city,
            state: customer.state,
            pincode: customer.pincode,
            identityNumber: customer.identityNumber || ""
        });
    };

    const onCreateCustomer = async (data: any) => {
        setCreateLoading(true);
        try {
            const response = await createCustomerApi({
                ...data,
                identityNumber: data.identityNumber || null
            });
            if (response.success) {
                toast.success("Customer profile created successfully.");
                resetCreate();
                setIsCreateOpen(false);
                fetchCustomers();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to create customer profile.");
        } finally {
            setCreateLoading(false);
        }
    };

    const onEditCustomer = async (data: any) => {
        if (!editingCustomer) return;
        setEditLoading(true);
        try {
            const response = await updateCustomerApi(editingCustomer.id, {
                ...data,
                identityNumber: data.identityNumber || null
            });
            if (response.success) {
                toast.success("Customer profile updated successfully.");
                setEditingCustomer(null);
                fetchCustomers();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to update customer profile.");
        } finally {
            setEditLoading(false);
        }
    };

    const columns: Column<Customer>[] = [
        { 
            key: "name", 
            label: "Customer Name", 
            sortable: true,
            render: (item) => item.user?.name || "Unknown"
        },
        { 
            key: "email", 
            label: "Email", 
            sortable: true,
            render: (item) => item.user?.email || "-"
        },
        { key: "phone", label: "Phone Number", sortable: true },
        { 
            key: "location", 
            label: "Location", 
            render: (item) => `${item.city}, ${item.state}`
        },
        { 
            key: "createdAt", 
            label: "Registered Date", 
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
                        onClick={() => handleViewDetails(item)}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                        title="View Details"
                    >
                        <FiInfo className="h-4.5 w-4.5" />
                    </button>
                    <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 hover:text-sky-800 transition-colors"
                        title="Edit Profile"
                    >
                        <FiEdit2 className="h-4.5 w-4.5" />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Customer Profiles"
                description="Browse client records, review demographic insights, and update profile addresses."
                action={
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center space-x-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-600/10 hover:bg-sky-700 transition-all duration-200"
                    >
                        <FiUserPlus className="h-4 w-4" />
                        <span>Add Customer</span>
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
                        placeholder="Search by name, phone, or email..."
                    />
                </div>

                <DataTable
                    columns={columns}
                    data={customers}
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
            {selectedCustomer && (
                <Modal
                    isOpen={!!selectedCustomer}
                    onClose={() => setSelectedCustomer(null)}
                    title="Customer Dossier"
                >
                    <div className="space-y-6">
                        <div className="flex items-center space-x-4 border-b border-slate-100 pb-4">
                            <div className="h-12 w-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                                <span className="text-lg font-bold text-sky-700">
                                    {(selectedCustomer.user?.name || "C").charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-slate-800 m-0">
                                    {selectedCustomer.user?.name}
                                </h4>
                                <span className="text-xs font-semibold text-slate-400">
                                    {selectedCustomer.user?.email}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                                <FiPhone className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</span>
                                    <span className="text-sm font-bold text-slate-800">{selectedCustomer.phone}</span>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                                <FiCalendar className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date of Birth</span>
                                    <span className="text-sm font-bold text-slate-800">
                                        {new Date(selectedCustomer.dob).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100 md:col-span-2">
                                <FiMapPin className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Residential Address</span>
                                    <span className="text-sm font-bold text-slate-800 block">{selectedCustomer.address}</span>
                                    <span className="text-xs font-semibold text-slate-500">
                                        {selectedCustomer.city}, {selectedCustomer.state} - {selectedCustomer.pincode}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100 md:col-span-2">
                                <FiFileText className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Identity Document / Passport No</span>
                                    <span className="text-sm font-bold text-slate-800">
                                        {selectedCustomer.identityNumber || "Not recorded"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* CREATE CUSTOMER PROFILE MODAL */}
            <Modal
                isOpen={isCreateOpen}
                onClose={() => {
                    setIsCreateOpen(false);
                    resetCreate();
                }}
                title="Initialize Customer Profile"
            >
                <form onSubmit={handleSubmitCreate(onCreateCustomer)} className="space-y-4">
                    {role === "ADMIN" ? (
                        <div className="flex flex-col space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Select Customer Account User <span className="text-rose-500">*</span>
                            </label>
                            <select
                                {...registerCreate("userId", { required: "User account is required" })}
                                className="block w-full rounded-xl border border-slate-200/60 bg-white/70 px-4 py-2.5 text-sm text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/10 backdrop-blur-md transition-all font-medium"
                            >
                                <option value="">Select a user account...</option>
                                {users.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name} ({u.email})
                                    </option>
                                ))}
                            </select>
                            {errorsCreate.userId && <span className="text-xs font-medium text-rose-500">{errorsCreate.userId.message}</span>}
                        </div>
                    ) : (
                        <FormInput
                            label="User CUID"
                            placeholder="Enter matching user account ID (CUID)"
                            error={errorsCreate.userId?.message}
                            {...registerCreate("userId", { required: "User CUID is required" })}
                        />
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <FormInput
                            label="Date of Birth"
                            type="date"
                            error={errorsCreate.dob?.message}
                            {...registerCreate("dob", { required: "Date of birth is required" })}
                        />
                        <FormInput
                            label="Phone Number"
                            placeholder="+1 555-0199"
                            error={errorsCreate.phone?.message}
                            {...registerCreate("phone", {
                                required: "Phone number is required",
                                pattern: { value: /^\+?[\d\s-]{10,15}$/, message: "Must be 10-15 digits" }
                            })}
                        />
                    </div>

                    <FormInput
                        label="Address"
                        placeholder="123 Main St, Apt 4"
                        error={errorsCreate.address?.message}
                        {...registerCreate("address", { required: "Address is required" })}
                    />

                    <div className="grid grid-cols-3 gap-3">
                        <FormInput
                            label="City"
                            placeholder="Seattle"
                            error={errorsCreate.city?.message}
                            {...registerCreate("city", { required: "City is required" })}
                        />
                        <FormInput
                            label="State"
                            placeholder="WA"
                            error={errorsCreate.state?.message}
                            {...registerCreate("state", { required: "State is required" })}
                        />
                        <FormInput
                            label="Pincode"
                            placeholder="98101"
                            error={errorsCreate.pincode?.message}
                            {...registerCreate("pincode", {
                                required: "Pincode is required",
                                pattern: { value: /^\d{5,6}$/, message: "5 or 6 digits" }
                            })}
                        />
                    </div>

                    <FormInput
                        label="Identity Document No (Optional)"
                        placeholder="Passport / Driver License No"
                        error={errorsCreate.identityNumber?.message}
                        {...registerCreate("identityNumber")}
                    />

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
                                "Save Profile"
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* EDIT CUSTOMER MODAL */}
            <Modal
                isOpen={!!editingCustomer}
                onClose={() => setEditingCustomer(null)}
                title="Update Customer Profile"
            >
                <form onSubmit={handleSubmitEdit(onEditCustomer)} className="space-y-4">
                    <FormInput
                        label="Phone Number"
                        placeholder="+1 555-0199"
                        error={errorsEdit.phone?.message}
                        {...registerEdit("phone", {
                            required: "Phone number is required",
                            pattern: { value: /^\+?[\d\s-]{10,15}$/, message: "Must be 10-15 digits" }
                        })}
                    />

                    <FormInput
                        label="Address"
                        placeholder="123 Main St, Apt 4"
                        error={errorsEdit.address?.message}
                        {...registerEdit("address", { required: "Address is required" })}
                    />

                    <div className="grid grid-cols-3 gap-3">
                        <FormInput
                            label="City"
                            placeholder="Seattle"
                            error={errorsEdit.city?.message}
                            {...registerEdit("city", { required: "City is required" })}
                        />
                        <FormInput
                            label="State"
                            placeholder="WA"
                            error={errorsEdit.state?.message}
                            {...registerEdit("state", { required: "State is required" })}
                        />
                        <FormInput
                            label="Pincode"
                            placeholder="98101"
                            error={errorsEdit.pincode?.message}
                            {...registerEdit("pincode", {
                                required: "Pincode is required",
                                pattern: { value: /^\d{5,6}$/, message: "5 or 6 digits" }
                            })}
                        />
                    </div>

                    <FormInput
                        label="Identity Document No (Optional)"
                        placeholder="Passport / Driver License No"
                        error={errorsEdit.identityNumber?.message}
                        {...registerEdit("identityNumber")}
                    />

                    <div className="mt-6 flex justify-end space-x-3 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={() => setEditingCustomer(null)}
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
                                "Update Profile"
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default CustomersList;
