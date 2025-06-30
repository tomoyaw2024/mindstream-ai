# Chrome拡張機能のデバッグ手順

MindStream AI拡張機能のデバッグを効率的に行うための手順です。

## 1. 拡張機能の状態確認

```bash
# 拡張機能のエラー確認
echo "1. chrome://extensions/ を開く"
echo "2. MindStream AI の「エラー」ボタンを確認"
echo "3. 詳細を表示してエラー内容を確認"
```

## 2. Content Scriptのデバッグ

YouTubeページで F12 を押してConsoleを開き：

```javascript
// Content Scriptの動作確認
console.log('=== Content Script Debug ===');

// MindStream パネルの存在確認
const panel = document.getElementById('mindstream-panel');
console.log('Panel exists:', !!panel);

// Shadow DOM の確認
if (panel && panel.shadowRoot) {
  console.log('Shadow DOM:', panel.shadowRoot.innerHTML);
}

// メッセージ送信テスト
chrome.runtime.sendMessage(
  { action: 'ping' },
  response => console.log('Service Worker response:', response)
);
```

## 3. Service Workerのデバッグ

chrome://extensions/ で「サービスワーカー」をクリックし、Consoleで：

```javascript
// Service Worker状態確認
console.log('=== Service Worker Debug ===');

// インポートされたモジュールの確認
console.log('Modules loaded:', typeof youtubeAPI, typeof geminiAPI);

// ストレージの内容確認
chrome.storage.local.get(null, (data) => {
  console.log('Storage contents:', data);
  console.log('Cached videos:', Object.keys(data).filter(k => k.startsWith('analysis_')));
});

// API設定の確認（キー自体は表示しない）
import('../src/utils/config.js').then(module => {
  const config = module.default;
  console.log('YouTube API configured:', config.YOUTUBE_API_KEY !== 'YOUR_YOUTUBE_API_KEY');
  console.log('Gemini API configured:', config.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY');
});
```

## 4. ネットワーク通信の確認

DevToolsのNetworkタブで：

1. **フィルター設定**
   - `googleapis.com` でフィルター
   - FailedリクエストをチェックON

2. **確認項目**
   - YouTube API: `youtube/v3/commentThreads`
   - Gemini API: `generativelanguage.googleapis.com`
   - ステータスコード（200 OK か）
   - レスポンス内容

## 5. よくあるエラーと対処法

### "Cannot read properties of undefined"
```javascript
// 原因: モジュールが読み込まれていない
// 対処: 動的インポートを確認
const modules = await loadModules();
```

### "chrome is not defined"
```javascript
// 原因: 通常のWebページでChrome APIを使用
// 対処: 拡張機能のコンテキストで実行
if (typeof chrome !== 'undefined' && chrome.runtime) {
  // Chrome API を使用
}
```

### CORS エラー
```javascript
// 原因: Content ScriptからAPIを直接呼び出し
// 対処: Service Worker経由で通信
chrome.runtime.sendMessage({ action: 'apiCall' });
```

## 6. パフォーマンス分析

```javascript
// レンダリング時間の測定
console.time('Panel Render');
// ... パネル表示処理 ...
console.timeEnd('Panel Render');

// API応答時間の測定
console.time('API Call');
const result = await fetchComments(videoId);
console.timeEnd('API Call');
console.log(`Fetched ${result.length} comments`);
```

## 7. メモリリークの確認

1. DevToolsのMemoryタブを開く
2. Heap snapshotを取得
3. 拡張機能を使用
4. 再度Heap snapshotを取得
5. 比較して異常な増加がないか確認

デバッグ対象: $ARGUMENTS