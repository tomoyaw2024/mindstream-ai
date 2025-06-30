import functions from '@google-cloud/functions-framework';
import { Firestore } from '@google-cloud/firestore';
import cors from 'cors';

// Firestoreインスタンスの初期化
const firestore = new Firestore({
  projectId: process.env.GCP_PROJECT || 'mindstream-ai'
});

// CORSの設定（Chrome拡張機能からのアクセスを許可）
const corsOptions = {
  origin: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

const corsMiddleware = cors(corsOptions);

// メインハンドラー
functions.http('mindstreamApi', (req, res) => {
  // CORS処理
  corsMiddleware(req, res, async () => {
    try {
      const path = req.path || '/';
      const method = req.method;

      // ルーティング
      switch (path) {
        case '/api/cache':
          if (method === 'GET') {
            await handleGetCache(req, res);
          } else if (method === 'POST') {
            await handleSaveCache(req, res);
          } else {
            res.status(405).json({ error: 'Method not allowed' });
          }
          break;

        case '/api/stats':
          if (method === 'GET') {
            await handleGetStats(req, res);
          } else if (method === 'POST') {
            await handleUpdateStats(req, res);
          } else {
            res.status(405).json({ error: 'Method not allowed' });
          }
          break;

        case '/api/health':
          res.status(200).json({ 
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'mindstream-api'
          });
          break;

        default:
          res.status(404).json({ error: 'Not found' });
      }
    } catch (error) {
      console.error('Error handling request:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  });
});

// キャッシュ取得ハンドラー
async function handleGetCache(req, res) {
  try {
    const { videoId } = req.query;
    
    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    // Firestoreからキャッシュを取得
    const cacheRef = firestore.collection('cache').doc(videoId);
    const doc = await cacheRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Cache not found' });
    }

    const data = doc.data();
    
    // キャッシュの有効期限をチェック（24時間）
    const cacheAge = Date.now() - data.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24時間

    if (cacheAge > maxAge) {
      // キャッシュが古い場合は削除
      await cacheRef.delete();
      return res.status(404).json({ error: 'Cache expired' });
    }

    res.status(200).json({
      success: true,
      data: data.clusters,
      timestamp: data.timestamp,
      cacheAge: Math.floor(cacheAge / 1000) // 秒単位
    });
  } catch (error) {
    console.error('Error getting cache:', error);
    res.status(500).json({ error: 'Failed to get cache' });
  }
}

// キャッシュ保存ハンドラー
async function handleSaveCache(req, res) {
  try {
    const { videoId, clusters } = req.body;
    
    if (!videoId || !clusters) {
      return res.status(400).json({ 
        error: 'videoId and clusters are required' 
      });
    }

    // Firestoreにキャッシュを保存
    const cacheRef = firestore.collection('cache').doc(videoId);
    await cacheRef.set({
      videoId,
      clusters,
      timestamp: Date.now(),
      createdAt: new Date().toISOString()
    });

    // 統計情報も更新
    await updateUsageStats('cache_saved');

    res.status(200).json({
      success: true,
      message: 'Cache saved successfully'
    });
  } catch (error) {
    console.error('Error saving cache:', error);
    res.status(500).json({ error: 'Failed to save cache' });
  }
}

// 統計情報取得ハンドラー
async function handleGetStats(req, res) {
  try {
    const statsRef = firestore.collection('stats').doc('usage');
    const doc = await statsRef.get();

    if (!doc.exists) {
      return res.status(200).json({
        totalAnalyses: 0,
        cacheHits: 0,
        cacheMisses: 0,
        totalComments: 0,
        lastUpdated: new Date().toISOString()
      });
    }

    const stats = doc.data();
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
}

// 統計情報更新ハンドラー
async function handleUpdateStats(req, res) {
  try {
    const { type, value = 1 } = req.body;
    
    if (!type) {
      return res.status(400).json({ error: 'type is required' });
    }

    await updateUsageStats(type, value);

    res.status(200).json({
      success: true,
      message: 'Stats updated successfully'
    });
  } catch (error) {
    console.error('Error updating stats:', error);
    res.status(500).json({ error: 'Failed to update stats' });
  }
}

// 統計情報更新ユーティリティ
async function updateUsageStats(type, value = 1) {
  const statsRef = firestore.collection('stats').doc('usage');
  
  const fieldMap = {
    'cache_saved': 'totalAnalyses',
    'cache_hit': 'cacheHits',
    'cache_miss': 'cacheMisses',
    'comments_analyzed': 'totalComments'
  };

  const field = fieldMap[type];
  if (!field) {
    console.warn(`Unknown stat type: ${type}`);
    return;
  }

  try {
    await firestore.runTransaction(async (transaction) => {
      const doc = await transaction.get(statsRef);
      
      if (!doc.exists) {
        // 初回の場合は新規作成
        transaction.set(statsRef, {
          totalAnalyses: 0,
          cacheHits: 0,
          cacheMisses: 0,
          totalComments: 0,
          lastUpdated: new Date().toISOString(),
          [field]: value
        });
      } else {
        // 既存の値をインクリメント
        const currentValue = doc.data()[field] || 0;
        transaction.update(statsRef, {
          [field]: currentValue + value,
          lastUpdated: new Date().toISOString()
        });
      }
    });
  } catch (error) {
    console.error('Error updating usage stats:', error);
  }
}