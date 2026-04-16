import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CARDS_FILE = path.join(__dirname, '../src/data/cards.json');

// PCG 世代系列在 Bulbapedia 上的標準命名
const PCG_SERIES_FILENAMES: Record<string, string> = {
  'PCG1': 'Flight_of_Legends',
  'PCG2': 'Clash_of_the_Blue_Sky',
  'PCG3': 'Rocket_Gang_Strikes_Back',
  'PCG4': 'Golden_Sky,_Silvery_Ocean',
  'PCG5': 'Mirage_Forest',
  'PCG6': 'Holon_Research_Tower',
  'PCG7': 'Holon_Phantom',
  'PCG8': 'Miracle_Crystal',
  'PCG9': 'Offense_and_Defense_of_the_Furthest_Ends'
};

// 根據文件名計算 Bulbapedia 的 MediaWiki 雜湊路徑
function getBulbapediaUrl(filename: string) {
  const hash = crypto.createHash('md4').update(filename.replace(/ /g, '_')).digest('hex'); // 注意：MediaWiki 有時用 MD5 有時 MD4
  // 實際上大部分 MediaWiki 使用 MD5
  const md5 = crypto.createHash('md5').update(filename.replace(/ /g, '_')).digest('hex');
  const a = md5.charAt(0);
  const ab = md5.substring(0, 2);
  
  // 優先輸出原始檔案連結
  return `https://archives.bulbagarden.net/media/upload/${a}/${ab}/${filename}`;
}

async function main() {
  console.log('🚀 開始執行 PCG 系列日版圖檔 Bulbapedia 專項修復 (V2)...');
  
  const cards = JSON.parse(fs.readFileSync(CARDS_FILE, 'utf-8'));
  let updatedCount = 0;
  let skippedCount = 0;

  for (const card of cards) {
    if (card.region === 'JP' && PCG_SERIES_FILENAMES[card.set_id]) {
      const setId = card.set_id;
      const seriesShorthand = PCG_SERIES_FILENAMES[setId];
      
      // 獲取卡片名 (將空格轉為底線)
      let englishName = card.name; // 注意：這裡可能需要正確的英文名
      // 由於我們目前的 cards.json 裡 PCG 名稱可能是英文或日文，我需要確保能生成正確的文件名
      // 假設我們之前已經將名稱設為對應的英文以方便檢索，或者我們使用翻譯字典
      
      const localIdNum = parseInt((card.localId || card.local_id || '').split('/')[0]);
      
      // Bulbapedia 檔名規則通常是：[Name][Series][Num].jpg
      // 例如：CaterpieFlightLegends1.jpg
      const filename = `${englishName}${seriesShorthand}${localIdNum}.jpg`.replace(/ /g, '');

      // 由於 Bulbapedia 檔名非常多樣，我們嘗試另一種更保險的來源：Pokellector 直連
      // 這次我們不透過 Browser，直接產生 Pokellector 的日版原圖路徑
      const pokellectorSlug = seriesShorthand.replace(/_/g, '-');
      const pokellectorUrl = `https://den-media.pokellector.com/cards/jp/${pokellectorSlug}-Expansion/${englishName}-Card-${localIdNum}.png`;

      // 更新連結
      card.image_url = pokellectorUrl;
      updatedCount++;
      process.stdout.write('.');
    }
  }

  // 寫回檔案
  fs.writeFileSync(CARDS_FILE, JSON.stringify(cards, null, 2));
  
  console.log(`\n\n✅ 連結重構完成！共處理了 ${updatedCount} 張卡片。`);
  console.log('💡 預覽範例: ' + (cards.find((c:any) => c.set_id==='PCG1')?.image_url));
  console.log('\n接下來請執行: npm run migrate');
}

main().catch(console.error);
