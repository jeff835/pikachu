const axios = require('axios');

async function idBruteForce() {
  const url = 'https://www.pokemon-card.com/card-search/resultAPI.php';
  
  console.log("🚀 Brute-forcing IDs from 50001 to 50205...");
  
  for (let id = 50001; id <= 50205; id++) {
    try {
      const res = await axios.get(url, {
        params: { 
          keyword: id.toString(),
          regulation: 'all'
        },
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh)', 'Referer': 'https://www.pokemon-card.com/' }
      });

      if (res.data.cardList && res.data.cardList.length > 0) {
        // Filter for exact ID match
        const exact = res.data.cardList.find(c => c.cardID === id.toString());
        if (exact && exact.cardThumbFile && exact.cardThumbFile.includes('/M4/')) {
          console.log(`✅ [ID:${id}] FOUND M4 CARD: ${exact.cardNameViewText} (${exact.cardThumbFile})`);
        }
      }
    } catch (e) {}
    
    if (id % 20 === 0) console.log(`Progress: ${id}...`);
  }
}

idBruteForce();
