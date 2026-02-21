import type { Claim } from '../types';
import { ChevronDown, Filter, AlertTriangle } from 'lucide-react';

interface AlertQueueProps {
    claims: Claim[];
    selectedClaimId: string | null;
    onSelectClaim: (id: string) => void;
}

const AlertQueue = ({ claims, selectedClaimId, onSelectClaim }: AlertQueueProps) => {
    return (
        <div className="bg-[#0a1024]/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-250px)] shadow-xl shadow-cyan-900/10 relative">
            <div className="p-5 border-b border-slate-800/80 flex justify-between items-center bg-[#070b19]/60 backdrop-blur-md z-10 sticky top-0">
                <h2 className="text-lg font-bold text-white flex items-center tracking-wide">
                    <div className="w-2 h-6 bg-cyan-500 rounded-full mr-3 shadow-[0_0_10px_#06b6d4]"></div>
                    Alert Queue
                </h2>
                <div className="flex gap-3">
                    <button className="flex items-center text-sm bg-[#070b19] hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-lg transition-colors border border-slate-700/80 shadow-sm font-medium">
                        <Filter size={14} className="mr-2 text-cyan-400" />
                        Filter Filters
                    </button>
                    <button className="flex items-center text-sm bg-[#070b19] hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-lg transition-colors border border-slate-700/80 shadow-sm font-medium">
                        Sort: <span className="text-cyan-400 ml-1">Highest Risk</span> <ChevronDown size={14} className="ml-2 text-slate-500" />
                    </button>
                </div>
            </div>

            <div className="overflow-y-auto flex-1 p-0 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-[#070b19]/90 sticky top-0 z-10 backdrop-blur-md border-b border-slate-800">
                        <tr>
                            <th className="px-6 py-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Claim ID</th>
                            <th className="px-6 py-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Provider</th>
                            <th className="px-6 py-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Diagnosis Code</th>
                            <th className="px-6 py-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Billed Amount</th>
                            <th className="px-6 py-4 text-slate-400 font-bold uppercase tracking-widest text-[10px] text-right">Risk Score</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                        {claims.map((claim) => (
                            <tr
                                key={claim.id}
                                onClick={() => onSelectClaim(claim.id)}
                                className={`cursor-pointer transition-all duration-200 hover:bg-slate-800/40 ${selectedClaimId === claim.id ? 'bg-cyan-900/10' : ''
                                    }`}
                            >
                                <td className="px-6 py-4 relative">
                                    {selectedClaimId === claim.id && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>
                                    )}
                                    <span className="text-slate-200 font-mono text-xs bg-[#070b19] px-2 py-1 rounded border border-slate-800 shadow-inner">
                                        {claim.id}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-200 font-semibold">{claim.provider}</td>
                                <td className="px-6 py-4">
                                    <span className="text-slate-400 bg-slate-900/50 px-2.5 py-1 rounded-md text-[11px] font-mono border border-slate-800/80">
                                        {claim.diagnosisCode}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-200 font-semibold text-cyan-400 tracking-wide hover:text-cyan-300">
                                    ${claim.billedAmount.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 flex justify-end">
                                    <RiskBadge score={claim.riskScore} level={claim.riskLevel} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

interface RiskBadgeProps {
    score: number;
    level: string;
}

const RiskBadge = ({ score, level }: RiskBadgeProps) => {
    let bgColor = 'bg-slate-800';
    let textColor = 'text-slate-300';
    let dotColor = 'bg-slate-500';

    if (level === 'Critical') {
        bgColor = 'bg-rose-500/10';
        textColor = 'text-rose-400';
        dotColor = 'bg-rose-500';
    } else if (level === 'High') {
        bgColor = 'bg-rose-900/20';
        textColor = 'text-rose-400';
        dotColor = 'bg-rose-500';
    } else if (level === 'Medium') {
        bgColor = 'bg-amber-500/10';
        textColor = 'text-amber-400';
        dotColor = 'bg-amber-400';
    } else if (level === 'Low') {
        bgColor = 'bg-cyan-500/10';
        textColor = 'text-cyan-400';
        dotColor = 'bg-cyan-400';
    }

    return (
        <div className={`px-3 py-1.5 rounded-full text-xs font-bold border ${level === 'Critical' ? 'border-rose-500/30' : 'border-transparent'} ${bgColor} ${textColor} flex items-center shadow-sm w-fit`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor} mr-2 ${level === 'Critical' ? 'shadow-[0_0_8px_#f43f5e]' : ''} ${level === 'Low' ? 'shadow-[0_0_8px_#22d3ee]' : ''}`}></span>
            {score}% - {level}
        </div>
    );
};

export default AlertQueue;
