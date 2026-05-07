const axios = require('axios');
const fs = require('fs');

async function exhaustiveM4Search() {
  const url = 'https://www.pokemon-card.com/card-search/resultAPI.php';
  const foundCards = new Map();
  
  // Load existing discovery if exists
  if (fs.existsSync('scripts/m4-discovery.json')) {
    const existing = JSON.parse(fs.readFileSync('scripts/m4-discovery.json'));
    existing.forEach(c => foundCards.set(c.cardID, c));
  }

  console.log(`Starting with ${foundCards.size} cards.`);

  const pgs = Array.from({length: 100}, (_, i) => (900 + i).toString());
  pgs.push('M4', 'M-P');

  const rarities = ['', 'sc_rare_sr', 'sc_rare_sar', 'sc_rare_ur', 'sc_rare_ar'];

  for (const pg of pgs) {
    for (const rarity of rarities) {
      const params = { pg, regulation: 'all', page: 1 };
      if (rarity) params[rarity] = '1';

      try {
        const res = await axios.get(url, {
          params,
          headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.pokemon-card.com/' }
        });

        if (res.data.cardList) {
          const m4InThisBatch = res.data.cardList.filter(c => c.cardThumbFile && c.cardThumbFile.includes('/M4/'));
          if (m4InThisBatch.length > 0) {
            m4InThisBatch.forEach(c => foundCards.set(c.cardID, c));
            console.log(`[PG:${pg}] [Rarity:${rarity || 'ALL'}] Found ${m4InThisBatch.length} M4 cards. Total: ${foundCards.size}`);
          }
        }
      } catch (e) {
        console.log(`Error on PG:${pg} Rarity:${rarity}: ${e.message}`);
      }
    }
  }

  const finalResults = Array.from(foundCards.values()).sort((a, b) => parseInt(a.cardID) - parseInt(b.cardID));
  fs.writeFileSync('scripts/m4-exhaustive-results.json', JSON.stringify(finalResults, null, 2));
  console.log(`\nDONE! Total unique M4 cards found: ${finalResults.size || finalResults.length}`);
}

exhaustiveM4Search();
