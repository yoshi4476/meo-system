'use client';

import { useState } from 'react';
import { useDashboard } from '@/contexts/DashboardContext';

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white">レポート出力</h1>
                <p className="text-slate-400 mt-1">この機能は現在利用できません。</p>
            </div>
            
            <div className="p-8 glass-card text-center text-slate-500">
                レポート出力機能は削除されました。
            </div>
        </div>
    );
}
