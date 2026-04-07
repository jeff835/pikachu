import axios from 'axios';
import fs from 'fs';
import path from 'path';

const API_URL = 'https://www.pokemon-card.com/card-search/resultAPI.php';

interface OfficialCard {
  cardID: string;
  cardThumbFile: string;
  cardNameViewText: string;
}

interface SetInfo {
  id: string;
  name: string;
}

async function fetchCardsForSet(setId: string): Promise<any[]> {
  let cards: any[] = [];
  let page = 1;
  let hasMore = true;

  console.log(`Fetching set ${setId}...`);

  while (hasMore) {
    try {
      const response = await axios.get(API_URL, {
        params: {
          pg: setId,
          page: page,
          regulation: 'all'
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.pokemon-card.com/card-search/',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
          'Connection': 'keep-alive'
        }
      });

      // Randomized delay: 2000ms - 5000ms
      const delay = 2000 + Math.random() * 3000;
      await new Promise(resolve => setTimeout(resolve, delay));

      if (response.data.result !== 1) {
        console.error(`Error fetching set ${setId} page ${page}:`, response.data.errMsg);
        break;
      }

      const list: OfficialCard[] = response.data.cardList;
      if (!list || list.length === 0) {
        hasMore = false;
        break;
      }

      cards = cards.concat(list.map(c => ({
        id: `official-${c.cardID}`,
        local_id: c.cardID,
        name: c.cardNameViewText,
        image_url: `https://www.pokemon-card.com${c.cardThumbFile.replace('thumb', 'large')}`, // Attempt to get large image
        set_id: setId,
        // We might need to map set names later
      })));

      if (page >= response.data.maxPage) {
        hasMore = false;
      } else {
        page++;
      }
      
      // Be polite to the API
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error: any) {
      console.error(`Request failed for set ${setId} page ${page}:`, error.message);
      hasMore = false;
    }
  }

  return cards;
}

async function main() {
  // We'll populate this with the IDs we found and others derived from research
  const setsToScrape: SetInfo[] = [
    { id: '950', name: 'ハイクラスパック 「MEGAドリームex」（M2a）' },
    { id: '949', name: '拡張パック「インフェルノX」' },
    { id: '942', name: '拡張パック「ブラックボルト」' },
    { id: '943', name: '拡張パック「ホワイトフレア」' },
    { id: '941', name: '拡張パック「ロケット団の栄光」' },
    { id: '940', name: '強化拡張パック「熱風のアリーナ」' },
    { id: '934', name: 'ハイクラスパック「テラスタルフェスex」' },
    { id: '923', name: '拡張パック「超電ブレイカー」 (SV8)' },
    { id: '922', name: '強化拡張パック「楽園ドラゴーナ」 (SV7a)' },
    { id: '918', name: '拡張パック「ステラミラクル」 (SV7)' },
    { id: '917', name: '強化拡張パック「ナイトワンダラー」 (SV6a)' },
    { id: '914', name: '拡張パック「変幻の仮面」 (SV6)' },
    { id: '913', name: '強化拡張パック「クリムゾンヘイズ」 (SV5a)' },
    { id: '906', name: '拡張パック「ワイルドフォース」 (SV5K)' },
    { id: '907', name: '拡張パック「サイバージャッジ」 (SV5M)' },
    { id: '905', name: 'ハイクラスパック「シャイニートレジャーex」 (SV4a)' },
    { id: '897', name: '強化拡張パック「レイジングサーフ」 (SV3a)' },
    { id: '894', name: '拡張パック「黒炎の支配者」 (SV3)' }
  ];

  const allSets = [...setsToScrape];
  console.log(`Starting to scrape ${allSets.length} sets...`);

  let allCards: any[] = [];
  for (const set of allSets) {
    const cards = await fetchCardsForSet(set.id);
    const cardsWithSetName = cards.map(c => ({ ...c, set_name: set.name }));
    allCards = allCards.concat(cardsWithSetName);
    console.log(`Total cards so far: ${allCards.length}`);
  }

  const outputPath = path.join(process.cwd(), 'src/data/cards-official.json');
  fs.writeFileSync(outputPath, JSON.stringify(allCards, null, 2));
  console.log(`Successfully saved ${allCards.length} cards to ${outputPath}`);
}

main();
