// MindStream AI - Popup Script

// DOM要素の取得
const autoAnalyzeToggle = document.getElementById('auto-analyze');
const notificationsToggle = document.getElementById('notifications');
const clearCacheButton = document.getElementById('clear-cache');
const analyzedCountElement = document.getElementById('analyzed-count');
const cacheSizeElement = document.getElementById('cache-size');
const privacyLink = document.getElementById('privacy-link');

// 設定の読み込み
chrome.storage.local.get(['autoAnalyze', 'notifications'], (result) => {
  // デフォルト値の設定
  const autoAnalyze = result.autoAnalyze !== false; // デフォルトはtrue
  const notifications = result.notifications === true; // デフォルトはfalse
  
  // UIに反映
  autoAnalyzeToggle.classList.toggle('active', autoAnalyze);
  notificationsToggle.classList.toggle('active', notifications);
});

// 統計情報の更新
updateStats();

// トグルスイッチのクリックイベント
autoAnalyzeToggle.addEventListener('click', () => {
  const isActive = autoAnalyzeToggle.classList.toggle('active');
  chrome.storage.local.set({ autoAnalyze: isActive });
});

notificationsToggle.addEventListener('click', () => {
  const isActive = notificationsToggle.classList.toggle('active');
  chrome.storage.local.set({ notifications: isActive });
  
  // 通知権限のリクエスト
  if (isActive && Notification.permission === 'default') {
    Notification.requestPermission();
  }
});

// キャッシュクリアボタン
clearCacheButton.addEventListener('click', async () => {
  clearCacheButton.disabled = true;
  clearCacheButton.textContent = 'クリア中...';
  
  try {
    // analysis_で始まるすべてのキーを削除
    const items = await chrome.storage.local.get(null);
    const keysToRemove = Object.keys(items).filter(key => key.startsWith('analysis_'));
    
    await chrome.storage.local.remove(keysToRemove);
    
    clearCacheButton.textContent = 'クリア完了！';
    setTimeout(() => {
      clearCacheButton.textContent = 'キャッシュをクリア';
      clearCacheButton.disabled = false;
    }, 2000);
    
    // 統計情報を更新
    updateStats();
  } catch (error) {
    console.error('Error clearing cache:', error);
    clearCacheButton.textContent = 'エラーが発生しました';
    setTimeout(() => {
      clearCacheButton.textContent = 'キャッシュをクリア';
      clearCacheButton.disabled = false;
    }, 2000);
  }
});

// プライバシーポリシーリンク
privacyLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({
    url: 'https://example.com/privacy' // 実際のプライバシーポリシーURLに変更
  });
});

// 統計情報を更新する関数
async function updateStats() {
  try {
    const items = await chrome.storage.local.get(null);
    
    // 分析済み動画数をカウント
    const analyzedCount = Object.keys(items).filter(key => key.startsWith('analysis_')).length;
    analyzedCountElement.textContent = analyzedCount;
    
    // キャッシュサイズを計算
    const cacheSize = new Blob([JSON.stringify(items)]).size;
    const cacheSizeKB = (cacheSize / 1024).toFixed(1);
    cacheSizeElement.textContent = `${cacheSizeKB} KB`;
  } catch (error) {
    console.error('Error updating stats:', error);
  }
}

// ストレージの変更を監視
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    updateStats();
  }
});