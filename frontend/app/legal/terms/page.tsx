import React from 'react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 flex justify-center">
      <div className="max-w-4xl w-full bg-slate-900 p-12 rounded-2xl border border-slate-800 shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-2 border-b-2 border-slate-700 pb-4">利用規約</h1>
        <p className="text-slate-400 text-sm mb-8 text-right">最終更新日: 2024年10月1日</p>
        
        <div className="space-y-8 text-sm leading-relaxed text-slate-300">
          <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="bg-slate-800 px-2 py-1 rounded text-xs text-slate-400">第1条</span>
              総則
            </h2>
            <p>この利用規約（以下「本規約」といいます。）は、株式会社[あなたの会社名]（以下「当社」といいます。）が提供するMEO対策および店舗管理支援サービス「MEO Mastermind AI」（以下「本サービス」といいます。）の利用条件を定めるものです。登録ユーザーの皆様（以下「ユーザー」といいます。）には、本規約に従って本サービスをご利用いただきます。</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="bg-slate-800 px-2 py-1 rounded text-xs text-slate-400">第2条</span>
              利用登録
            </h2>
            <ol className="list-decimal pl-5 space-y-2 marker:text-slate-500">
              <li>本サービスの利用を希望する者は、本規約に同意の上、当社所定の方法により利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。</li>
              <li>当社は、利用登録の申請者に以下の事由があると判断した場合、利用登録の申請を承認しないことがあり、その理由については一切の開示義務を負わないものとします。
                <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-400">
                  <li>申請に際して虚偽の事項を届け出た場合</li>
                  <li>本規約に違反したことがある者からの申請である場合</li>
                  <li>その他、当社が利用登録を相当でないと判断した場合</li>
                </ul>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="bg-slate-800 px-2 py-1 rounded text-xs text-slate-400">第3条</span>
              Googleビジネスプロフィールの連携
            </h2>
            <p className="mb-2">本サービスは、Google社の提供するGoogle Business Profile APIを使用しています。ユーザーは、本サービスの利用に際し、以下の事項に同意するものとします。</p>
            <ul className="list-disc pl-5 space-y-1 marker:text-slate-500">
              <li>Google利用規約およびプライバシーポリシーを遵守すること</li>
              <li>当社が本サービスを通じて、ユーザーのGoogleビジネスプロフィールの情報を取得・管理・更新すること</li>
              <li>Google APIの仕様変更や停止により、本サービスの一部または全部が利用できなくなる可能性があること</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="bg-slate-800 px-2 py-1 rounded text-xs text-slate-400">第4条</span>
              禁止事項
            </h2>
            <p className="mb-2">ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
            <ul className="list-disc pl-5 space-y-1 marker:text-slate-500">
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>当社のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
              <li>当社のサービスの運営を妨害するおそれのある行為</li>
              <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
              <li>不正アクセスをし、またはこれを試みる行為</li>
              <li>他のユーザーに成りすます行為</li>
              <li>反社会的勢力に対して直接または間接に利益を供与する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="bg-slate-800 px-2 py-1 rounded text-xs text-slate-400">第5条</span>
              免責事項
            </h2>
            <ol className="list-decimal pl-5 space-y-2 marker:text-slate-500">
              <li>当社の債務不履行責任は、当社の故意または重過失によらない場合には免責されるものとします。</li>
              <li>当社は、本サービスに関して、ユーザーと他のユーザーまたは第三者との間において生じた取引、連絡または紛争等について一切責任を負いません。</li>
              <li>AIが生成したテキストや画像等のコンテンツの正確性、適法性、有用性について、当社は保証しません。投稿前に必ずユーザー自身の責任で確認を行うものとします。</li>
            </ol>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 text-center">
          <a href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium">
            <span>ダッシュボードに戻る</span>
          </a>
        </div>
      </div>
    </div>
  );
}
