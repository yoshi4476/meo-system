'use client';
import { useState } from 'react';

const mockQAs = [
  { id: 1, question: '駐車場はありますか？', answer: 'はい、店舗前に3台分の無料駐車スペースがございます。', status: 'published', aiGenerated: false },
  { id: 2, question: '予約は必要ですか？', answer: '土日祝日は予約をおすすめしております。平日は予約なしでもご利用いただけます。', status: 'published', aiGenerated: true },
  { id: 3, question: 'クレジットカードは使えますか？', answer: 'はい、各種クレジットカード、電子マネーに対応しております。', status: 'published', aiGenerated: true },
  { id: 4, question: 'ランチタイムは何時までですか？', answer: '', status: 'draft', aiGenerated: false },
  { id: 5, question: 'テイクアウトはできますか？', answer: '', status: 'draft', aiGenerated: false },
];

export default function QAPage() {
  const [qas, setQas] = useState(mockQAs);


  const generateAnswer = (id: number) => {
    setQas(prev => prev.map(qa => {
      if (qa.id === id) {
        const aiAnswers: { [key: string]: string } = {
          'ランチタイムは何時までですか？': 'ランチタイムは11:00〜15:00（ラストオーダー14:30）となっております。',
          'テイクアウトはできますか？': 'はい、テイクアウトに対応しております。お電話またはご来店時にご注文ください。',
        };
        return { 
          ...qa, 
          answer: aiAnswers[qa.question] || 'AIが回答を生成しました。',
          aiGenerated: true,
          status: 'published'
        };
      }
      return qa;
    }));
  };

  const suggestedQuestions = [
    'Wi-Fiは使えますか？',
    '子供連れでも大丈夫ですか？',
    'アレルギー対応はしていますか？',
    '個室はありますか？',
    '喫煙席はありますか？',
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Q&A管理</h1>
          <p className="text-slate-400 mt-1">よくある質問を事前に登録して検索意図をカバー</p>
        </div>
        <button className="px-4 py-2 rounded-lg bg-aurora-purple hover:bg-aurora-purple/80 transition-colors text-sm font-medium shadow-lg shadow-purple-500/20 flex items-center gap-2">
          <span>+</span> 新しいQ&Aを追加
        </button>
      </div>

      {/* 統計 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="text-sm text-slate-400">登録済みQ&A</div>
          <div className="text-2xl font-bold text-white">{qas.filter(q => q.status === 'published').length}件</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-slate-400">下書き</div>
          <div className="text-2xl font-bold text-yellow-400">{qas.filter(q => q.status === 'draft').length}件</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-slate-400">AI生成</div>
          <div className="text-2xl font-bold text-aurora-cyan">{qas.filter(q => q.aiGenerated).length}件</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Q&Aリスト */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-white">登録されたQ&A</h2>
          
          {qas.map((qa) => (
            <div key={qa.id} className="glass-card p-5">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">❓</span>
                  <span className="font-bold text-white">{qa.question}</span>
                </div>
                <div className="flex items-center gap-2">
                  {qa.aiGenerated && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-aurora-cyan/20 text-aurora-cyan">AI生成</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    qa.status === 'published' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {qa.status === 'published' ? '公開中' : '下書き'}
                  </span>
                </div>
              </div>
              
              {qa.answer ? (
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <p className="text-slate-300 text-sm">{qa.answer}</p>
                </div>
              ) : (
                <div className="bg-slate-800/50 p-4 rounded-lg border border-dashed border-white/20">
                  <p className="text-slate-500 text-sm mb-3">回答が未設定です</p>
                  <button 
                    onClick={() => generateAnswer(qa.id)}
                    className="text-xs px-3 py-1.5 rounded-full bg-aurora-purple text-white hover:bg-aurora-purple/80 transition-colors"
                  >
                    ✨ AIで回答を生成
                  </button>
                </div>
              )}
              
              <div className="flex gap-2 mt-3">
                <button className="text-xs text-slate-400 hover:text-white transition-colors">編集</button>
                <button className="text-xs text-slate-400 hover:text-white transition-colors">削除</button>
              </div>
            </div>
          ))}
        </div>

        {/* AI提案 */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>💡</span> AI推奨の質問
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              ユーザーがよく検索する質問をAIが予測しました
            </p>
            <div className="space-y-2">
              {suggestedQuestions.map((q, i) => (
                <div 
                  key={i}
                  className="p-3 bg-slate-800/50 rounded-lg flex justify-between items-center hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <span className="text-sm text-slate-300">{q}</span>
                  <button className="text-xs px-2 py-1 rounded bg-white/10 text-slate-400 hover:bg-aurora-purple hover:text-white transition-colors">
                    追加
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-white mb-4">一括生成</h2>
            <p className="text-sm text-slate-400 mb-4">
              業種に基づいて一般的なQ&Aを自動生成します
            </p>
            <button className="w-full py-3 rounded-lg bg-aurora-purple hover:bg-aurora-purple/80 text-white font-medium transition-colors flex items-center justify-center gap-2">
              <span>✨</span> 10件をAIで一括生成
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
