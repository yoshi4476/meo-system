'use client';
import { useState } from 'react';
import { SmartphonePreview } from '../../../../components/dashboard/SmartphonePreview';

// 過去にアップロードした画像のモックデータ
const uploadedImages = [
  { id: 1, name: 'ランチプレート.jpg', url: '/images/lunch1.jpg', date: '2026-01-15' },
  { id: 2, name: '店内写真.jpg', url: '/images/interior1.jpg', date: '2026-01-10' },
  { id: 3, name: '外観.jpg', url: '/images/exterior1.jpg', date: '2026-01-05' },
  { id: 4, name: 'スタッフ.jpg', url: '/images/staff1.jpg', date: '2025-12-20' },
  { id: 5, name: 'ディナーコース.jpg', url: '/images/dinner1.jpg', date: '2025-12-15' },
  { id: 6, name: 'デザート.jpg', url: '/images/dessert1.jpg', date: '2025-12-10' },
];

export default function AIStudioPage() {
  // 基本設定
  const [postType, setPostType] = useState<'update' | 'event' | 'offer'>('update');
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [prompt, setPrompt] = useState('');
  const [mood, setMood] = useState('プロフェッショナル');
  const [charCount, setCharCount] = useState(300);
  
  // オファー設定
  const [couponCode, setCouponCode] = useState('');
  const [offerTerms, setOfferTerms] = useState('');
  

  // ロック設定
  const [keywordsLocked, setKeywordsLocked] = useState(false);
  const [promptLocked, setPromptLocked] = useState(false);


  // 画像・ギャラリー
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [showImageGallery, setShowImageGallery] = useState(false);

  // 予約投稿
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('12:00');

  // 生成
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    // モック生成処理
    setTimeout(() => {
        let content = "";
        if (postType === 'offer') {
            content = `【限定特典】${topic}\n\n${keywords.split(',').map(k => `#${k.trim()}`).join(' ')}\n\n${couponCode ? `クーポンコード: ${couponCode}\n` : ''}${offerTerms ? `利用条件: ${offerTerms}\n` : ''}\n皆様のご来店をお待ちしております！`;
        } else {
            content = `【${mood}な${postType === 'event' ? 'イベント' : 'お知らせ'}】\n${topic}\n\nいつもご利用ありがとうございます。\n${keywords.split(',').map(k => `#${k.trim()}`).join(' ')}\n\nぜひお立ち寄りください！`;
        }
        setGeneratedContent(content);
        setIsGenerating(false);
    }, 1500);
  };

  const handlePublish = () => {
    alert('投稿を保存しました！');
  };

  // ... (途中省略) ...

  return (
    <div className="max-w-7xl mx-auto flex gap-8">
      {/* 入力セクション */}
      <div className="flex-1 space-y-6 overflow-y-auto max-h-[calc(100vh-8rem)] pr-2">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <span className="text-aurora-purple">✨</span> AI投稿スタジオ
          </h1>
          <p className="text-slate-400 mt-1">SEO最適化された投稿を数秒で生成します。</p>
        </div>

        <div className="glass-card p-6 space-y-5">
          {/* タイプ選択 */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">投稿タイプ</label>
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => setPostType('update')}
                className={`py-3 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${postType === 'update' ? 'bg-aurora-cyan text-white ring-2 ring-aurora-cyan/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                <span>📰</span> 最新情報
              </button>
              <button 
                onClick={() => setPostType('event')}
                className={`py-3 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${postType === 'event' ? 'bg-aurora-purple text-white ring-2 ring-aurora-purple/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                <span>🎉</span> イベント情報
              </button>
              <button 
                onClick={() => setPostType('offer')}
                className={`py-3 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${postType === 'offer' ? 'bg-green-500 text-white ring-2 ring-green-500/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                <span>🏷️</span> 特典
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {postType === 'update' && '通常のお知らせやニュースを投稿します'}
              {postType === 'event' && 'セール、キャンペーン、特別イベントを告知します'}
              {postType === 'offer' && 'クーポンや割引オファーを発行します'}
            </p>
          </div>

          {/* オファー詳細（タイプが特典の場合のみ表示） */}
          {postType === 'offer' && (
            <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg space-y-4">
               <div>
                <label className="block text-sm font-medium text-green-400 mb-2">クーポンコード (任意)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="flex-1 bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500 transition-colors"
                    placeholder="例: SUMMER2024"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <button className="px-3 py-2 bg-slate-800 rounded-lg text-xs text-slate-300 hover:text-white border border-white/10">
                    自動生成
                  </button>
                </div>
               </div>
               <div>
                <label className="block text-sm font-medium text-green-400 mb-2">利用条件 (プロンプトに反映)</label>
                <textarea
                  className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500 transition-colors h-20 resize-none"
                  placeholder="例: ランチタイム限定、お一人様一回限り、他券併用不可"
                  value={offerTerms}
                  onChange={(e) => setOfferTerms(e.target.value)}
                />
               </div>
            </div>
          )}

          {/* トピック */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {postType === 'offer' ? '特典タイトル' : 'トピック'}
            </label>
            <input 
              type="text" 
              className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-aurora-cyan transition-colors"
              placeholder={postType === 'offer' ? "例: ランチセット10%OFF" : "例: 夏のランチスペシャル"}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          {/* キーワード（ロック可能） */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">キーワード（カンマ区切り）</label>
              <button
                onClick={() => setKeywordsLocked(!keywordsLocked)}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${keywordsLocked ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/10 text-slate-400 hover:bg-white/20'}`}
              >
                {keywordsLocked ? '🔒 ロック中' : '🔓 ロック'}
              </button>
            </div>
            <input 
              type="text" 
              className={`w-full bg-slate-900/50 border rounded-lg px-4 py-3 text-white focus:outline-none transition-colors ${keywordsLocked ? 'border-red-500/30 bg-red-500/5' : 'border-white/10 focus:border-aurora-cyan'}`}
              placeholder="例: ランチ, カフェ, 渋谷"
              value={keywords}
              onChange={(e) => !keywordsLocked && setKeywords(e.target.value)}
              disabled={keywordsLocked}
            />
            {keywordsLocked && <p className="text-xs text-red-400 mt-1">キーワードはロックされています（編集ロック項目）</p>}
          </div>

          {/* プロンプト（ロック可能） */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">プロンプト（AIへの追加指示）</label>
              <button
                onClick={() => setPromptLocked(!promptLocked)}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${promptLocked ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/10 text-slate-400 hover:bg-white/20'}`}
              >
                {promptLocked ? '🔒 ロック中' : '🔓 ロック'}
              </button>
            </div>
            <textarea 
              className={`w-full bg-slate-900/50 border rounded-lg px-4 py-3 text-white focus:outline-none transition-colors h-24 resize-none ${promptLocked ? 'border-red-500/30 bg-red-500/5' : 'border-white/10 focus:border-aurora-cyan'}`}
              placeholder="例: 学生向けの親しみやすい表現で、割引情報を強調してください"
              value={prompt}
              onChange={(e) => !promptLocked && setPrompt(e.target.value)}
              disabled={promptLocked}
            />
            {promptLocked && <p className="text-xs text-red-400 mt-1">プロンプトはロックされています（編集ロック項目）</p>}
          </div>
            
          {/* トーン選択 */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">トーン / ムード</label>
            <div className="grid grid-cols-3 gap-3">
              {['プロフェッショナル', 'フレンドリー', 'エキサイティング'].map((m) => (
                <button 
                  key={m}
                  onClick={() => setMood(m)}
                  className={`py-2 px-4 rounded-lg text-sm transition-all ${mood === m ? 'bg-aurora-purple text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* 文字数設定 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">文字数</label>
              <span className="text-sm text-aurora-cyan font-bold">{charCount}文字</span>
            </div>
            <input 
              type="range" 
              min="100" 
              max="500" 
              step="50"
              value={charCount}
              onChange={(e) => setCharCount(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-aurora-purple"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>100</span>
              <span>300</span>
              <span>500</span>
            </div>
          </div>

          {/* 画像選択 */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">画像</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setShowImageGallery(true)}
                className="py-3 px-4 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm flex items-center justify-center gap-2 transition-colors border border-white/10"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                過去の画像から選択
              </button>
              <button className="py-3 px-4 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm flex items-center justify-center gap-2 transition-colors border border-white/10">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>
                新しい画像をアップロード
              </button>
            </div>
            {selectedImage && (
              <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-between">
                <span className="text-sm text-green-400">
                  ✓ {uploadedImages.find(img => img.id === selectedImage)?.name} を選択中
                </span>
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  解除
                </button>
              </div>
            )}
          </div>

          {/* 予約投稿設定 */}
          <div className="border-t border-white/10 pt-5">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-slate-300">予約投稿</label>
              <div 
                onClick={() => setScheduleEnabled(!scheduleEnabled)}
                className={`w-12 h-7 rounded-full ${scheduleEnabled ? 'bg-aurora-cyan' : 'bg-slate-600'} relative cursor-pointer transition-colors`}
              >
                <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${scheduleEnabled ? 'right-1' : 'left-1'}`}></div>
              </div>
            </div>
            
            {scheduleEnabled && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">日付</label>
                  <input 
                    type="date" 
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-aurora-cyan"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">時間</label>
                  <select 
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-aurora-cyan"
                  >
                    {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 生成ボタン */}
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full btn-primary mt-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              '✨ 生成中...'
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M7.5 5.6L10 7 7.5 8.4 5 10l-2.5-1.6L0 7l2.5-1.4L5 4l2.5 1.6zm12 9.4l2.5 1.4-2.5 1.6-2.5 1.4-2.5-1.4 2.5-1.6 2.5-1.4zM22 2l-2.5 1.4L17 5l-2.5-1.6L12 2l2.5-1.4L17 0l2.5 1.6L22 2z"/></svg>
                投稿を生成
              </>
            )}
          </button>
        </div>

        {/* 生成結果 */}
        {generatedContent && (
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">生成されたコンテンツ</h3>
              <span className="text-xs text-slate-500">{generatedContent.length} / {charCount} 文字</span>
            </div>
            <textarea 
              className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white h-40 resize-none"
              value={generatedContent}
              onChange={(e) => setGeneratedContent(e.target.value)}
            />
            <div className="flex gap-3">
              <button 
                onClick={handlePublish}
                className="flex-1 py-2 rounded-lg bg-aurora-purple hover:bg-aurora-purple/80 text-white text-sm font-medium transition-colors"
              >
                {scheduleEnabled ? `${scheduleDate} ${scheduleTime} に予約` : '今すぐ投稿'}
              </button>
              <button className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-medium transition-colors">
                下書き保存
              </button>
            </div>
          </div>
        )}
      </div>

      {/* プレビューセクション */}
      <div className="w-[380px] flex items-start justify-center glass rounded-2xl p-8 bg-slate-900/30 sticky top-0">
        <SmartphonePreview content={generatedContent} image={selectedImage ? uploadedImages.find(img => img.id === selectedImage)?.url : undefined} />
      </div>

      {/* 画像ギャラリーモーダル */}
      {showImageGallery && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-8" onClick={() => setShowImageGallery(false)}>
          <div className="glass-card p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">過去にアップロードした画像</h2>
              <button onClick={() => setShowImageGallery(false)} className="text-slate-400 hover:text-white text-2xl">×</button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {uploadedImages.map((img) => (
                <div 
                  key={img.id}
                  onClick={() => { setSelectedImage(img.id); setShowImageGallery(false); }}
                  className={`aspect-square bg-linear-to-br from-slate-700 to-slate-800 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 ${selectedImage === img.id ? 'ring-2 ring-aurora-cyan' : 'hover:ring-2 hover:ring-white/30'}`}
                >
                  <div className="text-4xl mb-2">📷</div>
                  <div className="text-xs text-slate-400 text-center px-2 truncate w-full">{img.name}</div>
                  <div className="text-xs text-slate-600">{img.date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
