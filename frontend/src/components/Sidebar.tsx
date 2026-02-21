import React from 'react';
import { LayoutDashboard, AlertCircle, Briefcase, Activity, Settings, ShieldCheck } from 'lucide-react';

const Sidebar: React.FC = () => {
    return (
        <aside className="w-64 h-screen bg-[#070b19] border-r border-slate-800/60 flex flex-col pt-6 relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute top-0 left-0 w-full h-32 bg-cyan-900/10 blur-3xl pointer-events-none"></div>

            <div className="flex items-center px-6 mb-12 relative z-10">
                <div className="bg-gradient-to-br from-cyan-400 to-blue-600 p-1.5 rounded-lg mr-3 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                    <ShieldCheck className="text-[#070b19] w-6 h-6" />
                </div>
                <h1 className="text-xl font-extrabold tracking-wide text-white flex items-center">
                    FinCense<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 text-sm align-top pl-0.5 border-l border-slate-700 ml-1 pl-1">HQ</span>
                </h1>
            </div>

            <nav className="flex-1 px-4 space-y-2 relative z-10">
                <NavItem icon={<LayoutDashboard size={20} />} label="Overview" />
                <NavItem icon={<AlertCircle size={20} />} label="Alert Queue" active badge="12" />
                <NavItem icon={<Briefcase size={20} />} label="Case Manager" />
                <NavItem icon={<Activity size={20} />} label="Typology Studio" />
            </nav>

            <div className="p-4 mt-auto border-t border-slate-800/60 relative z-10 bg-[#0a1024]">
                <NavItem icon={<Settings size={20} />} label="Settings" />
                <div className="mt-4 flex items-center px-2 py-2 rounded-xl bg-slate-900/50 border border-slate-800">
                    <div className="w-8 h-8 rounded-full bg-[#070b19] flex items-center justify-center text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 ring-1 ring-cyan-500/30 relative">
                        AI
                        <div className="absolute top-0 right-0 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]"></div>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-slate-200">Anti-Fraud Copilot</p>
                        <p className="text-[10px] text-cyan-400 uppercase tracking-widest font-semibold flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-1.5 animate-pulse"></span>
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
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, badge }) => (
    <button
        className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-300 group ${active
            ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/5 text-cyan-400 border border-cyan-500/20 shadow-[inset_2px_0_0_0_#22d3ee]'
            : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
            }`}
    >
        <div className="flex items-center gap-3">
            <div className={`${active ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'} transition-colors`}>
                {icon}
            </div>
            <span className={`text-sm tracking-wide ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
        </div>
        {badge && (
            <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.15)]">
                {badge}
            </span>
        )}
    </button>
);

export default Sidebar;
