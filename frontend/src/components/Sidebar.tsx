import React from 'react';
import { LayoutDashboard, AlertCircle, Briefcase, Activity, Settings, ShieldPlus } from 'lucide-react';
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

            <div className="flex items-center px-6 mb-12 relative z-10 hover:scale-105 transition-transform cursor-pointer" onClick={() => onViewChange('overview')}>
                <div className="bg-gradient-to-br from-teal-500 to-cyan-600 p-1.5 rounded-lg mr-3 shadow-[0_0_15px_rgba(20,184,166,0.2)]">
                    <ShieldPlus className="text-white w-6 h-6" />
                </div>
                <h1 className="text-xl font-extrabold tracking-wide text-slate-800 flex items-center">
                    Veri<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">Claim</span>
                </h1>
            </div>

            <nav className="flex-1 px-4 space-y-2 relative z-10">
                <NavItem icon={<LayoutDashboard size={20} />} label="Overview" active={currentView === 'overview'} onClick={() => onViewChange('overview')} />
                <NavItem icon={<AlertCircle size={20} />} label="Alert Queue" active={currentView === 'queue'} badge="12" onClick={() => onViewChange('queue')} />
                <NavItem icon={<Briefcase size={20} />} label="Case Manager" active={currentView === 'case_manager'} onClick={() => onViewChange('case_manager')} />
                <NavItem icon={<Activity size={20} />} label="Typology Studio" active={currentView === 'typology'} onClick={() => onViewChange('typology')} />
            </nav>

            <div className="p-4 mt-auto border-t border-slate-200 dark:border-slate-700 relative z-10 bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md">
                <NavItem icon={<Settings size={20} />} label="Settings" active={currentView === 'settings'} onClick={() => onViewChange('settings')} />
                <div className="mt-4 flex items-center px-2 py-2 rounded-xl bg-white border border-slate-200 shadow-sm transition-all hover:border-teal-300 hover:shadow-md cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">
                        AI
                    </div>
                    <div className="ml-3 flex-1">
                        <p className="text-sm font-semibold text-slate-700">Anti-Fraud Copilot</p>
                        <p className="text-[10px] text-teal-600 uppercase tracking-widest font-bold flex items-center">
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
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, badge, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-300 group ${active
            ? 'bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/30 dark:to-cyan-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700 shadow-sm hover:shadow-md'
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-700/80 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
    >
        <div className="flex items-center gap-3">
            <div className={`${active ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'} transition-colors transform group-hover:scale-110 duration-200`}>
                {icon}
            </div>
            <span className={`text-sm tracking-wide ${active ? 'font-bold' : 'font-semibold'}`}>{label}</span>
        </div>
        {badge && (
            <span className="bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                {badge}
            </span>
        )}
    </button>
);

export default Sidebar;
