import axios from 'axios';
import fs from 'fs';
import path from 'path';

const API_URL = 'https://www.pokemon-card.com/card-search/resultAPI.php';

async function probeRange(start: number, end: number) {
  console.log(`🚀 開始探測 ID 範圍: ${start} ~ ${end}...`);
  const foundCards = [];

  for (let id = start; id <= end; id++) {
    try {
      // 模擬直接按 ID 搜尋的參數
      const response = await axios.get(API_URL, {
        params: {
          keyword: id.toString(),
          regulation: 'all'
        },
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.pokemon-card.com/card-search/'
        }
      });

      if (response.data.result === 1 && response.data.cardList) {
        const matches = response.data.cardList.filter((c: any) => c.cardID === id.toString());
        if (matches.length > 0) {
          const card = matches[0];
          console.log(`✅ 發現卡片 [${id}]: ${card.cardNameViewText} (${card.cardThumbFile})`);
          foundCards.push(card);
        }
      }
      
      // 每 5 筆稍微停一下，避免被官網封鎖
      if (id % 5 === 0) await new Promise(r => setTimeout(r, 200));

    } catch (e: any) {
      console.error(`❌ [${id}] 請求失敗:`, e.message);
    }
  }

  console.log(`\n✨ 探測結束！共找到 ${foundCards.length} 張卡片。`);
  fs.writeFileSync(path.join(process.cwd(), 'scripts/m4-probed.json'), JSON.stringify(foundCards, null, 2));
}

// 我們從 50000 探測到 50250，涵蓋目前的 50085~50167
probeRange(50000, 50250);
