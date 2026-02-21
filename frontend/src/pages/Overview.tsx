import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Target, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import type { DashboardStats, FraudTrend, RiskDistribution } from '../types';
import { api } from '../services/api';
import { Skeleton } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';
import { formatCurrency } from '../utils/format';

const COLORS = {
  Low: '#14b8a6',
  Medium: '#f59e0b',
  High: '#f97316',
  Critical: '#ef4444',
};

export const Overview: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<FraudTrend[]>([]);
  const [riskDist, setRiskDist] = useState<RiskDistribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, trendsData, riskData] = await Promise.all([
        api.getStats(),
        api.getFraudTrends(),
        api.getRiskDistribution(),
      ]);
      setStats(statsData);
      setTrends(trendsData || []);
      setRiskDist(riskData || []);
    } catch (error) {
      console.error('Failed to load dashboard data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const kpiCards = [
    {
      label: 'Total Claims Processed',
      value: stats?.totalClaims?.toLocaleString() || '0',
      trend: stats?.totalClaimsTrend || 0,
      icon: <Activity className="text-teal-600 dark:text-teal-400" size={24} />,
      isGood: true,
    },
    {
      label: 'High-Risk Alerts',
      value: stats?.highRiskAlerts?.toLocaleString() || '0',
      trend: stats?.highRiskTrend || 0,
      icon: <ShieldAlert className="text-rose-500 dark:text-rose-400" size={24} />,
      isGood: false,
    },
    {
      label: 'False Positive Rate',
      value: `${stats?.falsePositiveRate?.toFixed(1) || 0}%`,
      trend: stats?.falsePositiveTrend || 0,
      icon: <Target className="text-cyan-600 dark:text-cyan-400" size={24} />,
      isGood: stats ? stats.falsePositiveTrend < 0 : true,
    },
    {
      label: 'Monthly Fraud Growth',
      value: `${stats?.monthlyFraudGrowth?.toFixed(1) || 0}%`,
      trend: stats?.monthlyFraudGrowth || 0,
      icon: <Users className="text-indigo-500 dark:text-indigo-400" size={24} />,
      isGood: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => (
          <div
            key={index}
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:shadow-teal-900/5 transition-all duration-300 transform hover:-translate-y-1"
          >
            {isLoading ? (
              <Skeleton height={60} />
            ) : (
              <>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      {kpi.label}
                    </p>
                    <h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                      {kpi.value}
                    </h3>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700">
                    {kpi.icon}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {kpi.trend >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-rose-600" />
                  )}
                  <span
                    className={`text-xs font-bold ${
                      (kpi.isGood && kpi.trend >= 0) || (!kpi.isGood && kpi.trend < 0)
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {Math.abs(kpi.trend).toFixed(1)}%
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">vs last period</span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fraud Trend Chart */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
            Fraud Trend (30 Days)
          </h3>
          {isLoading ? (
            <Skeleton height={300} />
          ) : trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="fraudCount"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Fraud Cases"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="totalClaims"
                  stroke="#14b8a6"
                  strokeWidth={2}
                  name="Total Claims"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-500">
              No data available
            </div>
          )}
        </div>

        {/* Risk Distribution Chart */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
            Risk Distribution
          </h3>
          {isLoading ? (
            <Skeleton height={300} />
          ) : riskDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskDist}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ level, percentage }) => `${level}: ${percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {riskDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.level]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-500">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Top Risky Providers */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
          Top Risky Providers
        </h3>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} height={60} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {[
              { provider: 'PRV-0007', riskScore: 87, claims: 142, amount: 1250000 },
              { provider: 'PRV-0013', riskScore: 72, claims: 98, amount: 890000 },
              { provider: 'PRV-0001', riskScore: 65, claims: 203, amount: 2100000 },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {item.provider}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {item.claims} claims • {formatCurrency(item.amount)}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={item.riskScore >= 70 ? 'danger' : item.riskScore >= 50 ? 'warning' : 'info'}
                >
                  Risk: {item.riskScore}/100
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

