import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart, CartesianGrid } from 'recharts';
import { Info } from 'lucide-react';

/**
 * GaussianBellCurve — Mathematically accurate Gaussian (Normal) distribution
 * 
 * The probability density function (PDF) of a normal distribution is:
 *   f(x) = (1 / (σ√(2π))) × e^(-(x-μ)² / (2σ²))
 * 
 * where μ = mean, σ = standard deviation
 * 
 * This component:
 * - Renders the exact bell curve for a configurable μ and σ
 * - Highlights the fraud threshold zones (e.g., beyond 2σ or 3σ)
 * - Shows claim amount overlaid to visualize where it falls on the distribution
 */

interface GaussianBellCurveProps {
    mean?: number;
    stdDev?: number;
    claimAmount?: number;
    diagnosisCode?: string;
}

// Exact Gaussian PDF function
function gaussianPDF(x: number, mean: number, stdDev: number): number {
    const coefficient = 1 / (stdDev * Math.sqrt(2 * Math.PI));
    const exponent = -((x - mean) ** 2) / (2 * stdDev ** 2);
    return coefficient * Math.exp(exponent);
}

// Pre-configured diagnosis distributions matching backend DIAG_STATS
const DIAGNOSIS_PRESETS: Record<string, { mean: number; std: number; label: string }> = {
    'J06.9': { mean: 150, std: 40, label: 'Acute Upper Respiratory Infection' },
    'M54.5': { mean: 320, std: 80, label: 'Lower Back Pain' },
    'E11.9': { mean: 600, std: 150, label: 'Type 2 Diabetes' },
    'I10': { mean: 500, std: 120, label: 'Essential Hypertension' },
    'K21.0': { mean: 280, std: 70, label: 'GERD' },
    'Z00.00': { mean: 200, std: 50, label: 'General Adult Exam' },
    'S72.001': { mean: 8500, std: 900, label: 'Femoral Fracture' },
    'C34.10': { mean: 12000, std: 2000, label: 'Malignant Lung Neoplasm' },
    'F32.1': { mean: 400, std: 100, label: 'Major Depressive Disorder' },
    'N39.0': { mean: 180, std: 45, label: 'Urinary Tract Infection' },
};

const GaussianBellCurve: React.FC<GaussianBellCurveProps> = ({
    mean: propMean,
    stdDev: propStdDev,
    claimAmount: propClaimAmount,
    diagnosisCode: propDiagCode,
}) => {
    const [selectedDiag, setSelectedDiag] = useState(propDiagCode || 'J06.9');
    const [inputAmount, setInputAmount] = useState<string>(propClaimAmount?.toString() || '9500');
    const [sigma, setSigma] = useState(2); // Fraud threshold in σ

    const preset = DIAGNOSIS_PRESETS[selectedDiag] || DIAGNOSIS_PRESETS['J06.9'];
    const mean = propMean || preset.mean;
    const stdDev = propStdDev || preset.std;
    const claimAmount = parseFloat(inputAmount) || 0;

    // Compute z-score for the entered claim amount
    const zScore = (claimAmount - mean) / stdDev;

    // Generate data points for the bell curve (from μ - 4σ to μ + 4σ)
    const data = useMemo(() => {
        const points = [];
        const start = mean - 4 * stdDev;
        const end = mean + 4 * stdDev;
        const step = (end - start) / 200; // 200 data points for a smooth curve

        for (let x = start; x <= end; x += step) {
            const y = gaussianPDF(x, mean, stdDev);
            const isFraudZone = Math.abs(x - mean) > sigma * stdDev;
            points.push({
                x: Math.round(x * 100) / 100,
                y: y,
                yFraud: isFraudZone ? y : undefined,
                yNormal: !isFraudZone ? y : undefined,
            });
        }
        return points;
    }, [mean, stdDev, sigma]);

    // Determine zone
    const absZ = Math.abs(zScore);
    const getZoneInfo = () => {
        if (absZ <= 1) return { label: 'Normal Range (≤1σ)', color: 'text-teal-700 dark:text-teal-300', bg: 'bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800', pct: '68.27%' };
        if (absZ <= 2) return { label: 'Elevated (1-2σ)', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800', pct: '95.45%' };
        if (absZ <= 3) return { label: 'High Anomaly (2-3σ)', color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800', pct: '99.73%' };
        return { label: 'Extreme Outlier (>3σ)', color: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800', pct: '>99.73%' };
    };
    const zone = getZoneInfo();

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-slate-800 backdrop-blur-md border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-xl text-xs">
                    <p className="font-bold text-slate-700 dark:text-slate-200">Amount: ${payload[0].payload.x.toLocaleString()}</p>
                    <p className="text-slate-500 dark:text-slate-400">Probability density: {payload[0].payload.y.toExponential(4)}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6 overflow-hidden">
            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Diagnosis Code</label>
                    <select
                        value={selectedDiag}
                        onChange={(e) => setSelectedDiag(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                    >
                        {Object.entries(DIAGNOSIS_PRESETS).map(([code, info]) => (
                            <option key={code} value={code}>{code} — {info.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Claim Amount ($)</label>
                    <input
                        type="number"
                        value={inputAmount}
                        onChange={(e) => setInputAmount(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                        placeholder="Enter claim amount"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Fraud Threshold ({sigma}σ)</label>
                    <input
                        type="range"
                        min="1"
                        max="4"
                        step="0.5"
                        value={sigma}
                        onChange={(e) => setSigma(parseFloat(e.target.value))}
                        className="w-full mt-2 accent-teal-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1">
                        <span>1σ (68%)</span>
                        <span>2σ (95%)</span>
                        <span>3σ (99.7%)</span>
                        <span>4σ</span>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-all">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold mb-1">Expected Mean (μ)</p>
                    <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100">${mean.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-all">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold mb-1">Std Deviation (σ)</p>
                    <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100">${stdDev.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-all">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold mb-1">Z-Score</p>
                    <p className={`text-xl font-extrabold ${absZ > sigma ? 'text-rose-600 dark:text-rose-400' : 'text-teal-600 dark:text-teal-400'}`}>
                        {zScore > 0 ? '+' : ''}{zScore.toFixed(2)}σ
                    </p>
                </div>
                <div className={`border rounded-xl p-4 text-center shadow-sm ${zone.bg}`}>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold mb-1">Classification</p>
                    <p className={`text-sm font-extrabold ${zone.color}`}>{zone.label}</p>
                </div>
            </div>

            {/* Bell Curve Chart */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                    <h3 className="text-sm font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-widest truncate">
                        Normal Distribution — {selectedDiag}
                    </h3>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 flex-shrink-0 flex-wrap">
                        <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-teal-500"></span> Normal</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-rose-500"></span> Fraud (&gt;{sigma}σ)</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-orange-500"></span> Claim</span>
                    </div>
                </div>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                            <XAxis
                                dataKey="x"
                                type="number"
                                domain={['dataMin', 'dataMax']}
                                tickFormatter={(v) => `$${Math.round(v).toLocaleString()}`}
                                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                                axisLine={{ stroke: '#cbd5e1' }}
                            />
                            <YAxis hide />
                            <Tooltip content={<CustomTooltip />} />

                            {/* Normal zone (green/teal fill) */}
                            <Area
                                type="monotone"
                                dataKey="yNormal"
                                stroke="none"
                                fill="#14b8a6"
                                fillOpacity={0.3}
                                animationDuration={1200}
                                connectNulls={false}
                            />
                            {/* Fraud zone (red fill) */}
                            <Area
                                type="monotone"
                                dataKey="yFraud"
                                stroke="none"
                                fill="#f43f5e"
                                fillOpacity={0.3}
                                animationDuration={1200}
                                connectNulls={false}
                            />
                            {/* Main bell curve outline */}
                            <Line
                                type="monotone"
                                dataKey="y"
                                stroke="#0d9488"
                                strokeWidth={2.5}
                                dot={false}
                                animationDuration={1500}
                            />

                            {/* Mean line */}
                            <ReferenceLine
                                x={mean}
                                stroke="#64748b"
                                strokeDasharray="4 4"
                                strokeWidth={1.5}
                                label={{ value: `μ = $${mean.toLocaleString()}`, position: 'top', fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                            />

                            {/* Fraud threshold boundaries */}
                            <ReferenceLine x={mean - sigma * stdDev} stroke="#f43f5e" strokeDasharray="6 3" strokeWidth={1} />
                            <ReferenceLine x={mean + sigma * stdDev} stroke="#f43f5e" strokeDasharray="6 3" strokeWidth={1} />

                            {/* Claim amount marker */}
                            {claimAmount > 0 && (
                                <ReferenceLine
                                    x={claimAmount}
                                    stroke="#f97316"
                                    strokeWidth={2.5}
                                    label={{ value: `$${claimAmount.toLocaleString()}`, position: 'top', fill: '#f97316', fontSize: 11, fontWeight: 800 }}
                                />
                            )}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Mathematical Explanation */}
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-5 text-sm overflow-hidden">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-teal-600 dark:text-teal-400 mt-0.5 flex-shrink-0" />
                    <div className="text-slate-600 dark:text-slate-400 leading-relaxed space-y-2 min-w-0 break-words">
                        <p className="font-bold text-slate-700 dark:text-slate-200">How Gaussian Distribution Detects Fraud</p>
                        <p>
                            For diagnosis <strong className="text-slate-800 dark:text-slate-100">{selectedDiag}</strong>, historical claims follow
                            a normal distribution with <strong>μ = ${mean.toLocaleString()}</strong> and <strong>σ = ${stdDev.toLocaleString()}</strong>.
                        </p>
                        <p>
                            A claim of <strong className="text-orange-600 dark:text-orange-400">${claimAmount.toLocaleString()}</strong> has a z-score
                            of <strong className={absZ > sigma ? 'text-rose-600 dark:text-rose-400' : 'text-teal-600 dark:text-teal-400'}>{zScore.toFixed(2)}σ</strong>,
                            meaning it is {absZ.toFixed(1)} standard deviations {zScore > 0 ? 'above' : 'below'} the mean.
                        </p>
                        <p>
                            Under the <strong>{sigma}σ rule</strong>, claims beyond ±{sigma}σ (i.e., outside
                            ${(mean - sigma * stdDev).toLocaleString()} – ${(mean + sigma * stdDev).toLocaleString()})
                            are flagged for investigation. This threshold captures {zone.pct} of normal claims within the accepted range.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GaussianBellCurve;
