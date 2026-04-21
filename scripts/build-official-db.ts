import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// 載入環境變數
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const API_URL = 'https://www.pokemon-card.com/card-search/resultAPI.php';

interface OfficialCard {
  cardID: string;
  cardThumbFile: string;
  cardNameViewText: string;
  regulation?: string;
  expansionName?: string;
}

interface SetInfo {
  id: string; // 官方內部查詢 ID (pg)
  name: string; // 前台名稱
}

// 追加 SV6a 擴充包
const TARGET_SETS: SetInfo[] = [
  { id: '917', name: 'ナイトワンダラー' }
];

async function uploadImageToSupabase(imageUrl: string, savePath: string): Promise<string | null> {
  try {
    const res = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(res.data, 'binary');
    
    const { data, error } = await supabase.storage
      .from('card-images')
      .upload(savePath, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      });
      
    if (error) {
      console.error(`- ⚠️ Upload err [${savePath}]:`, error.message);
      return null;
    }
    
    const { data: pubData } = supabase.storage.from('card-images').getPublicUrl(savePath);
    return pubData.publicUrl;
    
  } catch (err: any) {
    console.error(`- ⚠️ Download err [${imageUrl}]:`, err.message);
    return null;
  }
}

async function fetchCardsForSet(set: SetInfo): Promise<{ cards: any[], symbol: string }> {
  let cards: any[] = [];
  let page = 1;
  let hasMore = true;
  let firstSymbol = set.manualSymbol || '';

  console.log(`\n📦 開始處理擴充包: ${set.name}`);

  while (hasMore) {
    try {
      const response = await axios.get(API_URL, {
        params: { pg: set.id, page: page, regulation: 'all' },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Referer': 'https://www.pokemon-card.com/card-search/',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (response.data.result !== 1 || !response.data.cardList) {
         hasMore = false;
         break;
      }

      const list: OfficialCard[] = response.data.cardList;
      for (const c of list) {
         // 動態從官方網址提取真正的擴充包代號 (例如 /large/SV11B/...)
         const parts = c.cardThumbFile.split('/');
         const extractedSymbol = (parts.length > 5) ? parts[5] : set.id;
         const setSymbol = set.manualSymbol || extractedSymbol;
         if (!firstSymbol) firstSymbol = setSymbol;
        
         // 生成官方圖片的真實解析度網址
         const officialImgUrl = `https://www.pokemon-card.com${c.cardThumbFile.replace('thumb', 'large')}`;
         const storagePath = `${setSymbol}/${c.cardID}.jpg`;
         
         process.stdout.write(`  -> 抓取 [${c.cardID}] ${c.cardNameViewText}... `);
         
         const uploadedUrl = await uploadImageToSupabase(officialImgUrl, storagePath);
         const finalUrl = uploadedUrl || officialImgUrl; // 即使上傳失敗也保留官方連結兜底
         
         console.log(uploadedUrl ? 'OK' : 'Fallback');

         cards.push({
           id: `${setSymbol}-${c.cardID}`,
           local_id: c.cardID,
           name: c.cardNameViewText,
           image_url: finalUrl,
           set_id: setSymbol,
           set_name: set.name,
           region: 'JP',
           serie_id: setSymbol.startsWith('SV') ? 'SV' : setSymbol.replace(/[0-9a-zA-Z]$/, '').replace(/[0-9]$/, '')
         });
         
         await new Promise(resolve => setTimeout(resolve, 500)); // 避免被官方 rate limit
      }

      if (page >= response.data.maxPage) hasMore = false;
      else page++;
      
    } catch (error: any) {
      console.error(`- API Error (Page ${page}):`, error.message);
      hasMore = false;
    }
  }

  return { cards, symbol: firstSymbol };
}

async function main() {
  console.log(`🚀 開始自建官方圖庫管線... 共 ${TARGET_SETS.length} 個擴充包待處理`);
  
  let allCards: any[] = [];
  let seriesMap: Record<string, { id: string, name: string, sets: any[] }> = {};
  
  for (const set of TARGET_SETS) {
    const { cards, symbol } = await fetchCardsForSet(set);
    allCards = allCards.concat(cards);
    
    // 建立世代目錄結構
    const serieId = symbol.startsWith('SV') ? 'SV' : (symbol.match(/^[A-Za-z]+/)?.[0] || 'Unknown');
    if (!seriesMap[serieId]) {
       seriesMap[serieId] = { id: serieId, name: `${serieId} 系列`, sets: [] };
    }
    if (!seriesMap[serieId].sets.find((s: any) => s.id === symbol)) {
       seriesMap[serieId].sets.push({ id: symbol, name: set.name, logo: '' });
    }
  }

  // 去重: 避免不同 deck 包含重複卡片導致 upsert 失敗
  const uniqueCardsMap = new Map();
  allCards.forEach(c => uniqueCardsMap.set(c.id, c));
  allCards = Array.from(uniqueCardsMap.values());

  // 1. 寫入本地端 cards.json
  const cardsOutputPath = path.join(__dirname, '../src/data/cards.json');
  let existingCards: any[] = [];
  if (fs.existsSync(cardsOutputPath)) {
     existingCards = JSON.parse(fs.readFileSync(cardsOutputPath, 'utf8'));
     existingCards = existingCards.filter(c => !['ナイトワンダラー'].includes(c.set_name));
  }
  const finalCards = existingCards.concat(allCards);
  fs.writeFileSync(cardsOutputPath, JSON.stringify(finalCards, null, 2));
  console.log(`\n✅ 成功產生本地資料: ${finalCards.length} 筆卡片至 cards.json`);

  // 2. 寫入本地端 catalog-structure.json
  const catalogOutputPath = path.join(__dirname, '../src/data/catalog-structure.json');
  if (fs.existsSync(catalogOutputPath)) {
     const existingCatalog = JSON.parse(fs.readFileSync(catalogOutputPath, 'utf8'));
     for (const key of Object.keys(existingCatalog)) {
       if (!seriesMap[key]) seriesMap[key] = existingCatalog[key];
       else {
         // Merge sets, avoiding duplicates
         for (const s of existingCatalog[key].sets) {
           if (!seriesMap[key].sets.find((x: any) => x.id === s.id)) {
              seriesMap[key].sets.push(s);
           }
         }
       }
     }
  }
  fs.writeFileSync(catalogOutputPath, JSON.stringify(seriesMap, null, 2));
  console.log(`✅ 成功產生目錄結構: catalog-structure.json`);

  // 3. 寫入 Supabase 資料庫
  if (allCards.length > 0) {
     console.log(`\n☁️ 開始同步至 Supabase cards 資料表...`);
     const chunkSize = 200;
     for (let i = 0; i < allCards.length; i += chunkSize) {
       const chunk = allCards.slice(i, i + chunkSize);
       const { error } = await supabase.from('cards').upsert(chunk);
       if (error) {
         console.error('  - Supabase Upsert 錯誤:', error.message);
       } else {
         console.log(`  - 成功同步 ${i + chunk.length} / ${allCards.length} 筆`);
       }
     }
  }
  
  console.log('\n🎉 所有作業執行完畢！自建圖庫計畫大成功！');
}

main();
