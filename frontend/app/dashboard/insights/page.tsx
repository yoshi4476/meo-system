'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '../../../contexts/DashboardContext';

type DailyMetric = {
    date: { year: number; month: number; day: number };
    value: string; // API returns string numbers
};

type MetricSeries = {
    dailyMetric: string;
    dailyMetricTimeSeries: DailyMetric[];
};

export default function InsightsPage() {
    const { userInfo, isDemoMode } = useDashboard();
    const [data, setData] = useState<{ period: string, metrics: MetricSeries[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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

    useEffect(() => {
        if (isDemoMode) {
             // Generate 28 days of dummy data
             const generateSeries = (min: number, max: number) => {
                 return Array.from({ length: 28 }, (_, i) => {
                     const d = new Date();
                     d.setDate(d.getDate() - (27 - i));
                     return {
                         date: { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() },
                         value: Math.floor(Math.random() * (max - min) + min).toString()
                     };
                 });
             };

             setData({
                 period: '過去28日間',
                 metrics: [
                     { dailyMetric: 'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH', dailyMetricTimeSeries: generateSeries(50, 200) },
                     { dailyMetric: 'BUSINESS_IMPRESSIONS_MOBILE_SEARCH', dailyMetricTimeSeries: generateSeries(100, 400) },
                     { dailyMetric: 'BUSINESS_IMPRESSIONS_DESKTOP_MAPS', dailyMetricTimeSeries: generateSeries(200, 500) },
                     { dailyMetric: 'BUSINESS_IMPRESSIONS_MOBILE_MAPS', dailyMetricTimeSeries: generateSeries(800, 1500) },
                     { dailyMetric: 'WEBSITE_CLICKS', dailyMetricTimeSeries: generateSeries(10, 50) },
                     { dailyMetric: 'DRIVING_DIRECTIONS_CLICKS', dailyMetricTimeSeries: generateSeries(5, 30) },
                     { dailyMetric: 'CALL_CLICKS', dailyMetricTimeSeries: generateSeries(1, 10) },
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

    // Helper to get total count for a metric
    const getTotal = (metricName: string) => {
        const series = data?.metrics.find(m => m.dailyMetric === metricName);
        if (!series) return 0;
        return series.dailyMetricTimeSeries.reduce((acc, curr) => acc + parseInt(curr.value || '0'), 0);
    };

    // Helper to render a simple sparkline/bar chart
    const SimpleBarChart = ({ metricName, color = "bg-aurora-cyan" }: { metricName: string, color?: string }) => {
         const series = data?.metrics.find(m => m.dailyMetric === metricName);
         if (!series || !series.dailyMetricTimeSeries) return <div className="text-xs text-slate-500">データなし</div>;

         const values = series.dailyMetricTimeSeries.map(d => parseInt(d.value));
         const max = Math.max(...values, 10); // avoid div by zero

         return (
             <div className="h-24 flex items-end gap-1 mt-4">
                 {values.map((v, i) => (
                     <div key={i} className="flex-1 flex flex-col justify-end group relative">
                         <div 
                            className={`w-full ${color} opacity-60 hover:opacity-100 transition-all rounded-t-sm`}
                            style={{ height: `${(v / max) * 100}%` }}
                         />
                         {/* Tooltip */}
                         <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded hidden group-hover:block whitespace-nowrap z-10">
                            {v}
                         </div>
                     </div>
                 ))}
             </div>
         );
    };

    if (isLoading) return <div className="p-8 text-slate-400">読み込み中...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">インサイト分析</h1>
                    <p className="text-slate-400 mt-1">
                        過去28日間のパフォーマンス ({data?.period})
                    </p>
                </div>
                <button onClick={fetchInsights} className="bg-slate-800 p-2 rounded hover:bg-slate-700">🔄</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {/* Summary Cards */}
                <div className="glass-card p-6">
                    <h3 className="text-slate-400 text-sm mb-1">総検索数</h3>
                    <div className="text-3xl font-bold text-white">
                        {getTotal('BUSINESS_IMPRESSIONS_DESKTOP_SEARCH') + getTotal('BUSINESS_IMPRESSIONS_MOBILE_SEARCH')}
                    </div>
                </div>
                 <div className="glass-card p-6">
                    <h3 className="text-slate-400 text-sm mb-1">マップ表示回数</h3>
                    <div className="text-3xl font-bold text-white">
                         {getTotal('BUSINESS_IMPRESSIONS_DESKTOP_MAPS') + getTotal('BUSINESS_IMPRESSIONS_MOBILE_MAPS')}
                    </div>
                </div>
                 <div className="glass-card p-6">
                    <h3 className="text-slate-400 text-sm mb-1">ウェブサイトへのアクセス</h3>
                    <div className="text-3xl font-bold text-white">
                        {getTotal('WEBSITE_CLICKS')}
                    </div>
                </div>
                 <div className="glass-card p-6">
                    <h3 className="text-slate-400 text-sm mb-1">ルート検索</h3>
                    <div className="text-3xl font-bold text-white">
                         {getTotal('DRIVING_DIRECTIONS_CLICKS')}
                    </div>
                </div>
            </div>

            {/* Detailed Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                    <h3 className="font-bold text-white mb-2">検索経由の表示 (モバイル)</h3>
                    <SimpleBarChart metricName="BUSINESS_IMPRESSIONS_MOBILE_SEARCH" color="bg-blue-400" />
                </div>
                 <div className="glass-card p-6">
                    <h3 className="font-bold text-white mb-2">マップ経由の表示 (モバイル)</h3>
                    <SimpleBarChart metricName="BUSINESS_IMPRESSIONS_MOBILE_MAPS" color="bg-green-400" />
                </div>
                 <div className="glass-card p-6">
                    <h3 className="font-bold text-white mb-2">電話発信数</h3>
                    <SimpleBarChart metricName="CALL_CLICKS" color="bg-purple-400" />
                </div>
                 <div className="glass-card p-6">
                    <h3 className="font-bold text-white mb-2">ウェブサイトクリック</h3>
                    <SimpleBarChart metricName="WEBSITE_CLICKS" color="bg-orange-400" />
                </div>
            </div>
        </div>
    );
}
