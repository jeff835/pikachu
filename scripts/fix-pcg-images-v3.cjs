#!/usr/bin/env node
/**
 * PCG 系列圖片修復腳本 v3
 * 策略：
 * 1. 使用 TCGDex API 取得正確的 dexId / 寶可夢資訊
 * 2. 使用 PokeAPI 將 dexId 轉為正確的英文名稱
 * 3. 在對應的英文 EX 系列中尋找同名卡片，並取其圖片
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const PCG_TO_EX_SETS = ['ex5', 'ex6', 'ex7', 'ex8', 'ex9', 'ex10', 'ex11', 'ex12', 'ex13', 'ex14', 'ex15', 'ex16'];

const MANUAL_DICT = {
  'モンスターボール': 'Poké Ball',
  'グレートボール': 'Great Ball', 
  'VSシーカー': 'VS Seeker',
  'ポケモン図鑑HANDY909型': 'PokéDex HANDY909',
  'オーキド博士の研究': "Professor Oak's Research",
  'セリオのネットワーク': "Celio's Network",
  'ビルのメンテナンス': "Bill's Maintenance",
  '経験値全員': 'EXP. ALL', 
  'モンムーン': 'Mt. Moon',
  // Special names missed by regular dict
  '蝶': 'Butterfree',
  '雑草': 'Weedle',
  'スクランブルエネルギー': 'Scramble Energy',
  'Wレインボーエネルギー': 'Double Rainbow Energy',
  'マジック・マテリアル': 'Magic Material',
  '山ムーン': 'Mt. Moon'
};

function httpsGet(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000 // 10秒超時
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
      });
    });
    
    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchAllExCards() {
  console.log('Downloading all EX era cards to build image pool...');
  let page = 1;
  const exPool = {};
  
  while (true) {
    const url = `https://api.pokemontcg.io/v2/cards?q=set.id:ex*&pageSize=250&page=${page}`;
    const data = await httpsGet(url);
    if (!data || !data.data || data.data.length === 0) break;
    
    for (const card of data.data) {
      const name = (card.name || '').toLowerCase().trim();
      const imgUrl = card.images?.large || card.images?.small;
      if (name && imgUrl) {
        if (!exPool[name]) exPool[name] = imgUrl; 
      }
    }
    console.log(`  Fetched page ${page}, pool size: ${Object.keys(exPool).length}`);
    if (page * 250 >= data.totalCount) break;
    page++;
    await sleep(200);
  }
  return exPool;
}

const pokeApiCache = {};
async function getEnNameFromDex(dexId) {
  if (pokeApiCache[dexId]) return pokeApiCache[dexId];
  const data = await httpsGet(`https://pokeapi.co/api/v2/pokemon-species/${dexId}`);
  let name = null;
  if (data && data.names) {
    name = data.names.find(n => n.language.name === 'en')?.name;
  }
  pokeApiCache[dexId] = name;
  return name;
}

async function main() {
  const cardsPath = path.join(__dirname, '../src/data/cards.json');
  const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));

  const pcgCards = cards.filter(c => c.set_id && c.set_id.startsWith('PCG'));
  const targetCards = pcgCards;
  
  console.log(`=== PCG 圖片修復 v3 ===`);
  console.log(`總 PCG 張數: ${pcgCards.length}`);
  console.log(`待修復張數: ${targetCards.length}\n`);

  if (targetCards.length === 0) {
    console.log('All fixed!');
    return;
  }

  const exPool = await fetchAllExCards();
  let updated = 0;
  let notFound = 0;

  for (const card of targetCards) {
    const sid = card.set_id;
    const localId = card.localId || card.local_id;
    
    let enName = null;
    
    // First try TCGDex to get dex ID
    const tcgdexId = `${sid}-${String(localId).padStart(3, '0')}`;
    const tcgdexData = await httpsGet(`https://api.tcgdex.net/v2/ja/cards/${tcgdexId}`);
    
    if (tcgdexData) {
      if (tcgdexData.dexId && tcgdexData.dexId.length > 0) {
        enName = await getEnNameFromDex(tcgdexData.dexId[0]);
      } else {
        // No dex ID means Trainer / Energy
        const jpName = tcgdexData.name;
        enName = MANUAL_DICT[jpName] || null;
      }
    }
    
    // Fallback logic
    if (!enName) {
       const jpNameCard = card.name;
       enName = MANUAL_DICT[jpNameCard] || jpNameCard.replace(/ex/gi, '').replace(/☆/g, '').trim();
    }
    
    if (enName) {
      const enLower = enName.toLowerCase().replace(/ex/g, '').trim();
      let imgMatch = exPool[enLower] || exPool[enLower + ' ex'];
      
      if (!imgMatch) {
         // Fuzzy match in pool
         const fuzzy = Object.keys(exPool).find(k => k.includes(enLower) || enLower.includes(k));
         if (fuzzy) imgMatch = exPool[fuzzy];
      }
      
      if (imgMatch) {
        card.image_url = imgMatch;
        updated++;
      } else {
        notFound++;
      }
    } else {
      notFound++;
    }

    const currentCount = updated + notFound;
    if (currentCount % 10 === 0) {
      process.stdout.write(`\rProgress: ${currentCount}/${targetCards.length} (Updated: ${updated})... `);
    }
    
    await sleep(200); // Rate limit for TCGDex
  }

  console.log(`\n\n=== 執行結果 ===`);
  console.log(`✅ 成功更新: ${updated} 張`);
  console.log(`❌ 未找到: ${notFound} 張`);

  const backupPath = cardsPath.replace('.json', '.v2-backup.json');
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(cardsPath, backupPath);
  }

  fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2));
  console.log(`✅ Update saved to cards.json`);
}

main().catch(console.error);
