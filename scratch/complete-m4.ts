import axios from 'axios';
import fs from 'fs';
import path from 'path';

const API_URL = 'https://www.pokemon-card.com/card-search/resultAPI.php';

async function fetchCardById(id: number) {
  try {
    // 技巧：利用關鍵字搜尋 ID，這比直接傳 pg 更容易抓到隱藏卡
    const response = await axios.get(API_URL, {
      params: { word: id.toString() },
      timeout: 10000
    });
    
    if (response.data.result === 1 && response.data.cardList) {
      // 尋找精確匹配 ID 的那張卡
      return response.data.cardList.find((c: any) => c.cardID === id.toString());
    }
  } catch (error) {
    // console.error(`Error fetching ID ${id}`);
  }
  return null;
}

async function main() {
  const startId = 50085;
  const endId = 50205; // 120 cards total
  const results = [];

  console.log(`🚀 開始精確抓取 M4 系列 (ID: ${startId} ~ ${endId})...`);

  for (let i = startId; i <= endId; i++) {
    const card = await fetchCardById(i);
    if (card) {
      console.log(`✅ 抓到 [${i}]: ${card.cardNameViewText}`);
      results.push({
        id: `M4-${card.cardID}`,
        local_id: card.cardID,
        name: card.cardNameViewText,
        image_url: `https://www.pokemon-card.com${card.cardThumbFile.replace('thumb', 'large')}`,
        set_id: 'M4',
        set_name: '拡張パック「ニンジャスピナー」 (M4)',
        serie_id: 'M'
      });
    } else {
      console.log(`❌ 缺失 [${i}]`);
    }
    // 稍微延遲避免被封
    await new Promise(r => setTimeout(r, 300));
  }

  fs.writeFileSync('scratch/m4-complete.json', JSON.stringify(results, null, 2));
  console.log(`\n🎉 任務完成！共抓取 ${results.length} 張卡片。`);
}

main();
