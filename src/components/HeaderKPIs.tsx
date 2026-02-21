import React from 'react';
import { Activity, ShieldAlert, Target, Users } from 'lucide-react';
import { Metric } from '../types';

const metrics: Metric[] = [
    {
        label: 'Total Claims Processed',
        value: '14,284',
        trend: '+12.5%',
        trendDirection: 'up',
        isGood: true,
    },
    {
        label: 'High-Risk Alerts',
        value: '241',
        trend: '+4.2%',
        trendDirection: 'up',
        isGood: false,
    },
    {
        label: 'False Positive Rate',
        value: '8.4%',
        trend: '-2.1%',
        trendDirection: 'down',
        isGood: true,
    },
    {
        label: 'Pending Investigations',
        value: '89',
        trend: '-12',
        trendDirection: 'down',
        isGood: true,
    },
];

const icons = [
    <Activity className="text-emerald-400" size={24} />,
    <ShieldAlert className="text-rose-500" size={24} />,
    <Target className="text-emerald-400" size={24} />,
    <Users className="text-amber-400" size={24} />,
];

const HeaderKPIs: React.FC = () => {
    return (
        <div className="grid grid-cols-4 gap-6 mb-8 pt-4">
            {metrics.map((metric, index) => (
                <div
                    key={index}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-colors"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-400 mb-1">{metric.label}</p>
                            <h3 className="text-3xl font-bold text-white tracking-tight">{metric.value}</h3>
                        </div>
                        <div className={`p-2 rounded-lg bg-slate-950/50`}>
                            {icons[index]}
                        </div>
                    </div>
                    <div className="mt-4 flex items-center">
                        <span
                            className={`text-sm font-semibold flex items-center ${metric.isGood ? 'text-emerald-400' : 'text-rose-500'
                                }`}
                        >
                            {metric.trendDirection === 'up' ? '↑' : '↓'} {metric.trend}
                        </span>
                        <span className="text-sm text-slate-500 ml-2">vs last week</span>
                    </div>

                    {/* Subtle glow effect on hover */}
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-slate-800 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
            ))}
        </div>
    );
};

export default HeaderKPIs;
