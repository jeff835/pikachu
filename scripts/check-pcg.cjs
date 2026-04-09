const path = require('path');
const cards = require(path.join(__dirname, '../src/data/cards.json'));

const pcg = cards.filter(c => c.set_id && c.set_id.toUpperCase().startsWith('PCG'));
console.log('PCG 系列總卡數:', pcg.length);

const sets = {};
pcg.forEach(c => {
  const sid = c.set_id;
  if (!sets[sid]) sets[sid] = { name: c.set_name, total: 0, hasImage: 0, noImage: 0 };
  sets[sid].total++;
  const img = c.image_url || '';
  if (img && !img.includes('back') && !img.includes('cardback') && img.length > 10) {
    sets[sid].hasImage++;
  } else {
    sets[sid].noImage++;
  }
});

console.log('\n彈數 | 名稱 | 總計 | 有圖 | 無圖 | 覆蓋率');
console.log('---'.repeat(15));
Object.entries(sets).sort().forEach(([sid, info]) => {
  const pct = info.total > 0 ? Math.round(info.hasImage / info.total * 100) : 0;
  console.log(`${sid} | ${info.name} | ${info.total} | ${info.hasImage} | ${info.noImage} | ${pct}%`);
});

console.log('\n--- 前 5 筆 PCG 卡片 image_url 範例 ---');
pcg.slice(0, 5).forEach(c => {
  console.log(`[${c.set_id}] ${c.name}: ${c.image_url || '(空白)'}`);
});
