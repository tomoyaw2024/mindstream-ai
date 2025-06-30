# API設定ガイド

MindStream AIを使用するには、以下の2つのAPIキーが必要です。

## 1. YouTube Data API v3の設定

### ステップ1: Google Cloud Projectの作成

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 「プロジェクトを作成」をクリック
3. プロジェクト名を入力（例: "MindStream-AI"）
4. 作成をクリック

### ステップ2: YouTube Data API v3の有効化

1. 左側メニューから「APIとサービス」→「ライブラリ」を選択
2. 検索バーに「YouTube Data API v3」と入力
3. 検索結果から「YouTube Data API v3」をクリック
4. 「有効にする」ボタンをクリック

### ステップ3: APIキーの作成

1. 左側メニューから「APIとサービス」→「認証情報」を選択
2. 「認証情報を作成」→「APIキー」をクリック
3. 作成されたAPIキーをコピー
4. 「キーを制限」をクリックして制限を設定

### ステップ4: APIキーの制限（推奨）

1. アプリケーションの制限で「HTTPリファラー」を選択
2. 以下のURLを追加：
   - `https://www.youtube.com/*`
   - `chrome-extension://*` （拡張機能用）
3. API制限で「YouTube Data API v3」のみを選択
4. 保存

## 2. Gemini APIの設定

### ステップ1: Google AI Studioへアクセス

1. [Google AI Studio](https://makersuite.google.com/)にアクセス
2. Googleアカウントでログイン

### ステップ2: APIキーの取得

1. 左側メニューから「Get API key」を選択
2. 「Create API key」をクリック
3. 既存のプロジェクトを選択するか、新規作成
4. 生成されたAPIキーをコピー

### ステップ3: モデルアクセスの確認

1. Google AI Studioで「gemini-2.5-flash」モデルが利用可能か確認
2. 利用制限（RPM: Requests Per Minute）を確認

## 3. 拡張機能への設定

### config.jsファイルの更新

```javascript
// src/utils/config.js
const CONFIG = {
  YOUTUBE_API_KEY: 'あなたのYouTube APIキー',
  GEMINI_API_KEY: 'あなたのGemini APIキー',
  // 他の設定...
};
```

### 環境変数の使用（推奨）

本番環境では、APIキーを直接コードに記述せず、環境変数を使用することを推奨します。

```javascript
// 環境変数から読み込む例
const CONFIG = {
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || 'デフォルト値',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'デフォルト値',
};
```

## 4. APIの使用制限と料金

### YouTube Data API v3

- **無料枠**: 1日あたり10,000ユニット
- **コメント取得**: 1リクエストあたり1ユニット
- **推奨**: バッチ処理とキャッシュの活用

### Gemini API

- **無料枠**: 
  - gemini-2.5-flash: 15 RPM (Requests Per Minute)
  - 1日あたり1,500リクエスト
- **料金**: 無料枠を超えた場合は従量課金

## 5. トラブルシューティング

### よくあるエラー

1. **401 Unauthorized**
   - APIキーが正しく設定されているか確認
   - APIが有効化されているか確認

2. **403 Forbidden**
   - APIキーの制限設定を確認
   - 使用量制限に達していないか確認

3. **429 Too Many Requests**
   - レート制限に達している
   - リトライロジックの実装を検討

### デバッグ方法

1. Chrome DevToolsのConsoleでエラーを確認
2. Network タブでAPIリクエストの詳細を確認
3. `chrome://extensions/`で拡張機能のエラーを確認

## 6. セキュリティのベストプラクティス

1. **APIキーの保護**
   - GitHubなどのパブリックリポジトリにAPIキーをコミットしない
   - `.gitignore`に設定ファイルを追加

2. **最小権限の原則**
   - 必要なAPIのみを有効化
   - APIキーには必要最小限の権限のみ付与

3. **定期的な更新**
   - APIキーを定期的にローテーション
   - 使用していないAPIキーは削除

---

設定に関する質問は、[GitHub Issues](https://github.com/yourusername/mindstream-ai/issues)までお願いします。