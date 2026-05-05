import axios from 'axios';
import fs from 'fs';
import path from 'path';

const API_URL = 'https://www.pokemon-card.com/card-search/resultAPI.php';

const MAX_PAGES = 50; // 安全閥：防止無限迴圈

async function findM4Cards() {
  console.log('🚀 開始深度探索 M4 (Ninja Spinner) 缺失卡片...');
  
  const results = new Map();

  // 策略 1: 直接使用 pg=M4 (基礎搜尋)
  console.log('1. 正在抓取 pg=M4 基礎清單...');
  await fetchByParams({ pg: 'M4' }, results);

  // 策略 2: 使用關鍵字搜尋「ニンジャスピナー」
  console.log('2. 正在透過關鍵字「ニンジャスピナー」搜尋...');
  await fetchByParams({ keyword: 'ニンジャスピナー' }, results);

  console.log(`\n📊 探索完成！共發現 ${results.size} 張不重複卡片。`);
  
  const allCards = Array.from(results.values());
  allCards.sort((a, b) => {
    const idA = parseInt(a.cardID) || 0;
    const idB = parseInt(b.cardID) || 0;
    return idA - idB;
  });

  if (allCards.length > 0) {
    const outputPath = path.join(process.cwd(), 'scripts/m4-discovery.json');
    fs.writeFileSync(outputPath, JSON.stringify(allCards, null, 2));
    console.log(`✅ 結果已儲存至: ${outputPath}`);
    
    // 顯示前幾張和最後幾張的 ID 供參考
    console.log('ID 範例:', allCards.slice(0, 3).map(c => c.cardID), '...', allCards.slice(-3).map(c => c.cardID));
    
    if (allCards.length === 120) {
      console.log('🎉 太棒了！剛好找到了 120 張卡片！');
    } else {
      console.log(`目前總數為 ${allCards.length}，距離 120 還有 ${120 - allCards.length} 張的差距。`);
    }
  } else {
    console.log('⚠️ 未發現任何卡片，請檢查網路或 API 是否變動。');
  }
}

async function fetchByParams(params: any, map: Map<string, any>) {
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= MAX_PAGES) {
    try {
      console.log(`   [頁面 ${page}] 正在請求...`);
      const response = await axios.get(API_URL, {
        params: { ...params, page, regulation: 'all' },
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.pokemon-card.com/card-search/'
        }
      });

      if (response.data.result !== 1 || !response.data.cardList) {
        console.log(`   🏁 已到達末頁或無資料 (Result: ${response.data.result})`);
        break;
      }

      const list = response.data.cardList;
      list.forEach((c: any) => map.set(c.cardID, c));
      console.log(`   ✅ 取得 ${list.length} 張卡片 (累計: ${map.size})`);

      if (page >= response.data.maxPage) {
        hasMore = false;
      } else {
        page++;
        // 禮貌性延遲 1-2 秒
        const delay = 1000 + Math.random() * 1000;
        await new Promise(r => setTimeout(r, delay));
      }

    } catch (e: any) {
      console.error(`  ⚠️ 請求失敗 (Page ${page}):`, e.message);
      break;
    }
  }
  
  if (page > MAX_PAGES) {
    console.log(`  ⚠️ 已達到安全頁數上限 (${MAX_PAGES})，強制停止以防止死循環。`);
  }
}

findM4Cards();
