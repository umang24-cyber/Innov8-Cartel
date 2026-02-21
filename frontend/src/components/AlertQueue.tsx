import React, { useState } from 'react';
import type { Claim } from '../types';
import { ChevronDown, Filter, Loader2 } from 'lucide-react';

interface AlertQueueProps {
    claims: Claim[];
    selectedClaimId: string | null;
    onSelectClaim: (id: string) => void;
    isLoadingId?: string | null;
}

const AlertQueue: React.FC<AlertQueueProps> = ({ claims, selectedClaimId, onSelectClaim, isLoadingId }) => {
    const [sortField, setSortField] = useState<keyof Claim>('riskScore');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const handleSort = (field: keyof Claim) => {
        if (field === sortField) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const sortedClaims = [...claims].sort((a, b) => {
        const valA = a[sortField] ?? 0;
        const valB = b[sortField] ?? 0;
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const getRiskColor = (level?: string) => {
        switch (level) {
            case 'Critical': return 'bg-rose-100 text-rose-700 border-rose-200 shadow-sm';
            case 'High': return 'bg-orange-100 text-orange-700 border-orange-200 shadow-sm';
            case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200 shadow-sm';
            case 'Low': return 'bg-teal-50 text-teal-700 border-teal-200 shadow-sm';
            default: return 'bg-slate-100 text-slate-700 border-slate-200 shadow-sm';
        }
    };

    const getRiskDot = (level?: string) => {
        switch (level) {
            case 'Critical': return 'bg-rose-500 shadow-[0_0_8px_#f43f5e]';
            case 'High': return 'bg-orange-500';
            case 'Medium': return 'bg-amber-500';
            case 'Low': return 'bg-teal-500 shadow-[0_0_8px_#14b8a6]';
            default: return 'bg-slate-400';
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'Pending': return 'text-amber-600 bg-amber-50';
            case 'Investigating': return 'text-blue-600 bg-blue-50';
            case 'Cleared': return 'text-teal-600 bg-teal-50';
            default: return 'text-slate-600 bg-slate-50';
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">
            <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-250px)] shadow-xl shadow-teal-900/5 relative">
                {/* Header / ActionBar */}
                <div className="p-5 flex justify-between items-center border-b border-slate-200 bg-slate-50/50 backdrop-blur z-10 relative">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-extrabold text-slate-800 tracking-wide flex items-center">
                            <div className="w-2 h-2 rounded-full bg-teal-500 mr-2 shadow-[0_0_8px_#14b8a6]"></div>
                            Live Alert Queue
                        </h2>
                        <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {claims.length} Records
                        </span>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center text-sm font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm cursor-pointer hover:border-teal-300">
                            <Filter size={16} className="mr-2 text-teal-600" /> Filter
                        </button>
                    </div>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-6 gap-4 p-4 border-b border-slate-200 bg-slate-100 text-xs font-bold text-slate-500 uppercase tracking-widest sticky top-0 z-10 shadow-sm shadow-slate-200/50">
                    <div className="col-span-1 cursor-pointer hover:text-teal-600 flex items-center transition-colors" onClick={() => handleSort('claim_id')}>
                        Claim ID <ChevronDown size={14} className="ml-1" />
                    </div>
                    <div className="col-span-1 cursor-pointer hover:text-teal-600 flex items-center transition-colors" onClick={() => handleSort('Provider_ID')}>
                        Provider
                    </div>
                    <div className="col-span-1 cursor-pointer hover:text-teal-600 flex items-center transition-colors" onClick={() => handleSort('Diagnosis_Code')}>
                        Diagnosis
                    </div>
                    <div className="col-span-1 cursor-pointer hover:text-teal-600 flex items-center transition-colors justify-end" onClick={() => handleSort('Total_Claim_Amount')}>
                        Amount <ChevronDown size={14} className="ml-1" />
                    </div>
                    <div className="col-span-1 cursor-pointer hover:text-teal-600 flex items-center justify-center transition-colors" onClick={() => handleSort('riskScore')}>
                        Risk Score <ChevronDown size={14} className="ml-1" />
                    </div>
                    <div className="col-span-1 text-right">Status</div>
                </div>

                {/* Table Body */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-teal-200/50 scrollbar-track-transparent bg-white/50">
                    <div className="flex flex-col">
                        {sortedClaims.map((claim) => (
                            <div
                                key={claim.claim_id}
                                onClick={() => onSelectClaim(claim.claim_id)}
                                className={`grid grid-cols-6 gap-4 p-4 border-b border-slate-100 items-center transition-all duration-200 hover:bg-teal-50/50 cursor-pointer relative group ${selectedClaimId === claim.claim_id ? 'bg-teal-50' : ''
                                    }`}
                            >
                                {/* Active Row Indicator */}
                                {selectedClaimId === claim.claim_id && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500 shadow-[0_0_10px_#14b8a6]"></div>
                                )}

                                <div className="col-span-1 font-mono text-sm font-semibold text-slate-700 tracking-tight flex items-center">
                                    {claim.claim_id}
                                    {isLoadingId === claim.claim_id && (
                                        <Loader2 className="ml-2 w-3 h-3 text-teal-500 animate-spin" />
                                    )}
                                </div>
                                <div className="col-span-1 text-sm text-slate-600 font-medium truncate" title={claim.Provider_ID}>
                                    {claim.Provider_ID}
                                </div>
                                <div className="col-span-1">
                                    <span className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-xs font-mono font-medium shadow-sm">
                                        {claim.Diagnosis_Code}
                                    </span>
                                </div>
                                <div className="col-span-1 text-sm font-bold text-slate-800 text-right">
                                    ${claim.Total_Claim_Amount.toLocaleString()}
                                </div>
                                <div className="col-span-1 flex justify-center">
                                    {claim.riskScore !== undefined ? (
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center justify-center w-24 tracking-wide ${getRiskColor(claim.riskLevel)}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${getRiskDot(claim.riskLevel)}`}></span>
                                            {claim.riskScore}/100
                                        </span>
                                    ) : (
                                        <span className="text-slate-400 text-xs italic bg-slate-50 px-2 py-1 border border-slate-200 rounded-full font-medium">Unscored</span>
                                    )}
                                </div>
                                <div className="col-span-1 text-right">
                                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${getStatusColor(claim.status)}`}>
                                        {claim.status || 'Pending'}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {claims.length === 0 && (
                            <div className="p-8 text-center text-slate-500 font-medium flex flex-col items-center justify-center h-full">
                                <Loader2 className="w-8 h-8 text-teal-500 mb-4 animate-spin" />
                                <p>Loading records from ML Pipeline...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Gradient Fade */}
                <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
            </div>
        </div>
    );
};

export default AlertQueue;
