# MindStream AI - Cloud Functions Backend

このディレクトリには、MindStream AI Chrome拡張機能のバックエンドAPIが含まれています。

## 概要

Google Cloud Functionsを使用して、以下の機能を提供します：

- **キャッシュAPI** - 分析結果をFirestoreに保存し、API使用量を削減
- **統計API** - 利用統計情報の収集と表示

## エンドポイント

### `/api/cache`
- `GET ?videoId={videoId}` - キャッシュされた分析結果を取得
- `POST` - 新しい分析結果をキャッシュ

### `/api/stats`
- `GET` - 利用統計情報を取得
- `POST` - 統計情報を更新

### `/api/health`
- `GET` - ヘルスチェック

## セットアップ

### 1. Google Cloud CLIのインストール

```bash
# macOS
brew install google-cloud-sdk

# または公式インストーラー
curl https://sdk.cloud.google.com | bash
```

### 2. プロジェクトの設定

```bash
# ログイン
gcloud auth login

# プロジェクトの作成または選択
gcloud projects create mindstream-ai-hackathon
gcloud config set project mindstream-ai-hackathon

# 必要なAPIの有効化
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 3. Firestoreの初期化

```bash
# Firestoreを有効化
gcloud firestore databases create --location=asia-northeast1
```

### 4. デプロイ

```bash
# functionsディレクトリに移動
cd functions

# 依存関係のインストール
npm install

# Cloud Functionsにデプロイ
npm run deploy

# または手動でデプロイ
gcloud functions deploy mindstream-api \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --region=asia-northeast1 \
  --entry-point=mindstreamApi
```

## ローカル開発

```bash
# Functions Frameworkをインストール
npm install -g @google-cloud/functions-framework

# ローカルで実行
npx functions-framework --target=mindstreamApi --port=8080

# テスト
curl http://localhost:8080/api/health
```

## 環境変数

以下の環境変数を設定できます：

- `GCP_PROJECT` - Google Cloudプロジェクト名（デフォルト: mindstream-ai）

## Chrome拡張機能との連携

Chrome拡張機能の`src/utils/config.js`に以下を追加：

```javascript
// Cloud Functions URL
export const CLOUD_FUNCTIONS_URL = 'https://asia-northeast1-mindstream-ai-hackathon.cloudfunctions.net/mindstream-api';
```

## セキュリティ

- CORSが設定されており、どのオリジンからもアクセス可能
- 本番環境では、特定のドメインのみ許可するよう設定を変更してください

## トラブルシューティング

### デプロイエラー
```bash
# ログを確認
gcloud functions logs read mindstream-api --limit=50
```

### Firestore権限エラー
```bash
# サービスアカウントに権限を付与
gcloud projects add-iam-policy-binding mindstream-ai-hackathon \
  --member="serviceAccount:mindstream-ai-hackathon@appspot.gserviceaccount.com" \
  --role="roles/datastore.user"
```