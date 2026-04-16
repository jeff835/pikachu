import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CARDS_FILE = path.join(__dirname, '../src/data/cards.json');

const PCG_SETS: Record<string, string> = {
  'PCG1': '伝説の飛翔',
  'PCG2': '蒼空の激突',
  'PCG3': 'ロケット団の逆襲',
  'PCG4': '金の空、銀の海',
  'PCG5': '幻影の森',
  'PCG6': 'ホロンの研究塔',
  'PCG7': 'ホロンの幻影',
  'PCG8': '奇跡の結晶',
  'PCG9': 'さいはての攻防'
};

async function fetchOfficialCardImage(cardName: string, localId: string, setName: string) {
  try {
    // 官方 API 搜尋關鍵字：[名稱] [卡號]
    // 例如：キャタピー 001
    const cleanId = localId.replace(/^0+/, ''); // 官方搜尋有時不帶前導零比較準
    const query = encodeURIComponent(`${cardName} ${cleanId}`);
    const url = `https://www.pokemon-card.com/card-search/resultAPI.php?keyword=${query}&regulation=all&page=1`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'https://www.pokemon-card.com/card-search/'
      },
      timeout: 8000
    });

    const data = response.data;
    if (data.cardList && data.cardList.length > 0) {
      // 在搜尋結果中尋找系列名稱匹配的卡片
      // PCG 時代的系列名稱在 expansionText 中
      let match = data.cardList.find((c: any) => c.expansionText && c.expansionText.includes(setName));
      
      // 如果沒找到，退而求其次找第一個結果 (通常搜尋 [名稱] [卡號] 第一個就很準)
      if (!match) match = data.cardList[0];
      
      if (match && match.cardThumbFile) {
        return `https://www.pokemon-card.com${match.cardThumbFile}`;
      }
    }
  } catch (error: any) {
    // console.error(`Error searching for ${cardName}:`, error.message);
  }
  return null;
}

// 簡單的英譯日字典 (針對 PCG 卡片中可能出現的英文名)
const EN_TO_JA: Record<string, string> = {
  'beedrill': 'スピアー',
  'nidoranf': 'ニドラン♀',
  'nidoranm': 'ニドラン♂',
  'weepinbell': 'ウツドン',
  'victreebel': 'ウツボット',
  'venomoth': 'モルフォン',
  'rapidash': 'ギャロップ',
  'polywrath': 'ニョロボン',
  'magikarp': 'コイキング',
  'shellder': 'シェルダー',
  'cloyster': 'パルシェン',
  'kingler': 'キングラー',
  'geodude': 'イシツブテ',
  'golem': 'ゴローニャ',
  'graveler': 'ゴローン'
};

async function main() {
  console.log('🚀 開始從日本官網恢復 PCG 世代日版卡圖...');
  
  if (!fs.existsSync(CARDS_FILE)) {
    console.error('❌ 找不到 cards.json 文件');
    return;
  }

  const cards = JSON.parse(fs.readFileSync(CARDS_FILE, 'utf-8'));
  const pcgCards = cards.filter((c: any) => c.set_id && PCG_SETS[c.set_id]);
  
  console.log(`📊 發現 ${pcgCards.length} 張 PCG 系列卡片需要處理。`);

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < pcgCards.length; i++) {
    const card = pcgCards[i];
    const setName = PCG_SETS[card.set_id];
    
    // 處理名稱：如果是英文則嘗試翻譯，否則使用原名
    let searchName = card.name.toLowerCase();
    if (EN_TO_JA[searchName]) searchName = EN_TO_JA[searchName];
    else searchName = card.name;

    const localId = card.localId || card.local_id || '';
    
    process.stdout.write(`\r[${i + 1}/${pcgCards.length}] 正在搜尋: ${searchName} (${localId})...`);

    const officialUrl = await fetchOfficialCardImage(searchName, localId, setName);

    if (officialUrl) {
      card.image_url = officialUrl;
      updated++;
    } else {
      failed++;
    }

    // 稍微延遲避免觸發反爬蟲
    if (i % 5 === 0) await new Promise(r => setTimeout(r, 300));
  }

  // 寫回檔案
  fs.writeFileSync(CARDS_FILE, JSON.stringify(cards, null, 2));
  
  console.log(`\n\n✅ 任務完成！`);
  console.log(`- 成功更新: ${updated} 筆`);
  console.log(`- 搜尋失敗: ${failed} 筆`);
  console.log(`- 總計: ${pcgCards.length} 筆`);
  console.log(`\n💡 提示: 請執行 'npm run migrate' 同步至 Supabase。`);
}

main().catch(console.error);
