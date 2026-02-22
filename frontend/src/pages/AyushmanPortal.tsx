import React, { useState } from 'react';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';
import { AyushmanBadge } from '../components/AyushmanBadge';

const API_BASE = 'http://localhost:8000';

export interface AyushmanAuditResult {
    bis_verified: boolean;
    wallet_depletion_flag: boolean;
    risk_score: number;
    clinical_findings: string;
    advisory_note: string;
}

export const AyushmanPortal: React.FC = () => {
    const [formData, setFormData] = useState({
        ABHA_ID: '91-4567-8912-3456',
        PMJAY_Package_Code: 'BM001A',
        Diagnosis_Code: 'J06.9',
        Procedure_Code: '',
        Total_Claim_Amount: '37400',
        Unstructured_Notes: 'Patient presented with mild throat pain. Admitted to IPD for 3 days.',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AyushmanAuditResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setResult(null);
        setIsLoading(true);

        try {
            const res = await fetch(`${API_BASE}/api/ayushman/audit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ABHA_ID: formData.ABHA_ID,
                    PMJAY_Package_Code: formData.PMJAY_Package_Code,
                    Diagnosis_Code: formData.Diagnosis_Code,
                    Procedure_Code: formData.Procedure_Code || '99214',
                    Total_Claim_Amount: parseFloat(formData.Total_Claim_Amount),
                    Unstructured_Notes: formData.Unstructured_Notes,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || 'Audit request failed');
            }

            const data = await res.json();
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to connect to TMS. Ensure backend is running.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-full flex flex-col">
            {/* Header - Govt portal style */}
            <div className="mb-6 pb-6 border-b-2 border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-8 rounded-sm bg-[#FF9933]" />
                        <div className="w-3 h-8 rounded-sm bg-white dark:bg-slate-200 border border-slate-300" />
                        <div className="w-3 h-8 rounded-sm bg-[#138808]" />
                    </div>
                    <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                        National Anti-Fraud Unit (NAFU)
                    </h1>
                </div>
                <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF9933] via-slate-700 to-[#138808] dark:from-[#FF9933] dark:via-slate-300 dark:to-[#138808]">
                    TMS Pre-Authorization Portal
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Ayushman Bharat PM-JAY • ₹5 Lakh Family Floater Protection
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Form card */}
                <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-[#FF9933]/10 via-white to-[#138808]/10 dark:from-[#FF9933]/20 dark:via-slate-800 dark:to-[#138808]/20 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Shield size={18} className="text-[#138808]" />
                            Claim Pre-Authorization Request
                        </h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">ABHA ID</label>
                            <input
                                type="text"
                                value={formData.ABHA_ID}
                                onChange={(e) => setFormData({ ...formData, ABHA_ID: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#138808]/50 focus:border-[#138808]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">HBP Package Code</label>
                            <input
                                type="text"
                                value={formData.PMJAY_Package_Code}
                                onChange={(e) => setFormData({ ...formData, PMJAY_Package_Code: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#138808]/50 focus:border-[#138808]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Diagnosis Code</label>
                            <input
                                type="text"
                                value={formData.Diagnosis_Code}
                                onChange={(e) => setFormData({ ...formData, Diagnosis_Code: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#138808]/50 focus:border-[#138808]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Billed Amount (₹)</label>
                            <input
                                type="number"
                                value={formData.Total_Claim_Amount}
                                onChange={(e) => setFormData({ ...formData, Total_Claim_Amount: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#138808]/50 focus:border-[#138808]"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Clinical Notes</label>
                            <textarea
                                value={formData.Unstructured_Notes}
                                onChange={(e) => setFormData({ ...formData, Unstructured_Notes: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#138808]/50 focus:border-[#138808] resize-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-center">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[#FF9933] via-[#FF9933] to-[#138808] hover:opacity-90 shadow-lg shadow-[#138808]/25 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Running NAFU AI Audit...
                            </>
                        ) : (
                            <>
                                <Shield size={20} />
                                Initiate NAFU AI Audit
                            </>
                        )}
                    </button>
                </div>
            </form>

            {error && (
                <div className="mt-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-rose-800 dark:text-rose-200">Audit Error</h4>
                        <p className="text-sm text-rose-700 dark:text-rose-300 mt-1">{error}</p>
                    </div>
                </div>
            )}

            {result && (
                <div className="mt-6 space-y-4">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Shield size={18} className="text-[#138808]" />
                        NAFU Audit Results
                    </h3>

                    <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-gradient-to-r from-[#FF9933]/5 via-slate-50 to-[#138808]/5 dark:from-[#FF9933]/10 dark:via-slate-800 dark:to-[#138808]/10 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-4">
                            <AyushmanBadge isVerified={result.bis_verified} abhaId={formData.ABHA_ID} />
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Risk Score:</span>
                                <span className={`px-3 py-1 rounded-lg font-bold text-lg ${
                                    result.risk_score >= 60 ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300' :
                                    result.risk_score >= 30 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' :
                                    'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                }`}>
                                    {result.risk_score}/100
                                </span>
                            </div>
                            {result.wallet_depletion_flag && (
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                    <span className="text-sm font-bold text-amber-800 dark:text-amber-200">⚠️ Wallet Depletion Risk — Claim exceeds ₹5 Lakh limit</span>
                                </div>
                            )}
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600">
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">NAFU Clinical Findings</h4>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{result.clinical_findings}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
                                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">{result.advisory_note}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
