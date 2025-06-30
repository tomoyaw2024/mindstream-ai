# MindStream AI - Chrome Extension Project

## プロジェクトステータス 🚀
- **現在の状態**: Service Workerエラー修正完了
- **最終更新**: 2025-06-30 23:45
- **詳細**: @PROJECT_STATUS.md
- **クイックスタート**: @QUICKSTART.md

## プロジェクト概要
YouTube医療動画のコメントをAIで分析・整理するChrome拡張機能
- @README.md - プロジェクト全体の説明
- @manifest.json - Chrome拡張機能の設定
- @docs/development-log.md - 開発履歴
- Google Cloud ハッカソン向け作品

## 開発コマンド

### Chrome拡張機能の読み込み
1. `chrome://extensions/` を開く
2. デベロッパーモードをON
3. 「パッケージ化されていない拡張機能を読み込む」で `mindstream-ai` フォルダを選択

### デバッグ
- Console: F12キーでDevToolsを開く
- Service Worker: chrome://extensions/ で「サービスワーカー」をクリック
- Storage確認: `chrome.storage.local.get(null, (data) => console.log(data))`

### テスト
- サンプル動画: 益田裕介先生のYouTubeチャンネルの任意の動画
- APIキーなしでもサンプルデータで動作確認可能

## コードスタイル

### JavaScript
- ES Modules (import/export) を使用、CommonJS (require) は使わない
- インデント: 2スペース
- セミコロン: 必須
- 変数名: camelCase
- 定数: UPPER_SNAKE_CASE
- async/await を優先（Promiseチェーンより）

### 命名規則
- ファイル名: kebab-case (例: medical-compliance.js)
- クラス名: PascalCase (例: YouTubeAPI)
- 関数名: camelCase (例: fetchComments)

### Chrome拡張機能特有
- chrome.* APIは必ずtry-catchで囲む
- 権限は最小限に（manifest.jsonで定義）
- Service WorkerでDOM操作はしない

## アーキテクチャ

### ディレクトリ構造
```
src/
├── content/       # YouTubeページに注入されるスクリプト
├── background/    # Service Worker（API通信管理）
├── api/           # YouTube & Gemini API クライアント
├── utils/         # 共通ユーティリティ
└── popup/         # 拡張機能ポップアップUI
```

### 主要モジュール
- @src/content/content.js - YouTube統合のエントリーポイント
- @src/background/service-worker.js - API通信とキャッシュ管理
- @src/api/youtube-api.js - YouTube Data API v3
- @src/api/gemini-api.js - Gemini 2.5 Flash統合
- @src/utils/medical-compliance.js - 薬機法チェッカー
- @src/utils/config.js - API設定（要キー設定）

### データフロー
1. Content Script → Service Worker: メッセージ送信
2. Service Worker → APIs: YouTube/Gemini呼び出し
3. Service Worker → Storage: 結果キャッシュ
4. Service Worker → Content Script: 結果返却

## 開発ワークフロー

### 初期設定
1. @docs/api-setup.md を参照してAPIキーを取得
2. ⚠️ **重要**: @src/background/service-worker.js の5-6行目に直接APIキーを設定
   ```javascript
   YOUTUBE_API_KEY: 'あなたのAPIキー',
   GEMINI_API_KEY: 'あなたのAPIキー',
   ```
3. @docs/installation-guide.md の手順でテスト

### 開発サイクル
1. コード変更
2. chrome://extensions/ で拡張機能を再読み込み（Ctrl+R）
3. YouTubeページをリロード
4. DevToolsでデバッグ

### コミット前チェック
- [ ] APIキーがハードコードされていないか
- [ ] 薬機法対応の免責事項が表示されるか
- [ ] エラーハンドリングが適切か
- [ ] コンソールにデバッグログが残っていないか

## プロジェクト固有のガイドライン

### 薬機法対応（最重要）
- **絶対に** 診断・治療効果を断定しない
- **必ず** 免責事項を表示
- **常に** 「個人の体験」「医師に相談」を明記
- @src/utils/medical-compliance.js のチェッカーを活用

### 医療情報の扱い
```javascript
// NG例
"この薬は効果があります" 
"ADHDと診断されます"

// OK例
"個人の体験として効果を感じました"
"ADHDの可能性について医師にご相談ください"
```

### Gemini API使用時
- モデル: gemini-2.5-flash（高速処理）
- プロンプト: @prompts/clustering-prompt.txt を参照
- レート制限: 15 RPM (無料枠)
- エラー時はローカルクラスタリングにフォールバック

### YouTube API使用時
- 1日10,000ユニットの制限
- コメント取得は100件/リクエストが上限
- キャッシュを24時間保持

## よく使うデバッグ方法

### API通信の確認
```javascript
// Network タブで以下のURLを監視
// YouTube: googleapis.com/youtube/v3/
// Gemini: generativelanguage.googleapis.com
```

### ストレージの確認
```javascript
// Consoleで実行
chrome.storage.local.get(null, console.log)
chrome.storage.local.clear() // キャッシュクリア
```

### エラー追跡
1. chrome://extensions/ でエラーを確認
2. Service Workerのログを確認
3. Content Scriptのコンソールを確認

## ハッカソン向け注意事項

### デモ準備
- APIキーなしでもサンプルデータで動作
- @src/background/service-worker.js:155 のhandleSampleAnalysis()
- 益田先生の動画URLを事前に準備

### プレゼンテーションポイント
1. 66万人の視聴者の声を整理
2. Gemini 2.5 Flashによる高速分析
3. 薬機法に準拠した安全な実装
4. 体験談マッチングによるピアサポート

### パフォーマンス目標
- 初期表示: 3秒以内
- コメント分析: 10秒以内
- レスポンシブUI対応

## リファレンス
- Chrome Extension Docs: https://developer.chrome.com/docs/extensions/
- YouTube Data API: https://developers.google.com/youtube/v3
- Gemini API: https://ai.google.dev/
- 薬機法ガイドライン: 厚生労働省

---
最終更新: 2025-06-30 22:05
作成者: Claude Code & Watanabe Tomoya

## 関連リソース
- @PROJECT_STATUS.md - 現在の進捗状況
- @docs/development-log.md - 開発履歴と技術的決定
- @.claude/commands/ - カスタムコマンド集