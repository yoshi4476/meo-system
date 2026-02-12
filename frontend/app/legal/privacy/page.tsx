import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 flex justify-center">
      <div className="max-w-3xl w-full bg-slate-900 p-10 rounded-xl border border-slate-800 shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-8 border-b border-slate-700 pb-4">プライバシーポリシー</h1>
        
        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">1. 個人情報の収集</h2>
            <p>当サービスは、Googleアカウント情報（メールアドレス、名前、プロフィール画像のURL）およびGoogle Business Profileのデータを収集・保存します。</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">2. 利用目的</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>MEO対策および店舗情報の管理</li>
              <li>AIによる投稿生成および返信生成</li>
              <li>サービス改善のための分析</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">3. 第三者への提供</h2>
            <p>法令に基づく場合を除き、事前の同意なく個人情報を第三者に提供することはありません。</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">4. データの削除</h2>
            <p>ユーザーはいつでもアカウント削除を行い、当サービスに保存されたデータを削除することができます。</p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 text-center">
          <a href="/" className="text-purple-400 hover:text-purple-300 transition-colors">ホームに戻る</a>
        </div>
      </div>
    </div>
  );
}
