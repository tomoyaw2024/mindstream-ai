# API接続状態の確認

MindStream AIのAPI接続状態を確認します。

## YouTube Data API の確認

```javascript
// Console で実行
(async () => {
  const API_KEY = 'YOUR_KEY'; // config.jsから取得
  const videoId = 'dQw4w9WgXcQ'; // テスト用動画ID
  
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`
    );
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ YouTube API: 接続成功');
      console.log('動画タイトル:', data.items[0]?.snippet?.title);
    } else {
      console.error('❌ YouTube API: エラー', data.error);
    }
  } catch (error) {
    console.error('❌ YouTube API: 接続失敗', error);
  }
})();
```

## Gemini API の確認

```javascript
// Console で実行
(async () => {
  const API_KEY = 'YOUR_KEY'; // config.jsから取得
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Hello, Gemini!' }]
          }]
        })
      }
    );
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Gemini API: 接続成功');
      console.log('レスポンス:', data.candidates[0]?.content?.parts[0]?.text);
    } else {
      console.error('❌ Gemini API: エラー', data.error);
    }
  } catch (error) {
    console.error('❌ Gemini API: 接続失敗', error);
  }
})();
```

## API使用量の確認

### YouTube API
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 「APIとサービス」→「ダッシュボード」
3. YouTube Data API v3 の使用量を確認

### Gemini API
1. [Google AI Studio](https://makersuite.google.com/)にアクセス
2. APIキー管理画面で使用量を確認

## トラブルシューティング

### 403 Forbidden エラー
- APIキーの制限設定を確認
- 使用量制限に達していないか確認

### 401 Unauthorized エラー
- APIキーが正しく設定されているか確認
- APIが有効化されているか確認

### ネットワークエラー
- インターネット接続を確認
- CORSの問題の場合はService Worker経由で実行

確認対象: $ARGUMENTS