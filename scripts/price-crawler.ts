import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 定義需要優先追蹤的熱門卡牌
const HOT_CARDS = [
  { name: 'Pikachu with Grey Felt Hat', id: 'svp-85' },
  { name: 'Charizard ex 199/165', id: 'sv1en-199' },
  { name: 'M Charizard-EX', id: 'xy12-13' },
  { name: 'Umbreon VMAX 215/203', id: 'swsh7-215' },
  { name: 'Giratina V 186/196', id: 'swsh11-186' }
];

async function fetchEbayPrice(keyword: string): Promise<number | null> {
  console.log(`[eBay] 正在搜尋: ${keyword} PSA 10...`);
  try {
    const url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(keyword)}+PSA+10&_sop=15`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    // 尋找 NT$ 價格 (eBay 會根據 IP 自動轉換)
    const priceMatches = response.data.match(/NT\$\s*([\d,]+)/g);
    if (priceMatches && priceMatches.length > 0) {
      const prices = priceMatches.map((m: string) => parseInt(m.replace(/[^\d]/g, ''), 10));
      // 取前幾筆結果的中位數以避免極端值
      const validPrices = prices.filter((p: number) => p > 100); // 排除運費或太便宜的廣告
      if (validPrices.length === 0) return null;
      const topFew = validPrices.slice(0, 5).sort((a: number, b: number) => a - b);
      return topFew[Math.floor(topFew.length / 2)];
    }
    return null;
  } catch (e: any) {
    console.warn(`[eBay] 抓取失敗 (${keyword}):`, e.message);
    return null;
  }
}

async function fetchSnkrPrice(keyword: string): Promise<number | null> {
  console.log(`[SNKRDUNK] 正在搜尋: ${keyword} PSA 10...`);
  try {
    // 優先使用英文版搜尋，因為關鍵字匹配較準
    const url = `https://snkrdunk.com/en/search/pokemon-cards?keyword=${encodeURIComponent(keyword)}+PSA10`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
      }
    });

    // SNKRDUNK 是 Next.js 應用，通常數據在 __NEXT_DATA__ 中
    const nextDataMatch = response.data.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]+?)<\/script>/);
    if (nextDataMatch) {
      const data = JSON.parse(nextDataMatch[1]);
      // 不同版本的路徑可能不同，嘗試常見路徑
      const products = data?.props?.pageProps?.initialState?.search?.products || 
                       data?.props?.pageProps?.products || [];
      
      if (products.length > 0) {
        let price = products[0].price || products[0].lowestPrice;
        // 如果是日幣，簡單換算為台幣 (約 0.22)
        if (price > 1000) return Math.floor(price * 0.22); 
        return price;
      }
    }
    
    // 備援方案：正則匹配價格字串
    const genericPriceMatch = response.data.match(/¥([\d,]+)/);
    if (genericPriceMatch) {
      const yen = parseInt(genericPriceMatch[1].replace(/,/g, ''), 10);
      return Math.floor(yen * 0.22);
    }

    return null;
  } catch (e: any) {
    console.warn(`[SNKRDUNK] 抓取失敗 (${keyword}):`, e.message);
    return null;
  }
}

async function startScraping() {
  const results: Record<string, { ebay: number | null; snkr: number | null, updatedAt: string }> = {};

  for (const card of HOT_CARDS) {
    const ebay = await fetchEbayPrice(card.name);
    const snkr = await fetchSnkrPrice(card.name);
    
    results[card.id] = { 
      ebay, 
      snkr,
      updatedAt: new Date().toISOString()
    };
    
    // 緩減壓力，避免被 Ban
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  const outDir = path.join(__dirname, '../src/data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  
  fs.writeFileSync(
    path.join(outDir, 'graded-prices.json'), 
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n✨ 鑑定卡價格更新完成！');
  console.log('檔案路徑: src/data/graded-prices.json');
}

startScraping();
