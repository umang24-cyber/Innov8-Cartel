import React from 'react';
import { LayoutDashboard, AlertCircle, Briefcase, Activity, Settings, Zap } from 'lucide-react';

const Sidebar: React.FC = () => {
    return (
        <aside className="w-64 h-screen bg-slate-950 border-r border-slate-800 flex flex-col pt-6">
            <div className="flex items-center px-6 mb-12">
                <Zap className="text-emerald-400 w-8 h-8 mr-3" />
                <h1 className="text-xl font-bold tracking-wider text-white">
                    FinCense<span className="text-emerald-400 text-sm align-top pl-1">HQ</span>
                </h1>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                <NavItem icon={<LayoutDashboard size={20} />} label="Overview" />
                <NavItem icon={<AlertCircle size={20} />} label="Alert Queue" active badge="12" />
                <NavItem icon={<Briefcase size={20} />} label="Case Manager" />
                <NavItem icon={<Activity size={20} />} label="Typology Studio" />
            </nav>

            <div className="p-4 mt-auto border-t border-slate-800">
                <NavItem icon={<Settings size={20} />} label="Settings" />
                <div className="mt-4 flex items-center px-2">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm font-medium text-white ring-2 ring-emerald-500/50">
                        AI
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-white">Agentic AI</p>
                        <p className="text-xs text-slate-400">Online</p>
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
        className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all duration-200 ${active
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
    >
        <div className="flex items-center gap-3">
            {icon}
            <span className="font-medium text-sm">{label}</span>
        </div>
        {badge && (
            <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.4)]">
                {badge}
            </span>
        )}
    </button>
);

export default Sidebar;
