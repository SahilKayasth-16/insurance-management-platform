import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { FiShield, FiFileText, FiFolder, FiDollarSign, FiActivity } from "react-icons/fi";

import Card from "../../components/Card.js";
import LoadingSkeleton from "../../components/LoadingSkeleton.js";
import { useAuth } from "../../hooks/useAuth.js";
import { getPaymentsApi, getPaymentApi } from "../../api/payments.api.js";
import { getClaimsApi } from "../../api/claims.api.js";
import { getDocumentsApi } from "../../api/documents.api.js";

export const CustomerDashboard: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    
    // Stats state
    const [policiesCount, setPoliciesCount] = useState(0);
    const [totalCoverage, setTotalCoverage] = useState(0);
    const [claimsCount, setClaimsCount] = useState(0);
    const [documentsCount, setDocumentsCount] = useState(0);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // 1. Fetch payments to count policies and calculate coverage value
                const paymentsRes = await getPaymentsApi({ limit: 100 });
                let uniquePoliciesCount = 0;
                let summedCoverage = 0;

                if (paymentsRes.success && paymentsRes.data.payments) {
                    const uniquePoliciesMap = new Map<string, string>();
                    paymentsRes.data.payments.forEach(p => {
                        if (p.policyId && !uniquePoliciesMap.has(p.policyId)) {
                            uniquePoliciesMap.set(p.policyId, p.id);
                        }
                    });

                    uniquePoliciesCount = uniquePoliciesMap.size;

                    // Fetch details of each policy asynchronously to sum coverage value
                    const detailPromises = Array.from(uniquePoliciesMap.values()).map(async (paymentId) => {
                        try {
                            const res = await getPaymentApi(paymentId);
                            if (res.success && res.data.policy) {
                                return Number(res.data.policy.coverageAmount || 0);
                            }
                        } catch (e) {
                            console.error(e);
                        }
                        return 0;
                    });

                    const coverages = await Promise.all(detailPromises);
                    summedCoverage = coverages.reduce((sum, val) => sum + val, 0);
                }

                // 2. Fetch claims count
                const claimsRes = await getClaimsApi({ limit: 1 });
                const totalClaims = claimsRes.success ? claimsRes.data.pagination.total : 0;

                // 3. Fetch documents count
                const documentsRes = await getDocumentsApi({ limit: 1 });
                const totalDocs = documentsRes.success ? documentsRes.data.pagination.total : 0;

                setPoliciesCount(uniquePoliciesCount);
                setTotalCoverage(summedCoverage);
                setClaimsCount(totalClaims);
                setDocumentsCount(totalDocs);

            } catch (err: any) {
                console.warn("Failed to load customer stats dynamically: ", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <LoadingSkeleton rows={4} className="mb-8" />
                <div className="grid gap-6 md:grid-cols-2">
                    <LoadingSkeleton rows={4} />
                    <LoadingSkeleton rows={4} />
                </div>
            </div>
        );
    }

    const cards = [
        { 
            label: "My Active Policies", 
            value: policiesCount.toString(), 
            icon: <FiShield className="h-6 w-6 text-blue-600" />,
            color: "bg-blue-50/50 border-blue-100"
        },
        { 
            label: "Submitted Claims", 
            value: claimsCount.toString(), 
            icon: <FiFileText className="h-6 w-6 text-indigo-600" />,
            color: "bg-indigo-50/50 border-indigo-100"
        },
        { 
            label: "Total Coverage Value", 
            value: `$${totalCoverage.toLocaleString()}`, 
            icon: <FiDollarSign className="h-6 w-6 text-violet-600" />,
            color: "bg-violet-50/50 border-violet-100"
        },
        { 
            label: "Uploaded Documents", 
            value: documentsCount.toString(), 
            icon: <FiFolder className="h-6 w-6 text-sky-600" />,
            color: "bg-sky-50/50 border-sky-100"
        }
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 m-0">
                    Welcome, <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{user?.name || "Valued Customer"}</span>
                </h1>
                <p className="mt-1.5 text-sm text-slate-500 font-semibold">
                    Review your insurance policies, make payments, or file a claim request.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map((card, idx) => (
                    <Card key={idx} className={`p-6 border hover:scale-[1.01] duration-200 transition-all ${card.color}`}>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">{card.label}</span>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-100 shadow-sm shrink-0">
                                {card.icon}
                            </div>
                        </div>
                        <div className="mt-4">
                            <span className="text-3xl font-extrabold text-slate-800">{card.value}</span>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Customer Options Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border border-slate-200/40">
                    <div className="flex items-center space-x-2 mb-4">
                        <FiActivity className="h-5 w-5 text-sky-600" />
                        <h3 className="text-base font-bold text-slate-800 uppercase tracking-wider m-0">Account Standing</h3>
                    </div>
                    <p className="text-sm font-semibold text-slate-600 leading-relaxed mb-0">
                        All your active coverages are operational. You can review payment dues in the **Premium Payments** section or file new claim requests by selecting your policies in the **Insurance Claims** panel.
                    </p>
                </Card>
                
                <Card className="border border-slate-200/40 flex flex-col justify-center items-center text-center p-8">
                    <FiShield className="h-10 w-10 text-sky-500 mb-3" />
                    <h3 className="text-base font-bold text-slate-800 mb-1">KYC Compliance</h3>
                    <p className="text-xs font-semibold text-slate-500 max-w-sm mb-0">
                        Please upload your current utility bills or government IDs to the **Documents** portal to maintain active profile status.
                    </p>
                </Card>
            </div>
        </div>
    );
};

export default CustomerDashboard;
