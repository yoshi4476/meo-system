from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models, schemas, auth
from routers import gbp, posts, reviews, admin, locations, insights, media, qa, ai, bulk, reports, sync, optimization, messages
from datetime import timedelta

models.Base.metadata.create_all(bind=engine)

# Run DB Migration (Add store_id if missing)
try:
    import migrate_db
    print("DEBUG: Running DB migration... Version 1.0.2")
    migrate_db.migrate()
except Exception as e:
    print(f"WARNING: DB Migration failed: {e}")

API_DESCRIPTION = """
## MEO Mastermind AI API 🚀

Googleビジネスプロフィール（GBP）を最大限に活用するためのAI駆動型MEO管理APIです。

---

## 📋 セットアップガイド

### 1️⃣ Google Cloud Console プロジェクト作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 「新しいプロジェクト」をクリック
3. プロジェクト名を入力（例: `MEO-Mastermind-AI`）
4. 「作成」をクリック

### 2️⃣ My Business API の有効化

1. [APIライブラリ](https://console.cloud.google.com/apis/library) を開く
2. 以下のAPIを検索して有効化
   - **My Business Business Information API**
   - **My Business Account Management API**

### 3️⃣ OAuth 同意画面の設定

1. [OAuth同意画面](https://console.cloud.google.com/apis/credentials/consent) を開く
2. ユーザータイプ 「外部」を選択
3. 入力項目:
   - アプリ名: `MEO Mastermind AI`
   - サポートメール: あなたのメールアドレス
4. スコープを追加: `https://www.googleapis.com/auth/business.manage`

### 4️⃣ OAuth クライアントID の作成

1. [認証情報](https://console.cloud.google.com/apis/credentials) を開く
2. 「認証情報を作成」→「OAuthクライアントID」
3. タイプ: ウェブアプリケーション
4. 承認済みリダイレクトURI: `http://localhost:8001/google/callback`
5. **クライアントID** と **クライアントシークレット** をメモ

### 5️⃣ 環境変数の設定

バックエンドに `.env` ファイルを作成:
```
GOOGLE_CLIENT_ID=取得したクライアントID
GOOGLE_CLIENT_SECRET=取得したクライアントシークレット
GOOGLE_REDIRECT_URI=http://localhost:8001/google/callback
SECRET_KEY=ランダムな文字列
```

### 6️⃣ MEO Mastermind AI での連携手順

1. 設定→「Googleでログインして連携」をクリック
2. Googleアカウントでログイン
3. 権限を許可
4. 「接続済み」と表示されれば完了

---

## 🔐 API認証（このページの使い方面

### ステップ1: ユーザー作成
`POST /users/` でユーザーを作成

### ステップ2: トークン取得
`POST /token` でアクセストークンを取得

### ステップ3: Authorize
画面右上の **「Authorize」** ボタンをクリックし、ユーザー名・パスワードを入力

---

## 🔧 トラブルシューティング

| エラー | 原因 | 解決策 |
|--------|------|--------|
| `redirect_uri_mismatch` | リダイレクトURIが不一致 | Google Consoleの設定を確認 |
| `Not authenticated` | 認証されていない | Authorizeボタンでログイン |
| `403 Forbidden` | 権限不足 | SUPER_ADMINロールが必要 |

---

## 🎯 主要機能

* **Google連携** - OAuth 2.0による安全なGoogleアカウント連携
* **投稿管理** - 投稿の作成、編集、予約、GBPへの公開
* **クチコミ管理** - クチコミの同期と返信
* **インサイト分析** - パフォーマンスデータの取得と分析

## 👥 ロール

* `SUPER_ADMIN` - 最高管理者（すべての機能にアクセス可能）
* `COMPANY_ADMIN` - 企業管理者
* `STORE_USER` - 店舗ユーザー
"""


app = FastAPI(
    title="MEO Mastermind AI API",
    description=API_DESCRIPTION,
    version="1.0.0",
    contact={
        "name": "MEO Support",
        "email": "support@meo-mastermind.com",
    },
    license_info={
        "name": "Proprietary",
    },
)

# CORS Configuration
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://meo-system-act.vercel.app", 
    "https://meo-backend-xoeo.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(gbp.router)
app.include_router(posts.router)
app.include_router(reviews.router)
app.include_router(admin.router)
app.include_router(locations.router)
app.include_router(insights.router)
app.include_router(media.router)
app.include_router(qa.router)
app.include_router(ai.router)
app.include_router(bulk.router)
app.include_router(reports.router)
app.include_router(sync.router)
app.include_router(optimization.router)
app.include_router(messages.router)
from routers import debug
app.include_router(debug.router)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # 1. Email Uniqueness Check
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 2. Super Admin Limit Check
    if user.role == "SUPER_ADMIN":
        existing_super_admin = db.query(models.User).filter(models.User.role == "SUPER_ADMIN").first()
        if existing_super_admin:
             raise HTTPException(
                 status_code=400, 
                 detail="A Super Admin already exists. Only one is allowed per system."
             )

    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(email=user.email, role=user.role, hashed_password=hashed_password, is_active=True)
    
    # Optional context-assignment if requester is logged in (future enhancement)
    # For now, company_id/store_id must be assigned by Admin via update
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/users/", response_model=list[schemas.User])
def read_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    print(f"DEBUG: read_users requested by {current_user.email} ({current_user.role})")
    
    if current_user.role == "SUPER_ADMIN":
        # Super Admin sees everyone
        users = db.query(models.User).offset(skip).limit(limit).all()
        return users
        
    elif current_user.role == "COMPANY_ADMIN":
        # Company Admin sees users in their company
        if not current_user.company_id:
             return [current_user] # Fallback if no company assigned
             
        users = db.query(models.User).filter(
            models.User.company_id == current_user.company_id
        ).offset(skip).limit(limit).all()
        return users
        
    else:
        # Regular user sees only themselves
        # Or return empty list/403 depending on UX. Returning self for now.
        return [current_user]

@app.get("/")
def read_root():
    return {"message": "Welcome to MEO Mastermind AI API"}
