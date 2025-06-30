# アイコン生成ガイド

MindStream AIのアイコンを生成する方法を説明します。

## 方法1: オンラインツールを使用

1. [CloudConvert](https://cloudconvert.com/svg-to-png)などのオンラインコンバーターにアクセス
2. `icon.svg`をアップロード
3. 以下のサイズでPNGを生成：
   - 16x16 → icon16.png
   - 48x48 → icon48.png
   - 128x128 → icon128.png

## 方法2: ImageMagickを使用（macOS/Linux）

```bash
# ImageMagickのインストール（macOS）
brew install imagemagick

# SVGからPNGを生成
convert -background none icon.svg -resize 16x16 icon16.png
convert -background none icon.svg -resize 48x48 icon48.png
convert -background none icon.svg -resize 128x128 icon128.png
```

## 方法3: 簡易的な代替アイコン

アイコンが必要ない場合は、以下の手順で単色の代替アイコンを作成：

1. 任意の画像編集ソフトを開く（Preview.app、ペイントなど）
2. 新規画像を作成（128x128ピクセル）
3. 背景を#2C5282（青色）で塗りつぶし
4. 中央に白文字で「M」を配置
5. 各サイズで保存

## 一時的な解決策

開発中は、manifest.jsonのアイコン部分をコメントアウトすることも可能です：

```json
{
  "manifest_version": 3,
  "name": "MindStream AI",
  // "icons": {
  //   "16": "assets/icons/icon16.png",
  //   "48": "assets/icons/icon48.png",
  //   "128": "assets/icons/icon128.png"
  // },
  ...
}
```

これにより、アイコンなしでも拡張機能は動作します。