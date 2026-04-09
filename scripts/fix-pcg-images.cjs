#!/usr/bin/env node
// PCG 系列圖片修復腳本
// 使用 pokemontcg.io API 取得英文版 EX 系列圖片（與日文版設計相同）

const fs = require('fs');
const path = require('path');
const https = require('https');

// PCG 系列 -> 英文 EX set ID 對照表
// 依照發行日期排序對應
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

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'PCG-fix-script/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function fetchAllCards(setId) {
  const cards = [];
  let page = 1;
  while (true) {
    const url = `https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&pageSize=250&page=${page}`;
    console.log(`  抓取 ${setId} p${page}...`);
    const data = await fetchJson(url);
    cards.push(...(data.data || []));
    if (cards.length >= data.totalCount) break;
    page++;
  }
  return cards;
}

async function main() {
  const cardsPath = path.join(__dirname, '../src/data/cards.json');
  const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));
  
  console.log('建立 EX 系列圖片對照表...\n');
  
  // 依照卡號建立查找 map：setId -> number -> imageUrl
  const imageMap = {}; // { 'PCG1': { 1: url, 2: url, ... } }
  
  for (const [pcgId, exId] of Object.entries(PCG_TO_EX)) {
    console.log(`\n正在抓取 ${pcgId} (${exId})...`);
    const exCards = await fetchAllCards(exId);
    imageMap[pcgId] = {};
    for (const c of exCards) {
      const num = parseInt(c.localId || c.number || '0');
      if (num && c.images && c.images.large) {
        imageMap[pcgId][num] = c.images.large;
      }
    }
    console.log(`  找到 ${Object.keys(imageMap[pcgId]).length} 張有圖卡片`);
  }
  
  // 比對並更新 PCG 卡片
  let updated = 0;
  let notFound = 0;
  
  for (const card of cards) {
    const sid = card.set_id;
    if (!sid || !imageMap[sid]) continue;
    
    // 嘗試用卡號匹配
    // local_id 通常是 "001", "002" 等格式
    const localId = parseInt(card.localId || card.local_id || card.card_number || '0');
    const imgMap = imageMap[sid];
    
    if (localId && imgMap[localId]) {
      card.image_url = imgMap[localId];
      updated++;
    } else {
      notFound++;
    }
  }
  
  console.log(`\n=== 更新結果 ===`);
  console.log(`成功更新: ${updated} 張`);
  console.log(`未找到對應: ${notFound} 張`);
  
  // 備份原始檔案
  const backupPath = cardsPath.replace('.json', '.pcg-backup.json');
  fs.copyFileSync(cardsPath, backupPath);
  console.log(`\n備份已存至: ${backupPath}`);
  
  // 寫入更新
  fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2));
  console.log('✅ cards.json 已更新！');
  
  // 顯示 PCG 覆蓋率
  const pcgCards = cards.filter(c => c.set_id && c.set_id.startsWith('PCG'));
  const hasImg = pcgCards.filter(c => c.image_url && c.image_url.includes('pokemontcg.io'));
  console.log(`\nPCG 圖片覆蓋率: ${hasImg.length}/${pcgCards.length} (${Math.round(hasImg.length/pcgCards.length*100)}%)`);
}

main().catch(console.error);
