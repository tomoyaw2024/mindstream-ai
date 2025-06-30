# MindStream AI 開発ログ

## 2025-06-30

### 23:45 - Service Worker動的インポートエラー修正

#### 発見された問題
- Service Workerで `import()` 動的インポートが使えないエラー
- ES modulesの静的インポートも動作しない
- Chrome拡張機能のService WorkerはES module非対応

#### 実施した対応
1. **単一ファイルへの統合**
   - すべての必要なコードをservice-worker.jsに統合
   - モジュール化を廃止し、すべての機能を1つのファイルに
   - CONFIGオブジェクトも直接埋め込み

2. **manifest.json更新**
   - `"type": "module"`を削除（ES module非対応のため）

#### 技術的詳細
- Chrome拡張機能のService WorkerはES modulesをサポートしていない
- 必要な機能（YouTube API、Gemini API、ストレージ管理）をすべて1つのファイルに統合
- APIキーはservice-worker.js内のCONFIGオブジェクトに直接設定する必要がある

### 23:00-23:30 - YouTubeライブ対応実装

#### 実装内容
1. **実際のAPI連携の復活**
   - Service WorkerでYouTube API & Gemini APIの呼び出し実装
   - エラーハンドリングの強化
   - APIキー未設定時はサンプルデータにフォールバック

2. **YouTubeライブ配信対応**
   - ライブチャットAPI（liveChatMessages）の統合
   - `/live/VIDEO_ID`形式のURLサポート
   - ライブ配信検出とキャッシュ無効化
   - スーパーチャット、モデレーター識別

3. **クイックスタートガイド作成**
   - 3分で始められる設定手順
   - 明日のライブ配信での使い方
   - トラブルシューティング

#### 技術的な工夫
- **ライブチャットとコメントの統一処理**
  - 異なるAPIレスポンスを共通フォーマットに変換
  - ライブ特有の情報（スーパーチャット等）も保持

- **パフォーマンス最適化**
  - ライブ動画はキャッシュしない
  - 最大200件のコメントに制限
  - バッチ処理でGemini APIの負荷軽減

#### 明日のライブに向けて
- 益田先生のライブ配信で実際に使用可能
- コメントの自動分類で質問の傾向を把握
- 緊急度の高いコメントを優先表示

## 2025-06-30

### 22:30-23:00 - セキュリティ緊急対応

#### 発見された問題
1. **APIキー露出**
   - 本物のAPIキーがconfig.jsにハードコード
   - GitHubプッシュ前に発見（幸運）

2. **Chrome拡張機能の設定エラー**
   - process.envが動作しない環境

3. **アイコンファイル不整合**
   - PNGが必要だがSVGのみ

#### 実施した対応
1. **APIキー対応**
   - config.jsからAPIキー削除
   - .env.local作成（ローカル用）
   - セキュリティガイド作成

2. **Chrome拡張機能修正**
   - process.env参照を削除
   - 固定URLに変更

3. **アイコン対応**
   - manifest.jsonで一時的にコメントアウト
   - PNG生成ガイド作成

#### 学んだ教訓
- APIキーは最初から適切に管理すべき
- Chrome拡張機能の制約を事前に確認
- セキュリティは後回しにしない

### 22:00-22:30 - Cloud Functions統合

#### 実装内容
1. **Cloud Functions バックエンド追加**
   - functions/ディレクトリ構造の作成
   - キャッシュAPI（/api/cache）の実装
   - 統計情報API（/api/stats）の実装
   - Firestore連携の設定

2. **Chrome拡張機能の改修**
   - Cloud Functionsキャッシュの優先読み込み
   - 統計情報の自動送信
   - フォールバック処理の実装

3. **ハッカソン必須条件のクリア**
   - Google Cloud アプリケーション関連サービス（Cloud Functions）の利用
   - Chrome拡張機能とクラウドサービスの連携実現

#### 技術的決定
- **Cloud Functionsを選択した理由**
  - 最小限の実装でハッカソン要件をクリア
  - サーバーレスでスケーラブル
  - 既存のChrome拡張機能への変更が最小限

### 21:00-22:00 - プロジェクト開始とMVP実装

#### 実装内容
1. **プロジェクト基盤構築**
   - ディレクトリ構造の作成
   - manifest.json（Chrome Extension Manifest V3）の設定
   - 基本的なファイル構成の確立

2. **API統合の実装**
   - YouTube Data API v3 クライアント
     - コメント取得機能（最大200件）
     - ページネーション対応
   - Gemini 2.5 Flash API統合
     - 医療コメント専用のプロンプトエンジニアリング
     - ローカルクラスタリングフォールバック

3. **Chrome拡張機能のコア実装**
   - Content Script: YouTubeページへのUI注入
   - Service Worker: API通信とキャッシュ管理
   - Shadow DOM使用によるスタイル隔離

4. **薬機法対応**
   - medical-compliance.jsの実装
   - 禁止表現の検出機能
   - 免責事項の自動表示

#### 重要な技術的決定

##### Chrome Extension Manifest V3の採用
- **理由**: 2024年以降の新規拡張機能はV3必須
- **影響**: background.jsの代わりにService Workerを使用
- **対応**: 動的インポートによるモジュール読み込み

##### Shadow DOMの使用
- **理由**: YouTubeのスタイルとの競合を防ぐ
- **実装**: content.jsでShadow Rootを作成
- **利点**: 完全なスタイル隔離を実現

##### Gemini 2.5 Flashの選択
- **理由**: 高速処理とコスト効率
- **代替案**: Gemini Proは精度は高いが遅い
- **結果**: ユーザー体験を優先

#### 学んだこと

1. **Chrome拡張機能の制約**
   - Service WorkerではDOM操作不可
   - Content ScriptとService Worker間の通信は非同期のみ
   - chrome.* APIは必ずtry-catchが必要

2. **医療情報の扱い**
   - 薬機法の制約は想像以上に厳格
   - 「効果がある」「治る」などの表現は完全NG
   - 免責事項は必須、目立つ位置に配置

3. **API制限への対応**
   - YouTube API: バッチ処理とキャッシュが重要
   - Gemini API: レート制限を考慮した実装
   - エラー時のフォールバック必須

#### トラブルシューティング

##### 問題1: ESモジュールのインポートエラー
```javascript
// 問題: Service WorkerでESモジュールが読み込めない
import config from './config.js'; // エラー

// 解決: 動的インポートを使用
const { default: config } = await import('./config.js');
```

##### 問題2: YouTube APIのCORS制限
```javascript
// 問題: Content ScriptからYouTube APIを直接呼べない
// 解決: Service Worker経由でAPI呼び出し
chrome.runtime.sendMessage({ action: 'analyzeVideo', videoId });
```

#### 次回への申し送り

1. **テスト優先事項**
   - 実際のYouTube動画での動作確認
   - 様々なコメント数での性能テスト
   - エラーケースの網羅的確認

2. **改善候補**
   - 検索機能の実装（現在UIのみ）
   - より詳細な体験談表示
   - コメントのリアルタイム更新

3. **注意事項**
   - APIキーは必ず環境変数化
   - 公開前に薬機法の専門家レビュー推奨
   - Chrome Web Store申請には追加ドキュメント必要

---

## 開発環境メモ

### 使用ツール
- エディタ: Claude Code
- ブラウザ: Google Chrome (最新版)
- 開発者ツール: Chrome DevTools

### APIバージョン
- YouTube Data API: v3
- Gemini API: v1beta (gemini-2.5-flash)
- Chrome Extension: Manifest V3

### 参考にしたリソース
1. [Chrome Extension公式ドキュメント](https://developer.chrome.com/docs/extensions/)
2. [YouTube Data API リファレンス](https://developers.google.com/youtube/v3)
3. [Gemini API ドキュメント](https://ai.google.dev/)
4. 薬機法ガイドライン（厚生労働省）

---
*このログは、開発の経緯と学びを記録し、将来の開発者の参考となることを目的としています。*