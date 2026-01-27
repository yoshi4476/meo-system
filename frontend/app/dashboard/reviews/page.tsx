'use client';
import { useState } from 'react';

// モックデータ：クチコミ
const mockReviews = [
  { 
    id: 1, 
    user: '田中 太郎', 
    rating: 5, 
    date: '2日前', 
    comment: 'ランチのパスタが絶品でした！スタッフの対応も丁寧で、とても居心地が良かったです。また利用します。',
    reply: '',
    status: 'unreplied'
  },
  { 
    id: 2, 
    user: '鈴木 花子', 
    rating: 4, 
    date: '3日前', 
    comment: '雰囲気は最高ですが、混雑時の提供時間が少し長かったです。味は間違いないので、そこだけ残念。',
    reply: '',
    status: 'unreplied'
  },
  { 
    id: 3, 
    user: 'John Smith', 
    rating: 5, 
    date: '1週間前', 
    comment: 'Great atmosphere and delicious coffee!',
    reply: 'Thank you for visiting! We look forward to seeing you again.',
    status: 'replied'
  }
];

export default function ReviewsPage() {
  const [reviews, setReviews] = useState(mockReviews);
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // 共通プロンプト機能
  const [commonPrompt, setCommonPrompt] = useState('親しみやすく、感謝の気持ちを伝えて。再来店を促すような一言を添えて。');
  const [commonPromptLocked, setCommonPromptLocked] = useState(false);

  const handleSelectReview = (id: number) => {
    setSelectedReviewId(id);
    const review = reviews.find(r => r.id === id);
    if (review?.reply) {
      setReplyText(review.reply);
    } else {
      setReplyText('');
    }
  };

  const handleGenerateReply = () => {
    if (!selectedReviewId) return;
    
    setIsGenerating(true);
    setTimeout(() => {
      const review = reviews.find(r => r.id === selectedReviewId);
      let generatedReply = '';
      
      if (review) {
        generatedReply = `${review.user}様\n\nご来店いただき、また${review.rating}星の高評価をいただきありがとうございます。\n`;
        
        if (review.rating >= 4) {
          generatedReply += `「${review.comment.substring(0, 10)}...」というお褒めの言葉、スタッフ一同大変嬉しく思います。\n`;
        } else {
          generatedReply += `貴重なご意見ありがとうございます。ご指摘いただいた点は真摯に受け止め、改善に努めてまいります。\n`;
        }

        // 共通プロンプトの内容を反映（擬似的に追加）
        // 実際にはAIがこれを考慮して生成する
        const promptNote = commonPrompt.length > 20 ? commonPrompt.substring(0, 20) + '...' : commonPrompt;
        
        generatedReply += `\n（AIへの指示「${promptNote}」に基づき、心温まるメッセージを作成しました）\n`;
        generatedReply += `\nまたのご来店を心よりお待ちしております。\n\n渋谷店 店長`;
      }
      
      setReplyText(generatedReply);
      setIsGenerating(false);
    }, 1500);
  };

  const handleSaveReply = () => {
    if (!selectedReviewId) return;
    
    setReviews(prev => prev.map(r => {
      if (r.id === selectedReviewId) {
        return { ...r, reply: replyText, status: 'replied' };
      }
      return r;
    }));
    
    setSelectedReviewId(null);
    setReplyText('');
    alert('返信を保存しました');
  };

  const selectedReview = reviews.find(r => r.id === selectedReviewId);

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-6">
      {/* 左カラム：クチコミリスト + 共通プロンプト */}
      <div className="w-1/3 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">クチコミ管理</h1>
          <div className="flex gap-2 text-sm">
            <span className="text-slate-400">未返信: <strong className="text-red-400">{reviews.filter(r => r.status === 'unreplied').length}件</strong></span>
          </div>
        </div>

        {/* 共通プロンプト設定エリア */}
        <div className="glass-card p-4 border border-aurora-purple/30 bg-aurora-purple/5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-aurora-cyan flex items-center gap-1">
              <span>✨</span> 全返信共通AI指示 (プロンプト)
            </label>
            <button
              onClick={() => setCommonPromptLocked(!commonPromptLocked)}
              className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full transition-colors ${commonPromptLocked ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/10 text-slate-400 hover:bg-white/20'}`}
            >
              {commonPromptLocked ? '🔒 ロック中' : '🔓 ロック'}
            </button>
          </div>
          <textarea
            className={`w-full bg-slate-900/50 border rounded-lg px-3 py-2 text-white text-xs focus:outline-none transition-colors h-16 resize-none ${commonPromptLocked ? 'border-red-500/30 bg-red-500/5 text-slate-400' : 'border-white/10 focus:border-aurora-cyan'}`}
            placeholder="例: 親しみやすく、感謝の気持ちを伝えて"
            value={commonPrompt}
            onChange={(e) => !commonPromptLocked && setCommonPrompt(e.target.value)}
            disabled={commonPromptLocked}
          />
          {commonPromptLocked && <p className="text-[10px] text-red-400 mt-1">管理者が設定をロックしています</p>}
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {reviews.map((review) => (
            <div 
              key={review.id}
              onClick={() => handleSelectReview(review.id)}
              className={`p-4 rounded-xl cursor-pointer transition-all border ${
                selectedReviewId === review.id
                  ? 'bg-aurora-purple/20 border-aurora-purple'
                  : 'bg-slate-800/50 border-white/5 hover:bg-slate-800'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                    {review.user.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{review.user}</div>
                    <div className="text-xs text-slate-500">{review.date}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-yellow-400 text-sm">{'★'.repeat(review.rating)}</div>
                  {review.status === 'unreplied' && (
                    <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full mt-1">未返信</span>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-300 line-clamp-2">{review.comment}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 右カラム：返信エディタ */}
      <div className="flex-1 glass-card p-6 flex flex-col h-full relative overflow-hidden">
        {selectedReview ? (
          <>
            <div className="mb-6 pb-6 border-b border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-400">{'★'.repeat(selectedReview.rating)}</span>
                <span className="text-slate-400 text-sm">by {selectedReview.user}</span>
              </div>
              <p className="text-white text-lg italic">&quot;{selectedReview.comment}&quot;</p>
            </div>

            <div className="flex-1 flex flex-col gap-4">
              <div className="flex-1 relative">
                <textarea 
                  className="w-full h-full bg-slate-900/50 border border-white/10 rounded-xl p-4 text-white resize-none focus:outline-none focus:border-aurora-purple"
                  placeholder="返信内容を入力するか、AI生成ボタンを押してください..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
                <button 
                  onClick={handleGenerateReply}
                  disabled={isGenerating}
                  className="absolute bottom-4 right-4 px-4 py-2 rounded-lg bg-aurora-purple hover:bg-aurora-purple/80 text-white text-sm font-medium shadow-lg shadow-purple-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isGenerating ? '生成中...' : '✨ AI返信作成'}
                </button>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedReviewId(null)}
                className="px-6 py-2 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 transition-colors"
              >
                キャンセル
              </button>
              <button 
                onClick={handleSaveReply}
                className="px-6 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium shadow-lg shadow-green-500/20 transition-colors"
              >
                返信を公開
              </button>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <div className="text-4xl mb-4">💬</div>
            <p>左側のリストからクチコミを選択してください</p>
          </div>
        )}
      </div>
    </div>
  );
}
