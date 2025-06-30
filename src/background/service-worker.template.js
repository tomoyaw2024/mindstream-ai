// MindStream AI - Service Worker Template
// 使用方法: このファイルをservice-worker.jsにコピーして、APIキーを設定してください
console.log('MindStream AI: Service worker started');

// 設定 - ここにAPIキーを設定
const CONFIG = {
  YOUTUBE_API_KEY: 'YOUR_YOUTUBE_API_KEY',  // ← あなたのYouTube APIキーに置き換え
  GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY',    // ← あなたのGemini APIキーに置き換え
  GEMINI_MODEL: 'gemini-2.5-flash',
  GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/',
  YOUTUBE_API_URL: 'https://www.googleapis.com/youtube/v3/',
  MAX_COMMENTS_PER_BATCH: 50,
  CACHE_DURATION_HOURS: 24,
  UPDATE_INTERVAL_MS: 30000,
  CLOUD_FUNCTIONS_URL: 'https://asia-northeast1-mindstream-ai-hackathon.cloudfunctions.net/mindstream-api',
  USE_CLOUD_CACHE: true
};

// 以下のコードは変更しないでください
// ストレージ管理
const storage = {
  cachePrefix: 'analysis_',
  cacheDurationMs: 24 * 60 * 60 * 1000,

  async saveAnalysis(videoId, data) {
    const key = `${this.cachePrefix}${videoId}`;
    const storageData = {
      data: data,
      timestamp: Date.now(),
      videoId: videoId,
      version: '1.0'
    };

    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: storageData }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          console.log(`Analysis saved for video: ${videoId}`);
          resolve();
        }
      });
    });
  },

  async getAnalysis(videoId) {
    const key = `${this.cachePrefix}${videoId}`;
    
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        const cached = result[key];
        
        if (!cached) {
          resolve(null);
          return;
        }

        const age = Date.now() - cached.timestamp;
        if (age > this.cacheDurationMs) {
          console.log(`Cache expired for video: ${videoId}`);
          this.removeAnalysis(videoId);
          resolve(null);
          return;
        }

        console.log(`Cache hit for video: ${videoId}`);
        resolve(cached.data);
      });
    });
  },

  async removeAnalysis(videoId) {
    const key = `${this.cachePrefix}${videoId}`;
    
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove([key], () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  },

  async cleanupExpiredCache() {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, async (items) => {
        let removedCount = 0;
        const now = Date.now();
        
        for (const [key, value] of Object.entries(items)) {
          if (key.startsWith(this.cachePrefix)) {
            const age = now - value.timestamp;
            if (age > this.cacheDurationMs) {
              await this.removeAnalysis(value.videoId);
              removedCount++;
            }
          }
        }
        
        console.log(`Cleaned up ${removedCount} expired cache entries`);
        resolve(removedCount);
      });
    });
  }
};

// YouTube API関連
const youtubeAPI = {
  async fetchComments(videoId, maxResults = 100, pageToken = null) {
    try {
      const params = new URLSearchParams({
        part: 'snippet',
        videoId: videoId,
        maxResults: Math.min(maxResults, 100),
        order: 'relevance',
        key: CONFIG.YOUTUBE_API_KEY
      });

      if (pageToken) {
        params.append('pageToken', pageToken);
      }

      const url = `${CONFIG.YOUTUBE_API_URL}commentThreads?${params}`;
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `API Error: ${response.status}`);
      }

      const data = await response.json();
      
      const comments = (data.items || []).map(item => {
        const comment = item.snippet.topLevelComment.snippet;
        return {
          id: item.id,
          text: comment.textDisplay.replace(/<[^>]*>/g, ''),
          textOriginal: comment.textOriginal,
          authorName: comment.authorDisplayName,
          authorChannelId: comment.authorChannelId?.value,
          likeCount: comment.likeCount,
          publishedAt: comment.publishedAt,
          updatedAt: comment.updatedAt,
          replyCount: item.snippet.totalReplyCount
        };
      });
      
      return {
        comments,
        nextPageToken: data.nextPageToken,
        totalResults: data.pageInfo?.totalResults || 0
      };
    } catch (error) {
      console.error('YouTube API Error:', error);
      throw error;
    }
  },

  async fetchAllComments(videoId, limit = 200) {
    const allComments = [];
    let pageToken = null;
    let totalFetched = 0;

    try {
      while (totalFetched < limit) {
        const batchSize = Math.min(100, limit - totalFetched);
        const result = await this.fetchComments(videoId, batchSize, pageToken);
        
        allComments.push(...result.comments);
        totalFetched += result.comments.length;

        if (!result.nextPageToken || totalFetched >= limit) {
          break;
        }

        pageToken = result.nextPageToken;
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`Fetched ${allComments.length} comments for video ${videoId}`);
      return allComments;
    } catch (error) {
      console.error('Error fetching all comments:', error);
      return allComments;
    }
  }
};

// Gemini API関連
const geminiAPI = {
  isConfigured() {
    return CONFIG.GEMINI_API_KEY && CONFIG.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY';
  },

  async clusterComments(comments) {
    try {
      const prompt = this.buildClusteringPrompt(comments);
      const response = await this.generateContent(prompt);
      return this.parseClusteringResponse(response);
    } catch (error) {
      console.error('Gemini clustering error:', error);
      throw error;
    }
  },

  buildClusteringPrompt(comments) {
    const limitedComments = comments.slice(0, 50);
    
    const commentTexts = limitedComments.map((comment, index) => 
      `${index + 1}. ${comment.text} (いいね: ${comment.likeCount})`
    ).join('\n');

    return `あなたは精神科医療のコメント分析専門家です。
YouTube動画のコメントを分析し、視聴者にとって有益な形で整理してください。

【分析するコメント】
${commentTexts}

【分析手順】
1. すべてのコメントを読み、内容を理解
2. 類似した話題・体験・質問をグループ化
3. 各グループに以下の情報を付与：
   - topic: 話題の要約（30文字以内、絵文字1つ含める）
   - commentCount: そのグループに含まれるコメント数
   - keywords: 主要なキーワード（最大5個）
   - urgency: 緊急度（high/medium/low）
   - medicalRelevance: 医療関連度（0.0〜1.0）
   - sampleComments: 代表的なコメントの要約（2つ）

【注意事項】
- 薬機法に準拠し、診断や治療効果を断定しない
- 個人情報は含めない
- 自殺念慮などの危機的状況は最優先

【出力形式】
必ずJSON形式で出力してください：
{
  "clusters": [
    {
      "id": "1",
      "topic": "💊 薬に関する体験談",
      "commentCount": 15,
      "keywords": ["ストラテラ", "副作用", "効果"],
      "urgency": "medium",
      "medicalRelevance": 0.9,
      "sampleComments": [
        "ストラテラを3ヶ月服用した体験",
        "副作用で眠気がひどいという相談"
      ]
    }
  ],
  "summary": "薬の体験談と家族の悩みが中心。緊急性の高い相談も数件あり。"
}`;
  },

  async generateContent(prompt) {
    const url = `${CONFIG.GEMINI_API_URL}${CONFIG.GEMINI_MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;
    
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0]) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('No content generated');
      }
    } catch (error) {
      console.error('Gemini API request error:', error);
      throw error;
    }
  },

  parseClusteringResponse(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch (error) {
      console.error('Error parsing clustering response:', error);
      
      return {
        clusters: [],
        summary: 'コメントの分析に失敗しました',
        error: error.message
      };
    }
  }
};

// コメント処理
const commentParser = {
  preprocessComments(comments) {
    return comments;
  }
};

// メッセージリスナー
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('MindStream AI: Received message:', request);
  
  if (request.action === 'analyzeVideo') {
    handleVideoAnalysis(request.videoId)
      .then(sendResponse)
      .catch(error => {
        console.error('Analysis error:', error);
        sendResponse({ error: error.message });
      });
    return true; // 非同期レスポンスのため
  }
});

// 動画分析のメイン処理
async function handleVideoAnalysis(videoId) {
  try {
    // 1. キャッシュをチェック
    const cached = await storage.getAnalysis(videoId);
    if (cached && !isLiveVideo(videoId)) {
      console.log('Using cached analysis');
      return cached;
    }
    
    // 2. APIキーの確認
    const hasYouTubeKey = CONFIG.YOUTUBE_API_KEY && CONFIG.YOUTUBE_API_KEY !== 'YOUR_YOUTUBE_API_KEY';
    const hasGeminiKey = geminiAPI.isConfigured();
    
    if (!hasYouTubeKey || !hasGeminiKey) {
      console.log('API keys not configured, using sample data');
      return getSampleAnalysis();
    }
    
    try {
      // 3. YouTubeからコメントを取得
      console.log('Fetching comments for video:', videoId);
      const comments = await youtubeAPI.fetchAllComments(videoId, 200);
      console.log(`Fetched ${comments.length} comments`);
      
      if (comments.length === 0) {
        return { 
          clusters: [], 
          summary: 'この動画にはまだコメントがありません。' 
        };
      }
      
      // 4. コメントを前処理
      const processedComments = commentParser.preprocessComments(comments);
      
      // 5. Geminiでクラスタリング
      console.log('Starting Gemini analysis...');
      const result = await geminiAPI.clusterComments(processedComments);
      console.log('Gemini analysis completed');
      
      // 6. 結果をキャッシュ（ライブ動画以外）
      if (!isLiveVideo(videoId)) {
        await storage.saveAnalysis(videoId, result);
      }
      
      return result;
      
    } catch (apiError) {
      console.error('API Error:', apiError);
      
      // APIエラーの詳細をログ
      if (apiError.message.includes('403')) {
        throw new Error('APIキーの権限エラー。APIキーの設定を確認してください。');
      } else if (apiError.message.includes('404')) {
        throw new Error('動画が見つかりません。URLを確認してください。');
      } else if (apiError.message.includes('quota')) {
        throw new Error('API使用量の上限に達しました。');
      }
      
      // その他のエラーはサンプルデータを返す
      console.log('Falling back to sample data due to error');
      return getSampleAnalysis();
    }
    
  } catch (error) {
    console.error('Error in handleVideoAnalysis:', error);
    throw error;
  }
}

// ライブ動画の状態を管理
const liveVideoStates = new Map();

// ライブ動画かどうかを判定
async function isLiveVideo(videoId) {
  try {
    if (liveVideoStates.has(videoId)) {
      const state = liveVideoStates.get(videoId);
      if (Date.now() - state.timestamp < 5 * 60 * 1000) {
        return state.isLive;
      }
    }
    
    const isLive = false;
    
    liveVideoStates.set(videoId, {
      isLive,
      timestamp: Date.now()
    });
    
    return isLive;
  } catch (error) {
    console.error('Error checking if video is live:', error);
    return false;
  }
}

// サンプル分析結果
function getSampleAnalysis() {
  return {
    clusters: [
      {
        id: '1',
        topic: '💊 薬に関する体験談',
        commentCount: 45,
        keywords: ['ストラテラ', 'コンサータ', '副作用', '効果'],
        urgency: 'medium',
        medicalRelevance: 0.9,
        sampleComments: [
          'ストラテラを3ヶ月服用していますが...',
          '副作用で眠気がひどくて困っています'
        ]
      },
      {
        id: '2',
        topic: '😰 診断前の不安・悩み',
        commentCount: 32,
        keywords: ['診断', '病院', '症状', '不安'],
        urgency: 'high',
        medicalRelevance: 0.7,
        sampleComments: [
          'ADHDかもしれないと思い始めて...',
          '病院に行くべきか悩んでいます'
        ]
      },
      {
        id: '3',
        topic: '👨‍👩‍👧‍👦 家族・周囲の理解',
        commentCount: 28,
        keywords: ['家族', '理解', 'サポート', '子供'],
        urgency: 'medium',
        medicalRelevance: 0.5,
        sampleComments: [
          '子供がADHDと診断されました',
          '家族の理解が得られず辛いです'
        ]
      }
    ],
    summary: 'サンプルデータ: APIキーを設定すると実際のコメントを分析できます。'
  };
}

// 拡張機能のインストール時の処理
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('MindStream AI installed');
    // 初期設定を保存
    chrome.storage.local.set({
      settings: {
        autoAnalyze: true,
        notifications: false,
        maxComments: 200,
        language: 'ja',
        theme: 'light'
      }
    });
  } else if (details.reason === 'update') {
    console.log('MindStream AI updated to version', chrome.runtime.getManifest().version);
  }
});

// 定期的なキャッシュクリーンアップ（24時間ごと）
chrome.alarms.create('cleanupCache', { periodInMinutes: 60 * 24 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'cleanupCache') {
    const removedCount = await storage.cleanupExpiredCache();
    console.log(`Cleanup completed: ${removedCount} items removed`);
  }
});