import React from 'react';
import type { Claim } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { X, FileText, CheckCircle, ShieldAlert, HeartPulse, AlertTriangle, TrendingUp } from 'lucide-react';

interface ExplainabilityPanelProps {
    claim: Claim | null;
    onClose: () => void;
}

const ExplainabilityPanel: React.FC<ExplainabilityPanelProps> = ({ claim, onClose }) => {
    if (!claim) return null;

    // Map SHAP values for chart display
    // Backend returns: { feature, value, display }
    const data = claim.shapValues?.map(shap => ({
        feature: shap.display || shap.feature,
        impact: shap.value || 0
    })) || [];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-3 rounded-lg shadow-xl text-sm">
                    <p className="font-semibold text-slate-700 mb-1">{`Feature: ${label}`}</p>
                    <p className={`font-medium ${payload[0].value > 0 ? 'text-rose-600' : 'text-teal-600'}`}>
                        {`Impact: ${(payload[0].value > 0 ? '+' : '')}${payload[0].value.toFixed(4)}`}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-[400px] bg-white/95 backdrop-blur-2xl border-l border-slate-200 h-[calc(100vh-250px)] flex flex-col shadow-[-20px_0_40px_rgba(0,0,0,0.05)] transform transition-transform duration-300 translate-x-0 relative z-20 rounded-r-2xl">
            {/* Top ambient glow */}
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-500 opacity-80"></div>

            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/80 backdrop-blur top-0 sticky z-10">
                <div>
                    <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600 tracking-wide flex items-center">
                        <HeartPulse className="w-5 h-5 text-teal-500 mr-2" />
                        AI Analysis Report
                    </h2>
                    <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-widest ml-7">Ref: {claim.claim_id}</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors border border-transparent hover:border-slate-300"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-6 scrollbar-thin scrollbar-thumb-teal-200/50 scrollbar-track-transparent">
                {/* Structured Data Section */}
                <section className="bg-slate-50 rounded-xl p-4 border border-slate-200 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-4 flex items-center">
                        <CheckCircle className="mr-2 text-teal-600" size={14} />
                        Structured Data
                    </h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-4 text-sm">
                        <div>
                            <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">Provider</p>
                            <p className="text-slate-800 font-semibold truncate" title={claim.Provider_ID}>{claim.Provider_ID}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">Amt Billed</p>
                            <p className="text-teal-700 font-extrabold">${claim.Total_Claim_Amount.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">Diag Code</p>
                            <p className="text-cyan-700 font-mono bg-cyan-50 px-1.5 py-0.5 rounded text-xs border border-cyan-200 w-fit">{claim.Diagnosis_Code}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">Procedure</p>
                            <p className="text-slate-600 font-mono text-xs">{claim.Procedure_Code}</p>
                        </div>
                    </div>
                </section>

                {/* SHAP Values Chart */}
                {claim.shapValues && claim.shapValues.length > 0 && (
                    <section>
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center mb-1">
                            <ShieldAlert className="mr-2 text-rose-500" size={14} />
                            Risk Drivers (SHAP)
                        </h3>
                        <p className="text-[10px] text-slate-500 mb-4 ml-6 uppercase tracking-wide">
                            Variables contributing to anomaly
                        </p>
                        <div className="h-48 w-full bg-white rounded-xl p-3 border border-slate-200 shadow-sm group transition-all duration-300 hover:border-teal-300">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 40, bottom: 5 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="feature" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} width={80} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }} />
                                    <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
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
                {claim.anomalyScore !== undefined && (
                    <section>
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-3 flex items-center">
                            <AlertTriangle className="mr-2 text-orange-500" size={14} />
                            Anomaly Detection (Isolation Forest)
                        </h3>
                        <div className={`p-4 rounded-xl border shadow-sm ${
                            claim.anomalyScore === -1 
                                ? 'bg-orange-50/80 border-orange-200' 
                                : 'bg-teal-50/50 border-teal-100'
                        }`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-sm font-bold ${
                                    claim.anomalyScore === -1 ? 'text-orange-700' : 'text-teal-700'
                                }`}>
                                    {claim.anomalyScore === -1 ? '⚠️ ANOMALY DETECTED' : '✓ Normal Pattern'}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                                    claim.anomalyScore === -1 
                                        ? 'bg-orange-100 text-orange-700' 
                                        : 'bg-teal-100 text-teal-700'
                                }`}>
                                    {claim.anomalyScore === -1 ? 'Anomaly' : 'Normal'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-600 font-medium mt-2">
                                {claim.anomalyScore === -1 
                                    ? "This claim exhibits statistical patterns that deviate significantly from normal billing behavior. Recommend investigation."
                                    : "This claim's pattern matches expected statistical distributions in the dataset."}
                            </p>
                        </div>
                    </section>
                )}

                {/* Benford's Law Analysis */}
                {claim.benfordScore !== undefined && claim.benfordAnalysis && (
                    <section>
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-3 flex items-center">
                            <TrendingUp className="mr-2 text-purple-500" size={14} />
                            Benford's Law Analysis
                        </h3>
                        <div className={`p-4 rounded-xl border shadow-sm ${
                            claim.benfordScore > 50 
                                ? 'bg-purple-50/80 border-purple-200' 
                                : 'bg-slate-50 border-slate-200'
                        }`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-slate-600 uppercase tracking-wider font-bold">
                                    Deviation Score
                                </span>
                                <span className={`text-sm font-extrabold ${
                                    claim.benfordScore > 50 ? 'text-purple-700' : 'text-slate-700'
                                }`}>
                                    {claim.benfordScore.toFixed(1)}/100
                                </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 mb-3">
                                <div 
                                    className={`h-2 rounded-full transition-all ${
                                        claim.benfordScore > 50 ? 'bg-purple-500' : 'bg-teal-500'
                                    }`}
                                    style={{ width: `${Math.min(claim.benfordScore, 100)}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                {claim.benfordAnalysis}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-2 italic">
                                Benford's Law detects unnatural number distributions that may indicate fabricated amounts.
                            </p>
                        </div>
                    </section>
                )}

                {/* AI Auditor Section (Groq) */}
                {claim.llmAnalysis && (
                    <section>
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-3 flex items-center">
                            <span className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-[10px] px-1.5 py-0.5 rounded mr-2 shadow-sm font-black">AI</span>
                            Clinical Audit
                        </h3>
                        <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-100 shadow-sm text-sm text-slate-700 leading-relaxed font-medium">
                            <p>{claim.llmAnalysis}</p>
                        </div>
                    </section>
                )}

                {/* Unstructured Data */}
                <section>
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-3 flex items-center">
                        <FileText className="mr-2 text-blue-500" size={14} />
                        Physician Notes
                    </h3>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative group transition-colors hover:border-blue-300 shadow-inner">
                        <p className="text-sm text-slate-600 font-serif leading-relaxed italic">
                            "{claim.Unstructured_Notes}"
                        </p>
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-teal-400 rounded-l-xl opacity-70 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                </section>
            </div>

            <div className="p-5 border-t border-slate-200 bg-slate-50/90 backdrop-blur grid grid-cols-2 gap-4 rounded-br-2xl">
                <button className="flex-1 bg-white hover:bg-slate-50 text-slate-600 py-2.5 rounded-lg text-sm font-bold border border-slate-300 transition-colors shadow-sm">
                    Clear Claim
                </button>
                <button className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white py-2.5 rounded-lg text-sm font-bold transition-all shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:shadow-[0_0_20px_rgba(20,184,166,0.4)] transform hover:-translate-y-0.5">
                    Investigate
                </button>
            </div>
        </div>
    );
};

export default ExplainabilityPanel;
