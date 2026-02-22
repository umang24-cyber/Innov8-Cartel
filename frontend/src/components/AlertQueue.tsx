import React, { useState, useMemo } from 'react';
import type { Claim } from '../types';
import { ChevronDown, ChevronUp, Filter, Loader2, CheckSquare, Square, ChevronLeft, ChevronRight, Search, CheckCircle } from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';
import { Skeleton } from './ui/Skeleton';
import { formatCurrency } from '../utils/format';

interface AlertQueueProps {
    claims: Claim[];
    selectedClaimId: string | null;
    onSelectClaim: (id: string) => void;
    isLoadingId?: string | null;
    onInvestigateAll?: () => void;
    onMarkDone?: (id: string) => void;
    isInvestigatingAll?: boolean;
}

type SortField = 'claim_id' | 'Provider_ID' | 'Total_Claim_Amount' | 'riskScore' | 'createdAt';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

export const AlertQueue: React.FC<AlertQueueProps> = ({ claims, selectedClaimId, onSelectClaim, isLoadingId, onInvestigateAll, onMarkDone, isInvestigatingAll }) => {
    const [sortField, setSortField] = useState<SortField>('riskScore');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [selectedRiskLevels, setSelectedRiskLevels] = useState<Set<string>>(new Set(['Low', 'Medium', 'High', 'Critical']));
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedClaims, setSelectedClaims] = useState<Set<string>>(new Set());
    const [showFilters, setShowFilters] = useState(false);

    const handleSort = (field: SortField) => {
        if (field === sortField) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const filteredAndSortedClaims = useMemo(() => {
        let filtered = [...claims];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (c) =>
                    c.claim_id.toLowerCase().includes(query) ||
                    c.Provider_ID.toLowerCase().includes(query) ||
                    c.Diagnosis_Code.toLowerCase().includes(query)
            );
        }

        // Risk level filter
        filtered = filtered.filter((c) => {
            const level = c.riskLevel || 'Low';
            return selectedRiskLevels.has(level);
        });

        // Sort
        filtered.sort((a, b) => {
            let aVal: any = a[sortField];
            let bVal: any = b[sortField];

            if (sortField === 'riskScore') {
                aVal = a.riskScore ?? 0;
                bVal = b.riskScore ?? 0;
            }

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [claims, searchQuery, selectedRiskLevels, sortField, sortDirection]);

    const totalPages = Math.ceil(filteredAndSortedClaims.length / ITEMS_PER_PAGE);
    const paginatedClaims = filteredAndSortedClaims.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const getRiskColor = (level?: string) => {
        switch (level) {
            case 'Critical': return 'danger';
            case 'High': return 'warning';
            case 'Medium': return 'info';
            case 'Low': return 'success';
            default: return 'default';
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'Investigating': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'Investigated': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
            case 'Done': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'Cleared': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'Rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const toggleSelectClaim = (claimId: string) => {
        const newSelected = new Set(selectedClaims);
        if (newSelected.has(claimId)) {
            newSelected.delete(claimId);
        } else {
            newSelected.add(claimId);
        }
        setSelectedClaims(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedClaims.size === paginatedClaims.length) {
            setSelectedClaims(new Set());
        } else {
            setSelectedClaims(new Set(paginatedClaims.map((c) => c.claim_id)));
        }
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return null;
        return sortDirection === 'asc' ? (
            <ChevronUp className="w-4 h-4 ml-1" />
        ) : (
            <ChevronDown className="w-4 h-4 ml-1" />
        );
    };

    return (
        <div className="flex flex-col h-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/50 backdrop-blur">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_8px_#14b8a6]"></div>
                            Live Alert Queue
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {filteredAndSortedClaims.length} of {claims.length} claims
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            placeholder="Search claims..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 w-64"
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter className="w-4 h-4" />
                            Filters
                        </Button>
                        {onInvestigateAll && (
                            <button
                                onClick={onInvestigateAll}
                                disabled={isInvestigatingAll}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-teal-500/20 hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isInvestigatingAll ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Investigating...</>
                                ) : (
                                    <><Search className="w-4 h-4" /> Investigate All</>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Drawer */}
                {showFilters && (
                    <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Risk Levels</p>
                        <div className="flex flex-wrap gap-2">
                            {['Low', 'Medium', 'High', 'Critical'].map((level) => (
                                <button
                                    key={level}
                                    onClick={() => {
                                        const newSet = new Set(selectedRiskLevels);
                                        if (newSet.has(level)) {
                                            newSet.delete(level);
                                        } else {
                                            newSet.add(level);
                                        }
                                        setSelectedRiskLevels(newSet);
                                        setCurrentPage(1);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${selectedRiskLevels.has(level)
                                            ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600'
                                        }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto">
                {claims.length === 0 ? (
                    <EmptyState
                        title="No claims found"
                        description="Claims will appear here when they are processed"
                    />
                ) : (
                    <>
                        <table className="w-full">
                            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/80 backdrop-blur z-10 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-4 text-left">
                                        <button
                                            onClick={toggleSelectAll}
                                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                                        >
                                            {selectedClaims.size === paginatedClaims.length ? (
                                                <CheckSquare className="w-4 h-4 text-teal-600" />
                                            ) : (
                                                <Square className="w-4 h-4 text-slate-400" />
                                            )}
                                        </button>
                                    </th>
                                    <th
                                        className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                                        onClick={() => handleSort('claim_id')}
                                    >
                                        <div className="flex items-center">
                                            Claim ID
                                            <SortIcon field="claim_id" />
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                                        onClick={() => handleSort('Provider_ID')}
                                    >
                                        <div className="flex items-center">
                                            Provider
                                            <SortIcon field="Provider_ID" />
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Diagnosis
                                    </th>
                                    <th
                                        className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                                        onClick={() => handleSort('Total_Claim_Amount')}
                                    >
                                        <div className="flex items-center justify-end">
                                            Amount
                                            <SortIcon field="Total_Claim_Amount" />
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                                        onClick={() => handleSort('riskScore')}
                                    >
                                        <div className="flex items-center justify-center">
                                            Risk Score
                                            <SortIcon field="riskScore" />
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {paginatedClaims.map((claim) => (
                                    <tr
                                        key={claim.claim_id}
                                        onClick={() => onSelectClaim(claim.claim_id)}
                                        className={`cursor-pointer transition-all hover:bg-teal-50/50 dark:hover:bg-teal-900/10 ${selectedClaimId === claim.claim_id
                                                ? 'bg-teal-50 dark:bg-teal-900/20'
                                                : ''
                                            }`}
                                    >
                                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => toggleSelectClaim(claim.claim_id)}
                                                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                                            >
                                                {selectedClaims.has(claim.claim_id) ? (
                                                    <CheckSquare className="w-4 h-4 text-teal-600" />
                                                ) : (
                                                    <Square className="w-4 h-4 text-slate-400" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                    {claim.claim_id}
                                                </span>
                                                {isLoadingId === claim.claim_id && (
                                                    <Loader2 className="w-3 h-3 text-teal-500 animate-spin" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium">
                                            {claim.Provider_ID}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge size="sm" variant="default">
                                                {claim.Diagnosis_Code}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                                {formatCurrency(claim.Total_Claim_Amount)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {claim.riskScore !== undefined ? (
                                                <Badge variant={getRiskColor(claim.riskLevel)} size="sm">
                                                    {claim.riskScore}/100
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">Unscored</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <Badge size="sm" className={getStatusColor(claim.status)}>
                                                    {claim.status || 'Pending'}
                                                </Badge>
                                                {claim.riskLevel && (
                                                    <Badge variant={getRiskColor(claim.riskLevel)} size="sm">
                                                        {claim.riskLevel}
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                            {(claim.status === 'Investigated' || claim.status === 'Investigating') && onMarkDone && (
                                                <button
                                                    onClick={() => onMarkDone(claim.claim_id)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    Mark Done
                                                </button>
                                            )}
                                            {claim.status === 'Done' && (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                    <CheckCircle className="w-3.5 h-3.5" /> Completed
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-700/50">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                        {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedClaims.length)} of{' '}
                        {filteredAndSortedClaims.length} claims
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 px-3">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlertQueue;
