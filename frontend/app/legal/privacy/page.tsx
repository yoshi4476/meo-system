import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 flex justify-center">
      <div className="max-w-4xl w-full bg-slate-900 p-12 rounded-2xl border border-slate-800 shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-2 border-b-2 border-slate-700 pb-4">プライバシーポリシー</h1>
        <p className="text-slate-400 text-sm mb-8 text-right">最終更新日: 2024年10月1日</p>
        
        <div className="space-y-8 text-sm leading-relaxed text-slate-300">
          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. 個人情報の定義</h2>
            <p>「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報（個人識別情報）を指します。</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. 個人情報の収集方法</h2>
            <p>当社は、ユーザーが利用登録をする際に氏名、会社名、住所、電話番号、メールアドレス、クレジットカード番号などの個人情報をお尋ねすることがあります。また、ユーザーと提携先などとの間でなされたユーザーの個人情報を含む取引記録や決済に関する情報を、当社の提携先（情報提供元、広告主、広告配信先などを含みます。）から収集することがあります。</p>
            <p className="mt-2">特に、Googleアカウントとの連携に際しては、以下の情報を取得・保存します。</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-400">
              <li>Googleユーザープロフィール情報（氏名、メールアドレス、プロフィール画像）</li>
              <li>Googleビジネスプロフィールに関連する店舗情報、インサイトデータ、投稿データ、口コミデータ</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. 個人情報の利用目的</h2>
            <p>当社が個人情報を収集・利用する目的は、以下のとおりです。</p>
            <ol className="list-decimal pl-5 mt-2 space-y-1 marker:text-slate-500">
              <li>本サービスの提供・運営のため</li>
              <li>ユーザーからのお問い合わせに回答するため（本人確認を行うことを含む）</li>
              <li>AIを用いた投稿生成および口コミ返信生成の精度向上のため（個人を特定しない統計データとして利用）</li>
              <li>メンテナンス、重要なお知らせなど必要に応じたご連絡のため</li>
              <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため</li>
              <li>有料プランにおいて、利用料金を請求するため</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. 個人情報の第三者提供</h2>
            <p>当社は、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-400">
              <li>法令に基づく場合</li>
              <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
              <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. セキュリティ対策</h2>
            <p>当社は、取り扱う個人情報の漏洩、滅失またはき損の防止その他の個人情報の安全管理のために必要かつ適切な措置を講じます。また、SSL（Secure Sockets Layer）技術を用いて通信を暗号化し、第三者による盗聴や改ざんを防止しています。</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. お問い合わせ窓口</h2>
            <p>本ポリシーに関するお問い合わせは、ダッシュボード内の「お問い合わせ」フォームよりお願いいたします。</p>
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
