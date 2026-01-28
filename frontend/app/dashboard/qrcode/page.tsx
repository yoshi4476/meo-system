'use client';

import { useState } from 'react';
import { useDashboard } from '@/contexts/DashboardContext';

export default function QRCodePage() {
  const { userInfo, isDemoMode } = useDashboard();
  const [size, setSize] = useState(200);
  const [format, setFormat] = useState('png');
  // Demo text
  const qrUrl = "https://g.page/r/example/review";

  const handleDownload = () => {
      // In a real app we would generate the QR on canvas or fetch from API
      // Here just alert for demo
      alert(`デモモード: ${format.toUpperCase()}形式 (${size}px) でQRコードをダウンロードしました`);
  };

  return (
    <div className="space-y-6">
      <div>
         <h1 className="text-3xl font-bold text-white">QRコード生成</h1>
         <p className="text-slate-400 mt-1">クチコミ促進やメニュー誘導用のQRコードを作成します</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-card p-6 flex flex-col items-center justify-center bg-white/5">
              <div className="bg-white p-4 rounded-lg shadow-lg">
                  {/* Pseudo QR Code for visual */}
                  <div 
                      className="bg-slate-900 grid grid-cols-5 grid-rows-5 gap-1"
                      style={{ width: 200, height: 200, padding: 10, backgroundColor: 'white' }}
                  >
                        {/* Just some random blocks to look like QR */}
                       <div className="col-span-2 row-span-2 bg-black"></div>
                       <div className="col-start-4 col-span-2 row-span-2 bg-black"></div>
                       <div className="col-start-1 col-span-2 row-start-4 row-span-2 bg-black"></div>
                       <div className="col-start-3 row-start-3 bg-black"></div>
                       <div className="col-start-4 row-start-3 bg-black"></div>
                       <div className="col-start-3 row-start-4 bg-black"></div>
                  </div>
              </div>
              <p className="mt-4 text-slate-300 font-mono text-sm">{qrUrl}</p>
          </div>

          <div className="glass-card p-6 space-y-6">
              <h3 className="text-xl font-bold text-white">設定</h3>
              
              <div className="space-y-2">
                  <label className="text-slate-400 text-sm">リンク先タイプ</label>
                  <select className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-white">
                      <option>クチコミ投稿画面</option>
                      <option>Googleマップ店舗トップ</option>
                      <option>ウェブサイト</option>
                      <option>カスタムURL</option>
                  </select>
              </div>

              <div className="space-y-2">
                  <label className="text-slate-400 text-sm">サイズ</label>
                  <input 
                    type="range" 
                    min="100" max="500" 
                    value={size} 
                    onChange={(e) => setSize(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-right text-xs text-slate-400">{size}px</div>
              </div>

              <div className="space-y-2">
                  <label className="text-slate-400 text-sm">形式</label>
                  <div className="flex gap-4">
                      {['png', 'jpg', 'svg'].map(f => (
                          <label key={f} className="flex items-center gap-2 text-white cursor-pointer">
                              <input 
                                type="radio" 
                                name="format" 
                                checked={format === f}
                                onChange={() => setFormat(f)}
                                className="accent-aurora-cyan"
                              />
                              {f.toUpperCase()}
                          </label>
                      ))}
                  </div>
              </div>

              <button 
                onClick={handleDownload}
                className="w-full bg-aurora-purple text-white font-bold py-3 rounded-lg hover:bg-aurora-purple/80 transition-colors"
              >
                  ダウンロード
              </button>
          </div>
      </div>
    </div>
  );
}
