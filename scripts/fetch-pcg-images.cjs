/**
 * 從 Bulbapedia MediaWiki API 取得 Flight of Legends (PCG1) 卡片的真實圖片 URL
 * 用法：node scripts/fetch-pcg-images.cjs
 */
const https = require('https');

// PCG1 伝説の飛翔 (Flight of Legends) 所有 82 張卡片的 Bulbapedia 頁面名稱
// 格式：[英文名] (Flight of Legends [編號])
const SET_SLUG = 'Flight_of_Legends';
const TOTAL_CARDS = 82;

// 根據 Bulbapedia 卡表提取的卡片順序
const CARD_NAMES = [
  'Caterpie', 'Metapod', 'Butterfree', 'Weedle', 'Kakuna', 'Beedrill',
  'Nidoran♀', 'Nidorina', 'Nidoran♂', 'Nidorino', 'Paras', 'Parasect',
  'Venonat', 'Venomoth', 'Bellsprout', 'Weepinbell', 'Victreebel', 'Tangela',
  'Scyther', 'Growlithe', 'Arcanine', 'Ponyta', 'Rapidash', 'Moltres ex',
  'Poliwag', 'Poliwhirl', 'Poliwrath', 'Seel', 'Dewgong', 'Shellder',
  'Cloyster', 'Krabby', 'Kingler', 'Magikarp', 'Gyarados ex', 'Articuno ex',
  'Pikachu', 'Raichu', 'Magnemite', 'Magneton', 'Voltorb', 'Electrode ex',
  'Zapdos ex', 'Slowpoke', 'Slowbro', 'Gastly', 'Haunter', 'Gengar ex',
  'Drowzee', 'Hypno', 'Exeggcute', 'Exeggutor', 'Mr. Mime ex', 'Mr. Mime ex',
  'Nidoqueen', 'Nidoking', 'Diglett', 'Dugtrio', 'Mankey', 'Primeape',
  'Onix', 'Cubone', 'Marowak', 'Pidgeot', 'Clefairy', 'Clefable ex',
  "Farfetch'd", 'Lickitung', 'Chansey', 'Kangaskhan', 'Tauros', 'Ditto',
  'Porygon', 'Snorlax', 'Great Ball', 'VS Seeker', 'PokéDex HANDY909',
  "Professor Oak's Research", "Celio's Network", "Bill's Maintenance",
  'EXP. ALL', 'Mt. Moon'
];

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'PikachuApp/1.0 (research; image-restoration)',
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getImageForPage(pageName) {
  // 使用 Bulbapedia MediaWiki API 取得頁面中的圖片列表
  const encoded = encodeURIComponent(pageName);
  const url = `https://bulbapedia.bulbagarden.net/w/api.php?action=query&prop=images&titles=${encoded}&format=json&imlimit=10`;
  
  try {
    const data = await httpsGet(url);
    const pages = data?.query?.pages;
    if (!pages) return null;
    
    const page = Object.values(pages)[0];
    if (!page?.images) return null;
    
    // 找出包含該 Pokémon 名稱的圖片（通常第一張就是卡片正面）
    const images = page.images;
    const cardImage = images.find(img => 
      img.title.includes('jpg') || img.title.includes('png')
    );
    return cardImage ? cardImage.title : null;
  } catch (e) {
    return null;
  }
}

async function getImageUrl(fileTitle) {
  // 取得檔案的實際 URL
  const encoded = encodeURIComponent(fileTitle.replace('File:', ''));
  const url = `https://bulbapedia.bulbagarden.net/w/api.php?action=query&prop=imageinfo&titles=${encodeURIComponent(fileTitle)}&iiprop=url&format=json`;
  
  try {
    const data = await httpsGet(url);
    const pages = data?.query?.pages;
    if (!pages) return null;
    
    const page = Object.values(pages)[0];
    return page?.imageinfo?.[0]?.url || null;
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log('=== PCG1 高清圖 URL 擷取工具 ===');
  console.log('正在從 Bulbapedia API 取得真實圖片 URL...\n');
  
  const results = [];
  
  // 先測試前 5 張卡片
  for (let i = 1; i <= 5; i++) {
    const cardName = CARD_NAMES[i - 1];
    const pageName = `${cardName} (${SET_SLUG} ${i})`;
    
    console.log(`[${i}/5] 正在處理: ${pageName}`);
    
    const imageTitle = await getImageForPage(pageName);
    if (imageTitle) {
      const imageUrl = await getImageUrl(imageTitle);
      console.log(`  圖片檔名: ${imageTitle}`);
      console.log(`  圖片 URL: ${imageUrl}`);
      results.push({ num: i, name: cardName, page: pageName, file: imageTitle, url: imageUrl });
    } else {
      console.log(`  ⚠️ 找不到圖片`);
      results.push({ num: i, name: cardName, page: pageName, file: null, url: null });
    }
    
    // 避免請求過快
    await sleep(500);
  }
  
  console.log('\n=== 測試結果摘要 ===');
  results.forEach(r => {
    const status = r.url ? '✅' : '❌';
    console.log(`${status} PCG1-${String(r.num).padStart(3, '0')} ${r.name}: ${r.url || '未找到'}`);
  });
}

main().catch(console.error);
