// MindStream AI - Content Script
console.log('MindStream AI: Content script loaded');

// YouTube動画ページかどうかを確認
function isYouTubeVideoPage() {
  return window.location.hostname === 'www.youtube.com' && 
         (window.location.pathname === '/watch' || 
          window.location.pathname.startsWith('/live/') ||
          window.location.search.includes('v='));
}

// 動画IDを取得
function getVideoId() {
  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get('v');
  
  // /live/VIDEO_ID 形式のURLにも対応
  if (!videoId && window.location.pathname.startsWith('/live/')) {
    const pathParts = window.location.pathname.split('/');
    return pathParts[2]; // /live/VIDEO_ID の VIDEO_ID 部分
  }
  
  return videoId;
}

// UIを注入
function injectUI() {
  // 既存のUIがある場合は削除
  const existingPanel = document.getElementById('mindstream-panel');
  if (existingPanel) {
    existingPanel.remove();
  }
  
  // パネルコンテナを作成
  const panel = document.createElement('div');
  panel.id = 'mindstream-panel';
  panel.className = 'mindstream-panel';
  
  // Shadow DOMを使用してスタイルを隔離
  const shadow = panel.attachShadow({ mode: 'open' });
  
  // スタイルを追加
  const style = document.createElement('style');
  style.textContent = `
    :host {
      position: fixed;
      right: 20px;
      top: 80px;
      width: 350px;
      max-height: calc(100vh - 100px);
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .panel-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    
    .panel-header {
      background: #2C5282;
      color: white;
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .panel-title {
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .panel-close {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 20px;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .panel-close:hover {
      opacity: 0.8;
    }
    
    .panel-content {
      padding: 16px;
      overflow-y: auto;
      max-height: calc(100vh - 200px);
    }
    
    .loading {
      text-align: center;
      padding: 40px;
      color: #666;
    }
    
    .disclaimer {
      background: #FFF5F5;
      border: 1px solid #FEB2B2;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 16px;
      font-size: 12px;
      color: #742A2A;
    }
    
    .cluster-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .cluster-card {
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 12px;
      border-left: 4px solid #2C5282;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .cluster-card:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .cluster-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .cluster-title {
      font-weight: 600;
      color: #2D3748;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .cluster-count {
      background: #E2E8F0;
      color: #4A5568;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
    }
    
    .cluster-keywords {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 8px;
    }
    
    .keyword-tag {
      background: #EBF8FF;
      color: #2B6CB0;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
    }
  `;
  
  // HTMLコンテンツ
  const container = document.createElement('div');
  container.className = 'panel-container';
  container.innerHTML = `
    <div class="panel-header">
      <div class="panel-title">
        <span>🧠</span>
        <span>MindStream AI</span>
      </div>
      <button class="panel-close" id="close-button">×</button>
    </div>
    <div class="panel-content">
      <div class="disclaimer">
        ⚠️ このツールは医療情報の整理を支援するものであり、医療行為や診断を行うものではありません。
      </div>
      <div id="content-area" class="loading">
        コメントを分析中...
      </div>
    </div>
  `;
  
  shadow.appendChild(style);
  shadow.appendChild(container);
  
  // パネルを追加
  document.body.appendChild(panel);
  
  // 閉じるボタンのイベント
  shadow.getElementById('close-button').addEventListener('click', () => {
    panel.remove();
  });
  
  // コメント分析を開始
  const videoId = getVideoId();
  if (videoId) {
    analyzeComments(videoId, shadow.getElementById('content-area'));
    
    // ライブ動画の場合は定期的に更新（開発中）
    if (window.location.pathname.startsWith('/live/')) {
      console.log('MindStream AI: Live video detected, enabling auto-refresh');
      // 30秒ごとに更新（将来的に実装）
      panel.dataset.isLive = 'true';
    }
  }
}

// コメント分析を実行
async function analyzeComments(videoId, contentArea) {
  try {
    console.log('MindStream AI: Sending analyze request for video:', videoId);
    
    // Background scriptにメッセージを送信
    const response = await chrome.runtime.sendMessage({
      action: 'analyzeVideo',
      videoId: videoId
    });
    
    console.log('MindStream AI: Received response:', response);
    
    if (response && response.error) {
      console.error('MindStream AI: Response error:', response.error);
      contentArea.innerHTML = `<div class="error">エラー: ${response.error}</div>`;
      return;
    }
    
    if (response && response.clusters) {
      console.log('MindStream AI: Displaying clusters:', response.clusters);
      // 結果を表示
      displayResults(response.clusters, contentArea);
    } else {
      console.warn('MindStream AI: No clusters in response');
      contentArea.innerHTML = '<div>分析結果がありません</div>';
    }
  } catch (error) {
    console.error('MindStream AI: Error analyzing comments:', error);
    contentArea.innerHTML = '<div class="error">分析中にエラーが発生しました</div>';
  }
}

// 分析結果を表示
function displayResults(clusters, contentArea) {
  if (!clusters || clusters.length === 0) {
    contentArea.innerHTML = '<div>分析可能なコメントがありません</div>';
    return;
  }
  
  const clusterList = document.createElement('div');
  clusterList.className = 'cluster-list';
  
  clusters.forEach((cluster, index) => {
    const card = document.createElement('div');
    card.className = 'cluster-card';
    
    card.innerHTML = `
      <div class="cluster-header">
        <div class="cluster-title">
          <span>${getClusterIcon(cluster.urgency)}</span>
          <span>${cluster.topic}</span>
        </div>
        <span class="cluster-count">${cluster.commentCount}件</span>
      </div>
      <div class="cluster-keywords">
        ${cluster.keywords.map(keyword => 
          `<span class="keyword-tag">#${keyword}</span>`
        ).join('')}
      </div>
    `;
    
    clusterList.appendChild(card);
  });
  
  contentArea.innerHTML = '';
  contentArea.appendChild(clusterList);
}

// 緊急度に応じたアイコンを返す
function getClusterIcon(urgency) {
  switch(urgency) {
    case 'high': return '🚨';
    case 'medium': return '⚠️';
    case 'low': return '💡';
    default: return '📝';
  }
}

// ページ読み込み時に実行
if (isYouTubeVideoPage()) {
  // UIを注入するタイミングを調整
  setTimeout(() => {
    injectUI();
  }, 2000);
  
  // URLが変更された時にも対応（YouTubeはSPAのため）
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      if (isYouTubeVideoPage()) {
        setTimeout(() => {
          injectUI();
        }, 2000);
      }
    }
  }).observe(document, { subtree: true, childList: true });
}