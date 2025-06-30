# Chrome拡張機能のテスト手順

以下の手順でMindStream AI拡張機能をテストしてください：

## 1. 拡張機能の読み込み確認
- chrome://extensions/ を開く
- MindStream AIが表示されているか確認
- エラーがないか確認

## 2. APIキー設定確認
```bash
# config.jsの存在確認
ls -la src/utils/config.js

# APIキーが設定されているか確認（キー自体は表示しない）
grep -q "YOUR_" src/utils/config.js && echo "APIキー未設定" || echo "APIキー設定済み"
```

## 3. テスト用YouTube動画
以下のいずれかの動画でテスト：
- 益田裕介先生の最新動画: https://www.youtube.com/@seishinkai-masuda
- コメントが多い動画を選択

## 4. 動作確認チェックリスト
- [ ] 動画ページを開いて2-3秒待つ
- [ ] 右側にMindStream AIパネルが表示される
- [ ] 「コメントを分析中...」のメッセージが表示される
- [ ] 分析完了後、クラスターが表示される
- [ ] 免責事項が表示されている
- [ ] パネルの✕ボタンで閉じられる

## 5. デバッグ（問題がある場合）
```javascript
// F12でConsoleを開いて実行
console.log('=== MindStream AI Debug ===');

// ストレージ確認
chrome.storage.local.get(null, (data) => {
  console.log('Storage:', data);
});

// エラー確認
if (chrome.runtime.lastError) {
  console.error('Runtime Error:', chrome.runtime.lastError);
}
```

## 6. Service Workerログ確認
1. chrome://extensions/ を開く
2. MindStream AIの「サービスワーカー」リンクをクリック
3. Consoleでログを確認

テスト引数: $ARGUMENTS