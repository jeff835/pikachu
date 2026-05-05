const axios = require('axios');

async function probeM4() {
  const API_URL = 'https://www.pokemon-card.com/card-search/resultAPI.php';
  try {
    const response = await axios.get(API_URL, {
      params: {
        pg: 'M4',
        page: 1,
        regulation: 'all',
        illust_ex: 1
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.pokemon-card.com/card-search/',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    console.log('Result Status:', response.data.result);
    if (response.data.result === 1) {
      console.log('Max Page:', response.data.maxPage);
      let totalFetched = 0;
      for (let p = 1; p <= response.data.maxPage; p++) {
        const pRes = await axios.get(API_URL, {
          params: { pg: 'M4', page: p, regulation: 'all', illust_ex: 1 },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.pokemon-card.com/card-search/',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        if (pRes.data.result === 1) {
          console.log(`Page ${p} has ${pRes.data.cardList.length} cards.`);
          if (p === 1) {
            console.log('Sample cards:', pRes.data.cardList.slice(0, 5).map(c => `${c.cardID}: ${c.cardNameViewText}`));
          }
          totalFetched += pRes.data.cardList.length;
        } else {
          console.log(`Page ${p} failed:`, pRes.data.errMsg);
        }
      }
      console.log('Total cards across all pages:', totalFetched);
    } else {
      console.log('Error Message:', response.data.errMsg);
    }
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

probeM4();
