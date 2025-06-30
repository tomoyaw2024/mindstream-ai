# セキュリティガイド

## 🔐 APIキーの管理

### 重要な警告
**絶対にAPIキーをGitHubやその他の公開リポジトリにコミットしないでください！**

### 推奨される管理方法

#### 1. ローカル開発
```bash
# 1. config.js.exampleをコピー
cp src/utils/config.js.example src/utils/config.js

# 2. config.jsを編集してAPIキーを設定
# 注意: config.jsは.gitignoreに含まれています
```

#### 2. 環境変数の使用（推奨）
開発中の.env.localファイル：
```env
YOUTUBE_API_KEY=your_actual_key_here
GEMINI_API_KEY=your_actual_key_here
```

#### 3. Chrome拡張機能の設定画面
将来的には、拡張機能の設定画面でAPIキーを入力できるようにする予定です。

### セキュリティチェックリスト

#### コミット前の確認
```bash
# APIキーが含まれていないか確認
git diff --cached | grep -E "(AIza|YOUR_.*_KEY)"

# config.jsがステージングされていないか確認
git status
```

#### 万が一APIキーをコミットした場合
1. **即座にAPIキーを無効化**
   - [Google Cloud Console](https://console.cloud.google.com/)
   - [Google AI Studio](https://makersuite.google.com/)

2. **新しいAPIキーを生成**

3. **Git履歴からの削除**
   ```bash
   # BFGまたはgit filter-branchを使用
   # 詳細は公式ドキュメントを参照
   ```

### ベストプラクティス

1. **APIキーの制限**
   - IPアドレス制限
   - HTTPリファラー制限
   - APIの使用量制限

2. **定期的なローテーション**
   - 3ヶ月ごとにAPIキーを更新

3. **最小権限の原則**
   - 必要な権限のみを付与

### 本番環境での推奨事項

1. **環境変数サービス**
   - GitHub Secrets
   - Google Secret Manager
   - 環境変数管理サービス

2. **Chrome拡張機能での管理**
   - chrome.storage.localを使用
   - 暗号化された保存
   - ユーザーごとの設定

## 📝 開発者向けメモ

- config.jsは絶対にコミットしない
- .env.localファイルも同様
- APIキーを含むスクリーンショットも注意
- デモ動画でAPIキーが映らないよう注意

---
安全な開発を心がけましょう！