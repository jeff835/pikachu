const axios = require('axios');
const fs = require('fs');

async function bruteForceM4Secrets() {
  const url = 'https://www.pokemon-card.com/card-search/resultAPI.php';
  const foundCards = new Map();
  
  const START_ID = 50168;
  const END_ID = 50250; 

  console.log(`🚀 開始地毯式搜索 ID 區間: ${START_ID} ~ ${END_ID}`);

  const rarityFilters = [
    { name: 'SR', params: { sc_rare_sr: '1' } },
    { name: 'SAR', params: { sc_rare_sar: '1' } },
    { name: 'UR', params: { sc_rare_ur: '1' } },
    { name: 'AR', params: { sc_rare_ar: '1' } },
    { name: 'RR', params: { sc_rare_rr: '1' } },
    { name: 'NONE', params: { keyword: 'ニンジャスピナー' } }
  ];

  for (const filter of rarityFilters) {
    console.log(`\n🔍 正在測試標籤: ${filter.name}...`);
    for (let page = 1; page <= 15; page++) {
      try {
        const res = await axios.get(url, {
          params: { 
            ...filter.params,
            regulation: 'all', 
            page: page
          },
          headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh)', 'Referer': 'https://www.pokemon-card.com/' }
        });

        if (!res.data.cardList || res.data.cardList.length === 0) break;

        const matches = res.data.cardList.filter(c => {
          const id = parseInt(c.cardID);
          return (id >= START_ID && id <= END_ID) || (c.cardThumbFile && c.cardThumbFile.includes('/M4/'));
        });

        if (matches.length > 0) {
          matches.forEach(m => {
            if (!foundCards.has(m.cardID)) {
              foundCards.set(m.cardID, m);
              console.log(`  ✨ [發現] ${m.cardID}: ${m.cardNameViewText} (稀有度: ${m.rarity || '?'})`);
            }
          });
        }
        
        if (page >= (res.data.maxPage || 15)) break;
      } catch (e) {
        console.log(`  ❌ Page ${page} 錯誤: ${e.message}`);
      }
    }
  }

  const finalResults = Array.from(foundCards.values()).sort((a, b) => parseInt(a.cardID) - parseInt(b.cardID));
  fs.writeFileSync('/Users/wengyiwei/Desktop/pikachu/scripts/m4-secrets-found.json', JSON.stringify(finalResults, null, 2));
  console.log(`\n✅ 搜索結束！共發現 ${finalResults.length} 張潛在隱藏卡。`);
}

bruteForceM4Secrets();
