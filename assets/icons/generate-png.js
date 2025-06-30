// SVGからPNGを生成する簡易スクリプト
// このスクリプトはImageMagickが利用できない場合の代替案です

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SVGファイルの内容
const svgContent = fs.readFileSync(path.join(__dirname, 'icon.svg'), 'utf8');

// 各サイズのPNGを生成するための設定
const sizes = [16, 48, 128];

// PNG生成の指示を出力
console.log('PNG生成ガイド:');
console.log('================');
console.log('');
console.log('以下の方法でPNGファイルを生成してください：');
console.log('');
console.log('### 方法1: オンラインコンバーター');
console.log('1. https://cloudconvert.com/svg-to-png にアクセス');
console.log('2. icon.svgをアップロード');
console.log('3. 以下のサイズで変換：');
sizes.forEach(size => {
  console.log(`   - ${size}x${size} → icon${size}.png`);
});
console.log('');
console.log('### 方法2: macOSのImageMagick');
console.log('```bash');
console.log('# ImageMagickのインストール');
console.log('brew install imagemagick');
console.log('');
console.log('# PNGの生成');
sizes.forEach(size => {
  console.log(`convert -background none -density 300 icon.svg -resize ${size}x${size} icon${size}.png`);
});
console.log('```');
console.log('');
console.log('### 方法3: 簡易的な代替アイコン作成');
console.log('manifest.jsonの以下の部分をコメントアウトして開発を続行：');
console.log('```json');
console.log('// "icons": {');
console.log('//   "16": "assets/icons/icon16.png",');
console.log('//   "48": "assets/icons/icon48.png",');
console.log('//   "128": "assets/icons/icon128.png"');
console.log('// }');
console.log('```');

// 代替として、SVGファイルのコピーを作成（開発用）
sizes.forEach(size => {
  const filename = `icon${size}.svg`;
  fs.writeFileSync(path.join(__dirname, filename), svgContent);
  console.log(`\n開発用SVG作成: ${filename}`);
});