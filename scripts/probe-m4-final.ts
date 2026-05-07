import axios from 'axios';
import fs from 'fs';
import path from 'path';

const API_URL = 'https://www.pokemon-card.com/card-search/resultAPI.php';

async function probeM4SecretRares() {
  console.log('🚀 開始強力探測 M4 (Ninja Spinner) 隱藏卡片 (SR/SAR/UR)...');
  
  const baseIDStart = 50085;
  const baseIDEnd = 50167; // 基礎集 83 張
  const probeStart = 50168; // 從第 84 張開始探測
  const probeEnd = 50250;   // 掃描到 50250，應該足以涵蓋到第 120 張
  
  const foundM4Cards = [];

  // 先把基礎集放進去 (從已有的 discovery 讀取，避免重複請求)
  const discoveryPath = path.join(process.cwd(), 'scripts/m4-discovery.json');
  if (fs.existsSync(discoveryPath)) {
    const discoveryData = JSON.parse(fs.readFileSync(discoveryPath, 'utf-8'));
    const baseSet = discoveryData.filter((c: any) => c.cardThumbFile && c.cardThumbFile.includes('/M4/'));
    foundM4Cards.push(...baseSet);
    console.log(`📦 已載入基礎集卡片: ${baseSet.length} 張`);
  }

  const existingIDs = new Set(foundM4Cards.map(c => c.cardID));

  console.log(`🔍 正在探測 ID 範圍 ${probeStart} ~ ${probeEnd}...`);

  for (let id = probeStart; id <= probeEnd; id++) {
    if (existingIDs.has(id.toString())) continue;

    try {
      // 關鍵：直接用 keyword 搜尋 ID，並加上 regulation=all 確保所有環境都能搜到
      const response = await axios.get(API_URL, {
        params: {
          keyword: id.toString(),
          regulation: 'all'
        },
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Referer': 'https://www.pokemon-card.com/card-search/'
        }
      });

      if (response.data.result === 1 && response.data.cardList) {
        // 精確匹配 ID
        const matches = response.data.cardList.filter((c: any) => c.cardID === id.toString() && c.cardThumbFile.includes('/M4/'));
        if (matches.length > 0) {
          const card = matches[0];
          console.log(`✅ [ID:${id}] 發現隱藏卡: ${card.cardNameViewText}`);
          foundM4Cards.push(card);
          existingIDs.add(id.toString());
        }
      }

      // 控制速度，每 3 個 ID 停一下，避免被 Block
      if (id % 3 === 0) {
        await new Promise(r => setTimeout(r, 300));
      }

    } catch (e: any) {
      console.log(`⚠️ [ID:${id}] 請求異常: ${e.message}`);
    }

    // 每 10 筆顯示一次進度
    if (id % 10 === 0) {
      console.log(`... 進度: ${id}/${probeEnd} (目前累計 M4 卡片: ${foundM4Cards.length})`);
    }
    
    // 如果已經搜到 120 張，就提前結束
    if (foundM4Cards.length >= 120) {
      console.log('🎉 恭喜！已收集齊全 120 張 M4 卡片！');
      break;
    }
  }

  // 儲存最終結果
  foundM4Cards.sort((a, b) => parseInt(a.cardID) - parseInt(b.cardID));
  const finalPath = path.join(process.cwd(), 'scripts/m4-final-120.json');
  fs.writeFileSync(finalPath, JSON.stringify(foundM4Cards, null, 2));
  
  console.log(`\n🏁 任務完成！`);
  console.log(`- 總計發現 M4 卡片: ${foundM4Cards.length} 張`);
  console.log(`- 結果儲存至: ${finalPath}`);
}

probeM4SecretRares();
