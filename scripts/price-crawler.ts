import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// 載入環境變數
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../src/data');
const CARDS_FILE = path.join(DATA_DIR, 'cards.json');
const METADATA_FILE = path.join(DATA_DIR, 'enriched-metadata.json');

// 初始化 Supabase (使用專案內部的環境變數)
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const POKEMON_JA_MAP: Record<string, string> = {
  '皮卡丘': 'ピカチュウ', '噴火龍': 'リザードン', '妙蛙種子': 'フシギダネ', '水箭龜': 'カメックス',
  '耿鬼': 'ゲンガー', '卡比獸': 'カビゴン', '超夢': 'ミュウツー', '夢幻': 'ミュウ',
  '洛奇亞': 'ルギア', '鳳王': 'ホウオウ', '水君': 'スイクン', '烈空坐': 'レックウザ',
  '伊布': 'イーブイ', '沙奈朵': 'サーナイト', '甲賀忍蛙': 'ゲッコウガ'
};

const POKEMON_EN_MAP: Record<string, string> = {
  '皮卡丘': 'Pikachu', '噴火龍': 'Charizard', '妙蛙種子': 'Bulbasaur', '水箭龜': 'Blastoise',
  '伊布': 'Eevee', '耿鬼': 'Gengar', '烈空坐': 'Rayquaza', '超夢': 'Mewtwo', '夢幻': 'Mew'
};

interface CardEntry { id: string; name: string; region: string; }
interface EnrichedMetadata {
  ebayPrice?: number | null;
  snkrPrice?: number | null;
  ebayImageUrl?: string | null;
  snkrImageUrl?: string | null;
  lastAttempted?: string;
  updatedAt: string;
}

const allCards: CardEntry[] = JSON.parse(fs.readFileSync(CARDS_FILE, 'utf-8'));
let enrichedMetadata: Record<string, EnrichedMetadata> = {};

if (fs.existsSync(METADATA_FILE)) {
  try {
    enrichedMetadata = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
  } catch (e) {}
}

async function fetchFromEbay(query: string) {
  try {
    const url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&_sop=15`;
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' },
      timeout: 8000
    });
    const body = response.data;
    const priceMatches = body.match(/US\$\s*([\d,.]+)/g); // 僅匹配 USD
    let price: number | null = null;
    if (priceMatches) {
      const validPrices = priceMatches.map((m: string) => {
        return parseFloat(m.replace(/[^\d.]/g, ''));
      }).filter((v: number) => v > 5); // 稍微過濾極端低價 (如運費)
      if (validPrices.length > 0) price = validPrices[0];
    }
    const imgMatch = body.match(/(?:src|data-src)="(https:\/\/i\.ebayimg\.com\/images\/g\/[\w-]+\/s-l\d+\.(?:jpg|webp|jpeg))"/);
    return { price, imageUrl: imgMatch ? imgMatch[1] : null };
  } catch (e) { return { price: null, imageUrl: null }; }
}

async function fetchFromSNKRDunk(query: string) {
  try {
    const url = `https://snkrdunk.com/products/search?q=${encodeURIComponent(query)}`;
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
      timeout: 8000
    });
    const body = response.data;
    
    // 日幣提取 (JPY 符號或 ¥)
    const jpyMatches = body.match(/(?:¥|円)\s*([\d,]+)/g);
    let price: number | null = null;
    if (jpyMatches) {
      const validPrices = jpyMatches.map((m: string) => {
        return parseFloat(m.replace(/[^\d]/g, ''));
      }).filter((v: number) => v > 100);
      if (validPrices.length > 0) price = validPrices[0];
    }

    const imgMatch = body.match(/src="(https:\/\/img\.snkrdunk\.com\/images\/product\/[\w/]+\.jpg)"/);
    return { price, imageUrl: imgMatch ? imgMatch[1] : null };
  } catch (e) { return { price: null, imageUrl: null }; }
}

async function startEnrichment(limit = 50, forceAll = false) {
  console.log(`🚀 啟動行情強化爬蟲 (併步 Supabase) (批次: ${limit})`);
  let processed = 0;
  const now = new Date();

  for (const card of allCards) {
    const existing = enrichedMetadata[card.id];
    // 如果已經有資料且更新時間在一週內，跳過 (除非強制)
    if (existing && existing.ebayPrice && existing.snkrPrice && (now.getTime() - new Date(existing.updatedAt).getTime()) < 86400000 * 7) continue;

    if (!forceAll && processed >= limit) break;

    const [setId, cardNum] = card.id.split('-');
    const jaName = POKEMON_JA_MAP[card.name] || card.name;
    const enName = POKEMON_EN_MAP[card.name] || card.name;

    console.log(`[${processed + 1}] 正在抓取: ${card.name} (${card.id})`);

    // 1. 抓取 SNKRDUNK (JPY)
    let snkrResult = await fetchFromSNKRDunk(`${jaName} ${cardNum}/${setId} PSA 10`);
    if (!snkrResult.price) {
      snkrResult = await fetchFromSNKRDunk(`${jaName} PSA 10`);
    }

    // 2. 抓取 eBay (USD)
    let ebayResult = await fetchFromEbay(`${enName} ${cardNum} PSA 10`);
    if (!ebayResult.price) {
      ebayResult = await fetchFromEbay(`${card.id} PSA 10`);
    }

    // 更新資料庫
    if (ebayResult.price || snkrResult.price) {
       const { error } = await supabase
        .from('card_prices')
        .upsert({
            card_id: card.id,
            snkr_price: snkrResult.price,
            ebay_price: ebayResult.price,
            last_updated: now.toISOString()
        });
       if (error) console.error(`❌ Supabase Upsert 失敗 (${card.id}):`, error.message);
       else console.log(`✅ 已同步至 Supabase: ${card.id}`);
    }

    // 同步更新本地 JSON 備份
    enrichedMetadata[card.id] = {
      ...existing,
      ebayPrice: ebayResult.price || existing?.ebayPrice || null,
      ebayImageUrl: ebayResult.imageUrl || existing?.ebayImageUrl || null,
      snkrPrice: snkrResult.price || existing?.snkrPrice || null,
      snkrImageUrl: snkrResult.imageUrl || existing?.snkrImageUrl || null,
      lastAttempted: now.toISOString(),
      updatedAt: (ebayResult.price || snkrResult.price) ? now.toISOString() : (existing?.updatedAt || now.toISOString())
    };

    processed++;
    fs.writeFileSync(METADATA_FILE, JSON.stringify(enrichedMetadata, null, 2));
    
    // 頻率限制
    const delay = (ebayResult.price || snkrResult.price) ? 2000 : 500;
    await new Promise(r => setTimeout(r, delay + Math.random() * 500));
  }
  console.log(`✨ 完成！共更新 ${processed} 筆報價數據。`);
}

const isAll = process.argv.includes('--all');
startEnrichment(isAll ? 9999 : 30, isAll);
