import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function scrapeCards() {
  console.log('開始爬取 TCGdex 繁中版與日文版卡牌資料庫...');
  try {
    // Fetch TW
    const twResponse = await axios.get('https://api.tcgdex.net/v2/zh-tw/cards');
    const twDatabase = twResponse.data
      .filter((c: any) => c.image)
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

    // Fetch JP
    const jpResponse = await axios.get('https://api.tcgdex.net/v2/ja/cards');
    const jpDatabase = jpResponse.data
      .filter((c: any) => c.image)
      .map((c: any) => ({
        id: c.localId ? `${c.id}-${c.localId}` : c.id,
        name: c.name || '未知名稱',
        images: {
          small: `${c.image}/low.webp`,
          large: `${c.image}/high.webp`,
        },
        set: { name: '日版原裝卡包' },
        region: 'JP'
      }));
      
    // 聚合雙語資料庫
    const database = [...twDatabase, ...jpDatabase];

    const outDir = path.join(__dirname, '../src/data');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    fs.writeFileSync(path.join(outDir, 'cards.json'), JSON.stringify(database, null, 2));
    console.log(`成功獲取 ${twDatabase.length} 筆繁中、${jpDatabase.length} 筆日文卡牌！`);
    console.log(`成功匯出總計 ${database.length} 筆圖鑑至 src/data/cards.json`);
    
  } catch (error: any) {
    console.error('爬蟲發生錯誤:', error.message);
  }
}

scrapeCards();
