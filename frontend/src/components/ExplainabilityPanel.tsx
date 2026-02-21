import React from 'react';
import type { Claim } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { X, FileText, CheckCircle, ShieldAlert } from 'lucide-react';

interface ExplainabilityPanelProps {
    claim: Claim | null;
    onClose: () => void;
}

const ExplainabilityPanel: React.FC<ExplainabilityPanelProps> = ({ claim, onClose }) => {
    if (!claim) return null;

    const data = claim.shapValues || [];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-lg text-sm text-white">
                    <p className="font-semibold text-slate-300 mb-1">{`Feature: ${label}`}</p>
                    <p className="text-emerald-400">
                        {`Impact: ${(payload[0].value > 0 ? '+' : '')}${payload[0].value.toFixed(2)}`}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-96 bg-slate-900 border-l border-slate-800 h-[calc(100vh-220px)] flex flex-col shadow-[-10px_0_20px_rgba(0,0,0,0.5)] transform transition-transform duration-300 translate-x-0 relative z-20">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/90 backdrop-blur">
                <div>
                    <h2 className="text-lg font-bold text-white tracking-wide">AI Analysis Report</h2>
                    <p className="text-xs text-slate-500 font-mono mt-1">Ref: {claim.id}</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {/* Structured Data Section */}
                <section className="bg-slate-950/50 rounded-lg p-4 border border-slate-800/80">
                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center">
                        <CheckCircle className="mr-2 text-emerald-500" size={16} />
                        Structured Data
                    </h3>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                        <div>
                            <p className="text-slate-500 text-xs">Provider</p>
                            <p className="text-slate-200 font-medium">{claim.provider}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs">Amt Billed</p>
                            <p className="text-emerald-400 font-medium">${claim.billedAmount.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs">Diag Code</p>
                            <p className="text-slate-200 font-mono bg-slate-800 px-1 py-0.5 rounded text-xs w-fit">{claim.diagnosisCode}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs">Date</p>
                            <p className="text-slate-200">{claim.date}</p>
                        </div>
                    </div>
                </section>

                {/* SHAP Values Chart */}
                <section>
                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center mb-1">
                        <ShieldAlert className="mr-2 text-rose-500" size={16} />
                        Risk Drivers (SHAP)
                    </h3>
                    <p className="text-xs text-slate-500 mb-4 ml-6">
                        Variables contributing anomaly score
                    </p>
                    <div className="h-48 w-full bg-slate-950/30 rounded-lg p-2 border border-slate-800/50">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 40, bottom: 5 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="feature" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b' }} />
                                <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.impact > 0 ? '#f43f5e' : '#10b981'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* Unstructured Data */}
                <section>
                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center">
                        <FileText className="mr-2 text-amber-400" size={16} />
                        Original unstructured notes
                    </h3>
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 relative">
                        <p className="text-sm text-slate-300 font-mono leading-relaxed opacity-90">
                            "{claim.doctorsNote}"
                        </p>
                        <div className="absolute top-0 left-0 w-1 h-full bg-rose-500/50 rounded-l-lg shadow-[0_0_10px_rgba(244,63,94,0.3)]"></div>
                    </div>
                </section>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900 grid grid-cols-2 gap-3">
                <button className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 py-2 rounded-lg text-sm font-medium border border-emerald-500/20 transition-colors">
                    Approve Claim
                </button>
                <button className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-2 rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(244,63,94,0.4)]">
                    Create Case
                </button>
            </div>
        </div>
    );
};

export default ExplainabilityPanel;
