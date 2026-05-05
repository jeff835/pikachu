import fs from 'fs';
import path from 'path';

const API_BASE = 'https://api.tcgdex.net/v2/ja';
const EN_API_BASE = 'https://api.tcgdex.net/v2/en';
const ASSETS_BASE = 'https://assets.tcgdex.net/jp'; // TCGDex 日版資產通常在 /jp
const EN_ASSETS_BASE = 'https://assets.tcgdex.net/en';

// 舊彈種對應表: 日版 ID -> 英文版 ID (用於 Fallback 圖片)
const SET_ID_FALLBACK_MAP: Record<string, string> = {
  'PMCG1': 'base1',
  'PMCG2': 'base2',
  'PMCG3': 'base3',
  'PMCG4': 'base4',
  'PMCG5': 'gym1',
  'PMCG6': 'gym2',
  'neo1': 'neo1',
  'neo2': 'neo2',
  'neo3': 'neo3',
  'neo4': 'neo4',
  'e1': 'ecard1',
  'e2': 'ecard2',
  'e3': 'ecard3',
  'web': 'web',
  'vs': 'vs',
};

// 譯名過濾: 檢查是否包含日文字符，避免出現保加利亞文等錯誤
function containsJapanese(text: string): boolean {
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
}

async function fetchJson(url: string) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    return resp.json();
  } catch (e) {
    return null;
  }
}

async function syncJpDatabase() {
  console.log('🚀 開始建立全量日文卡牌資料庫 (優化版)...');

  const sets = await fetchJson(`${API_BASE}/sets`);
  if (!sets) {
    console.error('❌ 無法獲取彈種列表');
    return;
  }

  console.log(`📦 發現 ${sets.length} 個日文彈種，開始抓取並清洗資料...`);

  let allCards: any[] = [];
  const totalSets = sets.length;

  for (let i = 0; i < totalSets; i++) {
    const set = sets[i];
    if ((i + 1) % 5 === 0 || i === 0 || i === totalSets - 1) {
      console.log(`處理中 (${i + 1}/${totalSets}): ${set.name} ...`);
    }

    const setDetail = await fetchJson(`${API_BASE}/sets/${set.id}`);
    if (!setDetail || !setDetail.cards || setDetail.cards.length === 0) {
      continue;
    }

    // 獲取該彈種的英文資訊 (用於 Fallback 名稱或圖片)
    const enSetId = SET_ID_FALLBACK_MAP[set.id];
    let enSetDetail: any = null;
    if (enSetId) {
      enSetDetail = await fetchJson(`${EN_API_BASE}/sets/${enSetId}`);
    }

    const serieId = setDetail.serie.id.toLowerCase();
    const setId = setDetail.id.toLowerCase();

    const setCards = setDetail.cards.map((card: any) => {
      let finalName = card.name;
      // 使用 API 提供的基底路徑，若無則 fallback 到拼接網址
      let imageUrl = card.image ? `${card.image}/high.webp` : `${ASSETS_BASE}/${serieId}/${setId}/${card.localId}/high.webp`;

      // 1. 譯名清洗: 如果不包含日文且有英文對應，則使用英文名 (避免保加利亞文侵入)
      if (!containsJapanese(finalName)) {
        if (enSetDetail && enSetDetail.cards) {
          const enCard = enSetDetail.cards.find((c: any) => c.localId === card.localId || parseInt(c.localId) === parseInt(card.localId));
          if (enCard) finalName = enCard.name;
        }
      }

      // 2. 圖片 Fallback: 針對已知缺失日版圖的舊彈種，切換到英文版圖
      if (enSetId) {
        const enSerieId = enSetDetail?.serie?.id?.toLowerCase() || serieId;
        const enSetIdProcessed = enSetId.toLowerCase();
        
        // 重要：英文版資產編號通常沒有前導零 (如 1 而非 001)
        const enLocalId = card.localId.replace(/^0+/, ''); 
        imageUrl = `${EN_ASSETS_BASE}/${enSerieId}/${enSetIdProcessed}/${enLocalId}/high.jpg`;
      }

      return {
        id: card.id,
        localId: card.localId,
        name: finalName,
        image_url: imageUrl, // 統一欄位名為 image_url 以適配 Supabase
        rarity: card.rarity || 'Common',
        set_id: set.id,
        set_name: set.name,
        serie_id: setDetail.serie.id,
        serie_name: setDetail.serie.name,
        region: 'JP'
      };
    });

    allCards = [...allCards, ...setCards];
  }

  // --- 注入官方高畫質資料櫃 (Override/Inject Official Data) ---
  const officialDataPath = path.join(process.cwd(), 'src/data/cards-official.json');
  if (fs.existsSync(officialDataPath)) {
    console.log('\n💎 正在校對官方高畫質資料櫃...');
    const officialCards = JSON.parse(fs.readFileSync(officialDataPath, 'utf-8'));
    let injectCount = 0;
    let updateCount = 0;

    officialCards.forEach((offCard: any) => {
      // 官方 JSON 格式與 TCGDex 不同，需要進行對齊映射
      // 注意：官方圖片路徑需補齊網域
      const officialImg = offCard.cardThumbFile.startsWith('http') 
        ? offCard.cardThumbFile 
        : `https://www.pokemon-card.com${offCard.cardThumbFile}`;

      // 嘗試在現有清單中尋找匹配項 (依名稱匹配，因 ID 體系不同)
      const existingIdx = allCards.findIndex(c => 
        (c.name === offCard.cardNameViewText || c.name === offCard.cardNameAltText)
      );

      if (existingIdx !== -1) {
        // 更新現有卡片的圖片為官方高畫質
        allCards[existingIdx].image_url = officialImg;
        updateCount++;
      } else {
        // 如果是全新卡片 (如 M2a 尚未被 TCGDex 收錄)，則新增
        allCards.push({
          id: `official-${offCard.cardID}`,
          localId: offCard.cardID,
          name: offCard.cardNameViewText,
          image_url: officialImg,
          rarity: 'Common',
          set_id: offCard.cardThumbFile.split('/')[5] || 'UNKNOWN', // 從路徑提取 SetID (如 M2a)
          set_name: offCard.cardThumbFile.split('/')[5] || 'Official Set',
          serie_id: 'OFFICIAL',
          serie_name: 'Official Collection',
          region: 'JP'
        });
        injectCount++;
      }
    });
    console.log(`✨ 校對完成：更新了 ${updateCount} 張圖片，注入了 ${injectCount} 張新卡片。`);
  }

  console.log('\n✅ 抓取與清洗完成！');
  console.log(`📊 總共獲取 ${allCards.length} 張日文卡牌。`);

  const outputPath = path.join(process.cwd(), 'src/data/cards.json');
  fs.writeFileSync(outputPath, JSON.stringify(allCards, null, 2));
  console.log(`💾 數據已儲存至: ${outputPath}`);
}

syncJpDatabase().catch(err => {
  console.error('❌ 同步失敗:', err);
});
