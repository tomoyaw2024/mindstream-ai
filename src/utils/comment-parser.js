// コメント処理ユーティリティ

class CommentParser {
  constructor() {
    // 医療関連キーワード
    this.medicalKeywords = {
      診断: ['診断', '判定', '検査結果'],
      薬剤: ['薬', 'ストラテラ', 'コンサータ', 'インチュニブ', 'ビバンセ', '処方', '服用'],
      症状: ['症状', '不注意', '多動', '衝動性', '集中力', 'ミス', '忘れ物'],
      治療: ['治療', '通院', '受診', 'カウンセリング', '療法'],
      副作用: ['副作用', '眠気', '食欲', '不眠', '頭痛', '吐き気'],
      感情: ['不安', '心配', '辛い', '苦しい', '悩み', '困って'],
      家族: ['家族', '子供', '親', '夫', '妻', 'パートナー'],
      仕事学校: ['仕事', '職場', '学校', '勉強', '授業', '上司', '同僚']
    };

    // 緊急度の高いキーワード
    this.urgentKeywords = [
      '死にたい', '消えたい', '自殺', '自傷', 'リストカット',
      '過量服薬', 'OD', 'オーバードーズ', '危険', '緊急'
    ];

    // NGワード（薬機法対応）
    this.ngWords = [
      '絶対に治る', '完治します', '副作用はありません',
      '医師不要', '病院に行かなくても', '薬は不要'
    ];
  }

  /**
   * コメントを分析用に前処理
   * @param {Array} comments - 生のコメント配列
   * @returns {Array} 処理済みコメント配列
   */
  preprocessComments(comments) {
    return comments.map(comment => {
      const processed = {
        ...comment,
        // テキストの正規化
        normalizedText: this.normalizeText(comment.text),
        // 医療関連スコアの計算
        medicalScore: this.calculateMedicalScore(comment.text),
        // 緊急度の判定
        urgency: this.detectUrgency(comment.text),
        // キーワード抽出
        keywords: this.extractKeywords(comment.text),
        // 感情分析
        sentiment: this.analyzeSentiment(comment.text),
        // 体験談かどうかの判定
        isExperience: this.isExperienceStory(comment.text),
        // NGワードチェック
        hasNgWords: this.checkNgWords(comment.text)
      };

      return processed;
    });
  }

  /**
   * テキストを正規化
   * @param {string} text - 元のテキスト
   * @returns {string} 正規化されたテキスト
   */
  normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/\s+/g, ' ') // 複数の空白を1つに
      .replace(/[！？。、]/g, ' ') // 句読点をスペースに
      .trim();
  }

  /**
   * 医療関連スコアを計算（0-1）
   * @param {string} text - コメントテキスト
   * @returns {number} スコア
   */
  calculateMedicalScore(text) {
    let score = 0;
    let totalKeywords = 0;

    for (const [category, keywords] of Object.entries(this.medicalKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          score += this.getCategoryWeight(category);
          totalKeywords++;
        }
      }
    }

    // 正規化（0-1の範囲に）
    return totalKeywords > 0 ? Math.min(score / totalKeywords, 1) : 0;
  }

  /**
   * カテゴリーの重み付けを取得
   * @param {string} category - カテゴリー名
   * @returns {number} 重み
   */
  getCategoryWeight(category) {
    const weights = {
      診断: 0.9,
      薬剤: 0.9,
      症状: 0.7,
      治療: 0.8,
      副作用: 0.8,
      感情: 0.5,
      家族: 0.4,
      仕事学校: 0.3
    };
    return weights[category] || 0.5;
  }

  /**
   * 緊急度を検出
   * @param {string} text - コメントテキスト
   * @returns {string} 'high' | 'medium' | 'low'
   */
  detectUrgency(text) {
    const lowerText = text.toLowerCase();
    
    // 緊急キーワードのチェック
    for (const keyword of this.urgentKeywords) {
      if (lowerText.includes(keyword)) {
        return 'high';
      }
    }

    // 中程度の緊急度のパターン
    const mediumPatterns = [
      /薬.{0,10}(効かない|合わない)/,
      /副作用.{0,10}(ひどい|辛い)/,
      /病院.{0,10}(行けない|遠い)/,
      /(助けて|教えて).{0,10}(ください|ほしい)/
    ];

    for (const pattern of mediumPatterns) {
      if (pattern.test(lowerText)) {
        return 'medium';
      }
    }

    return 'low';
  }

  /**
   * キーワードを抽出
   * @param {string} text - コメントテキスト
   * @returns {Array<string>} キーワード配列
   */
  extractKeywords(text) {
    const keywords = new Set();

    // 医療キーワードから抽出
    for (const keywordList of Object.values(this.medicalKeywords)) {
      for (const keyword of keywordList) {
        if (text.includes(keyword) && keyword.length > 1) {
          keywords.add(keyword);
        }
      }
    }

    // 頻出する名詞を抽出（簡易版）
    const nounPatterns = [
      /[一-龠々]{2,}/g, // 漢字の連続
      /[ァ-ヴー]{3,}/g  // カタカナの連続
    ];

    for (const pattern of nounPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          if (match.length <= 10) { // 長すぎる語は除外
            keywords.add(match);
          }
        });
      }
    }

    return Array.from(keywords).slice(0, 10); // 最大10個
  }

  /**
   * 感情分析（簡易版）
   * @param {string} text - コメントテキスト
   * @returns {string} 'positive' | 'negative' | 'neutral'
   */
  analyzeSentiment(text) {
    const positiveWords = [
      '良い', 'よかった', '改善', '効果', '助かった', 
      '嬉しい', 'ありがとう', '希望', '前向き'
    ];

    const negativeWords = [
      '悪い', '辛い', '苦しい', '困った', '不安',
      '心配', '失敗', 'ダメ', '無理', '諦め'
    ];

    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach(word => {
      if (text.includes(word)) positiveCount++;
    });

    negativeWords.forEach(word => {
      if (text.includes(word)) negativeCount++;
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * 体験談かどうかを判定
   * @param {string} text - コメントテキスト
   * @returns {boolean}
   */
  isExperienceStory(text) {
    const experiencePatterns = [
      /私は.{0,20}(診断|薬|治療)/,
      /(経験|体験)しました/,
      /\d+年前.{0,10}から/,
      /(飲んで|服用して).{0,20}(ます|います)/,
      /子供が.{0,20}(診断|ADHD|発達障害)/
    ];

    return experiencePatterns.some(pattern => pattern.test(text));
  }

  /**
   * NGワードをチェック
   * @param {string} text - コメントテキスト
   * @returns {boolean} NGワードが含まれているか
   */
  checkNgWords(text) {
    const lowerText = text.toLowerCase();
    return this.ngWords.some(word => lowerText.includes(word));
  }

  /**
   * コメントをグループ化用に特徴ベクトル化
   * @param {Object} comment - 処理済みコメント
   * @returns {Array<number>} 特徴ベクトル
   */
  vectorizeComment(comment) {
    // 簡易的な特徴ベクトル生成
    const vector = [
      comment.medicalScore,
      comment.urgency === 'high' ? 1 : comment.urgency === 'medium' ? 0.5 : 0,
      comment.sentiment === 'positive' ? 1 : comment.sentiment === 'negative' ? -1 : 0,
      comment.isExperience ? 1 : 0,
      comment.text.length / 500, // 長さの正規化
      comment.likeCount / 100 // いいね数の正規化
    ];

    return vector;
  }

  /**
   * 類似度を計算（コサイン類似度）
   * @param {Array<number>} vec1 - ベクトル1
   * @param {Array<number>} vec2 - ベクトル2
   * @returns {number} 類似度（0-1）
   */
  calculateSimilarity(vec1, vec2) {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    return isNaN(similarity) ? 0 : similarity;
  }
}

// シングルトンインスタンスをエクスポート
export default new CommentParser();