import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../src/data/cards.json');

puppeteer.use(StealthPlugin());

const PCG_MAP: Record<string, string> = {
  'PCG1': 'Flight-of-Legends-Expansion',
  'PCG2': 'Clash-of-the-Blue-Sky-Expansion',
  'PCG3': 'Team-Rocket-Strikes-Back-Expansion',
  'PCG4': 'Golden-Sky-Silvery-Ocean-Expansion',
  'PCG5': 'Mirage-Forest-Expansion',
  'PCG6': 'Holon-Research-Tower-Expansion',
  'PCG7': 'Holon-Phantom-Expansion',
  'PCG8': 'Miracle-Crystal-Expansion',
  'PCG9': 'Offense-and-Defense-of-the-Furthest-Ends-Expansion'
};

async function main() {
  console.log('🚀 啟動本地無頭瀏覽器，前往 Pokellector 抓取純淨版 PCG 日文卡圖...');
  
  if (!fs.existsSync(DATA_FILE)) {
    console.error('❌ 找不到 cards.json！');
    return;
  }
  
  const cards = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  let updatedCount = 0;

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  
  // 建立備份
  const backupFile = DATA_FILE.replace('.json', '.en_pcg_backup.json');
  fs.copyFileSync(DATA_FILE, backupFile);
  console.log('✅ 已建立防呆備份:', backupFile);

  for (const [setId, slug] of Object.entries(PCG_MAP)) {
    console.log(`\\n🔍 正在尋找系列：${setId} (${slug})...`);
    try {
      const url = `https://jp.pokellector.com/${slug}`;
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      const html = await page.content();
      const $ = cheerio.load(html);
      
      // Pokellector 卡片列表通常包在 .card 元素中
      const imgMap: Record<string, string> = {};
      
      $('.card').each((_, el) => {
        const imgSrc = $(el).find('img').attr('src');
        const cardRef = $(el).attr('id'); // e.g. card_10
        // 有些版本會把編號寫在 a href 或 data 屬性
        const detailUrl = $(el).find('a').attr('href');
        
        // 從圖片或連結中抽取卡號
        // 解析連結 (e.g. /Flight-of-Legends-Expansion/Charizard-ex-Card-89)
        let localId = '';
        if (detailUrl) {
           const match = detailUrl.match(/-Card-(\\d+[a-zA-Z]?)$/i);
           if (match) localId = match[1].padStart(3, '0');
        }
        
        if (imgSrc && localId) {
          // 下載高畫質圖 (通常把 .png 結尾或去掉 thumb)
          const highResUrl = imgSrc.replace('thumb', '').replace('thumb.png', '.png').replace('thumb.jpg', '.jpg');
          imgMap[localId] = highResUrl;
        }
      });
      
      console.log(`✅ ${setId} 成功抓出 ${Object.keys(imgMap).length} 張圖片連結！準備替換...`);

      if (Object.keys(imgMap).length > 0) {
        cards.forEach((c: any) => {
           if (c.set_id === setId && c.region === 'JP') {
              const num = c.localId || c.local_id;
              const formattedNum = num.replace(/^0+/, '').padStart(3, '0'); // 處理 089 或 89
              // 若找到對應圖檔，則覆寫！
              if (imgMap[formattedNum] || imgMap[num]) {
                 c.image_url = imgMap[formattedNum] || imgMap[num];
                 updatedCount++;
              }
           }
        });
      }

    } catch (e: any) {
      console.error(`⚠️ 讀取 ${setId} 時發生錯誤:`, e.message);
    }
  }

  await browser.close();

  fs.writeFileSync(DATA_FILE, JSON.stringify(cards, null, 2));
  console.log(`\\n🎉 所有替換完成！共修正了 ${updatedCount} 張卡片！`);
  console.log('💡 接下來請執行: npm run migrate 即可發佈到您的網站資料庫！');
}

main().catch(console.error);
