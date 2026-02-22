import React from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

interface AyushmanBadgeProps {
    isVerified: boolean;
    abhaId: string;
}

export const AyushmanBadge: React.FC<AyushmanBadgeProps> = ({ isVerified, abhaId }) => {
    if (isVerified) {
        return (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 shadow-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                    <span className="text-sm font-bold text-emerald-800 dark:text-emerald-200">BIS e-KYC Verified</span>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">ABHA ID: {abhaId}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            <div>
                <span className="text-sm font-bold text-rose-800 dark:text-rose-200">e-KYC Mismatch</span>
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">ABHA ID: {abhaId}</p>
            </div>
        </div>
    );
};
