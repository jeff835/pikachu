import axios from 'axios';
import fs from 'fs';
import path from 'path';

const API_URL = 'https://www.pokemon-card.com/card-search/resultAPI.php';

async function findHiddenM4Secrets() {
    console.log('🕵️ 開始全球搜索 M4 隱藏卡片 (不限系列，僅限稀有度)...');
    
    const results = new Map();
    const rarities = [
        { label: 'SR', params: { sc_rare_sr: '1' } },
        { label: 'SAR', params: { sc_rare_sar: '1' } },
        { label: 'UR', params: { sc_rare_ur: '1' } },
        { label: 'AR', params: { sc_rare_ar: '1' } },
        { label: 'ACE', params: { sc_rare_ace: '1' } }
    ];

    for (const rarity of rarities) {
        console.log(`\n🔍 正在掃描稀有度: ${rarity.label}...`);
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= 30) {
            try {
                const response = await axios.get(API_URL, {
                    params: { 
                        ...rarity.params, 
                        page, 
                        regulation: 'all' 
                    },
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Referer': 'https://www.pokemon-card.com/card-search/'
                    }
                });

                if (response.data.result !== 1 || !response.data.cardList) break;

                const list = response.data.cardList;
                const m4Matches = list.filter((c: any) => 
                    (c.cardThumbFile && c.cardThumbFile.includes('/M4/')) ||
                    (c.cardID && parseInt(c.cardID) >= 50168 && parseInt(c.cardID) <= 50300)
                );

                if (m4Matches.length > 0) {
                    m4Matches.forEach((c: any) => {
                        if (!results.has(c.cardID)) {
                            results.set(c.cardID, c);
                            console.log(`   ✨ [發現] ${c.cardID}: ${c.cardNameViewText} (${c.rarity || rarity.label})`);
                        }
                    });
                }

                if (page >= response.data.maxPage) {
                    hasMore = false;
                } else {
                    page++;
                }
            } catch (e: any) {
                console.error(`   ❌ 錯誤 (Page ${page}): ${e.message}`);
                break;
            }
        }
    }

    console.log(`\n📊 搜索結束！共發現 ${results.size} 張 M4 潛在卡片。`);
    
    if (results.size > 0) {
        const allFound = Array.from(results.values()).sort((a, b) => parseInt(a.cardID) - parseInt(b.cardID));
        const outputPath = path.join(process.cwd(), 'scripts/m4-secrets-discovered.json');
        fs.writeFileSync(outputPath, JSON.stringify(allFound, null, 2));
        console.log(`✅ 已儲存至: ${outputPath}`);
    }
}

findHiddenM4Secrets();
