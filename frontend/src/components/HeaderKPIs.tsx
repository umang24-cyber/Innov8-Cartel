import React from 'react';
import { Activity, ShieldAlert, Target, Users } from 'lucide-react';
import type { Metric } from '../types';

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
    <Activity className="text-cyan-400" size={24} />,
    <ShieldAlert className="text-rose-500" size={24} />,
    <Target className="text-blue-400" size={24} />,
    <Users className="text-indigo-400" size={24} />,
];

const HeaderKPIs: React.FC = () => {
    return (
        <div className="grid grid-cols-4 gap-6 mb-8 pt-4">
            {metrics.map((metric, index) => (
                <div
                    key={index}
                    className="bg-[#0a1024]/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-lg shadow-cyan-900/5 relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-300 transform hover:-translate-y-1"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{metric.label}</p>
                            <h3 className="text-3xl font-extrabold text-white tracking-tight">{metric.value}</h3>
                        </div>
                        <div className="p-3 rounded-xl bg-[#070b19] border border-slate-800 shadow-inner">
                            {icons[index]}
                        </div>
                    </div>
                    <div className="mt-4 flex items-center">
                        <span
                            className={`text-sm font-bold flex items-center px-2 py-0.5 rounded-md ${metric.isGood ? 'bg-cyan-500/10 text-cyan-400 bg-opacity-20' : 'bg-rose-500/10 text-rose-400'
                                }`}
                        >
                            {metric.trendDirection === 'up' ? '↗' : '↘'} {metric.trend}
                        </span>
                        <span className="text-xs text-slate-500 ml-3 font-medium">vs last week</span>
                    </div>

                    {/* Subtle glow effect on hover */}
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
            ))}
        </div>
    );
};

export default HeaderKPIs;
