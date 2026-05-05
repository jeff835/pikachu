import axios from 'axios';

const API_URL = 'https://www.pokemon-card.com/card-search/resultAPI.php';

async function probeM4() {
  console.log('正在探測 M4 系列 API 響應...');
  try {
    const response = await axios.get(API_URL, {
      params: {
        pg: 'M4',
        regulation: 'all'
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.pokemon-card.com/card-search/'
      }
    });

    if (response.data.result === 1) {
      console.log('✅ API 探測成功！');
      const maxPage = response.data.maxPage;
      let totalCards = response.data.cardList.length;
      
      for (let p = 2; p <= maxPage; p++) {
        const pRes = await axios.get(API_URL, {
          params: { pg: 'M4', regulation: 'all', page: p },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.pokemon-card.com/card-search/'
          }
        });
        totalCards += pRes.data.cardList.length;
      }

      console.log(`\n--- M4 系列報告 ---`);
      console.log(`總分頁數: ${maxPage}`);
      console.log(`總卡片數量: ${totalCards}`);
      console.log(`加載狀態: 正常 (無分頁錯誤)`);
    } else {
      console.error('❌ API 返回錯誤:', response.data.errMsg);
    }
  } catch (error: any) {
    console.error('❌ 請求發生錯誤:', error.message);
  }
}

probeM4();
