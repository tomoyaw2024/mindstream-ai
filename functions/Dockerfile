FROM node:20-slim

WORKDIR /app

# 依存関係をコピーしてインストール
COPY package*.json ./
RUN npm ci --only=production

# アプリケーションコードをコピー
COPY . .

# ポート8080を公開
EXPOSE 8080

# Cloud Functions Frameworkを使用してサーバーを起動
CMD ["npx", "@google-cloud/functions-framework", "--target=mindstreamApi", "--signature-type=http"]