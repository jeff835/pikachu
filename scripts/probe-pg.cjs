const https = require('https');
const fs = require('fs');

async function probePg(pg) {
  return new Promise((resolve) => {
    https.get(`https://www.pokemon-card.com/card-search/resultAPI.php?pg=${pg}&regulation=all&page=1`, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh)", "Referer": "https://www.pokemon-card.com/" }
    }, (res) => {
       let data = '';
       res.on('data', c => data += c);
       res.on('end', () => {
         try {
           const j = JSON.parse(data);
           if (j.cardList && j.cardList.length > 0) {
              const c = j.cardList[0];
              resolve({ pg, set: c.expansionText || 'Unknown', series: c.seriesText || 'Unknown', count: j.cardList.length });
           } else {
              resolve(null);
           }
         } catch(e) { resolve(null); }
       });
    }).on('error', () => resolve(null));
  });
}

(async () => {
  console.log("Probing PG 150 to 450...");
  let found = [];
  // batching
  for (let i = 150; i < 450; i += 20) {
    const chunk = Array.from({length: 20}, (_, idx) => i + idx);
    const results = await Promise.all(chunk.map(probePg));
    for (const r of results) {
       if (r) {
         console.log(`PG ${r.pg}: ${r.series} -> ${r.set} (${r.count} cards)`);
         if (r.series.includes("PCG")) found.push(r);
       }
    }
    // rate limit prevention
    await new Promise(r => setTimeout(r, 500));
  }
  
  if (found.length > 0) {
    console.log("\\nFound PCG Sets:");
    found.forEach(f => console.log(`PG: ${f.pg} | ${f.set}`));
  } else {
    console.log("\\nNo PCG sets found in this range.");
  }
})();
