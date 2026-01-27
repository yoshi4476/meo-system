'use client';

const mockPosts = [
  {
    id: 1,
    title: '夏のランチスペシャル開始！',
    content: '本日より夏季限定メニューがスタート！冷製パスタや季節のサラダをお楽しみください。',
    status: 'published',
    publishedAt: '2026-01-20 12:00',
    views: 1234,
    clicks: 89,
  },
  {
    id: 2,
    title: '1月の営業時間のお知らせ',
    content: '成人の日（1/13）は通常営業いたします。皆様のご来店をお待ちしております。',
    status: 'published',
    publishedAt: '2026-01-10 10:00',
    views: 856,
    clicks: 45,
  },
  {
    id: 3,
    title: 'バレンタイン特別コース予約開始',
    content: '2月14日限定のスペシャルディナーコースのご予約を開始しました！',
    status: 'scheduled',
    scheduledAt: '2026-02-01 09:00',
    views: 0,
    clicks: 0,
  },
  {
    id: 4,
    title: '新メニュー準備中',
    content: '春の新メニューを現在準備中です。',
    status: 'draft',
    views: 0,
    clicks: 0,
  },
];

export default function PostsPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">投稿管理</h1>
          <p className="text-slate-400 mt-1">すべての投稿を管理・スケジュール</p>
        </div>
        <a href="/dashboard/posts/new" className="px-4 py-2 rounded-lg bg-aurora-purple hover:bg-aurora-purple/80 transition-colors text-sm font-medium shadow-lg shadow-purple-500/20 flex items-center gap-2">
          <span>✨</span> 新規投稿を作成
        </a>
      </div>

      {/* ステータスタブ */}
      <div className="flex gap-2">
        {[
          { label: 'すべて', count: 4, active: true },
          { label: '公開済み', count: 2, active: false },
          { label: '予約済み', count: 1, active: false },
          { label: '下書き', count: 1, active: false },
        ].map((tab) => (
          <button 
            key={tab.label}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${tab.active ? 'bg-aurora-purple text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
          >
            {tab.label}
            <span className={`px-2 py-0.5 rounded-full text-xs ${tab.active ? 'bg-white/20' : 'bg-white/10'}`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* 投稿リスト */}
      <div className="space-y-4">
        {mockPosts.map((post) => (
          <div key={post.id} className="glass-card p-6 hover:border-white/20 transition-all">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-white">{post.title}</h3>
                  {post.status === 'published' && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">公開中</span>
                  )}
                  {post.status === 'scheduled' && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">予約済み</span>
                  )}
                  {post.status === 'draft' && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-slate-500/20 text-slate-400 border border-slate-500/30">下書き</span>
                  )}
                </div>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">{post.content}</p>
                
                <div className="flex items-center gap-6 text-sm">
                  {post.status === 'published' && (
                    <>
                      <div className="flex items-center gap-2 text-slate-500">
                        <span>📅</span>
                        <span>{post.publishedAt} 公開</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <span>👁</span>
                        <span>{post.views.toLocaleString()} 表示</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <span>🖱</span>
                        <span>{post.clicks} クリック</span>
                      </div>
                    </>
                  )}
                  {post.status === 'scheduled' && (
                    <div className="flex items-center gap-2 text-blue-400">
                      <span>⏰</span>
                      <span>{post.scheduledAt} に公開予定</span>
                    </div>
                  )}
                  {post.status === 'draft' && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <span>✏️</span>
                      <span>下書き保存中</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-slate-400 hover:text-white">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                </button>
                <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-slate-400 hover:text-white">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ヒント */}
      <div className="glass-card p-6 border-l-4 border-l-aurora-cyan">
        <h3 className="font-bold text-white mb-2 flex items-center gap-2">
          <span>💡</span> 投稿のベストプラクティス
        </h3>
        <ul className="space-y-1 text-sm text-slate-400">
          <li>• 週に2〜3回の投稿が最適な頻度です</li>
          <li>• 写真付きの投稿は閲覧数が3倍になります</li>
          <li>• 営業時間中の投稿がエンゲージメントを高めます</li>
          <li>• 季節のイベントやプロモーションを忘れずに</li>
        </ul>
      </div>
    </div>
  );
}
