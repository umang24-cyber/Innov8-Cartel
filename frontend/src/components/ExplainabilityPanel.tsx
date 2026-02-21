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
                <div className="bg-[#070b19]/90 backdrop-blur-md border border-cyan-900/40 p-3 rounded-lg shadow-xl text-sm text-white">
                    <p className="font-semibold text-slate-300 mb-1">{`Feature: ${label}`}</p>
                    <p className="text-cyan-400 font-medium">
                        {`Impact: ${(payload[0].value > 0 ? '+' : '')}${payload[0].value.toFixed(2)}`}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-96 bg-[#0a1024]/95 backdrop-blur-2xl border-l border-cyan-900/30 h-[calc(100vh-250px)] flex flex-col shadow-[-20px_0_40px_rgba(0,0,0,0.6)] transform transition-transform duration-300 translate-x-0 relative z-20 rounded-r-2xl">
            {/* Top ambient glow */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-500/0 via-cyan-400 to-blue-500/0 opacity-50"></div>

            <div className="p-5 border-b border-slate-800/60 flex justify-between items-center bg-[#070b19]/80 backdrop-blur top-0 sticky z-10">
                <div>
                    <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-300 tracking-wide flex items-center">
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mr-2 shadow-[0_0_8px_#22d3ee]"></div>
                        AI Analysis Report
                    </h2>
                    <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-widest ml-3.5">Ref: {claim.id}</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-full hover:bg-slate-800/80 text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-700"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-6 scrollbar-thin scrollbar-thumb-cyan-900/50 scrollbar-track-transparent">
                {/* Structured Data Section */}
                <section className="bg-[#070b19]/60 rounded-xl p-4 border border-slate-800/80 shadow-inner">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-4 flex items-center">
                        <CheckCircle className="mr-2 text-cyan-500" size={14} />
                        Structured Data
                    </h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-4 text-sm">
                        <div>
                            <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">Provider</p>
                            <p className="text-slate-200 font-semibold truncate" title={claim.provider}>{claim.provider}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">Amt Billed</p>
                            <p className="text-cyan-400 font-bold">${claim.billedAmount.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">Diag Code</p>
                            <p className="text-cyan-200 font-mono bg-cyan-950/30 px-1.5 py-0.5 rounded text-xs border border-cyan-900/50 w-fit">{claim.diagnosisCode}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">Date</p>
                            <p className="text-slate-300 text-xs">{claim.date}</p>
                        </div>
                    </div>
                </section>

                {/* SHAP Values Chart */}
                <section>
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center mb-1">
                        <ShieldAlert className="mr-2 text-rose-500" size={14} />
                        Risk Drivers (SHAP)
                    </h3>
                    <p className="text-[10px] text-slate-500 mb-4 ml-6 uppercase tracking-wide">
                        Variables contributing to anomaly
                    </p>
                    <div className="h-48 w-full bg-[#070b19]/50 rounded-xl p-3 border border-slate-800/80 shadow-inner group transition-all duration-300 hover:border-cyan-900/50">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 40, bottom: 5 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="feature" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(15, 23, 42, 0.4)' }} />
                                <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.impact > 0 ? '#f43f5e' : '#0ea5e9'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* Unstructured Data */}
                <section>
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-3 flex items-center">
                        <FileText className="mr-2 text-blue-400" size={14} />
                        Unstructured Content
                    </h3>
                    <div className="bg-[#070b19]/80 p-4 rounded-xl border border-slate-800/60 relative group transition-colors hover:border-blue-900/50">
                        <p className="text-sm text-slate-300 font-mono leading-relaxed opacity-90 italic">
                            "{claim.doctorsNote}"
                        </p>
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-cyan-400 rounded-l-xl opacity-70 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                </section>
            </div>

            <div className="p-5 border-t border-slate-800/60 bg-[#070b19]/90 backdrop-blur grid grid-cols-2 gap-4 rounded-br-2xl">
                <button className="flex-1 bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-400 py-2.5 rounded-lg text-sm font-semibold border border-cyan-800/50 transition-colors shadow-inner">
                    Clear Claim
                </button>
                <button className="flex-1 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white py-2.5 rounded-lg text-sm font-semibold transition-all shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:shadow-[0_0_25px_rgba(244,63,94,0.5)] transform hover:-translate-y-0.5">
                    Create Case
                </button>
            </div>
        </div>
    );
};

export default ExplainabilityPanel;
