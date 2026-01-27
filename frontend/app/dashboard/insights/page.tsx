'use client';

import { useState } from 'react';

export default function InsightsPage() {
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">パフォーマンスインサイト</h1>
        <p className="text-slate-400 mt-1">AIによる店舗の可視性とエンゲージメント分析</p>
      </div>

      {/* メインチャートセクション */}
      <div className="glass-card p-8">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">表示数・アクション推移</h2>
            <div className="flex gap-2 text-sm">
                <button 
                  onClick={() => setPeriod('7')}
                  className={`px-3 py-1 rounded-full cursor-pointer transition-all ${period === '7' ? 'bg-aurora-purple text-white shadow-lg shadow-purple-500/30' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  7日間
                </button>
                <button 
                  onClick={() => setPeriod('30')}
                  className={`px-3 py-1 rounded-full cursor-pointer transition-all ${period === '30' ? 'bg-aurora-purple text-white shadow-lg shadow-purple-500/30' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  30日間
                </button>
                <button 
                  onClick={() => setPeriod('90')}
                  className={`px-3 py-1 rounded-full cursor-pointer transition-all ${period === '90' ? 'bg-aurora-purple text-white shadow-lg shadow-purple-500/30' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  90日間
                </button>
            </div>
        </div>
        
        {/* CSSチャートモック */}
        <div className="w-full h-64 flex items-end justify-between gap-2 mt-4 relative">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                <div className="w-full h-px bg-white"></div>
                <div className="w-full h-px bg-white"></div>
                <div className="w-full h-px bg-white"></div>
                <div className="w-full h-px bg-white"></div>
                <div className="w-full h-px bg-white"></div>
            </div>
            
            {[40, 65, 45, 80, 55, 90, 75, 60, 85, 95, 70, 88].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end gap-1 group relative">
                    <div 
                        style={{ height: `${h}%` }} 
                        className="w-full bg-linear-to-t from-aurora-purple/50 to-aurora-cyan rounded-t-sm group-hover:from-aurora-purple group-hover:to-cyan-300 transition-all duration-300"
                    ></div>
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-bold">
                        {h * 12} 表示
                    </div>
                </div>
            ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>1月1日</span>
            <span>1月15日</span>
            <span>1月30日</span>
        </div>
      </div>

      {/* AIアナリストレポート */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-linear-to-tr from-aurora-purple to-aurora-cyan flex items-center justify-center text-xl">🤖</div>
                AIアナリストレポート
            </h2>

            <div className="glass-card p-6 border-l-4 border-l-red-500">
                <h3 className="font-bold text-white mb-2 text-lg">⚠️ ルート検索の減少を検知</h3>
                <p className="text-slate-300 mb-4">
                    「ルート検索」リクエストが先月比で<strong>12%</strong>減少しています。これは多くの場合、外観写真が古くなっていることと相関があります。
                </p>
                <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5">
                    <p className="text-sm text-aurora-cyan font-bold mb-2">推奨アクション:</p>
                    <p className="text-sm text-slate-400">日中の店舗外観の高品質な写真を3枚追加してください。</p>
                </div>
            </div>

            <div className="glass-card p-6 border-l-4 border-l-green-500">
                <h3 className="font-bold text-white mb-2 text-lg">✅ エンゲージメント急上昇</h3>
                <p className="text-slate-300 mb-4">
                    「夏のメニュー」投稿が平均の<strong>3.5倍</strong>のパフォーマンスを記録しています。
                </p>
                <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5">
                    <p className="text-sm text-aurora-cyan font-bold mb-2">戦略的アドバイス:</p>
                    <p className="text-sm text-slate-400">この投稿をプロフィールのトップに固定して、今後7日間のコンバージョンを最大化しましょう。</p>
                </div>
            </div>

            <div className="glass-card p-6 border-l-4 border-l-blue-500">
                <h3 className="font-bold text-white mb-2 text-lg">📊 競合分析レポート</h3>
                <p className="text-slate-300 mb-4">
                    エリア内の競合5店舗と比較した結果、あなたの店舗は<strong>写真の数</strong>で劣っています（あなた: 12枚、競合平均: 28枚）。
                </p>
                <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5">
                    <p className="text-sm text-aurora-cyan font-bold mb-2">推奨アクション:</p>
                    <p className="text-sm text-slate-400">内装・料理・スタッフの写真を少なくとも15枚追加することで、競合と同等のレベルに達します。</p>
                </div>
            </div>
        </div>

        {/* 感情分析クラウド */}
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">感情分析クラウド</h2>
            <div className="glass-card p-6 flex flex-wrap gap-3 content-start min-h-[300px]">
                {[
                    { text: '美味しい', size: 'text-2xl', color: 'text-green-400' },
                    { text: '接客が良い', size: 'text-xl', color: 'text-green-300' },
                    { text: '待ち時間が長い', size: 'text-lg', color: 'text-red-400' },
                    { text: '清潔', size: 'text-base', color: 'text-blue-300' },
                    { text: '価格が高め', size: 'text-sm', color: 'text-slate-400' },
                    { text: '雰囲気が良い', size: 'text-lg', color: 'text-green-300' },
                    { text: '駐車場がない', size: 'text-xs', color: 'text-red-300' },
                    { text: 'ランチ最高', size: 'text-xl', color: 'text-aurora-cyan' },
                    { text: 'コスパ良い', size: 'text-lg', color: 'text-green-400' },
                    { text: 'リピート確定', size: 'text-base', color: 'text-aurora-purple' },
                ].map((tag, i) => (
                    <span key={i} className={`${tag.size} ${tag.color} font-bold opacity-80 hover:opacity-100 transition-opacity cursor-default`}>
                        {tag.text}
                    </span>
                ))}
            </div>
            
            <div className="glass-card p-4">
                <h3 className="text-sm font-bold text-white mb-3">競合比較</h3>
                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">あなたの店舗</span>
                        <span className="text-white font-bold">4.8 ★</span>
                    </div>
                    <div className="w-full bg-slate-700 h-1 rounded-full"><div className="w-[96%] h-full bg-aurora-cyan rounded-full"></div></div>
                    
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">エリア平均</span>
                        <span className="text-white font-bold">4.2 ★</span>
                    </div>
                    <div className="w-full bg-slate-700 h-1 rounded-full"><div className="w-[84%] h-full bg-slate-500 rounded-full"></div></div>

                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">トップ競合</span>
                        <span className="text-white font-bold">4.7 ★</span>
                    </div>
                    <div className="w-full bg-slate-700 h-1 rounded-full"><div className="w-[94%] h-full bg-yellow-500 rounded-full"></div></div>
                </div>
            </div>

            <div className="glass-card p-4">
                <h3 className="text-sm font-bold text-white mb-3">検索キーワードトップ5</h3>
                <div className="space-y-2 text-sm">
                    {[
                        { keyword: '渋谷 ランチ', count: 342 },
                        { keyword: '渋谷 カフェ', count: 256 },
                        { keyword: '渋谷 おしゃれ', count: 189 },
                        { keyword: '渋谷駅 近く', count: 145 },
                        { keyword: '渋谷 デート', count: 98 },
                    ].map((item, i) => (
                        <div key={i} className="flex justify-between">
                            <span className="text-slate-400">{item.keyword}</span>
                            <span className="text-white">{item.count}回</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
