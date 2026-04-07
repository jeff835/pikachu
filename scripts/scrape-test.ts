import axios from 'axios';
import * as cheerio from 'cheerio';

async function fetchOfficialSets() {
  try {
    const res = await axios.get('https://www.pokemon-card.com/card-search/');
    const $ = cheerio.load(res.data);
    
    const expansions: Record<string, {id: string, name: string}[]> = {};
    
    // Look for optgroup or selects that hold the expansion codes.
    // .regulation_sidebar_search selects
    $('select option').each((i, el) => {
      const val = $(el).attr('value');
      const text = $(el).text().trim();
      if (val && text && !text.includes('指定なし')) {
        console.log(`Found option: ${val} -> ${text}`);
      }
    });
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

fetchOfficialSets();
