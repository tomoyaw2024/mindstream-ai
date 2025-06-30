// 薬機法（医薬品医療機器等法）コンプライアンスチェッカー

class MedicalComplianceChecker {
  constructor() {
    // 薬機法違反となる可能性のある表現
    this.prohibitedExpressions = {
      診断: [
        /診断(します|できます|いたします)/,
        /病名を(判定|特定|診断)/,
        /あなたは.{0,10}(病|症|障害)です/,
        /間違いなく.{0,10}(ADHD|うつ病|発達障害)/
      ],
      治療効果: [
        /必ず(治る|改善|効果)/,
        /確実に.{0,10}効く/,
        /治療(します|できます)/,
        /完治(します|できます|保証)/,
        /副作用は(ありません|ない|ゼロ)/
      ],
      医学的助言: [
        /薬を(変更|中止|増量|減量)(してください|すべき)/,
        /病院に行く必要は(ない|ありません)/,
        /医師は不要/,
        /この治療法を試してください/
      ],
      誇大広告: [
        /医学的に証明/,
        /科学的根拠は確実/,
        /厚生労働省(認可|推奨)/,
        /世界中の医師が推奨/
      ]
    };

    // 注意が必要な表現
    this.cautionExpressions = [
      /効果が(ある|あります)/,
      /改善(する|します)/,
      /症状が(軽くなる|良くなる)/,
      /おすすめ(です|します)/
    ];

    // 推奨される表現
    this.recommendedPhrases = {
      個人の感想: [
        '個人の体験です',
        '私の場合は',
        '効果には個人差があります',
        '一例として'
      ],
      医師相談: [
        '医師にご相談ください',
        '専門医の診断を受けてください',
        '医療機関を受診することをお勧めします',
        '主治医と相談して'
      ],
      情報提供: [
        '参考情報として',
        '一般的な情報です',
        '医学的助言ではありません',
        'あくまで情報共有です'
      ]
    };

    // 緊急対応が必要なキーワード
    this.emergencyKeywords = [
      '死にたい',
      '消えたい',
      '自殺',
      '自傷',
      'リストカット',
      'OD',
      'オーバードーズ',
      '大量服薬'
    ];
  }

  /**
   * テキストの薬機法コンプライアンスをチェック
   * @param {string} text - チェックするテキスト
   * @returns {Object} チェック結果
   */
  checkCompliance(text) {
    const issues = [];
    let complianceScore = 1.0;
    let status = 'safe';

    // 禁止表現のチェック
    for (const [category, patterns] of Object.entries(this.prohibitedExpressions)) {
      for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
          issues.push({
            type: 'prohibited',
            category: category,
            text: matches[0],
            reason: `薬機法違反の可能性: ${category}に関する断定的表現`,
            suggestion: this.getSuggestion(category, matches[0])
          });
          complianceScore -= 0.3;
          status = 'danger';
        }
      }
    }

    // 注意表現のチェック
    for (const pattern of this.cautionExpressions) {
      const matches = text.match(pattern);
      if (matches) {
        issues.push({
          type: 'caution',
          category: '注意表現',
          text: matches[0],
          reason: '誤解を招く可能性がある表現',
          suggestion: this.getCautionSuggestion(matches[0])
        });
        complianceScore -= 0.1;
        if (status === 'safe') status = 'warning';
      }
    }

    // 緊急キーワードのチェック
    const emergencyFound = this.checkEmergencyKeywords(text);
    if (emergencyFound.length > 0) {
      issues.push({
        type: 'emergency',
        category: '緊急対応',
        text: emergencyFound.join(', '),
        reason: '自殺リスクや危険行為を示唆する内容',
        suggestion: '緊急サポート情報を表示してください'
      });
      status = 'emergency';
    }

    // スコアの正規化
    complianceScore = Math.max(0, Math.min(1, complianceScore));

    return {
      status: status,
      complianceScore: complianceScore,
      issues: issues,
      hasEmergency: emergencyFound.length > 0,
      suggestions: this.generateSuggestions(issues)
    };
  }

  /**
   * 緊急キーワードをチェック
   * @param {string} text - チェックするテキスト
   * @returns {Array<string>} 見つかった緊急キーワード
   */
  checkEmergencyKeywords(text) {
    const found = [];
    const lowerText = text.toLowerCase();

    for (const keyword of this.emergencyKeywords) {
      if (lowerText.includes(keyword)) {
        found.push(keyword);
      }
    }

    return found;
  }

  /**
   * 違反カテゴリーに応じた修正提案を生成
   * @param {string} category - 違反カテゴリー
   * @param {string} originalText - 元のテキスト
   * @returns {string} 修正提案
   */
  getSuggestion(category, originalText) {
    const suggestions = {
      診断: '「医師の診断を受けることをお勧めします」のような表現に変更',
      治療効果: '「個人の体験です」「効果には個人差があります」を追加',
      医学的助言: '「医師にご相談ください」「参考情報として」に変更',
      誇大広告: '断定的でない表現に変更し、出典を明記'
    };

    return suggestions[category] || '医療に関する断定的表現を避けてください';
  }

  /**
   * 注意表現に対する修正提案を生成
   * @param {string} text - 注意表現
   * @returns {string} 修正提案
   */
  getCautionSuggestion(text) {
    if (text.includes('効果')) {
      return '「私の場合は効果を感じました」のように個人の体験として表現';
    }
    if (text.includes('改善')) {
      return '「私は改善を感じました」「個人差があります」を追加';
    }
    if (text.includes('おすすめ')) {
      return '「参考になれば」「医師と相談の上」などの表現を追加';
    }
    return '断定的でない表現に変更することを推奨';
  }

  /**
   * 総合的な修正提案を生成
   * @param {Array} issues - 検出された問題
   * @returns {Array<string>} 修正提案リスト
   */
  generateSuggestions(issues) {
    const suggestions = [];

    // 重大な問題がある場合
    if (issues.some(issue => issue.type === 'prohibited')) {
      suggestions.push('医療に関する断定的な表現は避け、個人の体験として記載してください');
      suggestions.push('必ず「医師にご相談ください」の文言を含めてください');
    }

    // 緊急対応が必要な場合
    if (issues.some(issue => issue.type === 'emergency')) {
      suggestions.push('以下の緊急相談窓口を表示してください:');
      suggestions.push('- いのちの電話: 0120-783-556');
      suggestions.push('- こころの健康相談統一ダイヤル: 0570-064-556');
    }

    // 一般的な推奨事項
    if (suggestions.length === 0) {
      suggestions.push('医療情報は参考程度に留め、診断や治療は医師に相談することを明記してください');
    }

    return suggestions;
  }

  /**
   * 免責事項テキストを生成
   * @param {string} context - コンテキスト（'comment', 'panel', 'fullなど）
   * @returns {string} 免責事項
   */
  generateDisclaimer(context = 'standard') {
    const disclaimers = {
      standard: 'このツールは医療情報の整理を支援するものであり、医療行為や診断を行うものではありません。健康に関する判断は必ず医師にご相談ください。',
      comment: '※個人の体験談です。効果には個人差があります。',
      emergency: '緊急時は迷わず119番通報してください。いのちの電話: 0120-783-556',
      full: `【重要】医療に関する免責事項
このツールは医療情報の整理を支援するものであり、医療行為や診断を行うものではありません。
表示される情報は参考情報であり、医学的助言ではありません。
健康に関する判断は必ず医師にご相談ください。
緊急時は迷わず119番通報してください。`
    };

    return disclaimers[context] || disclaimers.standard;
  }

  /**
   * テキストを薬機法準拠に修正
   * @param {string} text - 元のテキスト
   * @returns {string} 修正されたテキスト
   */
  sanitizeText(text) {
    let sanitized = text;

    // 断定的表現を緩和
    sanitized = sanitized
      .replace(/必ず(治る|効く|改善)/g, '改善する可能性がある')
      .replace(/確実に/g, '場合によっては')
      .replace(/診断します/g, '可能性があります')
      .replace(/治療します/g, '参考になれば幸いです');

    // 免責事項の自動追加
    if (!sanitized.includes('個人の') && !sanitized.includes('医師')) {
      sanitized += '\n※個人の体験です。医師にご相談ください。';
    }

    return sanitized;
  }

  /**
   * 緊急サポート情報を取得
   * @returns {Object} 緊急連絡先情報
   */
  getEmergencySupport() {
    return {
      title: '緊急サポート情報',
      contacts: [
        {
          name: 'いのちの電話',
          number: '0120-783-556',
          hours: '16:00-21:00（毎日）',
          description: '自殺予防の電話相談'
        },
        {
          name: 'こころの健康相談統一ダイヤル',
          number: '0570-064-556',
          hours: '対応時間は地域により異なる',
          description: 'メンタルヘルスの相談'
        },
        {
          name: '緊急時',
          number: '119',
          hours: '24時間対応',
          description: '生命の危険がある場合'
        }
      ],
      message: '一人で悩まず、専門家に相談してください。あなたは一人ではありません。'
    };
  }
}

// シングルトンインスタンスをエクスポート
export default new MedicalComplianceChecker();