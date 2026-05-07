const axios = require('axios');

async function bruteForcePG() {
  const url = 'https://www.pokemon-card.com/card-search/resultAPI.php';
  
  for (let pg = 940; pg <= 960; pg++) {
    console.log(`Checking PG: ${pg}...`);
    try {
      const res = await axios.get(url, {
        params: { pg: pg.toString(), regulation: 'all', page: 1 },
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh)', 'Referer': 'https://www.pokemon-card.com/' }
      });

      if (res.data.cardList && res.data.cardList.length > 0) {
        const c = res.data.cardList[0];
        console.log(`  [PG:${pg}] Name: ${c.expansionText || '??'} | Count: ${res.data.cardList.length}`);
        
        const possibleM4 = res.data.cardList.filter(card => 
          (card.cardThumbFile && card.cardThumbFile.includes('/M4/')) ||
          (parseInt(card.cardID) >= 50085 && parseInt(card.cardID) <= 50250)
        );
        
        if (possibleM4.length > 0) {
          console.log(`  🎯 FOUND POSSIBLE M4 CARDS IN PG:${pg}! Count: ${possibleM4.length}`);
          possibleM4.slice(0, 3).forEach(s => console.log(`     - ${s.cardID}: ${s.cardNameViewText} (${s.cardThumbFile})`));
        }
      }
    } catch (e) {}
  }
}

bruteForcePG();
