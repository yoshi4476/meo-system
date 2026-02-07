'use client';

import { useDashboard } from '../../../../contexts/DashboardContext';

export default function UsageManualPage() {
  const { userInfo } = useDashboard();

  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto w-full max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">システム操作マニュアル</h1>
        <p className="text-slate-400">MEO Mastermind AIシステムの基本的な使い方を解説します。</p>
      </div>

      <div className="space-y-12 pb-20">
        
        {/* ■ はじめに */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-aurora-cyan border-b border-white/10 pb-2">1. Googleアカウント連携</h2>
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5 space-y-4">
            <p className="text-slate-300">
              システムを利用するには、まずGoogleビジネスプロフィール（GBP）を管理しているGoogleアカウントと連携する必要があります。
            </p>
            <ol className="list-decimal list-inside space-y-2 text-slate-300 ml-4">
              <li>サイドバーの「設定」ボタンをクリックします。</li>
              <li>「Googleアカウント連携」セクションの「Googleでログイン」ボタンをクリックします。</li>
              <li>Googleの認証画面が表示されるので、GBPを管理しているアカウントを選択し、すべての権限を許可してください。</li>
              <li>連携が完了すると、管理している店舗一覧が表示されます。</li>
            </ol>
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl">
              <p className="text-yellow-400 text-sm">
                ⚠ 注意: すべてのチェックボックスにチェックを入れて権限を許可しないと、正常に動作しません。
              </p>
            </div>
          </div>
        </section>

        {/* ■ ダッシュボード */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-aurora-cyan border-b border-white/10 pb-2">2. ダッシュボードの見方</h2>
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5 space-y-4">
             <p className="text-slate-300">
                ログイン直後の画面で、店舗の最新状況を一目で確認できます。
             </p>
             <ul className="list-disc list-inside space-y-2 text-slate-300 ml-4">
                <li><strong className="text-white">パフォーマンス概要:</strong> 検索数、閲覧数、アクション数（電話、ウェブサイトクリック等）の推移グラフ。</li>
                <li><strong className="text-white">最新のクチコミ:</strong> 最近投稿されたクチコミと、AIによる自動返信状況。</li>
                <li><strong className="text-white">タスク管理:</strong> 次に行うべきアクションの提案。</li>
             </ul>
          </div>
        </section>

        {/* ■ 投稿管理 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-aurora-cyan border-b border-white/10 pb-2">3. 投稿管理機能</h2>
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5 space-y-4">
            <p className="text-slate-300">
              Googleビジネスプロフィールの「最新情報」や「イベント」を投稿できます。AIを使って魅力的な文章を自動生成することも可能です。
            </p>
            <div className="grid md:grid-cols-2 gap-6">
                 <div>
                    <h3 className="text-lg font-bold text-white mb-2">新規投稿の作成</h3>
                    <ol className="list-decimal list-inside space-y-2 text-slate-300 bg-slate-900/50 p-4 rounded-xl">
                        <li>サイドバー「投稿管理」をクリック。</li>
                        <li>右上の「新規作成」ボタンをクリック。</li>
                        <li>写真を選択し、本文を入力します。<br/><span className="text-xs text-aurora-purple">※「AIで生成」ボタンを押すと、キーワードから文章を自動作成できます。</span></li>
                        <li>「投稿する」で即時公開、「予約する」で指定日時に自動公開されます。</li>
                    </ol>
                 </div>
                 <div>
                    <h3 className="text-lg font-bold text-white mb-2">AI自動生成のコツ</h3>
                    <ul className="list-disc list-inside space-y-2 text-slate-300 bg-slate-900/50 p-4 rounded-xl">
                        <li>「新ランチメニュー」「春のキャンペーン」など、具体的なキーワードを入力すると品質が向上します。</li>
                        <li>トーン（親しみやすい、フォーマル等）を選択して、お店の雰囲気に合わせましょう。</li>
                    </ul>
                 </div>
            </div>
          </div>
        </section>

        {/* ■ クチコミ管理 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-aurora-cyan border-b border-white/10 pb-2">4. クチコミ自動返信</h2>
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5 space-y-4">
            <p className="text-slate-300">
               寄せられたクチコミに対して、AIが内容を分析し、適切な返信案を自動生成・自動投稿します。
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-300 ml-4">
                <li><strong className="text-white">自動返信設定:</strong> 設定画面で「自動返信を有効にする」をONにすると、新規クチコミに対して5分〜1時間程度で自動返信が行われます。</li>
                <li><strong className="text-white">手動編集:</strong> 自動返信前に内容を確認したい場合は、「下書き保存」モード（今後のアップデートで追加予定）を利用するか、投稿後に修正してください。</li>
            </ul>
             <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
              <p className="text-blue-400 text-sm">
                ★ ポイント: 全てのクチコミに返信することで、Googleからの評価が高まり、MEO順位向上に繋がります。
              </p>
            </div>
          </div>
        </section>

        {/* ■ 店舗情報管理 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-aurora-cyan border-b border-white/10 pb-2">5. 店舗情報の編集</h2>
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5 space-y-4">
            <p className="text-slate-300">
               住所、電話番号、営業時間などの基本情報を編集し、Googleに即時反映させることができます。
            </p>
             <ol className="list-decimal list-inside space-y-2 text-slate-300 ml-4">
              <li>サイドバー「店舗情報」をクリック。</li>
              <li>変更したい項目（営業時間など）を編集します。</li>
              <li>右下の「保存してGoogleに反映」ボタンをクリック。</li>
              <li>数秒でGoogleビジネスプロフィールに変更が送信されます。</li>
            </ol>
            <p className="text-slate-400 text-sm mt-2">
                ※ Google側の審査により、反映まで時間がかかる場合があります（通常数分〜数時間）。
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
