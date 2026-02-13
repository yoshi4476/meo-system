'use client';

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
            <p>この利用規約（以下「本規約」といいます。）は、提供者が提供するMEO対策および店舗管理支援サービス「MEO Mastermind AI」（以下「本サービス」といいます。）の利用条件を定めるものです。登録ユーザーの皆様（以下「ユーザー」といいます。）には、本規約に従って本サービスをご利用いただきます。</p>
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
              IDおよびパスワードの管理
            </h2>
            <p className="mb-2">ユーザーは、自己の責任において、本サービスのユーザーIDおよびパスワードを適切に管理するものとします。</p>
            <ul className="list-disc pl-5 space-y-1 marker:text-slate-500">
              <li>いかなる場合にも、ユーザーIDおよびパスワードを第三者に譲渡または貸与し、もしくは第三者と共用することはできません。</li>
              <li>当社は、ユーザーIDとパスワードの組み合わせが登録情報と一致してログインされた場合には、そのユーザーIDを登録しているユーザー自身による利用とみなします。</li>
              <li>ユーザーID及びパスワードが第三者に使用されたことによって生じた損害は、当社に故意又は重大な過失がある場合を除き、当社は一切の責任を負わないものとします。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="bg-slate-800 px-2 py-1 rounded text-xs text-slate-400">第4条</span>
              Googleビジネスプロフィールの連携
            </h2>
            <p className="mb-2">本サービスは、Google社の提供するGoogle Business Profile APIを使用しています。ユーザーは、本サービスの利用に際し、以下の事項に同意するものとします。</p>
            <ul className="list-disc pl-5 space-y-1 marker:text-slate-500">
              <li>Google利用規約およびプライバシーポリシーを順守すること</li>
              <li>当社が本サービスを通じて、ユーザーのGoogleビジネスプロフィールの情報を取得・管理・更新すること</li>
              <li>Google APIの仕様変更や停止により、本サービスの一部または全部が利用できなくなる可能性があること</li>
              <li>本サービスを通じて行われた投稿や変更が、Google側の判断により削除または非表示となる場合があること</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="bg-slate-800 px-2 py-1 rounded text-xs text-slate-400">第5条</span>
              禁止事項
            </h2>
            <p className="mb-2">ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
            <ul className="list-disc pl-5 space-y-1 marker:text-slate-500">
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>本サービスの内容等、本サービスに含まれる著作権、商標権ほか知的財産権を侵害する行為</li>
              <li>当社のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
              <li>本サービスによって得られた情報を商業的に利用する行為</li>
              <li>当社のサービスの運営を妨害するおそれのある行為</li>
              <li>不正アクセスをし、またはこれを試みる行為</li>
              <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
              <li>不正な目的を持って本サービスを利用する行為</li>
              <li>本サービスの他のユーザーまたはその他の第三者に不利益、損害、不快感を与える行為</li>
              <li>他のユーザーに成りすます行為</li>
              <li>当社が許諾しない本サービス上での宣伝、広告、勧誘、または営業行為</li>
              <li>反社会的勢力に対して直接または間接に利益を供与する行為</li>
              <li>その他、当社が不適切と判断する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="bg-slate-800 px-2 py-1 rounded text-xs text-slate-400">第6条</span>
              本サービスの提供の停止等
            </h2>
            <p className="mb-2">当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。</p>
            <ul className="list-disc pl-5 space-y-1 marker:text-slate-500">
              <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
              <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
              <li>コンピュータまたは通信回線等が事故により停止した場合</li>
              <li>その他、当社が本サービスの提供が困難と判断した場合</li>
            </ul>
             <p className="mt-2">当社は、本サービスの提供の停止または中断により、ユーザーまたは第三者が被ったいかなる不利益または損害についても、一切の責任を負わないものとします。</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="bg-slate-800 px-2 py-1 rounded text-xs text-slate-400">第7条</span>
              利用制限および登録抹消
            </h2>
            <p>当社は、ユーザーが以下のいずれかに該当する場合には、事前の通知なく、ユーザーに対して、本サービスの全部もしくは一部の利用を制限し、またはユーザーとしての登録を抹消することができるものとします。</p>
             <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-400">
                  <li>本規約のいずれかの条項に違反した場合</li>
                  <li>登録事項に虚偽の事実があることが判明した場合</li>
                  <li>料金等の支払債務の不履行があった場合</li>
                  <li>当社からの連絡に対し、一定期間返答がない場合</li>
                  <li>本サービスについて、最終の利用から一定期間利用がない場合</li>
                  <li>その他、当社が本サービスの利用を適当でないと判断した場合</li>
             </ul>
             <p className="mt-2">当社は、本条に基づき当社が行った行為によりユーザーに生じた損害について、一切の責任を負いません。</p>
          </section>

           <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="bg-slate-800 px-2 py-1 rounded text-xs text-slate-400">第8条</span>
              保証の否認および免責事項
            </h2>
            <ol className="list-decimal pl-5 space-y-2 marker:text-slate-500">
              <li>当社は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。</li>
              <li>当社は、本サービスに起因してユーザーに生じたあらゆる損害について、当社の故意又は重過失による場合を除き、一切の責任を負いません。</li>
              <li>AIが生成したテキストや画像等のコンテンツの正確性、適法性、有用性について、当社は保証しません。すべてのコンテンツは、投稿前に必ずユーザー自身の責任で確認を行うものとします。</li>
              <li>当社は、本サービスに関して、ユーザーと他のユーザーまたは第三者との間において生じた取引、連絡または紛争等について一切責任を負いません。</li>
            </ol>
          </section>

           <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="bg-slate-800 px-2 py-1 rounded text-xs text-slate-400">第9条</span>
              サービス内容の変更等
            </h2>
            <p>当社は、ユーザーへの事前の通知なくして、本サービスの内容を変更し、または本サービスの提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="bg-slate-800 px-2 py-1 rounded text-xs text-slate-400">第10条</span>
              利用規約の変更
            </h2>
            <p>当社は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。なお、本規約の変更後、本サービスの利用を開始した場合には、当該ユーザーは変更後の規約に同意したものとみなします。</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="bg-slate-800 px-2 py-1 rounded text-xs text-slate-400">第11条</span>
              個人情報の取扱い
            </h2>
            <p>当社は、本サービスの利用によって取得する個人情報については、当社「プライバシーポリシー」に従い適切に取り扱うものとします。</p>
          </section>

           <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="bg-slate-800 px-2 py-1 rounded text-xs text-slate-400">第12条</span>
              準拠法・裁判管轄
            </h2>
            <p>本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄裁判所とします。</p>
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
