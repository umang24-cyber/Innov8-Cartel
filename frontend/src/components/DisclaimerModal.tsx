import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle } from 'lucide-react';

const DisclaimerModal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [hasAgreed, setHasAgreed] = useState(false);

    useEffect(() => {
        // Show disclaimer on every fresh page load
        const dismissed = sessionStorage.getItem('vericlaim_disclaimer_accepted');
        if (!dismissed) {
            setIsOpen(true);
        }
    }, []);

    const handleAccept = () => {
        sessionStorage.setItem('vericlaim_disclaimer_accepted', 'true');
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden border border-slate-200 dark:border-slate-700 transform animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-8 translate-x-8"></div>
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                            <ShieldAlert size={28} />
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold tracking-wide">Important Legal Notice</h2>
                            <p className="text-sm text-amber-100 font-semibold mt-0.5">Please read before proceeding</p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                        <h3 className="text-sm font-extrabold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-2">
                            ⚠️ Advisory-Only System
                        </h3>
                        <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                            VeriClaim is an <strong>advisory tool only</strong>. All risk assessments, anomaly
                            detections, and AI-generated insights produced by this system are
                            <strong> recommendations</strong> — not final verdicts.
                        </p>
                    </div>

                    <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        <p className="font-medium">
                            <strong className="text-slate-900 dark:text-slate-100">No claim is automatically approved or rejected</strong> by this system.
                            Every flagged claim must be reviewed and adjudicated by a qualified
                            human investigator before any administrative action is taken.
                        </p>
                        <p className="font-medium">
                            The machine learning models, SHAP explanations, and large language model
                            analyses are designed to <strong>assist</strong> human decision-making — they do
                            not replace professional medical billing auditors or fraud investigators.
                        </p>
                        <p className="font-medium">
                            By proceeding, you acknowledge that all outputs from VeriClaim are
                            illustrative and must be independently verified before use in any
                            official investigation, legal proceeding, or claims adjudication process.
                        </p>
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 hover:border-teal-300 dark:hover:border-teal-600 transition-colors">
                        <input
                            type="checkbox"
                            checked={hasAgreed}
                            onChange={(e) => setHasAgreed(e.target.checked)}
                            className="mt-0.5 w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            I understand that VeriClaim is an advisory tool requiring human oversight
                            and decision-making for all claim determinations.
                        </span>
                    </label>
                </div>

                {/* Footer */}
                <div className="p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                    <button
                        onClick={handleAccept}
                        disabled={!hasAgreed}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all transform ${hasAgreed
                            ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-500/20 hover:shadow-lg hover:-translate-y-0.5'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                            }`}
                    >
                        <CheckCircle size={16} />
                        I Understand, Proceed
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DisclaimerModal;
