#!/usr/bin/env node
/**
 * PCG 系列圖片修復腳本 v2
 * 策略：使用 TCGDex API 取得 PCG 卡片各自的 image 欄位
 * 若 TCGDex 無圖，退回用 pokemontcg.io 以「寶可夢名稱」匹配
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

// PCG -> 英文 EX 系列對照
const PCG_TO_EX = {
  'PCG1': 'ex6',   // 伝説の飛翔 → EX FireRed & LeafGreen
  'PCG2': 'ex7',   // 蒼空の激突 → EX Team Rocket Returns
  'PCG3': 'ex8',   // ロケット団の逆襲 → EX Deoxys
  'PCG4': 'ex10',  // 金の空、銀の海 → EX Unseen Forces
  'PCG5': 'ex12',  // まぼろしの森 → EX Legend Maker
  'PCG6': 'ex13',  // ホロンの研究塔 → EX Holon Phantoms
  'PCG7': 'ex11',  // ホロンの幻影 → EX Delta Species
  'PCG8': 'ex14',  // きせきの結晶 → EX Crystal Guardians
  'PCG9': 'ex15',  // さいはての攻防 → EX Dragon Frontiers
};

// 日文 → 英文 寶可夢名稱對照（含特殊卡）
const JP_TO_EN = {
  'キャタピー': 'Caterpie', 'メタポッド': 'Metapod', 'バタフリー': 'Butterfree',
  'ビードル': 'Weedle', 'コクーン': 'Kakuna', 'スピアー': 'Beedrill',
  'ニドラン♀': 'Nidoran ♀', 'ニドリーナ': 'Nidorina', 'ニドラン♂': 'Nidoran ♂',
  'ニドリーノ': 'Nidorino', 'パラス': 'Paras', 'パラセクト': 'Parasect',
  'コンパン': 'Venonat', 'モルフォン': 'Venomoth', 'マダツボミ': 'Bellsprout',
  'ウツドン': 'Weepinbell', 'ウツボット': 'Victreebel', 'モンジャラ': 'Tangela',
  'ストライク': 'Scyther', 'ガーディ': 'Growlithe', 'ウインディ': 'Arcanine',
  'ポニータ': 'Ponyta', 'ギャロップ': 'Rapidash', 'ファイヤーex': 'Moltres ex',
  'ニョロモ': 'Poliwag', 'ニョロゾ': 'Poliwhirl', 'ニョロボン': 'Poliwrath',
  'パウワウ': 'Seel', 'ジュゴン': 'Dewgong', 'シェルダー': 'Shellder',
  'パルシェン': 'Cloyster', 'クラブ': 'Krabby', 'キングラー': 'Kingler',
  'コイキング': 'Magikarp', 'ギャラドスex': 'Gyarados ex', 'フリーザーex': 'Articuno ex',
  'ピカチュウ': 'Pikachu', 'ライチュウ': 'Raichu', 'コイル': 'Magnemite',
  'レアコイル': 'Magneton', 'ビリリダマ': 'Voltorb', 'マルマインex': 'Electrode ex',
  'サンダーex': 'Zapdos ex', 'ヤドン': 'Slowpoke', 'ヤドラン': 'Slowbro',
  'ゴース': 'Gastly', 'ゴースト': 'Haunter', 'ゲンガーex': 'Gengar ex',
  'スリープ': 'Drowzee', 'スリーパー': 'Hypno', 'タマタマ': 'Exeggcute',
  'ナッシー': 'Exeggutor', 'バリヤードex': 'Mr. Mime ex', 'ニドクイン': 'Nidoqueen',
  'ニドキング': 'Nidoking', 'ディグダ': 'Diglett', 'ダグトリオ': 'Dugtrio',
  'マンキー': 'Mankey', 'オコリザル': 'Primeape', 'イワーク': 'Onix',
  'カラカラ': 'Cubone', 'ガラガラ': 'Marowak', 'ピジョット': 'Pidgeot',
  'ピッピ': 'Clefairy', 'ピクシーex': 'Clefable ex', 'カモネギ': "Farfetch'd",
  'ベロリンガ': 'Lickitung', 'ラッキー': 'Chansey', 'ガルーラ': 'Kangaskhan',
  'ケンタロス': 'Tauros', 'メタモン': 'Ditto', 'ポリゴン': 'Porygon',
  'カビゴン': 'Snorlax', 'モンスターボール': 'Poké Ball',
  // 訓練師卡
  'グレートボール': 'Great Ball', 'VSシーカー': 'VS Seeker',
  'ポケモン図鑑HANDY909型': 'PokéDex HANDY909',
  'オーキド博士の研究': "Professor Oak's Research",
  'セリオのネットワーク': "Celio's Network",
  'ビルのメンテナンス': "Bill's Maintenance",
  '経験値全員': 'EXP. ALL', 'モンムーン': 'Mt. Moon',
  // PCG2 蒼空の激突
  'フシギダネ': 'Bulbasaur', 'フシギソウ': 'Ivysaur', 'フシギバナex': 'Venusaur ex',
  'ヒトカゲ': 'Charmander', 'リザード': 'Charmeleon', 'リザードンex': 'Charizard ex',
  'ゼニガメ': 'Squirtle', 'カメール': 'Wartortle', 'カメックスex': 'Blastoise ex',
  'アーボ': 'Ekans', 'アーボック': 'Arbok', 'サンダース': 'Jolteon',
  'ブースター': 'Flareon', 'シャワーズ': 'Vaporeon', 'イーブイ': 'Eevee',
  'トサキント': 'Goldeen', 'アズマオウ': 'Seaking', 'ヒトデマン': 'Staryu',
  'スターミー': 'Starmie', 'ルージュラ': 'Jynx', 'エレブー': 'Electabuzz',
  'ブーバー': 'Magmar', 'ケンター': 'Ponyta', 'ゴルダック': 'Golduck',
  // 共通
  '蝶': 'Butterfree', '雑草': 'Weedle',
};

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'PikachuApp/2.0' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(10000, () => { req.destroy(); resolve(null); });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function buildExImageMap(exSetId) {
  console.log(`  正在抓取 pokemontcg.io/${exSetId} 的圖片...`);
  const url = `https://api.pokemontcg.io/v2/cards?q=set.id:${exSetId}&pageSize=250`;
  const data = await httpsGet(url);
  if (!data || !data.data) return {};

  // 建立 名稱 -> 圖片 URL 的對照
  const map = {};
  for (const card of data.data) {
    const name = (card.name || '').toLowerCase().trim();
    const imgUrl = card.images?.large || card.images?.small;
    if (name && imgUrl) {
      if (!map[name]) map[name] = imgUrl; // 同名取第一張
    }
  }
  console.log(`  找到 ${Object.keys(map).length} 張英文卡片`);
  return map;
}

async function main() {
  const cardsPath = path.join(__dirname, '../src/data/cards.json');
  const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));

  const pcgCards = cards.filter(c => c.set_id && c.set_id.startsWith('PCG'));
  console.log(`=== PCG 圖片修復 v2 ===`);
  console.log(`待修復 PCG 卡片: ${pcgCards.length} 張\n`);

  // 為每個 PCG 系列建立英文名稱 -> 圖片 URL 的映射
  const exMaps = {};
  for (const [pcgId, exId] of Object.entries(PCG_TO_EX)) {
    exMaps[pcgId] = await buildExImageMap(exId);
    await sleep(300);
  }

  let updated = 0;
  let notFound = 0;
  const notFoundList = [];

  for (const card of cards) {
    const sid = card.set_id;
    if (!sid || !sid.startsWith('PCG') || !exMaps[sid]) continue;

    const jpName = card.name || '';
    const enName = JP_TO_EN[jpName] || jpName;
    const enNameLower = enName.toLowerCase().trim();
    const exMap = exMaps[sid];

    // 嘗試直接匹配英文名
    const imgUrl = exMap[enNameLower];

    if (imgUrl) {
      card.image_url = imgUrl;
      updated++;
    } else {
      // 模糊匹配（部分名稱）
      const fuzzyKey = Object.keys(exMap).find(k =>
        k.includes(enNameLower) || enNameLower.includes(k)
      );
      if (fuzzyKey) {
        card.image_url = exMap[fuzzyKey];
        updated++;
      } else {
        notFound++;
        notFoundList.push({ id: card.id, jp: jpName, en: enName });
      }
    }
  }

  console.log(`\n=== 更新結果 ===`);
  console.log(`✅ 成功更新: ${updated} 張`);
  console.log(`❌ 未找到對應: ${notFound} 張`);

  if (notFoundList.length > 0 && notFoundList.length <= 30) {
    console.log('\n未找到圖片的卡片:');
    notFoundList.forEach(c => console.log(`  ${c.id}: ${c.jp} (EN: ${c.en})`));
  }

  // 備份並寫入
  const backupPath = cardsPath.replace('.json', '.v1-backup.json');
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(cardsPath, backupPath);
    console.log(`\n備份已存至: ${backupPath}`);
  }

  fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2));
  console.log('✅ cards.json 已更新！');

  const finalPcg = cards.filter(c => c.set_id && c.set_id.startsWith('PCG'));
  const hasImg = finalPcg.filter(c => c.image_url && c.image_url.includes('pokemontcg.io'));
  console.log(`\nPCG 圖片覆蓋率: ${hasImg.length}/${finalPcg.length} (${Math.round(hasImg.length/finalPcg.length*100)}%)`);
}

main().catch(console.error);
