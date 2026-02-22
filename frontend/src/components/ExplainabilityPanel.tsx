import React from 'react';
import type { Claim } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { X, FileText, CheckCircle, ShieldAlert, HeartPulse, AlertTriangle, TrendingUp, Loader2 } from 'lucide-react';
import { formatCurrency } from '../utils/format';

interface ExplainabilityPanelProps {
    claim: Claim | null;
    onClose: () => void;
    onInvestigate: (id: string) => void;
    onClear: (id: string) => void;
    isAnalyzing: boolean;
}

const ExplainabilityPanel: React.FC<ExplainabilityPanelProps> = ({ claim, onClose, onInvestigate, onClear, isAnalyzing }) => {
    if (!claim) return null;

    // Map SHAP values for chart display
    const data = claim.shapValues?.map(shap => ({
        feature: shap.display || shap.feature,
        impact: shap.value || 0
    })) || [];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/95 dark:bg-slate-800 backdrop-blur-md border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-xl text-sm">
                    <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{`Feature: ${label}`}</p>
                    <p className={`font-medium ${payload[0].value > 0 ? 'text-rose-600' : 'text-teal-600'}`}>
                        {`Impact: ${(payload[0].value > 0 ? '+' : '')}${payload[0].value.toFixed(4)}`}
                    </p>
                </div>
            );
        }
        return null;
    };

    const hasBeenAnalyzed = claim.riskScore !== undefined;

    return (
        <div className="w-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl border-l border-slate-200 dark:border-slate-700 h-[calc(100vh-160px)] flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.05)] relative z-20 rounded-r-2xl">
            {/* Top ambient glow */}
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-500 opacity-80"></div>

            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/80 dark:bg-slate-700/80 backdrop-blur top-0 sticky z-10">
                <div>
                    <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400 tracking-wide flex items-center">
                        <HeartPulse className="w-5 h-5 text-teal-500 dark:text-teal-400 mr-2" />
                        AI Analysis Report
                    </h2>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1 uppercase tracking-widest ml-7">Ref: {claim.claim_id}</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-all duration-200 border border-transparent hover:border-slate-300 dark:hover:border-slate-600 hover:rotate-90"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-6 scrollbar-thin scrollbar-thumb-teal-200/50 scrollbar-track-transparent">
                {/* Structured Data Section */}
                <section className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600 shadow-sm transition-all duration-300 hover:shadow-md">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-4 flex items-center">
                        <CheckCircle className="mr-2 text-teal-600 dark:text-teal-400" size={14} />
                        Structured Data
                    </h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-4 text-sm">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider mb-0.5">Provider</p>
                            <p className="text-slate-800 dark:text-slate-200 font-semibold truncate" title={claim.Provider_ID}>{claim.Provider_ID}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider mb-0.5">Amt Billed</p>
                            <p className="text-teal-700 dark:text-teal-400 font-extrabold">{formatCurrency(claim.Total_Claim_Amount)}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider mb-0.5">Diag Code</p>
                            <p className="text-cyan-700 dark:text-cyan-400 font-mono bg-cyan-50 dark:bg-cyan-900/30 px-1.5 py-0.5 rounded text-xs border border-cyan-200 dark:border-cyan-800 w-fit">{claim.Diagnosis_Code}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider mb-0.5">Procedure</p>
                            <p className="text-slate-600 dark:text-slate-300 font-mono text-xs">{claim.Procedure_Code}</p>
                        </div>
                    </div>
                </section>

                {/* Not yet analyzed prompt */}
                {!hasBeenAnalyzed && !isAnalyzing && (
                    <section className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-center">
                        <p className="text-sm text-amber-800 dark:text-amber-300 font-semibold mb-2">This claim has not been analyzed yet.</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400">Click <strong>"Investigate"</strong> below to run a comprehensive health claim audit.</p>
                    </section>
                )}

                {/* Loading state while analyzing */}
                {isAnalyzing && (
                    <section className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-6 flex flex-col items-center justify-center">
                        <Loader2 className="w-8 h-8 text-teal-600 dark:text-teal-400 animate-spin mb-3" />
                        <p className="text-sm text-teal-700 dark:text-teal-300 font-bold">Performing health claim audit...</p>
                        <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">Verifying diagnosis · Checking procedures · Reviewing notes</p>
                    </section>
                )}

                {/* SHAP Values Chart */}
                {hasBeenAnalyzed && claim.shapValues && claim.shapValues.length > 0 && (
                    <section className="transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
                        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center mb-1">
                            <ShieldAlert className="mr-2 text-rose-500" size={14} />
                            Risk Drivers (SHAP)
                        </h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4 ml-6 uppercase tracking-wide">
                            Variables contributing to anomaly
                        </p>
                        <div className="h-48 w-full bg-white dark:bg-slate-700/50 rounded-xl p-3 border border-slate-200 dark:border-slate-600 shadow-sm group transition-all duration-300 hover:border-teal-300 dark:hover:border-teal-600">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 40, bottom: 5 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="feature" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} width={80} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }} />
                                    <Bar dataKey="impact" radius={[0, 4, 4, 0]} animationDuration={800}>
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.impact > 0 ? '#f43f5e' : '#14b8a6'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </section>
                )}

                {/* Isolation Forest Anomaly Detection */}
                {hasBeenAnalyzed && claim.anomalyScore !== undefined && (
                    <section className="transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
                        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-3 flex items-center">
                            <AlertTriangle className="mr-2 text-orange-500" size={14} />
                            Anomaly Detection (Isolation Forest)
                        </h3>
                        <div className={`p-4 rounded-xl border shadow-sm transition-all duration-300 ${claim.anomalyScore === -1
                            ? 'bg-orange-50/80 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                            : 'bg-teal-50/50 dark:bg-teal-900/20 border-teal-100 dark:border-teal-800'
                            }`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-sm font-bold ${claim.anomalyScore === -1 ? 'text-orange-700 dark:text-orange-300' : 'text-teal-700 dark:text-teal-300'
                                    }`}>
                                    {claim.anomalyScore === -1 ? '⚠️ ANOMALY DETECTED' : '✓ Normal Pattern'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-2">
                                {claim.anomalyScore === -1
                                    ? "This claim exhibits statistical patterns that deviate significantly from normal billing behavior."
                                    : "This claim's pattern matches expected statistical distributions."}
                            </p>
                        </div>
                    </section>
                )}

                {/* Gaussian Distribution Analysis */}
                {hasBeenAnalyzed && claim.gaussianScore !== undefined && claim.gaussianAnalysis && (
                    <section className="transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
                        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-3 flex items-center">
                            <TrendingUp className="mr-2 text-purple-500" size={14} />
                            Gaussian Distribution
                        </h3>
                        <div className={`p-4 rounded-xl border shadow-sm ${claim.gaussianScore > 50
                            ? 'bg-purple-50/80 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                            : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
                            }`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider font-bold">Z-Score Suspicion</span>
                                <span className={`text-sm font-extrabold ${claim.gaussianScore > 50 ? 'text-purple-700 dark:text-purple-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {claim.gaussianScore.toFixed(1)}/100
                                </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2 mb-3">
                                <div
                                    className={`h-2 rounded-full transition-all duration-700 ${claim.gaussianScore > 50 ? 'bg-purple-500' : 'bg-teal-500'}`}
                                    style={{ width: `${Math.min(claim.gaussianScore, 100)}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{claim.gaussianAnalysis}</p>
                        </div>
                    </section>
                )}

                {/* AI Auditor Section (Groq) */}
                {hasBeenAnalyzed && claim.llmAnalysis && (
                    <section className="transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
                        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-3 flex items-center">
                            <span className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-[10px] px-1.5 py-0.5 rounded mr-2 shadow-sm font-black">AI</span>
                            Clinical Audit
                        </h3>
                        <div className="bg-teal-50/50 dark:bg-teal-900/20 p-4 rounded-xl border border-teal-100 dark:border-teal-800 shadow-sm text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                            <p>{claim.llmAnalysis}</p>
                        </div>
                    </section>
                )}

                {/* Unstructured Data */}
                <section>
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-3 flex items-center">
                        <FileText className="mr-2 text-blue-500" size={14} />
                        Physician Notes
                    </h3>
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-600 relative group transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-600 shadow-inner">
                        <p className="text-sm text-slate-600 dark:text-slate-300 font-serif leading-relaxed italic">
                            "{claim.Unstructured_Notes}"
                        </p>
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-teal-400 rounded-l-xl opacity-70 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                </section>
            </div>

            {/* Action Buttons — FIXED: Clear and Investigate are functional */}
            <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur grid grid-cols-2 gap-4 rounded-br-2xl">
                <button
                    onClick={() => onClear(claim.claim_id)}
                    className="flex-1 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 py-2.5 rounded-lg text-sm font-bold border border-slate-300 dark:border-slate-600 transition-all duration-200 shadow-sm active:scale-95 hover:shadow-md"
                >
                    Clear Claim
                </button>
                <button
                    onClick={() => onInvestigate(claim.claim_id)}
                    disabled={isAnalyzing}
                    className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white py-2.5 rounded-lg text-sm font-bold transition-all shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:shadow-[0_0_20px_rgba(20,184,166,0.4)] transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isAnalyzing ? (
                        <><Loader2 size={16} className="animate-spin" /> Analyzing...</>
                    ) : hasBeenAnalyzed ? (
                        'Re-Investigate'
                    ) : (
                        'Investigate'
                    )}
                </button>
            </div>
        </div>
    );
};

export default ExplainabilityPanel;
