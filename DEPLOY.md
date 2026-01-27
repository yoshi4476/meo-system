# 🔰 初心者向け：システム公開（デプロイ）完全ガイド

このガイドでは、あなたがこの画面（Antigravity）で作った「MEO Mastermind AI」システムを、インターネット上に公開する手順を説明します。
専門用語をなるべく使わず、一つずつ丁寧に解説します。

---

## 🛠 ステップ1：必要なアカウントの準備（最初だけ）

作業を始める前に、以下の3つのサービスに登録してください（すべて無料で使えます）。

1. **GitHub（ギットハブ）**
   - **役割**: プログラムの「倉庫」。Antigravityで作ったコードをここに保存します。
   - **登録**: https://github.com/

2. **Render（レンダー）**
   - **役割**: システムの「頭脳（バックエンド）」を動かす場所。
   - **登録**: https://render.com/

3. **Vercel（バーセル）**
   - **役割**: システムの「顔（フロントエンド）」を動かす場所。
   - **登録**: https://vercel.com/

---

## 📦 ステップ2：作成したコードをGitHubに保存する

ここが一番重要なステップです。AntigravityにあるコードをGitHubの倉庫に送ります。

### 1. GitHubで新しい倉庫（リポジトリ）を作る

1. [GitHub](https://github.com/) にログインします。
2. 画面右上にある **「+」アイコン** をクリックし、**「New repository」** を選びます。
3. **Repository name**（倉庫の名前）に `meo-system` と入力します（好きな名前でOK）。
4. **Public**（誰でも見れる）か **Private**（自分だけ見れる）を選びます。
   - ※特に理由がなければ「Private」が安心です。
5. 画面一番下の **「Create repository」** ボタンを押します。
6. 次の画面に表示されるURL（例: `https://github.com/yourname/meo-system.git`）をコピーしておきます。

### 2. Antigravityからコードを送信する

ここでの操作を行います。画面下部にある「ターミナル」を使います。
（見当たらない場合は、キーボードの `Ctrl` + `J` を押すと表示されます）

ターミナルに、以下のコマンドを**1行ずつコピーして貼り付け、Enterキーを押して**実行してください。

```bash
# 1. 準備（初期化）
git init

# 2. 全てのファイルを「送るもの」として指定
git add .

# 3. 変更を記録（名前を付けて保存するイメージ）
git commit -m "初回アップロード"

# 4. 送り先のGitHub倉庫を登録
# ※以下のURLは、さっきGitHubでコピーした自分のURLに書き換えてください！
git remote add origin https://github.com/あなたのユーザー名/meo-system.git

# 5. インターネット上の倉庫へ送信（プッシュ）
git push -u origin main
```

**⚠️ 注意：初めてGitHubを使う場合**
コマンドを実行すると、GitHubのユーザー名やパスワード（トークン）を求められることがあります。
その場合は画面の指示に従い、ブラウザで認証を行ってください。

> **🤖 難しいな、と思ったら？**
> コマンド操作が不安な場合は、チャットで私に**「GitHubに保存して」**と頼んでください！
> 私が代わりにコマンドを実行することもできます（認証はご自身で行う必要があります）。

---

## ⚙️ ステップ3：バックエンド（裏側の処理）を公開する

AI機能などが動く「バックエンド」を **Render** で動かします。

1. **Render** にログインし、ダッシュボード右上の「New +」→「**Web Service**」を選択。
2. 「Connect a repository」で、さっきアップロードした `meo-system` を選択して「Connect」。
3. 設定画面で以下のように入力します。

| 項目名             | 入力する内容                                   |
| :----------------- | :--------------------------------------------- |
| **Name**           | `meo-backend` （好きな名前）                   |
| **Region**         | `Singapore` （日本に近いのでおすすめ）         |
| **Branch**         | `main`                                         |
| **Root Directory** | `backend` 👈 **超重要！忘れずに入力！**        |
| **Runtime**        | `Python 3`                                     |
| **Build Command**  | `pip install -r requirements.txt`              |
| **Start Command**  | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

4. 画面下の「**Environment Variables**（環境変数）」に以下を追加します。

| Key（名前）            | Value（値）                                       |
| :--------------------- | :------------------------------------------------ |
| `PYTHON_VERSION`       | `3.11.0`                                          |
| `SECRET_KEY`           | `(適当な長い英数字)`                              |
| `GOOGLE_CLIENT_ID`     | `(GCPで取得したクライアントID)`                   |
| `GOOGLE_CLIENT_SECRET` | `(GCPで取得した秘密鍵)`                           |
| `GOOGLE_REDIRECT_URI`  | `https://(アプリ名).onrender.com/google/callback` |

- ※ `GOOGLE_REDIRECT_URI` は、Web Service作成後に決まるURLを使って後で修正します。

5. 「**Create Web Service**」をクリック。
   - しばらく待ち、緑色の「Live」になれば成功！
   - 画面左上のURL（例: `https://meo-backend-xxx.onrender.com`）をコピーしておきます。

---

## 🎨 ステップ4：フロントエンド（画面）を公開する

ユーザーが操作する画面を **Vercel** で動かします。

1. **Vercel** にログインし、「Add New...」→「Project」を選択。
2. 「Import Git Repository」から `meo-system` の「Import」を押す。
3. **Configure Project** 画面の設定：
   - **Root Directory** の「Edit」を押し、**`frontend`** を選択（これ重要です！）。
4. 「**Environment Variables**」を開き、以下を追加：
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `ステップ3でコピーしたバックエンドのURL` （末尾の / は無しでOK）
5. 「**Deploy**」ボタンを押す。
   - 花吹雪が舞えば成功！「Visit」で実際のサイトを見てみましょう。

---

## 🔗 ステップ5：最後の仕上げ（Google連携）

最後に、Googleログインが正しく動くように設定を更新します。

1. **Google Cloud Console**（https://console.cloud.google.com/）を開く。
2. 「APIとサービス」→「認証情報」へ。
3. 作成済みの「OAuth 2.0 クライアント ID」を編集（鉛筆マーク）。
4. 「**承認済みのリダイレクト URI**」に以下を追加して保存：
   - `https://(あなたのバックエンドURL).onrender.com/google/callback`

お疲れ様でした！これであなたのシステムは世界中に公開されました。
