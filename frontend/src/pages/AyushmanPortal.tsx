import React, { useState } from 'react';
import { Loader2, Shield, AlertTriangle, FileText } from 'lucide-react';
import { AyushmanBadge } from '../components/AyushmanBadge';

const API_BASE = 'http://localhost:8000';

export interface AyushmanAuditResult {
    abha_verified: boolean;
    risk_score: number;
    risk_label: string;
    nafu_audit_finding: string;
}

export const AyushmanPortal: React.FC = () => {
    const [formData, setFormData] = useState({
        ABHA_ID: '91-4567-8912-3456',
        PMJAY_Package_Code: 'BM001A',
        Diagnosis_Code: 'J06.9',
        Procedure_Code: '99214',
        Total_Claim_Amount: '37400',
        Unstructured_Notes: 'Patient presented with mild throat pain. Admitted to IPD for 3 days.',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AyushmanAuditResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isHumanInvestigatorAssigned, setIsHumanInvestigatorAssigned] = useState(false);

    const diagnosisCodes = [
        { code: 'J06.9', label: 'Acute Upper Respiratory Infection' },
        { code: 'M54.5', label: 'Lower Back Pain' },
        { code: 'E11.9', label: 'Type 2 Diabetes' },
        { code: 'I10', label: 'Essential Hypertension' },
        { code: 'K21.0', label: 'GERD' },
        { code: 'Z00.00', label: 'General Adult Exam' },
        { code: 'S72.001', label: 'Femoral Fracture' },
        { code: 'C34.10', label: 'Malignant Lung Neoplasm' },
        { code: 'F32.1', label: 'Major Depressive Disorder' },
        { code: 'N39.0', label: 'Urinary Tract Infection' },
        { code: 'OTHER', label: 'Other' },
    ];

    const procedureCodes = [
        { code: '99213', label: 'Office Visit (Level 3)' },
        { code: '99214', label: 'Office Visit (Level 4)' },
        { code: '99232', label: 'Subsequent Hospital Care' },
        { code: '81003', label: 'Urinalysis' },
        { code: '71046', label: 'Chest X-Ray' },
        { code: '90837', label: 'Psychotherapy (60 min)' },
        { code: '93000', label: 'Electrocardiogram' },
        { code: '43239', label: 'Upper GI Endoscopy' },
        { code: '27447', label: 'Total Knee Replacement' },
        { code: '96413', label: 'Chemotherapy Admin' },
        { code: 'OTHER', label: 'Other' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setResult(null);
        setIsHumanInvestigatorAssigned(false);

        if (formData.Procedure_Code === 'OTHER' || formData.Diagnosis_Code === 'OTHER') {
            setIsHumanInvestigatorAssigned(true);
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch(`${API_BASE}/api/ayushman/audit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ABHA_ID: formData.ABHA_ID,
                    PMJAY_Package_Code: formData.PMJAY_Package_Code,
                    Diagnosis_Code: formData.Diagnosis_Code,
                    Procedure_Code: formData.Procedure_Code || '',
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

    const handleExportPDF = () => {
        window.print();
    };

    return (
        <div className="h-full overflow-y-auto flex flex-col pb-8">
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
                    TMS Pre-Authorization
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Ayushman Bharat PM-JAY • ₹5 Lakh Family Floater Protection
                </p>
            </div>

            <form onSubmit={handleSubmit} className="print:hidden space-y-6">
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
                            <select
                                value={formData.Diagnosis_Code}
                                onChange={(e) => setFormData({ ...formData, Diagnosis_Code: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#138808]/50 focus:border-[#138808]"
                            >
                                <option value="">Select diagnosis...</option>
                                {diagnosisCodes.map(d => (
                                    <option key={d.code} value={d.code}>{d.code} — {d.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Procedure Code</label>
                            <select
                                value={formData.Procedure_Code}
                                onChange={(e) => setFormData({ ...formData, Procedure_Code: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#138808]/50 focus:border-[#138808]"
                            >
                                <option value="">Select procedure...</option>
                                {procedureCodes.map(p => (
                                    <option key={p.code} value={p.code}>{p.code} — {p.label}</option>
                                ))}
                            </select>
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
                                Verifying claim details...
                            </>
                        ) : (
                            <>
                                <Shield size={20} />
                                Initiate NAFU Audit
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

            {isHumanInvestigatorAssigned && (
                <div className="mt-6 p-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex flex-col items-center justify-center text-center">
                    <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
                    <h3 className="text-xl font-bold text-amber-800 dark:text-amber-200 mb-4">Manual Review Required</h3>
                    <p className="text-lg text-amber-700 dark:text-amber-300 max-w-md font-medium">
                        due to insufficient resources you will be allotted a human investigator, you can contact him at +91 87541 xxxxx
                    </p>
                </div>
            )}

            {result && (
                <div className="mt-6 space-y-4 print:w-full print:block relative">
                    <button
                        onClick={handleExportPDF}
                        className="print:hidden absolute top-0 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors shadow-sm z-10"
                    >
                        <FileText size={16} /> Export PDF
                    </button>
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Shield size={18} className="text-[#138808]" />
                        NAFU Audit Results
                    </h3>

                    <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-gradient-to-r from-[#FF9933]/5 via-slate-50 to-[#138808]/5 dark:from-[#FF9933]/10 dark:via-slate-800 dark:to-[#138808]/10 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-4">
                            <AyushmanBadge isVerified={result.abha_verified} abhaId={formData.ABHA_ID} />
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Risk Score:</span>
                                <span className={`px-3 py-1 rounded-lg font-bold text-lg ${result.risk_label === 'CRITICAL' ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300' :
                                    result.risk_label === 'HIGH' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' :
                                        'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                    }`}>
                                    {result.risk_score}/100
                                </span>
                                <span className={`text-sm font-bold px-2 py-0.5 rounded ${result.risk_label === 'CRITICAL' ? 'bg-rose-200/60 dark:bg-rose-800/40 text-rose-800 dark:text-rose-200' :
                                    result.risk_label === 'HIGH' ? 'bg-amber-200/60 dark:bg-amber-800/40 text-amber-800 dark:text-amber-200' :
                                        'bg-emerald-200/60 dark:bg-emerald-800/40 text-emerald-800 dark:text-emerald-200'
                                    }`}>
                                    {result.risk_label}
                                </span>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border-l-4 border-[#138808] dark:border-[#138808] shadow-sm">
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">NAFU Audit Finding</h4>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{result.nafu_audit_finding}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
