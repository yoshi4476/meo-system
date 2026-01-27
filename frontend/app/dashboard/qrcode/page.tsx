'use client';
import { useState } from 'react';

export default function QRCodePage() {
  const [qrType, setQrType] = useState<'review' | 'maps' | 'website'>('review');


  const qrTypes = [
    { id: 'review', name: 'クチコミ投稿用', desc: 'お客様がクチコミを投稿しやすいリンク', icon: '⭐' },
    { id: 'maps', name: 'Googleマップ用', desc: '店舗のGoogleマップページへのリンク', icon: '📍' },
    { id: 'website', name: 'ウェブサイト用', desc: '店舗のウェブサイトへのリンク', icon: '🌐' },
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-white">QRコード生成</h1>
        <p className="text-slate-400 mt-1">Googleビジネスプロフィール用のQRコードを生成</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 設定エリア */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-white mb-4">QRコードの種類</h2>
            <div className="space-y-3">
              {qrTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => setQrType(type.id as typeof qrType)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    qrType === type.id 
                      ? 'bg-aurora-purple/20 border border-aurora-purple' 
                      : 'bg-slate-800/50 border border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{type.icon}</span>
                    <div>
                      <div className="font-bold text-white">{type.name}</div>
                      <div className="text-xs text-slate-400">{type.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-white mb-4">カスタマイズ</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">QRコードの色</label>
                <div className="flex gap-3">
                  {['#000000', '#0f172a', '#7c3aed', '#06b6d4'].map((color) => (
                    <div 
                      key={color}
                      className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white/20 hover:border-white/50 transition-colors"
                      style={{ backgroundColor: color }}
                    ></div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">サイズ</label>
                <select className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white">
                  <option>小 (200x200)</option>
                  <option>中 (400x400)</option>
                  <option>大 (600x600)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">ロゴを中央に配置</label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-7 rounded-full bg-aurora-cyan relative cursor-pointer">
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white"></div>
                  </div>
                  <span className="text-sm text-slate-300">店舗ロゴを表示</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* プレビューエリア */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-white mb-4">プレビュー</h2>
            <div className="bg-white p-8 rounded-lg flex items-center justify-center">
              <div className="w-48 h-48 bg-linear-to-br from-slate-200 to-slate-300 rounded-lg flex items-center justify-center">
                <div className="grid grid-cols-5 gap-1">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-6 h-6 ${i % 2 === 0 ? 'bg-slate-900' : 'bg-white'}`}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-slate-500 mt-4">
              {qrType === 'review' && 'クチコミ投稿ページへのQRコード'}
              {qrType === 'maps' && 'Googleマップページへのリンク'}
              {qrType === 'website' && 'ウェブサイトへのリンク'}
            </p>
          </div>

          <div className="flex gap-3">
            <button className="flex-1 py-3 rounded-lg bg-aurora-purple hover:bg-aurora-purple/80 text-white font-medium transition-colors">
              PNGでダウンロード
            </button>
            <button className="flex-1 py-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 font-medium transition-colors">
              SVGでダウンロード
            </button>
          </div>

          <div className="glass-card p-4">
            <h3 className="font-bold text-white mb-2 text-sm">活用アイデア</h3>
            <ul className="space-y-1 text-xs text-slate-400">
              <li>• レジ横にクチコミ投稿用QRコードを設置</li>
              <li>• 名刺やチラシにマップ用QRコードを印刷</li>
              <li>• テーブルに予約用QRコードを貼付</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
