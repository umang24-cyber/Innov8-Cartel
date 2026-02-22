import React, { useState } from 'react';
import { Send, Loader2, AlertTriangle, CheckCircle, RotateCcw, FileText, ShieldAlert, TrendingUp, Save } from 'lucide-react';
import { api } from '../services/api';
import type { Claim } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const NewClaimPage: React.FC<{ userEmail?: string; onClaimSaved?: (claim: Claim) => void }> = ({ userEmail, onClaimSaved }) => {
    const [formData, setFormData] = useState({
        Provider_ID: '',
        ABHA_ID: '91-4567-8912-3456',
        PMJAY_Package_Code: 'BM001A',
        Diagnosis_Code: '',
        Procedure_Code: '',
        Total_Claim_Amount: '',
        Unstructured_Notes: '',
    });
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

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
        setSaveSuccess(false);

        if (!formData.Provider_ID || !formData.Diagnosis_Code || !formData.Procedure_Code || !formData.Total_Claim_Amount) {
            setError('Please fill in all required fields.');
            return;
        }

        setIsAnalyzing(true);
        try {
            const claimPayload: Claim = {
                claim_id: `MAN-${Date.now().toString(36).toUpperCase()}`,
                Provider_ID: formData.Provider_ID,
                ABHA_ID: formData.ABHA_ID,
                PMJAY_Package_Code: formData.PMJAY_Package_Code,
                Diagnosis_Code: formData.Diagnosis_Code,
                Procedure_Code: formData.Procedure_Code,
                Total_Claim_Amount: parseFloat(formData.Total_Claim_Amount),
                Unstructured_Notes: formData.Unstructured_Notes || 'Manual claim submission.',
            };

            const analysisResult = await api.analyzeClaim(claimPayload);
            setResult(analysisResult);
        } catch (err) {
            console.error('Failed to analyze claim', err);
            setError('Failed to connect to VeriClaim backend. Please ensure the server is running.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleReset = () => {
        setFormData({ Provider_ID: '', ABHA_ID: '91-4567-8912-3456', PMJAY_Package_Code: 'BM001A', Diagnosis_Code: '', Procedure_Code: '', Total_Claim_Amount: '', Unstructured_Notes: '' });
        setResult(null);
        setError(null);
        setSaveSuccess(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!result) return;

        setIsSaving(true);
        setError(null);
        try {
            const claimData = {
                Provider_ID: formData.Provider_ID,
                ABHA_ID: formData.ABHA_ID,
                PMJAY_Package_Code: formData.PMJAY_Package_Code,
                Diagnosis_Code: formData.Diagnosis_Code,
                Procedure_Code: formData.Procedure_Code,
                Total_Claim_Amount: parseFloat(formData.Total_Claim_Amount),
                Unstructured_Notes: formData.Unstructured_Notes || 'Manual claim submission.',
            };
            await api.saveClaim(claimData);
            // Build the full claim object for syncing
            const savedClaim: Claim = {
                ...claimData,
                claim_id: `MAN-${Date.now().toString(36).toUpperCase()}`,
                status: 'Pending',
                riskScore: result?.risk_score,
                riskLevel: result?.risk_label === 'HIGH' ? 'High' : result?.risk_label === 'MEDIUM' ? 'Medium' : result?.risk_label === 'LOW' ? 'Low' : undefined,
            };
            // Save to user-specific localStorage
            if (userEmail) {
                const storageKey = `vericlaim_claims_${userEmail}`;
                try {
                    const raw = localStorage.getItem(storageKey);
                    const existing = raw ? JSON.parse(raw) : [];
                    existing.push(savedClaim);
                    localStorage.setItem(storageKey, JSON.stringify(existing));
                } catch { /* ignore */ }
            }
            // Notify parent to sync with Alert Queue
            if (onClaimSaved) onClaimSaved(savedClaim);
            setSaveSuccess(true);
        } catch (err) {
            console.error('Failed to save claim', err);
            setError('Failed to save claim. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const shapData = result?.shap_details?.map((s: any) => ({
        feature: s.display || s.feature,
        impact: s.value || 0,
    })) || [];

    const riskColor = result
        ? result.risk_score > 70 ? 'rose' : result.risk_score > 40 ? 'amber' : 'teal'
        : 'slate';

    return (
        <div className="h-full overflow-y-auto pb-8 pr-2">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-12 translate-x-12"></div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-extrabold tracking-wide">Submit New Claim for Analysis</h2>
                        <p className="text-teal-100 font-medium mt-1">Enter claim details below to run a comprehensive health audit</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Form Section */}
                    <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-5">
                        <h3 className="text-sm font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-widest mb-1">Claim Fields</h3>

                        {/* Provider ID */}
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Provider ID *</label>
                            <input
                                type="text"
                                value={formData.Provider_ID}
                                onChange={(e) => setFormData({ ...formData, Provider_ID: e.target.value })}
                                placeholder="e.g. PRV-0042"
                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all hover:border-teal-300 dark:hover:border-teal-600"
                            />
                        </div>

                        {/* ABHA ID */}
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">ABHA ID <span className="text-slate-400 font-normal normal-case">(Optional)</span></label>
                            <input
                                type="text"
                                value={formData.ABHA_ID}
                                onChange={(e) => setFormData({ ...formData, ABHA_ID: e.target.value })}
                                placeholder="91-XXXX-XXXX-XXXX"
                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all hover:border-teal-300 dark:hover:border-teal-600"
                            />
                        </div>

                        {/* PM-JAY Package Code */}
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">PM-JAY Package Code <span className="text-slate-400 font-normal normal-case">(Optional)</span></label>
                            <input
                                type="text"
                                value={formData.PMJAY_Package_Code}
                                onChange={(e) => setFormData({ ...formData, PMJAY_Package_Code: e.target.value })}
                                placeholder="e.g. BM001A, MC012A"
                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all hover:border-teal-300 dark:hover:border-teal-600"
                            />
                        </div>

                        {/* Diagnosis Code */}
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Diagnosis Code *</label>
                            <select
                                value={formData.Diagnosis_Code}
                                onChange={(e) => setFormData({ ...formData, Diagnosis_Code: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all hover:border-teal-300 dark:hover:border-teal-600"
                            >
                                <option value="">Select diagnosis...</option>
                                {diagnosisCodes.map(d => (
                                    <option key={d.code} value={d.code}>{d.code} — {d.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Procedure Code */}
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Procedure Code *</label>
                            <select
                                value={formData.Procedure_Code}
                                onChange={(e) => setFormData({ ...formData, Procedure_Code: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all hover:border-teal-300 dark:hover:border-teal-600"
                            >
                                <option value="">Select procedure...</option>
                                {procedureCodes.map(p => (
                                    <option key={p.code} value={p.code}>{p.code} — {p.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Total Claim Amount */}
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Total Claim Amount (₹) *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.Total_Claim_Amount}
                                onChange={(e) => setFormData({ ...formData, Total_Claim_Amount: e.target.value })}
                                placeholder="e.g. 9500.00"
                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all hover:border-teal-300 dark:hover:border-teal-600"
                            />
                        </div>

                        {/* Unstructured Notes */}
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Physician Notes (optional)</label>
                            <textarea
                                value={formData.Unstructured_Notes}
                                onChange={(e) => setFormData({ ...formData, Unstructured_Notes: e.target.value })}
                                placeholder="Enter clinical notes for AI analysis..."
                                rows={3}
                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all resize-none hover:border-teal-300 dark:hover:border-teal-600"
                            />
                        </div>

                        {error && (
                            <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-3 flex items-center gap-2 text-sm text-rose-700 dark:text-rose-300 font-medium">
                                <AlertTriangle size={16} /> {error}
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={isAnalyzing}
                                className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-md shadow-teal-500/20 hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isAnalyzing ? <><Loader2 size={16} className="animate-spin" /> Running Pipeline...</> : <><Send size={16} /> Analyze Claim</>}
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={!result || isSaving || saveSuccess}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all shadow-md transform flex items-center justify-center gap-2 ${(!result || isSaving || saveSuccess)
                                    ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 cursor-not-allowed opacity-50'
                                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white shadow-indigo-500/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
                                    }`}
                            >
                                {isSaving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : saveSuccess ? <><CheckCircle size={16} /> Saved!</> : <><Save size={16} /> Save Claim</>}
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-4 py-3 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
                            >
                                <RotateCcw size={16} />
                            </button>
                        </div>
                    </form>

                    {/* Results Section */}
                    <div className="lg:col-span-3 space-y-5">
                        {!result && !isAnalyzing && (
                            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl p-12 shadow-sm flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-4">
                                    <FileText className="w-10 h-10 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">No Claim Analyzed</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">Fill in the claim fields on the left and click <strong>"Analyze Claim"</strong> to begin a comprehensive claim health check.</p>
                            </div>
                        )}

                        {isAnalyzing && (
                            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl p-12 shadow-sm flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                                <Loader2 className="w-12 h-12 text-teal-600 dark:text-teal-400 animate-spin mb-4" />
                                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">Checking vitals and verifying claim...</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Verifying diagnosis · Cross-checking procedures · Reviewing clinical notes</p>
                            </div>
                        )}

                        {result && (
                            <div className="space-y-5">
                                {/* Risk Score Card */}
                                <div className={`bg-${riskColor}-50 dark:bg-${riskColor}-900/20 border border-${riskColor}-200 dark:border-${riskColor}-800 rounded-2xl p-6 shadow-sm`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Risk Assessment</p>
                                            <div className="flex items-baseline gap-3">
                                                <span className={`text-5xl font-black text-${riskColor}-600 dark:text-${riskColor}-400`}>{result.risk_score}</span>
                                                <span className="text-lg text-slate-500 dark:text-slate-400 font-bold">/100</span>
                                            </div>
                                        </div>
                                        <div className={`px-4 py-2 rounded-xl text-sm font-extrabold bg-${riskColor}-100 dark:bg-${riskColor}-900/40 text-${riskColor}-700 dark:text-${riskColor}-300 border border-${riskColor}-200 dark:border-${riskColor}-700`}>
                                            {result.risk_label}
                                        </div>
                                    </div>
                                </div>

                                {/* SHAP Chart */}
                                {shapData.length > 0 && (
                                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
                                        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-4 flex items-center">
                                            <ShieldAlert className="mr-2 text-rose-500" size={14} /> Risk Drivers (SHAP)
                                        </h3>
                                        <div className="h-48 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={shapData} layout="vertical" margin={{ top: 5, right: 10, left: 60, bottom: 5 }}>
                                                    <XAxis type="number" hide />
                                                    <YAxis dataKey="feature" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} width={80} />
                                                    <Tooltip />
                                                    <Bar dataKey="impact" radius={[0, 4, 4, 0]} animationDuration={800}>
                                                        {shapData.map((entry: any, index: number) => (
                                                            <Cell key={`cell-${index}`} fill={entry.impact > 0 ? '#f43f5e' : '#14b8a6'} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}

                                {/* Anomaly + Benford */}
                                <div className="grid grid-cols-2 gap-4">
                                    {result.anomaly_score !== undefined && (
                                        <div className={`p-4 rounded-xl border shadow-sm ${result.anomaly_score === -1 ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' : 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800'}`}>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1"><AlertTriangle size={12} /> Anomaly Detection</p>
                                            <p className={`text-sm font-bold ${result.anomaly_score === -1 ? 'text-orange-700 dark:text-orange-300' : 'text-teal-700 dark:text-teal-300'}`}>
                                                {result.anomaly_score === -1 ? '⚠️ Anomaly Detected' : '✓ Normal Pattern'}
                                            </p>
                                        </div>
                                    )}
                                    {result.benford_score !== undefined && (
                                        <div className={`p-4 rounded-xl border shadow-sm ${result.benford_score > 50 ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'}`}>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1"><TrendingUp size={12} /> Benford's Law</p>
                                            <p className={`text-sm font-bold ${result.benford_score > 50 ? 'text-purple-700 dark:text-purple-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                                Deviation: {result.benford_score?.toFixed(1)}/100
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* LLM Analysis */}
                                {result.llm_text_analysis && (
                                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
                                        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-3 flex items-center">
                                            <span className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-[10px] px-1.5 py-0.5 rounded mr-2 shadow-sm font-black">AI</span>
                                            Clinical Audit
                                        </h3>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{result.llm_text_analysis}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
