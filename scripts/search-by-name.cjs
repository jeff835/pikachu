const axios = require('axios');

async function searchByName(keyword) {
    const url = 'https://www.pokemon-card.com/card-search/resultAPI.php';
    console.log(`🔍 正在全局搜尋關鍵字: "${keyword}"...`);
    
    try {
        const res = await axios.get(url, {
            params: { 
                keyword: keyword,
                regulation: 'all'
            },
            headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.pokemon-card.com/' }
        });

        if (res.data.cardList) {
            console.log(`✅ 找到 ${res.data.cardList.length} 張卡片:`);
            res.data.cardList.forEach(c => {
                console.log(`  - [ID:${c.cardID}] ${c.cardNameViewText} | 圖片: ${c.cardThumbFile}`);
            });
        } else {
            console.log("❌ 找不到結果。");
        }
    } catch (e) {
        console.log("❌ 請求失敗:", e.message);
    }
}

const target = process.argv[2] || "メガゲッコウガex";
searchByName(target);
