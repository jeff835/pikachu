import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../src/data');
const CARDS_FILE = path.join(DATA_DIR, 'cards.json');
const METADATA_FILE = path.join(DATA_DIR, 'enriched-metadata.json');

interface CardEntry {
  id: string;
  name: string;
  region: string;
}

interface EnrichedMetadata {
  ebayPrice?: number | null;
  snkrPrice?: number | null;
  ebayImageUrl?: string | null;
  snkrImageUrl?: string | null;
  updatedAt: string;
}

// 讀取現有卡牌資料
const allCards: CardEntry[] = JSON.parse(fs.readFileSync(CARDS_FILE, 'utf-8'));
let enrichedMetadata: Record<string, EnrichedMetadata> = {};

// 讀取已存在的豐富化數據 (支援斷點續傳)
if (fs.existsSync(METADATA_FILE)) {
  try {
    enrichedMetadata = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
    console.log(`載入現有數據: ${Object.keys(enrichedMetadata).length} 筆`);
  } catch (e) {
    console.warn('讀取 meta 文件失敗，將建立新文件');
  }
}

async function fetchEbayData(keyword: string): Promise<{ price: number | null; imageUrl: string | null }> {
  try {
    const url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(keyword)}+PSA+10&_sop=15`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });
    
    // 提取 NT$ 價格
    const priceMatches = response.data.match(/NT\$\s*([\d,]+)/g);
    let price: number | null = null;
    if (priceMatches) {
      const p = priceMatches.map((m: string) => parseInt(m.replace(/[^\d]/g, ''), 10)).filter((v: number) => v > 100);
      if (p.length > 0) price = p[0];
    }
    
    // 試圖抓取第一個合適的商品圖片 (eBay 搜尋結果中的縮圖)
    const imgMatch = response.data.match(/src="(https:\/\/i\.ebayimg\.com\/images\/g\/[\w-]+\/s-l\d+\.jpg)"/);
    const imageUrl = imgMatch ? imgMatch[1] : null;

    return { price, imageUrl };
  } catch (e: any) {
    return { price: null, imageUrl: null };
  }
}

async function fetchSnkrData(keyword: string): Promise<{ price: number | null; imageUrl: string | null }> {
  try {
    const url = `https://snkrdunk.com/en/search/pokemon-cards?keyword=${encodeURIComponent(keyword)}+PSA10`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
      },
      timeout: 10000
    });

    let price: number | null = null;
    let imageUrl: string | null = null;

    const nextDataMatch = response.data.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]+?)<\/script>/);
    if (nextDataMatch) {
      const data = JSON.parse(nextDataMatch[1]);
      const products = data?.props?.pageProps?.initialState?.search?.products || [];
      
      if (products.length > 0) {
        const prod = products[0];
        const rawPrice = prod.price || prod.lowestPrice;
        price = rawPrice > 1000 ? Math.floor(rawPrice * 0.22) : rawPrice;
        imageUrl = prod.image || prod.thumbnail || null;
      }
    }

    return { price, imageUrl };
  } catch (e: any) {
    return { price: null, imageUrl: null };
  }
}

async function startWideScaleEnrichment(limitPerRun = 20) {
  console.log(`--- 開始執行全量數據豐富化 (本次限制: ${limitPerRun} 筆) ---`);
  
  let processed = 0;
  for (const card of allCards) {
    if (enrichedMetadata[card.id] && enrichedMetadata[card.id].ebayPrice) {
       // 如果已經有數據且已有價格（非 null），則跳過
       continue;
    }

    if (processed >= limitPerRun) break;

    // 生成精確搜尋詞：名稱 + 卡號
    const idParts = card.id.split('-');
    const cardNum = idParts[idParts.length - 1];
    const searchQuery = `${card.name} ${cardNum}`;

    console.log(`[${processed + 1}] 正在豐富化: ${card.name} (${cardNum})...`);
    
    const [ebay, snkr] = await Promise.all([
      fetchEbayData(searchQuery),
      fetchSnkrData(searchQuery)
    ]);

    enrichedMetadata[card.id] = {
      ebayPrice: ebay.price,
      ebayImageUrl: ebay.imageUrl,
      snkrPrice: snkr.price,
      snkrImageUrl: snkr.imageUrl,
      updatedAt: new Date().toISOString()
    };

    processed++;

    // 每 5 筆寫入一次磁碟，確保進度保存
    if (processed % 5 === 0) {
      fs.writeFileSync(METADATA_FILE, JSON.stringify(enrichedMetadata, null, 2));
      console.log(`> 已暫存 ${processed} 筆進度至磁碟`);
    }

    // 隨機延遲 3-6 秒以防被 Ban
    await new Promise(r => setTimeout(r, 3000 + Math.random() * 3000));
  }

  // 最終寫入
  fs.writeFileSync(METADATA_FILE, JSON.stringify(enrichedMetadata, null, 2));
  console.log(`\n✨ 本次豐富化完成！總計處理: ${processed} 筆。`);
}

// 預設每次跑 50 筆
startWideScaleEnrichment(50);
