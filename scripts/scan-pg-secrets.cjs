const axios = require('axios');

async function findSecrets() {
  const url = 'https://www.pokemon-card.com/card-search/resultAPI.php';
  const pgs = ['M-P', '953', '952', '950', '949', '944', '945']; // Possible PGs
  const rarityKeys = ['sc_rare_sr', 'sc_rare_sar', 'sc_rare_ur', 'sc_rare_ar'];
  
  for (const pg of pgs) {
    console.log(`Checking PG: ${pg}...`);
    for (const key of rarityKeys) {
      const res = await axios.get(url, {
        params: { pg, regulation: 'all', [key]: '1' },
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh)', 'Referer': 'https://www.pokemon-card.com/' }
      });
      
      if (res.data.cardList && res.data.cardList.length > 0) {
        console.log(`  [PG:${pg}] Found ${res.data.cardList.length} cards with ${key}=1`);
        // Check image path for /M4/
        const m4Secrets = res.data.cardList.filter(c => c.cardThumbFile && c.cardThumbFile.includes('/M4/'));
        if (m4Secrets.length > 0) {
          console.log(`  ✨ MATCH! Found ${m4Secrets.length} M4 cards in PG:${pg} with ${key}=1`);
          m4Secrets.slice(0, 5).forEach(s => console.log(`     - ${s.cardID}: ${s.cardNameViewText}`));
        }
      }
    }
  }
}

findSecrets();
