'use client';
import { useState } from 'react';

const mockPhotos = [
  { id: 1, name: '外観写真1.jpg', category: 'exterior', date: '2026-01-15', quality: 92 },
  { id: 2, name: '内観写真1.jpg', category: 'interior', date: '2026-01-10', quality: 88 },
  { id: 3, name: 'ランチプレート.jpg', category: 'food', date: '2026-01-05', quality: 95 },
  { id: 4, name: 'スタッフ集合.jpg', category: 'team', date: '2025-12-20', quality: 78 },
  { id: 5, name: 'ディナーコース.jpg', category: 'food', date: '2025-12-15', quality: 91 },
  { id: 6, name: '店内カウンター.jpg', category: 'interior', date: '2025-12-10', quality: 85 },
  { id: 7, name: '外観夜景.jpg', category: 'exterior', date: '2025-12-05', quality: 72 },
  { id: 8, name: 'デザート盛り合わせ.jpg', category: 'food', date: '2025-11-28', quality: 89 },
];

const categories = [
  { id: 'all', name: 'すべて' },
  { id: 'exterior', name: '外観' },
  { id: 'interior', name: '内観' },
  { id: 'food', name: '料理' },
  { id: 'team', name: 'スタッフ' },
];

export default function PhotosPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([]);

  const filteredPhotos = selectedCategory === 'all' 
    ? mockPhotos 
    : mockPhotos.filter(p => p.category === selectedCategory);

  const toggleSelect = (id: number) => {
    setSelectedPhotos(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">写真管理</h1>
          <p className="text-slate-400 mt-1">Googleビジネスプロフィールの写真を管理・最適化</p>
        </div>
        <div className="flex gap-3">
          {selectedPhotos.length > 0 && (
            <button className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium">
              {selectedPhotos.length}枚を削除
            </button>
          )}
          <button className="px-4 py-2 rounded-lg bg-aurora-purple hover:bg-aurora-purple/80 transition-colors text-sm font-medium shadow-lg shadow-purple-500/20 flex items-center gap-2">
            <span>📷</span> 写真をアップロード
          </button>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="text-sm text-slate-400">総写真数</div>
          <div className="text-2xl font-bold text-white">{mockPhotos.length}枚</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-slate-400">平均品質スコア</div>
          <div className="text-2xl font-bold text-aurora-cyan">86点</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-slate-400">推奨: 追加が必要</div>
          <div className="text-2xl font-bold text-yellow-400">+12枚</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-slate-400">競合平均</div>
          <div className="text-2xl font-bold text-slate-300">28枚</div>
        </div>
      </div>

      {/* カテゴリフィルター */}
      <div className="flex gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === cat.id 
                ? 'bg-aurora-purple text-white' 
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* 写真グリッド */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredPhotos.map((photo) => (
          <div 
            key={photo.id}
            onClick={() => toggleSelect(photo.id)}
            className={`glass-card p-3 cursor-pointer transition-all hover:scale-105 ${
              selectedPhotos.includes(photo.id) ? 'ring-2 ring-aurora-cyan' : ''
            }`}
          >
            <div className="aspect-square bg-linear-to-br from-slate-700 to-slate-800 rounded-lg flex items-center justify-center text-4xl mb-3 relative">
              📷
              {selectedPhotos.includes(photo.id) && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-aurora-cyan rounded-full flex items-center justify-center text-white text-sm">✓</div>
              )}
            </div>
            <div className="text-sm text-white truncate">{photo.name}</div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-slate-500">{photo.date}</span>
              <span className={`text-xs font-bold ${getQualityColor(photo.quality)}`}>
                {photo.quality}点
              </span>
            </div>
          </div>
        ))}
        
        {/* アップロードボタン */}
        <div className="glass-card p-3 cursor-pointer hover:border-aurora-cyan border border-transparent transition-all flex flex-col items-center justify-center aspect-square">
          <div className="text-4xl mb-2 opacity-50">+</div>
          <div className="text-sm text-slate-500">追加</div>
        </div>
      </div>

      {/* AIアドバイス */}
      <div className="glass-card p-6 border-l-4 border-l-aurora-cyan">
        <h3 className="font-bold text-white mb-2 flex items-center gap-2">
          <span>💡</span> AI写真アドバイス
        </h3>
        <ul className="space-y-2 text-sm text-slate-400">
          <li>• 外観写真が2枚しかありません。日中と夜の写真を追加すると効果的です。</li>
          <li>• 「外観夜景.jpg」の品質スコアが低めです。明るさを調整した再アップロードを推奨します。</li>
          <li>• スタッフ写真を追加すると、親しみやすさが向上します。</li>
        </ul>
      </div>
    </div>
  );
}
