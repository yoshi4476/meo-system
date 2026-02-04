'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '../../../contexts/DashboardContext';

type DailyMetric = {
    date: { year: number; month: number; day: number };
    value: string;
};

type MetricSeries = {
    dailyMetric: string;
    dailyMetricTimeSeries: DailyMetric[];
};

type SummaryData = {
    total_impressions: number;
    map_views: number;
    search_views: number;
    website_clicks: number;
    phone_calls: number;
    direction_requests: number;
    total_actions: number;
};

type PredictionsData = {
    estimated_visits: number;
    visits_from_maps: number;
    visits_from_actions: number;
    action_rate_percent: number;
    map_conversion_rate: number;
    action_conversion_rate: number;
};

type InsightsData = {
    period: string;
    days_count?: number;
    summary?: SummaryData;
    predictions?: PredictionsData;
    metrics: MetricSeries[];
};

export default function InsightsPage() {
    const { userInfo, isDemoMode } = useDashboard();
    const [data, setData] = useState<InsightsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'table'>('overview');

    const fetchInsights = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('meo_auth_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/insights/${userInfo?.store_id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setData(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSyncAndDiagnose = async () => {
        if (!userInfo?.store_id) return;
        if (confirm("Googleからデータを同期します。よろしいですか？")) {
            setSyncing(true);
            setSyncResult(null);
            try {
                const token = localStorage.getItem('meo_auth_token');
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sync/${userInfo.store_id}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await res.json();
                setSyncResult(result);
                if (res.ok) {
                    fetchInsights();
                }
            } catch (e: any) {
                alert(`Error: ${e.message}`);
            } finally {
                setSyncing(false);
            }
        }
    };

    useEffect(() => {
        if (isDemoMode) {
            const generateSeries = (min: number, max: number) => {
                return Array.from({ length: 30 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (29 - i));
                    return {
                        date: { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() },
                        value: Math.floor(Math.random() * (max - min) + min).toString()
                    };
                });
            };
            setData({
                period: '過去30日間',
                days_count: 30,
                summary: {
                    total_impressions: 4523,
                    map_views: 2845,
                    search_views: 1678,
                    website_clicks: 234,
                    phone_calls: 45,
                    direction_requests: 89,
                    total_actions: 368
                },
                predictions: {
                    estimated_visits: 261,
                    visits_from_maps: 114,
                    visits_from_actions: 147,
                    action_rate_percent: 8.14,
                    map_conversion_rate: 4,
                    action_conversion_rate: 40
                },
                metrics: [
                    { dailyMetric: 'BUSINESS_IMPRESSIONS_MOBILE_SEARCH', dailyMetricTimeSeries: generateSeries(30, 80) },
                    { dailyMetric: 'BUSINESS_IMPRESSIONS_MOBILE_MAPS', dailyMetricTimeSeries: generateSeries(70, 150) },
                    { dailyMetric: 'WEBSITE_CLICKS', dailyMetricTimeSeries: generateSeries(5, 15) },
                    { dailyMetric: 'CALL_CLICKS', dailyMetricTimeSeries: generateSeries(0, 5) },
                    { dailyMetric: 'BUSINESS_DIRECTION_REQUESTS', dailyMetricTimeSeries: generateSeries(2, 8) },
                ]
            });
            setIsLoading(false);
            return;
        }
        if (userInfo?.store_id) {
            fetchInsights();
        } else {
            setIsLoading(false);
        }
    }, [userInfo, isDemoMode]);

    if (!userInfo?.store_id) return <div className="p-8 text-slate-400">店舗を選択してください</div>;
    if (isLoading) return <div className="p-8 text-slate-400">読み込み中...</div>;

    // Helper functions
    const getTotal = (metricName: string) =>
        data?.metrics.find(m => m.dailyMetric === metricName)?.dailyMetricTimeSeries.reduce((acc, curr) => acc + parseInt(curr.value || '0'), 0) || 0;

    const getSeries = (metricName: string) => data?.metrics.find(m => m.dailyMetric === metricName)?.dailyMetricTimeSeries || [];

    // Summary data (prefer API summary, fallback to calculated)
    const summary: SummaryData = data?.summary || {
        total_impressions: getTotal('BUSINESS_IMPRESSIONS_MOBILE_SEARCH') + getTotal('BUSINESS_IMPRESSIONS_MOBILE_MAPS'),
        map_views: getTotal('BUSINESS_IMPRESSIONS_MOBILE_MAPS'),
        search_views: getTotal('BUSINESS_IMPRESSIONS_MOBILE_SEARCH'),
        website_clicks: getTotal('WEBSITE_CLICKS'),
        phone_calls: getTotal('CALL_CLICKS'),
        direction_requests: getTotal('BUSINESS_DIRECTION_REQUESTS') || getTotal('DRIVING_DIRECTIONS_CLICKS'),
        total_actions: getTotal('WEBSITE_CLICKS') + getTotal('CALL_CLICKS') + (getTotal('BUSINESS_DIRECTION_REQUESTS') || getTotal('DRIVING_DIRECTIONS_CLICKS'))
    };

    // KPI Card Component
    const KPICard = ({ label, value, icon, color, subLabel }: { label: string; value: number; icon: string; color: string; subLabel?: string }) => (
        <div className="glass-card p-6 relative overflow-hidden">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-400 text-sm mb-1">{label}</p>
                    <p className="text-4xl font-bold text-white">{value.toLocaleString()}</p>
                    {subLabel && <p className="text-xs text-slate-500 mt-1">{subLabel}</p>}
                </div>
                <div className={`text-4xl ${color} opacity-30`}>{icon}</div>
            </div>
            <div className={`absolute bottom-0 left-0 right-0 h-1 ${color.replace('text-', 'bg-')}`}></div>
        </div>
    );

    // Line Chart Component
    const LineChart = ({ data, color, height = 80 }: { data: DailyMetric[]; color: string; height?: number }) => {
        if (!data || data.length === 0) return <div className="text-slate-500 text-sm py-4">データなし</div>;
        const values = data.map(d => parseInt(d.value || '0'));
        const max = Math.max(...values, 1);
        const min = Math.min(...values);
        const range = max - min || 1;

        return (
            <svg className="w-full" height={height} viewBox={`0 0 ${data.length * 10} ${height}`} preserveAspectRatio="none">
                {/* Grid lines */}
                <line x1="0" y1={height * 0.25} x2={data.length * 10} y2={height * 0.25} stroke="#334155" strokeWidth="0.5" />
                <line x1="0" y1={height * 0.5} x2={data.length * 10} y2={height * 0.5} stroke="#334155" strokeWidth="0.5" />
                <line x1="0" y1={height * 0.75} x2={data.length * 10} y2={height * 0.75} stroke="#334155" strokeWidth="0.5" />
                {/* Area */}
                <path
                    d={`M0,${height} ${values.map((v, i) => `L${i * 10},${height - ((v - min) / range) * (height - 10)}`).join(' ')} L${(values.length - 1) * 10},${height} Z`}
                    fill={`url(#gradient-${color})`}
                    opacity="0.3"
                />
                {/* Line */}
                <polyline
                    points={values.map((v, i) => `${i * 10},${height - ((v - min) / range) * (height - 10)}`).join(' ')}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {/* Gradient definition */}
                <defs>
                    <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.5" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
            </svg>
        );
    };

    // Bar Chart Component
    const BarChart = ({ data, color }: { data: DailyMetric[]; color: string }) => {
        if (!data || data.length === 0) return <div className="text-slate-500 text-sm py-4">データなし</div>;
        const values = data.map(d => parseInt(d.value || '0'));
        const max = Math.max(...values, 1);

        return (
            <div className="h-32 flex items-end gap-[2px]">
                {values.map((v, i) => (
                    <div key={i} className="flex-1 group relative">
                        <div
                            style={{ height: `${(v / max) * 100}%`, backgroundColor: color }}
                            className="w-full rounded-t opacity-70 hover:opacity-100 transition-opacity min-h-[2px]"
                        />
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded hidden group-hover:block z-10 whitespace-nowrap shadow-lg">
                            {data[i].date.month}/{data[i].date.day}: <span className="font-bold">{v}</span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // Metric Card with Chart
    const MetricCard = ({ title, metricName, color, chartType = 'bar' }: { title: string; metricName: string; color: string; chartType?: 'bar' | 'line' }) => {
        const series = getSeries(metricName);
        const total = series.reduce((acc, curr) => acc + parseInt(curr.value || '0'), 0);
        const avg = series.length > 0 ? Math.round(total / series.length) : 0;

        return (
            <div className="glass-card p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-bold text-white text-lg">{title}</h3>
                        <p className="text-3xl font-bold mt-2" style={{ color }}>{total.toLocaleString()}</p>
                        <p className="text-xs text-slate-400">日平均: {avg.toLocaleString()}</p>
                    </div>
                </div>
                {chartType === 'bar' ? <BarChart data={series} color={color} /> : <LineChart data={series} color={color} />}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">📊 インサイト分析</h1>
                    <p className="text-slate-400 mt-1">
                        {data?.period} ({data?.days_count || getSeries('BUSINESS_IMPRESSIONS_MOBILE_MAPS').length}日間のデータ)
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSyncAndDiagnose}
                        disabled={syncing}
                        className="bg-gradient-to-r from-aurora-purple to-aurora-cyan text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 disabled:opacity-50 font-bold shadow-lg"
                    >
                        {syncing ? <span className="animate-spin">⏳</span> : '⚡'}
                        {syncing ? '同期中...' : '同期＆診断'}
                    </button>
                </div>
            </div>

            {/* Sync Result */}
            {syncResult && (
                <div className={`p-4 rounded-lg text-sm font-mono overflow-auto max-h-60 ${
                    JSON.stringify(syncResult).includes("error") ? "bg-red-500/10 border border-red-500/30" : "bg-green-500/10 border border-green-500/30"
                }`}>
                    <div className="flex justify-between mb-2 font-bold">
                        <span>診断レポート</span>
                        <button onClick={() => setSyncResult(null)} className="hover:text-white">✕</button>
                    </div>
                    <pre className="text-xs">{JSON.stringify(syncResult, null, 2)}</pre>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-slate-700 pb-2">
                {[
                    { id: 'overview' as const, label: '📈 概要', desc: 'サマリー' },
                    { id: 'details' as const, label: '📊 詳細グラフ', desc: 'チャート' },
                    { id: 'table' as const, label: '📋 データテーブル', desc: '一覧' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-t-lg transition-colors ${activeTab === tab.id
                            ? 'bg-slate-700 text-white font-bold'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <KPICard label="総表示回数" value={summary.total_impressions} icon="👁️" color="text-cyan-400" />
                        <KPICard label="検索表示" value={summary.search_views} icon="🔍" color="text-blue-400" />
                        <KPICard label="マップ表示" value={summary.map_views} icon="🗺️" color="text-green-400" />
                        <KPICard label="ウェブクリック" value={summary.website_clicks} icon="🌐" color="text-orange-400" />
                        <KPICard label="電話発信" value={summary.phone_calls} icon="📞" color="text-purple-400" />
                        <KPICard label="ルート検索" value={summary.direction_requests} icon="🚗" color="text-pink-400" />
                    </div>

                    {/* Action Rate */}
                    <div className="glass-card p-6">
                        <h3 className="font-bold text-white mb-4">📊 アクション率分析</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <p className="text-slate-400 text-sm">表示→アクション変換率</p>
                                <p className="text-4xl font-bold text-aurora-cyan">
                                    {summary.total_impressions > 0 ? ((summary.total_actions / summary.total_impressions) * 100).toFixed(2) : 0}%
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-slate-400 text-sm">総アクション数</p>
                                <p className="text-4xl font-bold text-aurora-purple">{summary.total_actions.toLocaleString()}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-slate-400 text-sm">1日平均表示</p>
                                <p className="text-4xl font-bold text-white">
                                    {data?.days_count ? Math.round(summary.total_impressions / data.days_count).toLocaleString() : '-'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Visit Prediction Card */}
                    <div className="glass-card p-6 border-2 border-aurora-cyan/30 bg-gradient-to-br from-slate-800/50 to-cyan-900/20">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="text-4xl">🏪</div>
                            <div>
                                <h3 className="font-bold text-white text-xl">来店予測</h3>
                                <p className="text-slate-400 text-sm">業界平均ベンチマークに基づく推定値</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="text-center bg-slate-900/50 rounded-xl p-4">
                                <p className="text-slate-400 text-sm mb-1">推定来店数</p>
                                <p className="text-5xl font-bold text-aurora-cyan">
                                    {data?.predictions?.estimated_visits?.toLocaleString() || 
                                     Math.round(summary.map_views * 0.04 + summary.total_actions * 0.4).toLocaleString()}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">人/月</p>
                            </div>
                            <div className="text-center">
                                <p className="text-slate-400 text-sm mb-1">マップ経由</p>
                                <p className="text-3xl font-bold text-green-400">
                                    {data?.predictions?.visits_from_maps?.toLocaleString() || 
                                     Math.round(summary.map_views * 0.04).toLocaleString()}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">変換率 4%</p>
                            </div>
                            <div className="text-center">
                                <p className="text-slate-400 text-sm mb-1">アクション経由</p>
                                <p className="text-3xl font-bold text-purple-400">
                                    {data?.predictions?.visits_from_actions?.toLocaleString() || 
                                     Math.round(summary.total_actions * 0.4).toLocaleString()}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">変換率 40%</p>
                            </div>
                            <div className="text-center">
                                <p className="text-slate-400 text-sm mb-1">アクション率</p>
                                <p className="text-3xl font-bold text-orange-400">
                                    {data?.predictions?.action_rate_percent?.toFixed(2) || 
                                     (summary.total_impressions > 0 ? ((summary.total_actions / summary.total_impressions) * 100).toFixed(2) : 0)}%
                                </p>
                                <p className="text-xs text-slate-500 mt-1">表示→アクション</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-4 text-center">
                            ※ 来店予測は業界平均データ（マップ表示の約4%、アクションの約40%が来店につながる）に基づく推定値です
                        </p>
                    </div>

                    {/* Mini Charts Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass-card p-6">
                            <h3 className="font-bold text-white mb-2">検索表示トレンド</h3>
                            <LineChart data={getSeries('BUSINESS_IMPRESSIONS_MOBILE_SEARCH')} color="#60a5fa" height={100} />
                        </div>
                        <div className="glass-card p-6">
                            <h3 className="font-bold text-white mb-2">マップ表示トレンド</h3>
                            <LineChart data={getSeries('BUSINESS_IMPRESSIONS_MOBILE_MAPS')} color="#4ade80" height={100} />
                        </div>
                    </div>
                </>
            )}

            {/* Details Tab */}
            {activeTab === 'details' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <MetricCard title="🔍 検索経由の表示" metricName="BUSINESS_IMPRESSIONS_MOBILE_SEARCH" color="#60a5fa" chartType="bar" />
                    <MetricCard title="🗺️ マップ経由の表示" metricName="BUSINESS_IMPRESSIONS_MOBILE_MAPS" color="#4ade80" chartType="bar" />
                    <MetricCard title="🌐 ウェブサイトクリック" metricName="WEBSITE_CLICKS" color="#fb923c" chartType="bar" />
                    <MetricCard title="📞 電話発信数" metricName="CALL_CLICKS" color="#a855f7" chartType="bar" />
                    <MetricCard title="🚗 ルート検索" metricName="BUSINESS_DIRECTION_REQUESTS" color="#ec4899" chartType="bar" />
                    <MetricCard title="🚗 ルート検索 (旧)" metricName="DRIVING_DIRECTIONS_CLICKS" color="#ec4899" chartType="bar" />
                </div>
            )}

            {/* Table Tab */}
            {activeTab === 'table' && (
                <div className="glass-card p-6 overflow-x-auto">
                    <h3 className="font-bold text-white mb-4">📋 日次データテーブル</h3>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-700">
                                <th className="text-left py-3 px-2 text-slate-400">日付</th>
                                <th className="text-right py-3 px-2 text-slate-400">検索表示</th>
                                <th className="text-right py-3 px-2 text-slate-400">マップ表示</th>
                                <th className="text-right py-3 px-2 text-slate-400">ウェブクリック</th>
                                <th className="text-right py-3 px-2 text-slate-400">電話</th>
                                <th className="text-right py-3 px-2 text-slate-400">ルート</th>
                            </tr>
                        </thead>
                        <tbody>
                            {getSeries('BUSINESS_IMPRESSIONS_MOBILE_MAPS').map((day, i) => {
                                const search = getSeries('BUSINESS_IMPRESSIONS_MOBILE_SEARCH')[i];
                                const website = getSeries('WEBSITE_CLICKS')[i];
                                const phone = getSeries('CALL_CLICKS')[i];
                                const direction = getSeries('BUSINESS_DIRECTION_REQUESTS')[i] || getSeries('DRIVING_DIRECTIONS_CLICKS')[i];
                                return (
                                    <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50">
                                        <td className="py-2 px-2 text-white">{day.date.year}/{day.date.month}/{day.date.day}</td>
                                        <td className="py-2 px-2 text-right text-blue-400">{search?.value || 0}</td>
                                        <td className="py-2 px-2 text-right text-green-400">{day.value || 0}</td>
                                        <td className="py-2 px-2 text-right text-orange-400">{website?.value || 0}</td>
                                        <td className="py-2 px-2 text-right text-purple-400">{phone?.value || 0}</td>
                                        <td className="py-2 px-2 text-right text-pink-400">{direction?.value || 0}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-slate-600 font-bold">
                                <td className="py-3 px-2 text-white">合計</td>
                                <td className="py-3 px-2 text-right text-blue-400">{summary.search_views.toLocaleString()}</td>
                                <td className="py-3 px-2 text-right text-green-400">{summary.map_views.toLocaleString()}</td>
                                <td className="py-3 px-2 text-right text-orange-400">{summary.website_clicks.toLocaleString()}</td>
                                <td className="py-3 px-2 text-right text-purple-400">{summary.phone_calls.toLocaleString()}</td>
                                <td className="py-3 px-2 text-right text-pink-400">{summary.direction_requests.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
}
