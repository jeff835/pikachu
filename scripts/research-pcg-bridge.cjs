const https = require('https');

function getJson(url) {
    return new Promise((resolve) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { resolve(null); }
            });
        }).on('error', () => resolve(null));
    });
}

async function testSample() {
    const samples = ['PCG1-001', 'PCG1-082', 'PCG2-001', 'PCG9-068'];
    console.log('正在從 TCGDex 執行跨語言 ID 採樣測試...');
    
    for (const id of samples) {
        const jp = await getJson(`https://api.tcgdex.net/v2/ja/cards/${id}`);
        const en = await getJson(`https://api.tcgdex.net/v2/en/cards/${id}`);
        console.log(`ID: ${id}`);
        console.log(`  JP Name: ${jp ? jp.name : 'Not Found'}`);
        console.log(`  EN Name: ${en ? en.name : 'Not Found'}`);
    }
}

testSample();
