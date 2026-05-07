const axios = require('axios');
const fs = require('fs');

async function finalTest() {
  const url = 'https://www.pokemon-card.com/card-search/resultAPI.php';
  
  const tests = [
    { name: "Rarity Array", params: { pg: '953', 'rarity[]': ['SR', 'SAR', 'UR'], regulation: 'all' } },
    { name: "Rarity Individual", params: { pg: '953', sc_rare_sr: '1', sc_rare_sar: '1', sc_rare_ur: '1', regulation: 'all' } },
    { name: "Keyword SR", params: { pg: '953', keyword: 'SR', regulation: 'all' } }
  ];

  for (const t of tests) {
    console.log(`\n--- Testing: ${t.name} ---`);
    try {
      const res = await axios.get(url, {
        params: t.params,
        headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.pokemon-card.com/' }
      });
      if (res.data.cardList) {
        console.log(`Found ${res.data.cardList.length} cards.`);
        res.data.cardList.slice(0, 3).forEach(c => {
            console.log(`  - [ID:${c.cardID}] ${c.cardNameViewText} (${c.rarityText})`);
        });
      }
    } catch (e) { console.log("Failed."); }
  }
}

finalTest();
