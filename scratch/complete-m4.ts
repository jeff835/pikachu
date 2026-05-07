import axios from 'axios';
import fs from 'fs';

const API_URL = 'https://www.pokemon-card.com/card-search/resultAPI.php';

async function probeId(id: number) {
    try {
        const response = await axios.get(API_URL, {
            params: { keyword: id.toString() }, // 這裡試著用 keyword 傳 ID
            headers: { 'Referer': 'https://www.pokemon-card.com/' },
            timeout: 3000
        });
        if (response.data && response.data.cardList) {
            // 尋找精確匹配這個 ID 且路徑是 M4 的卡片
            return response.data.cardList.filter((c: any) => c.cardID === id.toString() && c.cardThumbFile.includes('/M4/'));
        }
    } catch (error) {}
    return [];
}

async function main() {
    const foundCards = new Map();
    const batchSize = 10;
    
    console.log("🚀 啟動地毯式掃描 (ID 50085 ~ 50300)...");

    for (let i = 50085; i <= 50300; i += batchSize) {
        const promises = [];
        for (let j = 0; j < batchSize && (i + j) <= 50300; j++) {
            promises.push(probeId(i + j));
        }
        
        const results = await Promise.all(promises);
        results.flat().forEach(c => {
            if (!foundCards.has(c.cardID)) {
                console.log(`✨ 發現卡片 [${c.cardID}]: ${c.cardNameViewText}`);
                foundCards.set(c.cardID, c);
            }
        });
        
        process.stdout.write(".");
        // 稍微停頓
        await new Promise(res => setTimeout(res, 200));
    }

    const finalResults = Array.from(foundCards.values()).sort((a, b) => parseInt(a.cardID) - parseInt(b.cardID));
    fs.writeFileSync('scripts/m4-final-120.json', JSON.stringify(finalResults, null, 2));
    
    console.log(`\n\n✅ 掃描結束！共捕獲 ${foundCards.size} 張 M4 系列卡片。`);
    if (foundCards.size >= 120) {
        console.log("🎯 目標達成！");
    } else {
        console.log("🔍 仍未集齊。我將嘗試掃描 40000 區段或查詢圖片伺服器索引。");
    }
}

main();
