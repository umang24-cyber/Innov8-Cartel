import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Shield, Gauge, Save } from 'lucide-react';
import { toast } from '../utils/toast';
import { api } from '../services/api';

const STORAGE_KEY = 'nafu_app_settings';

export interface AppSettings {
    opdToIpdDetection: boolean;
    walletDepletionTracker: boolean;
    hbpUpcodingAnalysis: boolean;
    criticalRiskThreshold: number;
    highRiskThreshold: number;
}

const DEFAULT_SETTINGS: AppSettings = {
    opdToIpdDetection: true,
    walletDepletionTracker: true,
    hbpUpcodingAnalysis: true,
    criticalRiskThreshold: 65,
    highRiskThreshold: 40,
};

function loadFromStorage(): AppSettings {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...DEFAULT_SETTINGS };
        const parsed = JSON.parse(raw) as Partial<AppSettings>;
        return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
}

export const Settings: React.FC = () => {
    const [settings, setSettings] = useState<AppSettings>(() => loadFromStorage());

    useEffect(() => {
        const local = loadFromStorage();
        api.getSettings().then((server) => {
            if (server && typeof server === 'object') {
                setSettings({
                    ...local,
                    opdToIpdDetection: server.opdToIpdDetection ?? local.opdToIpdDetection,
                    walletDepletionTracker: server.walletDepletionTracker ?? local.walletDepletionTracker,
                    hbpUpcodingAnalysis: server.hbpUpcodingAnalysis ?? local.hbpUpcodingAnalysis,
                    criticalRiskThreshold: Number(server.criticalRiskThreshold) || local.criticalRiskThreshold,
                    highRiskThreshold: Number(server.highRiskThreshold) || local.highRiskThreshold,
                });
            } else {
                setSettings(local);
            }
        }).catch(() => setSettings(local));
    }, []);

    const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
            await api.saveSettings({
                opdToIpdDetection: settings.opdToIpdDetection,
                walletDepletionTracker: settings.walletDepletionTracker,
                hbpUpcodingAnalysis: settings.hbpUpcodingAnalysis,
                criticalRiskThreshold: settings.criticalRiskThreshold,
                highRiskThreshold: settings.highRiskThreshold,
            });
            toast.success('Configuration saved successfully.');
        } catch (e) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
            toast.success('Configuration saved locally.');
        }
    };

    return (
        <div className="h-full overflow-y-auto pb-8">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-3 pb-6 border-b-2 border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-8 rounded-sm bg-[#FF9933]" />
                        <div className="w-3 h-8 rounded-sm bg-white dark:bg-slate-200 border border-slate-300" />
                        <div className="w-3 h-8 rounded-sm bg-[#138808]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                            <SettingsIcon size={24} className="text-[#138808]" />
                            System Settings
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            NAFU Admin — Fraud rules & risk thresholds
                        </p>
                    </div>
                </div>

                {/* Section 1: NAFU Fraud Rule Engine */}
                <section className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-[#FF9933]/10 via-white to-[#138808]/10 dark:from-[#FF9933]/20 dark:via-slate-800 dark:to-[#138808]/20 border-b border-slate-200 dark:border-slate-700">
                        <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Shield size={20} className="text-[#138808]" />
                            NAFU Fraud Rule Engine
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Enable or disable detection rules for pre-authorization audits.</p>
                    </div>
                    <div className="p-6 space-y-4">
                        <ToggleRow
                            label="OPD-to-IPD Conversion Detection"
                            description="Flags claims where minor/OPD conditions are billed as IPD admissions."
                            checked={settings.opdToIpdDetection}
                            onChange={(v) => update('opdToIpdDetection', v)}
                        />
                        <ToggleRow
                            label="Family Wallet Depletion Tracker"
                            description="Alerts when claim amount approaches or exceeds ₹5 Lakh family floater limit."
                            checked={settings.walletDepletionTracker}
                            onChange={(v) => update('walletDepletionTracker', v)}
                        />
                        <ToggleRow
                            label="HBP Upcoding Analysis"
                            description="Detects billing of higher-tier HBP codes for lower-complexity procedures."
                            checked={settings.hbpUpcodingAnalysis}
                            onChange={(v) => update('hbpUpcodingAnalysis', v)}
                        />
                    </div>
                </section>

                {/* Section 2: Risk Alert Thresholds */}
                <section className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-[#FF9933]/10 via-white to-[#138808]/10 dark:from-[#FF9933]/20 dark:via-slate-800 dark:to-[#138808]/20 border-b border-slate-200 dark:border-slate-700">
                        <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Gauge size={20} className="text-[#138808]" />
                            Risk Alert Thresholds
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Scores at or above these values trigger Critical and High risk labels.</p>
                    </div>
                    <div className="p-6 space-y-6">
                        <SliderRow
                            label="Critical Risk Threshold"
                            value={settings.criticalRiskThreshold}
                            onChange={(v) => update('criticalRiskThreshold', v)}
                            min={0}
                            max={100}
                        />
                        <SliderRow
                            label="High Risk Threshold"
                            value={settings.highRiskThreshold}
                            onChange={(v) => update('highRiskThreshold', v)}
                            min={0}
                            max={100}
                        />
                    </div>
                </section>

                {/* Save button */}
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={handleSave}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 transition-all"
                    >
                        <Save size={20} />
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
};

function ToggleRow({
    label,
    description,
    checked,
    onChange,
}: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between gap-4 py-2">
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[#138808]/50 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                    checked ? 'bg-[#138808]' : 'bg-slate-200 dark:bg-slate-600'
                }`}
            >
                <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition-transform ${
                        checked ? 'translate-x-5' : 'translate-x-1'
                    }`}
                />
            </button>
        </div>
    );
}

function SliderRow({
    label,
    value,
    onChange,
    min,
    max,
}: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    min: number;
    max: number;
}) {
    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</label>
                <span className="text-sm font-bold text-[#138808] dark:text-emerald-400 tabular-nums">{value}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none bg-slate-200 dark:bg-slate-600 accent-[#138808]"
            />
        </div>
    );
}
