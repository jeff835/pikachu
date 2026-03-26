import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fetchDetailsInBatches(cards: any[], lang: string, batchSize: number = 30) {
  const results = [];
  for (let i = 0; i < cards.length; i += batchSize) {
    const batch = cards.slice(i, i + batchSize);
    const promises = batch.map(async (c: any) => {
      try {
        const res = await axios.get(`https://api.tcgdex.net/v2/${lang}/cards/${c.id}`, { timeout: 10000 });
        const detailed = res.data;
        return {
          id: c.localId ? `${c.id}-${c.localId}` : c.id,
          name: c.name || '未知名稱',
          // 保留相容性結構
          images: {
            small: `${c.image}/low.webp`,
            large: `${c.image}/high.webp`,
          },
          // CardDetail 所需的新欄位
          image: `${c.image}/high.webp`,
          rarity: detailed.rarity || 'Common',
          set: detailed.set?.name || '無系列',
          setLogo: detailed.set?.logo ? `${detailed.set.logo}.webp` : '',
          description: detailed.description || '這張卡牌目前沒有描述。',
          region: lang === 'zh-tw' ? 'TW' : 'JP',
          // 模擬市場報價資料 (TCGdex 不包含這些資料)
          currentPrice: Math.floor(Math.random() * 5000) + 100,
          changePercent: `${(Math.random() * 20).toFixed(1)}%`,
          isUp: Math.random() > 0.5,
          platforms: [
            { name: 'SNKRDUNK', price: Math.floor(Math.random() * 5000) + 100, status: 'Stable', lastUpdate: '10 mins ago' },
            { name: 'eBay', price: Math.floor(Math.random() * 5000) + 100, status: 'High', lastUpdate: '1 hour ago' }
          ],
          history: {
            day: [
              { time: '00:00', price: 1000 },
              { time: '12:00', price: 1200 },
              { time: '23:59', price: 1100 }
            ],
            month: [
              { time: '01', price: 1000 },
              { time: '15', price: 1500 },
              { time: '30', price: 1100 }
            ],
            year: [
              { time: 'Q1', price: 1000 },
              { time: 'Q2', price: 2000 },
              { time: 'Q3', price: 1500 },
              { time: 'Q4', price: 1100 }
            ]
          }
        };
      } catch (err) {
        // 如果抓取單張卡牌詳細資訊失敗，退回使用簡化版本的資料
        return {
          id: c.localId ? `${c.id}-${c.localId}` : c.id,
          name: c.name || '未知名稱',
          images: {
            small: `${c.image}/low.webp`,
            large: `${c.image}/high.webp`,
          },
          image: `${c.image}/high.webp`,
          rarity: 'Common',
          set: '無系列',
          setLogo: '',
          description: '這張卡牌目前沒有描述。',
          region: lang === 'zh-tw' ? 'TW' : 'JP',
          currentPrice: 500,
          changePercent: '0.0%',
          isUp: true,
          platforms: [],
          history: { day: [], month: [], year: [] }
        };
      }
    });
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
    
    // 進度提示
    console.log(`[${lang.toUpperCase()}] 已處理 ${results.length} / ${cards.length} 張卡牌...`);
  }
  return results;
}

async function scrapeCards() {
  console.log('開始爬取 TCGdex 繁中版與日文版卡牌資料庫...');
  try {
    // 為了避免跑太久，我們這裡限制抓取的卡片總數量，各語系取前 500 張有圖片的卡
    const LIMIT = 500;

    // Fetch TW
    console.log('獲取繁中版卡牌列表...');
    const twResponse = await axios.get('https://api.tcgdex.net/v2/zh-tw/cards');
    const twList = twResponse.data.filter((c: any) => c.image).slice(0, LIMIT);
    const twDatabase = await fetchDetailsInBatches(twList, 'zh-tw');

    // Fetch JP
    console.log('獲取日文版卡牌列表...');
    const jpResponse = await axios.get('https://api.tcgdex.net/v2/ja/cards');
    const jpList = jpResponse.data.filter((c: any) => c.image).slice(0, LIMIT);
    const jpDatabase = await fetchDetailsInBatches(jpList, 'ja');
      
    // 聚合雙語資料庫
    const database = [...twDatabase, ...jpDatabase];

    const outDir = path.join(__dirname, '../src/data');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    fs.writeFileSync(path.join(outDir, 'cards.json'), JSON.stringify(database, null, 2));
    console.log(`成功獲取 ${twDatabase.length} 筆繁中、${jpDatabase.length} 筆日文卡牌！`);
    console.log(`成功匯出總計 ${database.length} 筆圖鑑詳細資料至 src/data/cards.json`);
    
  } catch (error: any) {
    console.error('爬蟲發生錯誤:', error.message);
  }
}

scrapeCards();

