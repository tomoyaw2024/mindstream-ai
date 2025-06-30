// Gemini 2.5 Flash API クライアント

import CONFIG from '../utils/config.js';

class GeminiAPI {
  constructor() {
    this.apiKey = CONFIG.GEMINI_API_KEY;
    this.model = CONFIG.GEMINI_MODEL;
    this.baseUrl = CONFIG.GEMINI_API_URL;
  }

  /**
   * コメントをクラスタリング
   * @param {Array} comments - コメントの配列
   * @returns {Promise<Object>} クラスタリング結果
   */
  async clusterComments(comments) {
    try {
      // プロンプトを読み込み（実際はファイルから読み込む）
      const prompt = await this.buildClusteringPrompt(comments);
      
      const response = await this.generateContent(prompt);
      return this.parseClusteringResponse(response);
    } catch (error) {
      console.error('Gemini clustering error:', error);
      throw error;
    }
  }

  /**
   * 薬機法チェック
   * @param {string} text - チェックするテキスト
   * @returns {Promise<Object>} チェック結果
   */
  async checkMedicalCompliance(text) {
    try {
      const prompt = await this.buildMedicalCheckPrompt(text);
      const response = await this.generateContent(prompt);
      return this.parseMedicalCheckResponse(response);
    } catch (error) {
      console.error('Medical compliance check error:', error);
      throw error;
    }
  }

  /**
   * Gemini APIを呼び出し
   * @param {string} prompt - プロンプト
   * @param {Object} options - 生成オプション
   * @returns {Promise<string>} 生成されたテキスト
   */
  async generateContent(prompt, options = {}) {
    const url = `${this.baseUrl}${this.model}:generateContent?key=${this.apiKey}`;
    
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: options.temperature || 0.7,
        topK: options.topK || 40,
        topP: options.topP || 0.95,
        maxOutputTokens: options.maxOutputTokens || 2048,
        ...options
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
      
      // レスポンスから生成されたテキストを抽出
      if (data.candidates && data.candidates[0]) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('No content generated');
      }
    } catch (error) {
      console.error('Gemini API request error:', error);
      throw error;
    }
  }

  /**
   * ストリーミング生成（将来実装用）
   * @param {string} prompt - プロンプト
   * @param {Function} onChunk - チャンクごとのコールバック
   * @returns {Promise<void>}
   */
  async generateContentStream(prompt, onChunk) {
    const url = `${this.baseUrl}${this.model}:streamGenerateContent?key=${this.apiKey}`;
    
    // ストリーミングAPIの実装
    // 現在のGemini APIはストリーミングをサポートしていないため、
    // 将来的な実装のプレースホルダー
    throw new Error('Streaming not yet implemented');
  }

  /**
   * クラスタリング用プロンプトを構築
   * @param {Array} comments - コメント配列
   * @returns {Promise<string>} プロンプト
   */
  async buildClusteringPrompt(comments) {
    // コメントを適切な数に制限（トークン制限のため）
    const limitedComments = comments.slice(0, 50);
    
    const commentTexts = limitedComments.map((comment, index) => 
      `${index + 1}. ${comment.text} (いいね: ${comment.likeCount})`
    ).join('\n');

    // プロンプトテンプレート（実際はファイルから読み込む）
    const template = `あなたは精神科医療のコメント分析専門家です。
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

    return template;
  }

  /**
   * 薬機法チェック用プロンプトを構築
   * @param {string} text - チェックするテキスト
   * @returns {Promise<string>} プロンプト
   */
  async buildMedicalCheckPrompt(text) {
    return `薬機法（医薬品医療機器等法）の観点から、以下のテキストをチェックしてください。

【チェック対象テキスト】
${text}

【チェック項目】
1. 診断・治療の断定的表現
2. 効果効能の標榜
3. 医学的アドバイス
4. 誤解を招く表現

【出力形式】
{
  "status": "safe/warning/danger",
  "issues": [
    {
      "text": "問題のある表現",
      "reason": "違反理由",
      "suggestion": "修正案"
    }
  ],
  "safetyScore": 0.0〜1.0
}`;
  }

  /**
   * クラスタリングレスポンスをパース
   * @param {string} response - Geminiのレスポンス
   * @returns {Object} パースされた結果
   */
  parseClusteringResponse(response) {
    try {
      // JSONを抽出（レスポンスに説明文が含まれる場合があるため）
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // JSON全体がレスポンスの場合
      return JSON.parse(response);
    } catch (error) {
      console.error('Error parsing clustering response:', error);
      
      // パース失敗時のフォールバック
      return {
        clusters: [],
        summary: 'コメントの分析に失敗しました',
        error: error.message
      };
    }
  }

  /**
   * 薬機法チェックレスポンスをパース
   * @param {string} response - Geminiのレスポンス
   * @returns {Object} パースされた結果
   */
  parseMedicalCheckResponse(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch (error) {
      console.error('Error parsing medical check response:', error);
      
      return {
        status: 'error',
        issues: [],
        safetyScore: 0,
        error: error.message
      };
    }
  }

  /**
   * APIキーが設定されているかチェック
   * @returns {boolean}
   */
  isConfigured() {
    return this.apiKey && this.apiKey !== 'YOUR_GEMINI_API_KEY';
  }
}

// シングルトンインスタンスをエクスポート
export default new GeminiAPI();