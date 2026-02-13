'use client';

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
              <li>アクセストークンおよびリフレッシュトークン（API連携のため）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. 個人情報の利用目的</h2>
            <p>当社が個人情報を収集・利用する目的は、以下のとおりです。</p>
            <ol className="list-decimal pl-5 mt-2 space-y-1 marker:text-slate-500">
              <li>本サービスの提供・運営のため</li>
              <li>ユーザーからのお問い合わせに回答するため（本人確認を行うことを含む）</li>
              <li>ユーザーが利用するサービスの更新情報、キャンペーン告知、その他当社が提供するサービスのお知らせを送付するため</li>
              <li>AIを用いた投稿生成および口コミ返信生成の精度向上のため（個人を特定しない統計データとして利用）</li>
              <li>メンテナンス、重要なお知らせなど必要に応じたご連絡のため</li>
              <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため</li>
              <li>ユーザー自身の登録情報の閲覧や変更、削除、ご利用状況の閲覧を行っていただくため</li>
              <li>有料プランにおいて、利用料金を請求するため</li>
              <li>上記の利用目的に付随する目的</li>
            </ol>
          </section>
          
          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. Google User Data Policyの遵守</h2>
            <p>本サービスはGoogle APIを利用しており、Google User Data Policyを遵守します。</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-400">
                <li>本サービスがGoogle APIを通じて取得したデータは、本サービスの機能提供（投稿管理、口コミ管理、インサイト分析など）のためにのみ使用されます。</li>
                <li>取得したデータを、広告目的で第三者に転送・販売することはありません。</li>
                <li>ユーザーはいつでもGoogleアカウントの連携を解除し、当社のデータベースから関連データを削除するよう要求することができます。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. 個人情報の第三者提供</h2>
            <p>当社は、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。ただし、個人情報保護法その他の法令で認められる場合を除きます。</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-400">
              <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
              <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき</li>
              <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき</li>
              <li>予め次の事項を告知あるいは公表し、かつ当社が個人情報保護委員会に届出をしたとき
                  <ul className="list-disc pl-5 mt-1">
                      <li>利用目的に第三者への提供を含むこと</li>
                      <li>第三者に提供されるデータの項目</li>
                      <li>第三者への提供の手段または方法</li>
                      <li>本人の求めに応じて個人情報の第三者への提供を停止すること</li>
                      <li>本人の求めを受け付ける方法</li>
                  </ul>
              </li>
            </ul>
             <p className="mt-2 text-slate-400">前項の定めにかかわらず、次に掲げる場合には、当該情報の提供先は第三者に該当しないものとします。</p>
             <ul className="list-disc pl-5 mt-1 text-slate-400">
                  <li>当社が利用目的の達成に必要な範囲内において個人情報の取扱いの全部または一部を委託する場合</li>
                  <li>合併その他の事由による事業の承継に伴って個人情報が提供される場合</li>
                  <li>個人情報を特定の者との間で共同して利用する場合であって、その旨並びに共同して利用される個人情報の項目、共同して利用する者の範囲、利用する者の利用目的および当該個人情報の管理について責任を有する者の氏名または名称について、あらかじめ本人に通知し、または本人が容易に知り得る状態に置いた場合</li>
             </ul>
          </section>
          
          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. 個人情報の開示</h2>
            <p>当社は、本人から個人情報の開示を求められたときは、本人に対し、遅滞なくこれを開示します。ただし、開示することにより次のいずれかに該当する場合は、その全部または一部を開示しないこともあり、開示しない決定をした場合には、その旨を遅滞なく通知します。</p>
             <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-400">
                  <li>本人または第三者の生命、身体、財産その他の権利利益を害するおそれがある場合</li>
                  <li>当社の業務の適正な実施に著しい支障を及ぼすおそれがある場合</li>
                  <li>その他法令に違反することとなる場合</li>
             </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. 個人情報の訂正および削除</h2>
            <p>ユーザーは、当社の保有する自己の個人情報が誤った情報である場合には、当社が定める手続きにより、当社に対して個人情報の訂正、追加または削除（以下、「訂正等」といいます。）を請求することができます。当社は、ユーザーから前項の請求を受けてその請求に応じる必要があると判断した場合には、遅滞なく、当該個人情報の訂正等を行うものとします。当社は、訂正等を行った場合、または訂正等を行わない旨の決定をしたときは遅滞なく、これをユーザーに通知します。</p>
          </section>

           <section>
            <h2 className="text-lg font-bold text-white mb-3">8. 個人情報の利用停止等</h2>
            <p>当社は、本人から、個人情報が、利用目的の範囲を超えて取り扱われているという理由、または不正の手段により取得されたものであるという理由により、その利用の停止または消去（以下、「利用停止等」といいます。）を求められた場合には、遅滞なく必要な調査を行います。調査結果に基づき、その請求に応じる必要があると判断した場合には、遅滞なく、当該個人情報の利用停止等を行います。当社は、利用停止等を行った場合、または利用停止等を行わない旨の決定をしたときは、遅滞なく、これをユーザーに通知します。</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">9. クッキー（Cookie）の利用</h2>
            <p>当社のウェブサイトでは、ユーザーの利便性向上のためにクッキーを利用することがあります。クッキーとは、ウェブサーバーからユーザーのブラウザに送信される小規模なデータのことです。ユーザーは、ブラウザの設定によりクッキーの受け取りを拒否することができますが、その場合、本サービスの一部が利用できなくなることがあります。</p>
            <p className="mt-2">また、本サービスでは、利用状況を把握するためにGoogle Analytics等の解析ツールを利用する場合があります。これらはクッキーを使用してデータを収集しますが、個人を特定する情報は含まれません。</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">10. プライバシーポリシーの変更</h2>
            <p>本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ユーザーに通知することなく、変更することができるものとします。当社が別途定める場合を除いて、変更後のプライバシーポリシーは、本ウェブサイトに掲載したときから効力を生じるものとします。</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">11. お問い合わせ窓口</h2>
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
