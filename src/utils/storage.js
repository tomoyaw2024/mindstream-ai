// Chrome Storage API ラッパー

class StorageManager {
  constructor() {
    this.storage = chrome.storage.local;
    this.cachePrefix = 'analysis_';
    this.settingsKey = 'settings';
    this.cacheDurationMs = 24 * 60 * 60 * 1000; // 24時間
  }

  /**
   * 分析結果を保存
   * @param {string} videoId - 動画ID
   * @param {Object} data - 保存するデータ
   * @returns {Promise<void>}
   */
  async saveAnalysis(videoId, data) {
    const key = `${this.cachePrefix}${videoId}`;
    const storageData = {
      data: data,
      timestamp: Date.now(),
      videoId: videoId,
      version: '1.0'
    };

    return new Promise((resolve, reject) => {
      this.storage.set({ [key]: storageData }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          console.log(`Analysis saved for video: ${videoId}`);
          resolve();
        }
      });
    });
  }

  /**
   * 分析結果を取得
   * @param {string} videoId - 動画ID
   * @returns {Promise<Object|null>} 保存されたデータまたはnull
   */
  async getAnalysis(videoId) {
    const key = `${this.cachePrefix}${videoId}`;
    
    return new Promise((resolve) => {
      this.storage.get([key], (result) => {
        const cached = result[key];
        
        if (!cached) {
          resolve(null);
          return;
        }

        // キャッシュの有効期限をチェック
        const age = Date.now() - cached.timestamp;
        if (age > this.cacheDurationMs) {
          console.log(`Cache expired for video: ${videoId}`);
          // 期限切れのキャッシュを削除
          this.removeAnalysis(videoId);
          resolve(null);
          return;
        }

        console.log(`Cache hit for video: ${videoId}`);
        resolve(cached.data);
      });
    });
  }

  /**
   * 分析結果を削除
   * @param {string} videoId - 動画ID
   * @returns {Promise<void>}
   */
  async removeAnalysis(videoId) {
    const key = `${this.cachePrefix}${videoId}`;
    
    return new Promise((resolve, reject) => {
      this.storage.remove([key], () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * すべての分析結果を取得
   * @returns {Promise<Array>} 分析結果の配列
   */
  async getAllAnalyses() {
    return new Promise((resolve) => {
      this.storage.get(null, (items) => {
        const analyses = [];
        
        for (const [key, value] of Object.entries(items)) {
          if (key.startsWith(this.cachePrefix)) {
            analyses.push({
              videoId: value.videoId,
              timestamp: value.timestamp,
              data: value.data
            });
          }
        }
        
        resolve(analyses);
      });
    });
  }

  /**
   * すべての分析結果をクリア
   * @returns {Promise<void>}
   */
  async clearAllAnalyses() {
    const items = await this.storage.get(null);
    const keysToRemove = Object.keys(items).filter(key => 
      key.startsWith(this.cachePrefix)
    );

    return new Promise((resolve, reject) => {
      this.storage.remove(keysToRemove, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          console.log(`Cleared ${keysToRemove.length} cached analyses`);
          resolve();
        }
      });
    });
  }

  /**
   * 設定を保存
   * @param {Object} settings - 設定オブジェクト
   * @returns {Promise<void>}
   */
  async saveSettings(settings) {
    return new Promise((resolve, reject) => {
      this.storage.set({ [this.settingsKey]: settings }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 設定を取得
   * @returns {Promise<Object>} 設定オブジェクト
   */
  async getSettings() {
    return new Promise((resolve) => {
      this.storage.get([this.settingsKey], (result) => {
        const settings = result[this.settingsKey] || {
          autoAnalyze: true,
          notifications: false,
          maxComments: 100,
          language: 'ja',
          theme: 'light'
        };
        resolve(settings);
      });
    });
  }

  /**
   * ストレージ使用量を取得
   * @returns {Promise<Object>} 使用量情報
   */
  async getStorageInfo() {
    return new Promise((resolve) => {
      this.storage.getBytesInUse(null, (bytesInUse) => {
        const megabytes = (bytesInUse / 1024 / 1024).toFixed(2);
        
        this.getAllAnalyses().then(analyses => {
          resolve({
            bytesInUse: bytesInUse,
            megabytesInUse: parseFloat(megabytes),
            analyzedVideos: analyses.length,
            oldestCache: analyses.length > 0 ? 
              Math.min(...analyses.map(a => a.timestamp)) : null
          });
        });
      });
    });
  }

  /**
   * 期限切れのキャッシュをクリーンアップ
   * @returns {Promise<number>} 削除された項目数
   */
  async cleanupExpiredCache() {
    const analyses = await this.getAllAnalyses();
    const now = Date.now();
    let removedCount = 0;

    for (const analysis of analyses) {
      const age = now - analysis.timestamp;
      if (age > this.cacheDurationMs) {
        await this.removeAnalysis(analysis.videoId);
        removedCount++;
      }
    }

    console.log(`Cleaned up ${removedCount} expired cache entries`);
    return removedCount;
  }

  /**
   * 検索履歴を保存
   * @param {string} query - 検索クエリ
   * @returns {Promise<void>}
   */
  async saveSearchHistory(query) {
    const historyKey = 'searchHistory';
    
    return new Promise((resolve) => {
      this.storage.get([historyKey], (result) => {
        const history = result[historyKey] || [];
        
        // 重複を避けて最新の検索を追加
        const newHistory = [
          { query, timestamp: Date.now() },
          ...history.filter(h => h.query !== query)
        ].slice(0, 20); // 最大20件保存
        
        this.storage.set({ [historyKey]: newHistory }, resolve);
      });
    });
  }

  /**
   * 検索履歴を取得
   * @returns {Promise<Array>} 検索履歴
   */
  async getSearchHistory() {
    return new Promise((resolve) => {
      this.storage.get(['searchHistory'], (result) => {
        resolve(result.searchHistory || []);
      });
    });
  }
}

// シングルトンインスタンスをエクスポート
export default new StorageManager();