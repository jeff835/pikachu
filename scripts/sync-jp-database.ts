import fs from 'fs';
import path from 'path';

const API_BASE = 'https://api.tcgdex.net/v2/ja';
const ASSETS_BASE = 'https://assets.tcgdex.net/ja';

interface Card {
  id: string;
  localId: string;
  name: string;
  image?: string;
  set: {
    id: string;
    name: string;
  };
}

async function fetchJson(url: string) {
  const resp = await fetch(url);
  if (!resp.ok) return null;
  return resp.json();
}

async function syncJpDatabase() {
  console.log('🚀 開始建立全量日文卡牌資料庫...');

  const sets = await fetchJson(`${API_BASE}/sets`);
  if (!sets) {
    console.error('❌ 無法獲取彈種列表');
    return;
  }

  console.log(`📦 發現 ${sets.length} 個日文彈種，開始抓取卡牌資訊...`);

  let allCards: any[] = [];
  const totalSets = sets.length;

  for (let i = 0; i < totalSets; i++) {
    const set = sets[i];
    process.stdout.write(`\r處理中 (${i + 1}/${totalSets}): ${set.name} ...`);

    const setDetail = await fetchJson(`${API_BASE}/sets/${set.id}`);
    if (!setDetail || !setDetail.cards || setDetail.cards.length === 0) {
      continue;
    }

    const serieId = setDetail.serie.id.toLowerCase();
    const setId = setDetail.id.toLowerCase();

    const setCards = setDetail.cards.map((card: any) => ({
      id: card.id,
      localId: card.localId,
      name: card.name,
      // TCGdex 圖片規律: assets.tcgdex.net/ja/<serie>/<set>/<localId>/high.jpg
      image: `${ASSETS_BASE}/${serieId}/${setId}/${card.localId}/high.jpg`,
      rarity: card.rarity || 'Common',
      set: {
        id: set.id,
        name: set.name,
        logo: set.logo
      },
      region: 'JP'
    }));

    allCards = [...allCards, ...setCards];
  }

  console.log('\n✅ 抓取完成！');
  console.log(`📊 總共獲取 ${allCards.length} 張日文卡牌。`);

  const outputPath = path.join(process.cwd(), 'src/data/cards.json');
  fs.writeFileSync(outputPath, JSON.stringify(allCards, null, 2));
  console.log(`💾 數據已儲存至: ${outputPath}`);
}

syncJpDatabase().catch(err => {
  console.error('❌ 同步失敗:', err);
});
