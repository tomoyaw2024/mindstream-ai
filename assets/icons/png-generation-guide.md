# PNGアイコン生成ガイド

## 現在の状況
- SVGアイコン（icon.svg）は作成済み
- manifest.jsonでPNGアイコンが必要だが、一時的にコメントアウト中

## PNG生成方法

### 方法1: オンラインツール（推奨・最速）
1. [CloudConvert](https://cloudconvert.com/svg-to-png) にアクセス
2. `icon.svg`をアップロード
3. 以下の設定で3回変換：
   - 16x16 → `icon16.png`として保存
   - 48x48 → `icon48.png`として保存  
   - 128x128 → `icon128.png`として保存
4. 生成したPNGファイルを`assets/icons/`に配置

### 方法2: macOS + ImageMagick
```bash
# ImageMagickをインストール
brew install imagemagick

# PNGを生成
cd /Users/moi/NeccoStream/mindstream-ai/assets/icons
convert -background none icon.svg -resize 16x16 icon16.png
convert -background none icon.svg -resize 48x48 icon48.png
convert -background none icon.svg -resize 128x128 icon128.png
```

### 方法3: Node.js + sharp（要インストール）
```bash
npm install sharp
node generate-png.js
```

## 生成後の作業

1. **manifest.jsonの修正**
   ```json
   // コメントアウトを解除
   "action": {
     "default_popup": "src/popup/popup.html",
     "default_icon": {
       "16": "assets/icons/icon16.png",
       "48": "assets/icons/icon48.png",
       "128": "assets/icons/icon128.png"
     }
   },
   "icons": {
     "16": "assets/icons/icon16.png",
     "48": "assets/icons/icon48.png",
     "128": "assets/icons/icon128.png"
   }
   ```

2. **Chrome拡張機能の再読み込み**
   - chrome://extensions/
   - 「再読み込み」ボタンをクリック

## 注意事項
- 透過背景を維持すること
- 各サイズで視認性を確認すること
- Chrome Web Store申請時は高品質なPNGが必要