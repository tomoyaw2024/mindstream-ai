// YouTube Data API v3 クライアント

import CONFIG from '../utils/config.js';

class YouTubeAPI {
  constructor() {
    this.apiKey = CONFIG.YOUTUBE_API_KEY;
    this.baseUrl = CONFIG.YOUTUBE_API_URL;
  }

  /**
   * 動画のコメントを取得（通常動画・ライブ両対応）
   * @param {string} videoId - YouTube動画ID
   * @param {number} maxResults - 取得する最大コメント数
   * @param {string} pageToken - ページネーショントークン
   * @returns {Promise<Object>} コメントデータ
   */
  async fetchComments(videoId, maxResults = 100, pageToken = null) {
    try {
      // まず動画情報を取得してライブかどうか確認
      const videoInfo = await this.fetchVideoDetails(videoId);
      
      // ライブ配信の場合はライブチャットを取得
      if (videoInfo.liveChatId) {
        console.log('Fetching live chat messages for:', videoId);
        return await this.fetchLiveChatMessages(videoInfo.liveChatId, maxResults);
      }
      
      // 通常の動画コメントを取得
      const params = new URLSearchParams({
        part: 'snippet',
        videoId: videoId,
        maxResults: Math.min(maxResults, 100), // APIの制限は100
        order: 'relevance', // 関連性の高い順
        key: this.apiKey
      });

      if (pageToken) {
        params.append('pageToken', pageToken);
      }

      const url = `${this.baseUrl}commentThreads?${params}`;
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `API Error: ${response.status}`);
      }

      const data = await response.json();
      
      // コメントデータを整形
      const comments = this.formatComments(data.items || []);
      
      return {
        comments,
        nextPageToken: data.nextPageToken,
        totalResults: data.pageInfo?.totalResults || 0,
        isLive: false
      };
    } catch (error) {
      console.error('YouTube API Error:', error);
      throw error;
    }
  }

  /**
   * ライブチャットメッセージを取得
   * @param {string} liveChatId - ライブチャットID
   * @param {number} maxResults - 取得する最大メッセージ数
   * @returns {Promise<Object>} チャットメッセージデータ
   */
  async fetchLiveChatMessages(liveChatId, maxResults = 200) {
    try {
      const params = new URLSearchParams({
        liveChatId: liveChatId,
        part: 'snippet,authorDetails',
        maxResults: Math.min(maxResults, 2000), // ライブチャットは最大2000
        key: this.apiKey
      });

      const url = `${this.baseUrl}liveChat/messages?${params}`;
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `Live Chat API Error: ${response.status}`);
      }

      const data = await response.json();
      
      // ライブチャットメッセージを通常のコメント形式に変換
      const comments = this.formatLiveChatMessages(data.items || []);
      
      return {
        comments,
        nextPageToken: data.nextPageToken,
        totalResults: comments.length,
        isLive: true,
        pollingIntervalMillis: data.pollingIntervalMillis || 5000
      };
    } catch (error) {
      console.error('Live Chat API Error:', error);
      throw error;
    }
  }

  /**
   * すべてのコメントを取得（ページネーション対応）
   * @param {string} videoId - YouTube動画ID
   * @param {number} limit - 取得する最大コメント数
   * @returns {Promise<Array>} すべてのコメント
   */
  async fetchAllComments(videoId, limit = 500) {
    const allComments = [];
    let pageToken = null;
    let totalFetched = 0;

    try {
      while (totalFetched < limit) {
        const batchSize = Math.min(100, limit - totalFetched);
        const result = await this.fetchComments(videoId, batchSize, pageToken);
        
        allComments.push(...result.comments);
        totalFetched += result.comments.length;

        // 次のページがない、または制限に達した場合は終了
        if (!result.nextPageToken || totalFetched >= limit) {
          break;
        }

        pageToken = result.nextPageToken;
        
        // API レート制限を考慮して少し待機
        await this.delay(100);
      }

      console.log(`Fetched ${allComments.length} comments for video ${videoId}`);
      return allComments;
    } catch (error) {
      console.error('Error fetching all comments:', error);
      // エラーが発生しても、取得済みのコメントは返す
      return allComments;
    }
  }

  /**
   * 動画の詳細情報を取得
   * @param {string} videoId - YouTube動画ID
   * @returns {Promise<Object>} 動画情報
   */
  async fetchVideoDetails(videoId) {
    try {
      const params = new URLSearchParams({
        part: 'snippet,statistics,liveStreamingDetails',
        id: videoId,
        key: this.apiKey
      });

      const url = `${this.baseUrl}videos?${params}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        throw new Error('Video not found');
      }

      const video = data.items[0];
      return {
        title: video.snippet.title,
        channelTitle: video.snippet.channelTitle,
        description: video.snippet.description,
        publishedAt: video.snippet.publishedAt,
        viewCount: parseInt(video.statistics?.viewCount || 0),
        likeCount: parseInt(video.statistics?.likeCount || 0),
        commentCount: parseInt(video.statistics?.commentCount || 0),
        // ライブ配信関連
        liveChatId: video.liveStreamingDetails?.activeLiveChatId,
        isLive: video.snippet.liveBroadcastContent === 'live',
        isUpcoming: video.snippet.liveBroadcastContent === 'upcoming'
      };
    } catch (error) {
      console.error('Error fetching video details:', error);
      throw error;
    }
  }

  /**
   * コメントデータを整形
   * @param {Array} items - YouTube APIのレスポンス
   * @returns {Array} 整形されたコメント
   */
  formatComments(items) {
    return items.map(item => {
      const comment = item.snippet.topLevelComment.snippet;
      return {
        id: item.id,
        text: this.cleanCommentText(comment.textDisplay),
        textOriginal: comment.textOriginal,
        authorName: comment.authorDisplayName,
        authorChannelId: comment.authorChannelId?.value,
        likeCount: comment.likeCount,
        publishedAt: comment.publishedAt,
        updatedAt: comment.updatedAt,
        replyCount: item.snippet.totalReplyCount,
        // 医療関連の簡易判定
        hasMedicalTerms: this.checkMedicalTerms(comment.textOriginal)
      };
    });
  }

  /**
   * コメントテキストをクリーンアップ
   * @param {string} text - HTMLを含むコメントテキスト
   * @returns {string} クリーンなテキスト
   */
  cleanCommentText(text) {
    // HTMLタグを除去
    const div = document.createElement('div');
    div.innerHTML = text;
    return div.textContent || div.innerText || '';
  }

  /**
   * ライブチャットメッセージを整形
   * @param {Array} items - YouTube Live Chat APIのレスポンス
   * @returns {Array} 整形されたコメント
   */
  formatLiveChatMessages(items) {
    return items.map(item => {
      const message = item.snippet;
      const author = item.authorDetails;
      
      return {
        id: item.id,
        text: this.cleanCommentText(message.displayMessage),
        textOriginal: message.textMessageDetails?.messageText || message.displayMessage,
        authorName: author.displayName,
        authorChannelId: author.channelId,
        likeCount: 0, // ライブチャットにはいいね機能がない
        publishedAt: message.publishedAt,
        updatedAt: message.publishedAt,
        replyCount: 0, // ライブチャットには返信機能がない
        hasMedicalTerms: this.checkMedicalTerms(message.displayMessage),
        isLiveChat: true,
        // ライブチャット特有の情報
        isSuperChat: message.type === 'superChatEvent',
        isModerator: author.isChatModerator,
        isOwner: author.isChatOwner,
        isVerified: author.isVerified
      };
    });
  }

  /**
   * 医療用語を含むかチェック
   * @param {string} text - コメントテキスト
   * @returns {boolean} 医療用語を含むか
   */
  checkMedicalTerms(text) {
    const medicalTerms = [
      '診断', '治療', '薬', '症状', '病院', '医師', '処方',
      'ADHD', 'ASD', 'うつ', '不安', '発達障害', 'ストラテラ',
      'コンサータ', '副作用', '効果', '服用', '通院'
    ];
    
    const lowerText = text.toLowerCase();
    return medicalTerms.some(term => lowerText.includes(term.toLowerCase()));
  }

  /**
   * 遅延処理
   * @param {number} ms - ミリ秒
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// シングルトンインスタンスをエクスポート
export default new YouTubeAPI();