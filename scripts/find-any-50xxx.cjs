const axios = require('axios');

async function find50xxx() {
  const url = 'https://www.pokemon-card.com/card-search/resultAPI.php';
  
  console.log("🔍 Searching for ANY card with ID > 50167...");
  
  // Try across several pages of SR search
  for (let page = 1; page <= 10; page++) {
    console.log(`Checking SR Page ${page}...`);
    const res = await axios.get(url, {
      params: { 
        regulation: 'all', 
        sc_rare_sr: '1',
        page: page
      },
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh)', 'Referer': 'https://www.pokemon-card.com/' }
    });

    if (res.data.cardList) {
      const target = res.data.cardList.filter(c => parseInt(c.cardID) >= 50085 && parseInt(c.cardID) <= 50300);
      if (target.length > 0) {
        console.log(`  ✨ Found ${target.length} interesting cards on page ${page}!`);
        target.forEach(t => console.log(`     - ${t.cardID}: ${t.cardNameViewText} (${t.cardThumbFile})`));
      }
    }
    
    // Also try SAR
    const res2 = await axios.get(url, {
      params: { 
        regulation: 'all', 
        sc_rare_sar: '1',
        page: page
      },
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh)', 'Referer': 'https://www.pokemon-card.com/' }
    });
    if (res2.data.cardList) {
      const target = res2.data.cardList.filter(c => parseInt(c.cardID) >= 50085 && parseInt(c.cardID) <= 50300);
      if (target.length > 0) {
        console.log(`  ✨ Found ${target.length} interesting SAR cards on page ${page}!`);
        target.forEach(t => console.log(`     - ${t.cardID}: ${t.cardNameViewText} (${t.cardThumbFile})`));
      }
    }
  }
}

find50xxx();
