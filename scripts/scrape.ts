import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../src/data');

interface RawCard {
  id: string;
  name: string;
  image?: string;
}

interface DetailedCard extends RawCard {
  rarity?: string;
  set?: { name: string; logo?: string };
  description?: string;
}

async function fetchCards(lang: string, limit: number = 300) {
  try {
    console.log(`[${lang.toUpperCase()}] 正在獲取卡牌列表...`);
    const response = await axios.get(`https://api.tcgdex.net/v2/${lang}/cards`);
    const list = response.data.filter((c: RawCard) => c.image).slice(0, limit);
    
    console.log(`[${lang.toUpperCase()}] 開始抓取 ${list.length} 筆詳細資訊 (批次處理)...`);
    return await fetchDetailsInBatches(list, lang);
  } catch (error: any) {
    console.error(`[${lang.toUpperCase()}] 獲取失敗:`, error.message);
    return [];
  }
}

async function fetchDetailsInBatches(cards: RawCard[], lang: string, batchSize: number = 20) {
  const results = [];
  for (let i = 0; i < cards.length; i += batchSize) {
    const batch = cards.slice(i, i + batchSize);
    const promises = batch.map(async (c: RawCard) => {
      try {
        const res = await axios.get(`https://api.tcgdex.net/v2/${lang}/cards/${c.id}`, { timeout: 10000 });
        const detailed: DetailedCard = res.data;
        
        return {
          id: c.id,
          name: c.name || '未知名稱',
          images: {
            small: `${c.image}/low.webp`,
            large: `${c.image}/high.webp`,
          },
          rarity: detailed.rarity || 'Common',
          set: detailed.set?.name || '無系列',
          setLogo: detailed.set?.logo ? `${detailed.set.logo}.webp` : '',
          description: detailed.description || '這張卡牌目前沒有描述。',
          region: lang === 'zh-tw' ? 'TW' : 'JP'
        };
      } catch (err) {
        return {
          id: c.id,
          name: c.name || '未知名稱',
          images: {
            small: `${c.image}/low.webp`,
            large: `${c.image}/high.webp`,
          },
          rarity: 'Common',
          set: '無系列',
          setLogo: '',
          description: '無法取得詳細描述。',
          region: lang === 'zh-tw' ? 'TW' : 'JP'
        };
      }
    });

    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
    console.log(`[${lang.toUpperCase()}] 進度: ${results.length} / ${cards.length}`);
    // 稍微延遲避免觸發 Rate Limit
    await new Promise(r => setTimeout(r, 500));
  }
  return results;
}

async function scrapeCards() {
  console.log('🚀 開始執行全量卡牌爬蟲 (繁中 & 日韓數據源)...\n');

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  try {
    const [twCards, jpCards] = await Promise.all([
      fetchCards('zh-tw', 300),
      fetchCards('ja', 300)
    ]);

    const allCards = [...twCards, ...jpCards];
    // 使用 Map 去重
    const uniqueCards = Array.from(new Map(allCards.map((c) => [c.id, c])).values());

    const outputPath = path.join(DATA_DIR, 'cards.json');
    fs.writeFileSync(outputPath, JSON.stringify(uniqueCards, null, 2));

    console.log(`\n📊 數據處理完成:`);
    console.log(`- 繁中版: ${twCards.length} 筆`);
    console.log(`- 日文版: ${jpCards.length} 筆`);
    console.log(`- 最終去重總數: ${uniqueCards.length} 筆`);
    console.log(`\n💾 已儲存至: ${outputPath}`);
    
  } catch (error: any) {
    console.error('\n❌ 爬蟲主程序發生意外錯誤:', error.message);
  }
}

scrapeCards();
