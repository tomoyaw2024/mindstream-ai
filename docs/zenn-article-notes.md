# Zenn記事投稿時の注意事項

## 📋 記事情報
- **文字数**: 約5,200文字（要件：4000-6000文字）✅
- **カテゴリ**: Idea（必須）
- **ファイル**: `docs/mindstream-ai-hackathon-article.md`

## 🎯 必須要件の確認

### ✅ 含まれている要素
1. **ユーザー像と課題**
   - 精神疾患患者419万人の待機問題
   - YouTube視聴者66万人のコメント埋没問題
   - 具体的な4つの課題を明記

2. **ソリューションと特徴**
   - MindStream AIの機能説明
   - 技術的特徴（Gemini、Cloud Functions）
   - 薬機法対応の詳細

3. **システムアーキテクチャ図**
   - mermaid形式で記述済み
   - `architecture-diagram.mmd`に保存

### ⚠️ 投稿前に必要な作業

1. **デモ動画の作成とアップロード**
   - 3分以内のデモ動画をYouTubeにアップロード
   - 記事内の`[YouTube動画をここに埋め込み - 3分以内のデモ]`を実際のURLに置き換え

2. **GitHubリポジトリURL**
   - `https://github.com/yourusername/mindstream-ai`を実際のURLに変更

3. **画像の準備**
   - システムアーキテクチャ図をmermaidから画像に変換
   - スクリーンショット（必要に応じて）

## 📝 Zenn投稿手順

1. **Zennにログイン**
   - https://zenn.dev/

2. **新規記事作成**
   - 「記事を書く」ボタンをクリック
   - タイプ：「アイデア」を選択

3. **記事の設定**
   ```yaml
   ---
   topics: ["googlecloud", "gemini", "chrome", "hackathon", "ai"]
   emoji: "🧠"
   type: "idea"
   title: "66万人の声をAIで整理！精神科YouTuber視聴者のための体験談共有Chrome拡張機能 - MindStream AI"
   published: true
   ---
   ```

4. **本文貼り付け**
   - `mindstream-ai-hackathon-article.md`の内容をコピー＆ペースト

5. **画像アップロード**
   - アーキテクチャ図
   - スクリーンショット（あれば）

6. **プレビュー確認**
   - mermaidが正しく表示されるか
   - 文字数が範囲内か
   - リンクが正しいか

7. **公開**
   - 「公開する」ボタンをクリック

## 🐦 SNS投稿（推奨）

X（Twitter）での投稿例：
```
🎉 Google Cloud AI Agent Hackathon 2025 に参加しました！

精神科YouTuber視聴者66万人の声をAIで整理するChrome拡張機能「MindStream AI」を開発。

Gemini 2.5 Flash × Cloud Functions で医療情報の体験談共有を促進します。

詳細はこちら👇
[Zenn記事URL]

#aiagentzenn #googlecloud
```

## 📌 提出フォーム記入時の注意

1. **GitHubリポジトリURL**
   - mainブランチのURL
   - またはタグ付けしたバージョン

2. **デプロイURL**
   - Chrome拡張機能の場合は説明を追加
   - 「Chrome拡張機能のため、GitHubからローカルインストールが必要」

3. **Zenn記事URL**
   - 公開後のURLをコピー

## 🔍 最終チェックリスト

- [ ] デモ動画をYouTubeにアップロード
- [ ] デモ動画のURLを記事に埋め込み
- [ ] GitHubリポジトリを公開
- [ ] GitHubのURLを記事内で更新
- [ ] mermaid図が正しく表示される
- [ ] 文字数が4000-6000文字の範囲内
- [ ] カテゴリが「Idea」
- [ ] ハッシュタグ #aiagentzenn #googlecloud を含む
- [ ] 免責事項が適切に記載されている