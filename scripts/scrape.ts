import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function scrapeCards() {
  console.log('開始爬取 TCGdex 繁中版卡牌資料庫...');
  try {
    const twResponse = await axios.get('https://api.tcgdex.net/v2/zh-tw/cards');
    const twCards = twResponse.data;
    
    console.log(`成功獲取 ${twCards.length} 筆繁中卡牌基礎資料！`);
    
    // Transform to standard schema used by our frontend
    const database = twCards
      .filter((c: any) => c.image) // 只保留有圖庫的卡牌
      .map((c: any) => ({
        id: c.localId ? `${c.id}-${c.localId}` : c.id,
        name: c.name || '未知名稱',
        images: {
          small: `${c.image}/low.webp`,
          large: `${c.image}/high.webp`,
        },
        set: { name: '亞洲繁中版擴充包' },
        region: 'TW'
      }));

    const outDir = path.join(__dirname, '../src/data');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    fs.writeFileSync(path.join(outDir, 'cards.json'), JSON.stringify(database, null, 2));
    console.log(`成功轉換並匯出 ${database.length} 筆卡牌圖鑑至 src/data/cards.json`);
    
  } catch (error: any) {
    console.error('爬蟲發生錯誤:', error.message);
  }
}

scrapeCards();
