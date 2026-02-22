import React from 'react';
import { LayoutDashboard, AlertCircle, Briefcase, Activity, Settings, ShieldPlus, Plus } from 'lucide-react';
import type { ViewState } from '../types';

interface SidebarProps {
    currentView: ViewState;
    onViewChange: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
    return (
        <aside className="w-64 h-screen bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-r border-slate-200 dark:border-slate-700 flex flex-col pt-6 relative overflow-hidden transition-all duration-300 shadow-xl z-20">
            {/* Ambient background glow */}
            <div className="absolute top-0 left-0 w-full h-32 bg-teal-500/5 blur-3xl pointer-events-none"></div>

            <div className="flex items-center px-6 mb-6 relative z-10 hover:scale-105 transition-transform cursor-pointer" onClick={() => onViewChange('overview')}>
                <div className="bg-gradient-to-br from-teal-500 to-cyan-600 p-1.5 rounded-lg mr-3 shadow-[0_0_15px_rgba(20,184,166,0.2)]">
                    <ShieldPlus className="text-white w-6 h-6" />
                </div>
                <h1 className="text-xl font-extrabold tracking-wide text-slate-800 dark:text-white flex items-center">
                    Veri<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400">Claim</span>
                </h1>
            </div>

            {/* + New Claim Button */}
            <div className="px-4 mb-4 relative z-10">
                <button
                    onClick={() => onViewChange('new_claim')}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 ${currentView === 'new_claim'
                            ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-500/30'
                            : 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30'
                        }`}
                >
                    <Plus size={18} strokeWidth={2.5} />
                    New Claim
                </button>
            </div>

            <nav className="flex-1 px-4 space-y-2 relative z-10">
                <NavItem icon={<LayoutDashboard size={20} />} label="Overview" active={currentView === 'overview'} onClick={() => onViewChange('overview')} />
                <NavItem icon={<AlertCircle size={20} />} label="Alert Queue" active={currentView === 'queue'} badge="12" onClick={() => onViewChange('queue')} />
                <NavItem icon={<Briefcase size={20} />} label="Case Manager" active={currentView === 'case_manager'} onClick={() => onViewChange('case_manager')} />
                <NavItem icon={<Activity size={20} />} label="Typology Studio" active={currentView === 'typology'} onClick={() => onViewChange('typology')} />
                <NavItem
                    icon={<span className="text-base leading-none">🇮🇳</span>}
                    label="AB-PMJAY Portal"
                    active={currentView === 'ayushman_portal'}
                    onClick={() => onViewChange('ayushman_portal')}
                    highlight="saffron"
                />
            </nav>

            <div className="p-4 mt-auto border-t border-slate-200 dark:border-slate-700 relative z-10 bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md">
                <NavItem icon={<Settings size={20} />} label="Settings" active={currentView === 'settings'} onClick={() => onViewChange('settings')} />
                <div className="mt-4 flex items-center px-2 py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm transition-all hover:border-teal-300 dark:hover:border-teal-500 hover:shadow-md cursor-pointer group">
                    <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-600 border border-slate-200 dark:border-slate-500 flex items-center justify-center text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">
                        AI
                    </div>
                    <div className="ml-3 flex-1">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Anti-Fraud Copilot</p>
                        <p className="text-[10px] text-teal-600 dark:text-teal-400 uppercase tracking-widest font-bold flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mr-1.5 animate-pulse shadow-[0_0_5px_#14b8a6]"></span>
                            Active
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    badge?: string;
    onClick: () => void;
    highlight?: 'saffron';
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, badge, onClick, highlight }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-300 group ${active && highlight === 'saffron'
            ? 'bg-gradient-to-r from-[#FF9933]/20 via-white to-[#138808]/20 dark:from-[#FF9933]/25 dark:via-slate-800 dark:to-[#138808]/25 text-slate-800 dark:text-white border border-[#138808]/40 dark:border-[#138808]/50 shadow-sm hover:shadow-md'
            : highlight === 'saffron'
                ? 'text-slate-600 dark:text-slate-300 hover:bg-gradient-to-r hover:from-[#FF9933]/10 hover:to-[#138808]/10 dark:hover:from-[#FF9933]/15 dark:hover:to-[#138808]/15 border border-transparent hover:border-[#138808]/30'
                : active
                    ? 'bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/30 dark:to-cyan-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700 shadow-sm hover:shadow-md'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-700/80 hover:text-slate-700 dark:hover:text-slate-200 border border-transparent hover:border-slate-200 dark:hover:border-slate-600'
            }`}
    >
        <div className="flex items-center gap-3">
            <div className={`${active ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-500 dark:group-hover:text-teal-400'} transition-colors transform group-hover:scale-110 duration-200`}>
                {icon}
            </div>
            <span className={`text-sm tracking-wide ${active ? 'font-bold' : 'font-semibold'}`}>{label}</span>
        </div>
        {badge && (
            <span className="bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-700 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                {badge}
            </span>
        )}
    </button>
);

export default Sidebar;
