const https = require('https');
const fs = require('fs');

function getJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { resolve(null); }
            });
        }).on('error', reject);
    });
}

async function buildPokemonDictionary() {
    console.log('Building Pokemon dictionary from PokeAPI...');
    const dictionary = {};
    
    // We only need up to Gen 3 for PCG era, but let's grab up to Gen 4 (493) to be safe.
    // Fetch species list
    const limit = 493;
    const batchSize = 50;
    
    for (let id = 1; id <= limit; id++) {
        try {
            const data = await getJson(`https://pokeapi.co/api/v2/pokemon-species/${id}/`);
            if (data && data.names) {
                let enName = '';
                let jpName = '';
                let jpNameRo = '';
                
                for (const n of data.names) {
                    if (n.language.name === 'en') enName = n.name;
                    if (n.language.name === 'ja') jpName = n.name; // Kanji/Kana? usually Katakana for ja
                    if (n.language.name === 'ja-Hrkt') jpName = n.name; // Kana
                }
                
                if (jpName && enName) {
                    dictionary[jpName] = enName;
                }
            }
            if (id % 50 === 0) console.log(`Fetched ${id}/${limit}`);
            // Small delay to avoid hammering
            await new Promise(r => setTimeout(r, 100));
        } catch (e) {
            console.error(`Failed to fetch ID ${id}: ${e.message}`);
        }
    }
    
    fs.writeFileSync('scripts/pokemon-dict.json', JSON.stringify(dictionary, null, 2));
    console.log(`Saved dictionary with ${Object.keys(dictionary).length} entries.`);
}

buildPokemonDictionary();
