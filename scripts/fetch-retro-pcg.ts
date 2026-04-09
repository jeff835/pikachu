import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

// Bulbapedia / Pokecardex 無水印日版卡圖抓取框架
const DATA_FILE = path.join(process.cwd(), 'src/data/cards.json');

async function fetchCleanRetroImage(cardName: string, setId: string, cardNumber: string) {
  // 實作: 透過名稱前往 Bulbapedia 獲取檔案庫網址
  // 例如 Bulbapedia 的檔案搜尋 API 或 Wiki API
  try {
    const query = encodeURIComponent(`File:${cardName} ${setId} ${cardNumber}.jpg`.replace(/ /g, '_'));
    const url = `https://bulbapedia.bulbagarden.net/w/api.php?action=query&titles=${query}&prop=imageinfo&iiprop=url&format=json`;
    
    // 註意：這裡設定框架，實際上 Bulbapedia 的檔名規則變動大，後續可針對特定系列擴充正則匹配
    const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const pages = res.data?.query?.pages;
    if (pages) {
      const pageId = Object.keys(pages)[0];
      if (pageId !== '-1' && pages[pageId].imageinfo) {
        return pages[pageId].imageinfo[0].url; // 取得原始乾淨大圖 URL
      }
    }
    return null;
  } catch (err) {
    return null;
  }
}

async function main() {
  console.log('🚀 開始掃描需要無水印歷史圖庫的 PCG 世代卡片...');
  
  if (!fs.existsSync(DATA_FILE)) {
    console.error('找不到 cards.json！');
    return;
  }
  
  const cards = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  const pcgCards = cards.filter((c: any) => c.set_id?.startsWith('PCG') && c.region === 'JP');
  
  console.log(`📌 共發現 ${pcgCards.length} 張日版 PCG 卡片需要修復圖源。`);
  
  let updated = 0;
  for (const card of pcgCards) {
    // 這裡放入每張卡的爬取調用，配合 setTimeout 避免被封鎖
    // 此處為架構示範，後續會搭配精準名稱轉換辭典 (POKEMON_JA_MAP) 來優化命中率
    console.log(`[處理中] ${card.id} - ${card.name}`);
    await new Promise(r => setTimeout(r, 200)); 
  }
  
  console.log(`\\n🎉 爬蟲架構就緒。待名稱校對後，即可批量抓取替換！`);
}

main().catch(console.error);
