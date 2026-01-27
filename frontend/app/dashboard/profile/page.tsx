'use client';
import { useState } from 'react';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [showSpecialHoursModal, setShowSpecialHoursModal] = useState(false);
  const [specialHoursDate, setSpecialHoursDate] = useState('');
  const [specialHoursOpen, setSpecialHoursOpen] = useState('');
  const [specialHoursClose, setSpecialHoursClose] = useState('');
  const [attributes] = useState([
    { name: 'Wi-Fi', enabled: true },
    { name: 'クレジットカード', enabled: true },
    { name: '電子マネー', enabled: true },
    { name: '駐車場', enabled: false },
    { name: 'テイクアウト', enabled: true },
    { name: 'デリバリー', enabled: false },
    { name: '車椅子対応', enabled: true },
    { name: '個室あり', enabled: false },
  ]);
  
  // ビジネス説明生成用
  const [descPrompt, setDescPrompt] = useState('');
  const [descPromptLocked, setDescPromptLocked] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleOptimizeDescription = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      alert(`AI最適化を実行しました。\n指示: ${descPrompt || 'なし'}`);
      setIsOptimizing(false);
    }, 1500);
  };
  
  const businessInfo = {
    name: '渋谷カフェ レストラン',
    category: 'カフェ・レストラン',
    address: '東京都渋谷区道玄坂1-2-3',
    phone: '03-1234-5678',
    website: 'https://example.com',
    description: '渋谷駅から徒歩3分。落ち着いた雰囲気の中で、こだわりのコーヒーと季節の料理をお楽しみいただけます。ランチ、ディナー、カフェタイムと様々なシーンでご利用ください。',
  };

  const hours = [
    { day: '月曜日', open: '11:00', close: '22:00' },
    { day: '火曜日', open: '11:00', close: '22:00' },
    { day: '水曜日', open: '11:00', close: '22:00' },
    { day: '木曜日', open: '11:00', close: '22:00' },
    { day: '金曜日', open: '11:00', close: '23:00' },
    { day: '土曜日', open: '10:00', close: '23:00' },
    { day: '日曜日', open: '10:00', close: '21:00' },
  ];




  const handleSaveSpecialHours = () => {
    if (specialHoursDate && specialHoursOpen && specialHoursClose) {
      alert(`特別営業時間を保存しました:\n日付: ${specialHoursDate}\n時間: ${specialHoursOpen} 〜 ${specialHoursClose}`);
      setShowSpecialHoursModal(false);
      setSpecialHoursDate('');
      setSpecialHoursOpen('');
      setSpecialHoursClose('');
    }
  };

  const handleOpenGoogleProfile = () => {
    // 実際のビジネスプロパイルにURLをリダイレクト
    window.open('https://business.google.com/locations', '_blank');
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">店舗プロフィール</h1>
          <p className="text-slate-400 mt-1">Googleビジネスプロフィールの情報を管理</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleOpenGoogleProfile}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
          >
            Googleで確認
          </button>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 rounded-lg bg-aurora-purple hover:bg-aurora-purple/80 transition-colors text-sm font-medium"
          >
            {isEditing ? '保存' : '編集'}
          </button>
        </div>
      </div>

      {/* プロフィール完成度 */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">プロフィール完成度</h2>
          <span className="text-2xl font-bold text-aurora-cyan">85%</span>
        </div>
        <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden">
          <div className="bg-linear-to-r from-aurora-purple to-aurora-cyan h-full w-[85%] rounded-full"></div>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2 text-green-400">
            <span>✓</span> 基本情報
          </div>
          <div className="flex items-center gap-2 text-green-400">
            <span>✓</span> 営業時間
          </div>
          <div className="flex items-center gap-2 text-yellow-400">
            <span>⚠</span> 写真（12/20枚）
          </div>
          <div className="flex items-center gap-2 text-red-400">
            <span>✗</span> Q&A未設定
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 基本情報 */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-2 h-6 bg-aurora-cyan rounded-full"></span>
            基本情報
          </h2>
          
          <div className="glass-card p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">ビジネス名</label>
              <input 
                type="text" 
                defaultValue={businessInfo.name}
                disabled={!isEditing}
                className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">カテゴリ</label>
              <input 
                type="text" 
                defaultValue={businessInfo.category}
                disabled={!isEditing}
                className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">住所</label>
              <input 
                type="text" 
                defaultValue={businessInfo.address}
                disabled={!isEditing}
                className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white disabled:opacity-60"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">電話番号</label>
                <input 
                  type="text" 
                  defaultValue={businessInfo.phone}
                  disabled={!isEditing}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">ウェブサイト</label>
                <input 
                  type="text" 
                  defaultValue={businessInfo.website}
                  disabled={!isEditing}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white disabled:opacity-60"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">ビジネス説明</label>
              
              {/* AI指示（プロンプト） */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-slate-400">AI生成への指示（プロンプト）</label>
                  <button
                    onClick={() => setDescPromptLocked(!descPromptLocked)}
                    className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full transition-colors ${descPromptLocked ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/10 text-slate-400 hover:bg-white/20'}`}
                  >
                    {descPromptLocked ? '🔒 ロック中' : '🔓 ロック'}
                  </button>
                </div>
                <input
                  type="text"
                  className={`w-full bg-slate-900/50 border rounded-lg px-3 py-2 text-white text-xs focus:outline-none transition-colors ${descPromptLocked ? 'border-red-500/30 bg-red-500/5 text-slate-400 cursor-not-allowed' : 'border-white/10 focus:border-aurora-cyan'}`}
                  placeholder="例: 若者向けのエネルギッシュな雰囲気で、隠れ家的な要素も強調して"
                  value={descPrompt}
                  onChange={(e) => !descPromptLocked && setDescPrompt(e.target.value)}
                  disabled={descPromptLocked}
                />
              </div>

              <textarea 
                defaultValue={businessInfo.description}
                disabled={!isEditing}
                className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white h-32 resize-none disabled:opacity-60"
              />
              <div className="mt-2 flex justify-end">
                <button 
                  onClick={handleOptimizeDescription}
                  disabled={isOptimizing}
                  className="text-xs px-3 py-1.5 rounded-lg bg-aurora-purple/20 text-aurora-purple hover:bg-aurora-purple hover:text-white transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  {isOptimizing ? '生成中...' : '✨ AIで説明文を最適化'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 営業時間 */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-2 h-6 bg-aurora-purple rounded-full"></span>
            営業時間
          </h2>
          
          <div className="glass-card p-6 space-y-3">
            {hours.map((h, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-slate-300 w-20">{h.day}</span>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    defaultValue={h.open}
                    disabled={!isEditing}
                    className="w-20 bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-white text-center text-sm disabled:opacity-60"
                  />
                  <span className="text-slate-500">〜</span>
                  <input 
                    type="text" 
                    defaultValue={h.close}
                    disabled={!isEditing}
                    className="w-20 bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-white text-center text-sm disabled:opacity-60"
                  />
                </div>
              </div>
            ))}
            <button 
              onClick={() => setShowSpecialHoursModal(true)}
              className="w-full mt-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-colors"
            >
              + 特別営業時間を追加
            </button>
          </div>

          {/* 特別営業時間モーダル */}
          {showSpecialHoursModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="glass-card p-6 w-full max-w-md">
                <h3 className="text-lg font-bold text-white mb-4">特別営業時間を追加</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">日付</label>
                    <input 
                      type="date" 
                      value={specialHoursDate}
                      onChange={(e) => setSpecialHoursDate(e.target.value)}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">開店時間</label>
                      <input 
                        type="time" 
                        value={specialHoursOpen}
                        onChange={(e) => setSpecialHoursOpen(e.target.value)}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">閉店時間</label>
                      <input 
                        type="time" 
                        value={specialHoursClose}
                        onChange={(e) => setSpecialHoursClose(e.target.value)}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowSpecialHoursModal(false)}
                      className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      キャンセル
                    </button>
                    <button 
                      onClick={handleSaveSpecialHours}
                      className="flex-1 py-2 rounded-lg bg-aurora-purple hover:bg-aurora-purple/80 transition-colors"
                    >
                      保存
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 属性 */}
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mt-8">
            <span className="w-2 h-6 bg-green-500 rounded-full"></span>
            店舗属性
          </h2>
          
          <div className="glass-card p-6">
            <div className="grid grid-cols-2 gap-3">
              {attributes.map((attr, i) => (
                <div 
                  key={i} 
                  className={`flex items-center justify-between p-3 rounded-lg border ${attr.enabled ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-800/50 border-white/10'}`}
                >
                  <span className={attr.enabled ? 'text-green-300' : 'text-slate-500'}>{attr.name}</span>
                  <div className={`w-10 h-6 rounded-full ${attr.enabled ? 'bg-green-500' : 'bg-slate-600'} relative cursor-pointer`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${attr.enabled ? 'right-1' : 'left-1'}`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 写真ギャラリー */}
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        <span className="w-2 h-6 bg-yellow-500 rounded-full"></span>
        写真ギャラリー
      </h2>
      
      <div className="glass-card p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square bg-linear-to-br from-slate-700 to-slate-800 rounded-lg flex items-center justify-center text-slate-500 hover:border-aurora-cyan border border-transparent transition-colors cursor-pointer">
              📷
            </div>
          ))}
          <div className="aspect-square border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center text-slate-500 hover:border-aurora-cyan hover:text-aurora-cyan transition-colors cursor-pointer">
            <span className="text-2xl">+</span>
            <span className="text-xs mt-1">追加</span>
          </div>
        </div>
        <div className="mt-4 flex gap-4 text-sm">
          <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
            外観写真を追加
          </button>
          <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
            内観写真を追加
          </button>
          <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
            料理写真を追加
          </button>
        </div>
      </div>
    </div>
  );
}
