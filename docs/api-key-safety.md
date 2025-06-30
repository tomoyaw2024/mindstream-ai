# APIキーの安全な設定方法

明日のライブで使うためのAPIキー設定ガイドです。

## 🔐 安全な設定手順

### 1. ⚠️ 重要な変更

技術的な制約により、APIキーは`src/background/service-worker.js`に直接設定する必要があります。

### 2. APIキーの設定

`src/background/service-worker.js`を開いて5-6行目を編集：

```javascript
const CONFIG = {
  YOUTUBE_API_KEY: 'ここにYouTube APIキーを貼り付け',
  GEMINI_API_KEY: 'ここにGemini APIキーを貼り付け',
  // 他の設定はそのまま
};
```

**注意**: このファイルは.gitignoreに含まれていないため、APIキーを設定したらGitHubにプッシュしないよう特に注意してください。

### 3. 設定の確認

APIキーが正しく設定されているか確認：

```javascript
// F12でConsoleを開いて実行
console.log('YouTube API configured:', CONFIG.YOUTUBE_API_KEY !== 'YOUR_YOUTUBE_API_KEY');
console.log('Gemini API configured:', CONFIG.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY');
```

## ⚠️ セキュリティ注意事項

### やってはいけないこと

1. **GitHubにプッシュしない**
   - config.jsは.gitignoreに含まれています
   - 誤ってコミットした場合は即座にAPIキーを無効化

2. **APIキーを他人と共有しない**
   - スクリーンショットに含めない
   - 配信中に表示しない

3. **公開の場所に保存しない**
   - クラウドストレージ
   - 公開フォルダ

### 推奨事項

1. **使用後はAPIキーを削除**
   ```javascript
   // 使用後
   YOUTUBE_API_KEY: 'YOUR_YOUTUBE_API_KEY',
   GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY',
   ```

2. **APIキーに制限を設定**
   - Google Cloud Consoleで使用量制限
   - 特定のドメインからのみ許可

3. **定期的にAPIキーを更新**
   - 月1回程度の更新を推奨

## 🚨 緊急時の対応

### APIキーが漏洩した場合

1. **即座に無効化**
   - [Google Cloud Console](https://console.cloud.google.com/)
   - [Google AI Studio](https://makersuite.google.com/)

2. **新しいAPIキーを生成**

3. **使用履歴を確認**
   - 不正使用がないかチェック

### config.jsを誤ってコミットした場合

```bash
# 履歴から削除
git rm --cached src/utils/config.js
git commit -m "Remove config.js"

# 履歴を完全に削除（注意：force pushが必要）
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch src/utils/config.js" \
  --prune-empty --tag-name-filter cat -- --all
```

## 📝 ベストプラクティス

### 開発時
1. config.js.exampleを常に最新に保つ
2. APIキーは環境変数から読み込む（将来実装）
3. テスト用の制限付きAPIキーを使用

### 本番環境（将来）
1. サーバーサイドでAPIキーを管理
2. プロキシサーバー経由でAPI呼び出し
3. OAuth 2.0認証の実装

---

**重要**: 明日のライブ配信後は、必ずAPIキーを削除またはダミー値に戻してください。