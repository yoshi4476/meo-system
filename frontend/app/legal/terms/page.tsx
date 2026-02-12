import React from 'react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 flex justify-center">
      <div className="max-w-3xl w-full bg-slate-900 p-10 rounded-xl border border-slate-800 shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-8 border-b border-slate-700 pb-4">利用規約</h1>
        
        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">第1条（適用）</h2>
            <p>本規約は、MEO Mastermind AI（以下「当サービス」）の利用に関する条件を定めるものです。</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">第2条（Googleサービスの利用）</h2>
            <p>当サービスはGoogle Business Profile APIを使用しています。ユーザーは、Googleの利用規約およびプライバシーポリシーに同意したものとみなされます。</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">第3条（禁止事項）</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>法令または公序良俗に違反する行為</li>
              <li>当サービスの運営を妨害する行為</li>
              <li>他のユーザー情報を不正に収集する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">第4条（免責事項）</h2>
            <p>当サービスの使用によって生じた損害について、運営者は一切の責任を負わないものとします。</p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 text-center">
          <a href="/" className="text-purple-400 hover:text-purple-300 transition-colors">ホームに戻る</a>
        </div>
      </div>
    </div>
  );
}
