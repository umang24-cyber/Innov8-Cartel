import type { Claim } from '../types';
import { ChevronDown, Filter, AlertTriangle } from 'lucide-react';

interface AlertQueueProps {
    claims: Claim[];
    selectedClaimId: string | null;
    onSelectClaim: (id: string) => void;
}

const AlertQueue = ({ claims, selectedClaimId, onSelectClaim }: AlertQueueProps) => {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-220px)] shadow-lg">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-sm z-10 sticky top-0">
                <h2 className="text-lg font-semibold text-white flex items-center">
                    <AlertTriangle className="mr-2 text-rose-500" size={20} />
                    Alert Queue
                </h2>
                <div className="flex gap-2">
                    <button className="flex items-center text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-md transition-colors border border-slate-700">
                        <Filter size={14} className="mr-2" />
                        Filter
                    </button>
                    <button className="flex items-center text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-md transition-colors border border-slate-700">
                        Sort by Risk <ChevronDown size={14} className="ml-1 text-slate-400" />
                    </button>
                </div>
            </div>

            <div className="overflow-y-auto flex-1 p-0">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-950/80 sticky top-0 z-10 backdrop-blur-md border-b border-slate-800">
                        <tr>
                            <th className="px-6 py-3 text-slate-400 font-medium uppercase tracking-wider text-xs">Claim ID</th>
                            <th className="px-6 py-3 text-slate-400 font-medium uppercase tracking-wider text-xs">Provider</th>
                            <th className="px-6 py-3 text-slate-400 font-medium uppercase tracking-wider text-xs">Diagnosis Code</th>
                            <th className="px-6 py-3 text-slate-400 font-medium uppercase tracking-wider text-xs">Billed Amount</th>
                            <th className="px-6 py-3 text-slate-400 font-medium uppercase tracking-wider text-xs text-right">Risk Score</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {claims.map((claim) => (
                            <tr
                                key={claim.id}
                                onClick={() => onSelectClaim(claim.id)}
                                className={`cursor-pointer transition-colors hover:bg-slate-800/50 ${selectedClaimId === claim.id ? 'bg-slate-800/80 ring-1 ring-inset ring-slate-700' : ''
                                    }`}
                            >
                                <td className="px-6 py-4">
                                    <span className="text-slate-200 font-mono text-xs bg-slate-950 px-2 py-1 rounded border border-slate-800">
                                        {claim.id}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-300 font-medium">{claim.provider}</td>
                                <td className="px-6 py-4">
                                    <span className="text-slate-400 bg-slate-950/50 px-2 py-0.5 rounded text-xs border border-slate-800">
                                        {claim.diagnosisCode}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-300 font-medium text-emerald-400/90 hover:text-emerald-400">
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
        bgColor = 'bg-rose-500/20';
        textColor = 'text-rose-400';
        dotColor = 'bg-rose-500';
    } else if (level === 'High') {
        bgColor = 'bg-rose-900/40';
        textColor = 'text-rose-400';
        dotColor = 'bg-rose-500';
    } else if (level === 'Medium') {
        bgColor = 'bg-amber-500/10';
        textColor = 'text-amber-400';
        dotColor = 'bg-amber-400';
    } else if (level === 'Low') {
        bgColor = 'bg-emerald-500/10';
        textColor = 'text-emerald-400';
        dotColor = 'bg-emerald-400';
    }

    return (
        <div className={`px-3 py-1 rounded-full text-xs font-bold border border-${level === 'Critical' ? 'rose-500/50' : 'transparent'} ${bgColor} ${textColor} flex items-center shadow-sm w-fit`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor} mr-2 shadow-[0_0_8px_currentColor]`}></span>
            {score}% - {level}
        </div>
    );
};

export default AlertQueue;
