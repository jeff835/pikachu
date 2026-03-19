import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../src/data');

// ==============================
// 核心型別定義
// ==============================
interface CardEntry {
  id: string;         // TCGdex 卡牌 ID (e.g. "SV2a-001")
  tcgId?: string;     // TCGPlayer/pokemontcg.io 英文版 ID (e.g. "sv3pt5-199")
  name: string;       // 繁中名稱
  jaName?: string;    // 日文名稱
  enName?: string;    // 英文名稱
  images: {
    small: string;
    large: string;
  };
  set: {
    id: string;
    name: string;
  };
  localId: string;    // 卡組編號 (e.g. "001")
  region: 'TW' | 'JP';
  tcgPlayerMarketPrice?: number; // TCGPlayer 美版市場均價 (USD)
}

// ==============================
// 抓取所有 TCGdex 繁中版卡牌
// ==============================
async function fetchTWCards(): Promise<CardEntry[]> {
  console.log('📦 正在抓取繁中版卡牌 (zh-tw)...');
  const response = await axios.get('https://api.tcgdex.net/v2/zh-tw/cards', { timeout: 30000 });
  const data: any[] = response.data;

  return data
    .filter((c) => c.image)
    .map((c) => ({
      id: c.id,
      name: c.name || '未知名稱',
      images: {
        small: `${c.image}/low.webp`,
        large: `${c.image}/high.webp`,
      },
      set: {
        id: c.id.split('-')[0],
        name: '亞洲繁中版',
      },
      localId: c.localId || c.id.split('-').pop() || '000',
      region: 'TW' as const,
    }));
}

// ==============================
// 抓取所有 TCGdex 日文版卡牌
// ==============================
async function fetchJPCards(): Promise<CardEntry[]> {
  console.log('📦 正在抓取日文版卡牌 (ja)...');
  const response = await axios.get('https://api.tcgdex.net/v2/ja/cards', { timeout: 30000 });
  const data: any[] = response.data;

  return data
    .filter((c) => c.image)
    .map((c) => ({
      id: c.id,
      name: c.name || '未知名稱',
      images: {
        small: `${c.image}/low.webp`,
        large: `${c.image}/high.webp`,
      },
      set: {
        id: c.id.split('-')[0],
        name: '日版原裝',
      },
      localId: c.localId || c.id.split('-').pop() || '000',
      region: 'JP' as const,
    }));
}

// ==============================
// 嘗試從 pokemontcg.io 抓取英文版資訊以補充 TCGPlayer 報價
// ==============================
async function fetchTCGPlayerPrice(cardName: string, setId: string): Promise<{ tcgId?: string; enName?: string; price?: number } | null> {
  try {
    // 先用 setId 前綴對應英文 set
    const response = await axios.get('https://api.pokemontcg.io/v2/cards', {
      params: { q: `name:"${cardName}"`, pageSize: 1 },
      timeout: 8000,
    });
    const cards = response.data.data;
    if (cards && cards.length > 0) {
      const card = cards[0];
      const price = card.tcgplayer?.prices?.holofoil?.market
        || card.tcgplayer?.prices?.normal?.market
        || card.tcgplayer?.prices?.reverseHolofoil?.market
        || null;
      return { tcgId: card.id, enName: card.name, price };
    }
  } catch (e) {
    // 靜默失敗
  }
  return null;
}

// ==============================
// 主要爬蟲流程
// ==============================
async function scrapeCards() {
  console.log('🚀 開始執行全量卡牌爬蟲...\n');

  // 確保輸出目錄存在
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  try {
    // **第一步：同時抓取繁中與日文版**
    const [twCards, jpCards] = await Promise.all([fetchTWCards(), fetchJPCards()]);
    console.log(`✅ 繁中版: ${twCards.length} 張`);
    console.log(`✅ 日文版: ${jpCards.length} 張`);

    // **第二步：合併，去重**
    const allCards = [...twCards, ...jpCards];
    const uniqueCards = Array.from(new Map(allCards.map((c) => [c.id, c])).values());
    console.log(`📊 去重後總計: ${uniqueCards.length} 張`);

    // **第三步：寫出基礎卡牌資料庫**
    fs.writeFileSync(
      path.join(DATA_DIR, 'cards.json'),
      JSON.stringify(uniqueCards, null, 2)
    );
    console.log(`\n💾 已儲存基礎卡牌資料至 src/data/cards.json`);
    console.log(`\n✨ 爬蟲完成！共 ${uniqueCards.length} 筆卡牌資料已寫出。`);
    console.log('\n💡 提示：如需更新 eBay/SNKR 的 PSA 10 鑑定價格，請執行：npm run scrape:prices');

  } catch (error: any) {
    console.error('❌ 爬蟲發生錯誤:', error.message);
    process.exit(1);
  }
}

scrapeCards();
