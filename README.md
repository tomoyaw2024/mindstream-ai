# MindStream AI

YouTube医療動画のコメントを整理し、視聴者の体験談を共有しやすくするChrome拡張機能

🚀 **[クイックスタート](QUICKSTART.md)** | 📊 **[プロジェクトステータス](PROJECT_STATUS.md)** | 📝 **[開発ログ](docs/development-log.md)** | 🔐 **[セキュリティガイド](docs/security-guide.md)**

## 🎯 概要

MindStream AIは、精神科医YouTuber（特に益田裕介先生）の動画コメントを、Gemini 2.5 Flashを使用して自動的に分析・分類します。66万人の視聴者の声を整理し、似た悩みを持つ人々がつながりやすくなることを目指しています。

Google Cloud Functionsを活用し、分析結果のキャッシュと統計情報の収集を行い、パフォーマンスとユーザー体験を向上させています。

## ✨ 主な機能

- **コメントクラスタリング**: AIが話題ごとにコメントを自動分類
- **体験談マッチング**: 似た体験を持つ人のコメントを発見
- **医療情報の信頼性担保**: 薬機法に準拠した適切な表現
- **リアルタイム分析**: 動画を開くと自動でコメント分析開始
- **クラウドキャッシュ**: Cloud Functionsで分析結果を共有
- **利用統計**: 分析回数やコメント数の統計情報収集

## 🏗️ アーキテクチャ

### フロントエンド（Chrome拡張機能）
- **Content Script**: YouTubeページへのUI注入（Shadow DOM）
- **Service Worker**: API通信とキャッシュ管理
- **Popup UI**: 設定画面

### バックエンド（Google Cloud）
- **Cloud Functions**: 分析結果のキャッシュと統計API
- **Firestore**: データ永続化
- **Gemini API**: コメントの自動分類
- **YouTube Data API**: コメント取得

## 🚀 インストール方法

### 開発版のインストール

1. このリポジトリをクローン
```bash
git clone https://github.com/yourusername/mindstream-ai.git
cd mindstream-ai
```

2. APIキーの設定
   - `src/utils/config.js`を開く
   - `YOUR_YOUTUBE_API_KEY`を実際のYouTube Data API v3のキーに置き換え
   - `YOUR_GEMINI_API_KEY`を実際のGemini APIキーに置き換え

3. Chrome拡張機能として読み込み
   - Chromeで `chrome://extensions/` を開く
   - 「デベロッパーモード」を有効化
   - 「パッケージ化されていない拡張機能を読み込む」をクリック
   - `mindstream-ai`フォルダを選択

## 🔧 必要なAPIキー

### YouTube Data API v3
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成
3. YouTube Data API v3を有効化
4. 認証情報を作成（APIキー）

### Gemini API
1. [Google AI Studio](https://makersuite.google.com/app/apikey)にアクセス
2. APIキーを生成
3. Gemini 2.5 Flashモデルへのアクセスを確認

## 📱 使い方

1. YouTubeで益田先生（または他の医療系YouTuber）の動画を開く
2. 右側にMindStream AIパネルが自動表示
3. コメントの分析結果がクラスターごとに表示
4. 気になる話題をクリックで詳細表示

## ⚖️ 薬機法対応

本ツールは以下の点で薬機法に準拠しています：

- 診断・治療効果の断定的表現を避ける
- 医療行為の代替となることを示唆しない
- 常に免責事項を表示
- 「参考情報」「体験談」であることを明確化

## 🔒 プライバシーとセキュリティ

- コメント投稿者の個人情報は収集しません
- 分析結果は24時間でキャッシュから削除
- すべての通信はHTTPSで暗号化

## 🤝 貢献方法

1. このリポジトリをフォーク
2. 新しいブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

MIT License - 詳細は[LICENSE](LICENSE)ファイルを参照

## ⚠️ 免責事項

このツールは医療情報の整理を支援するものであり、医療行為や診断を行うものではありません。健康に関する判断は必ず医師にご相談ください。緊急時は迷わず119番通報してください。

## 📞 お問い合わせ

- Issue: [GitHub Issues](https://github.com/yourusername/mindstream-ai/issues)
- Email: support@mindstream-ai.example.com

---

Made with ❤️ for Google AI Hackathon 2025