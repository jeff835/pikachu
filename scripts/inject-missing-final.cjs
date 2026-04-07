const fs = require('fs');
const path = require('path');

const cardsPath = '/Users/wengyiwei/Desktop/pikachu/src/data/cards.json';
const officialPath = '/Users/wengyiwei/Desktop/pikachu/src/data/cards-official.json';

try {
  const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));
  const official = JSON.parse(fs.readFileSync(officialPath, 'utf8'));

  const existingSetIds = new Set(cards.map(c => c.set_id));
  const existingIds = new Set(cards.map(c => c.id));

  // Sets to focus on for injection
  const setsToInject = ['SV6a', 'SV5M', 'SV5K', 'SV11', 'SV10', 'SV9', 'SV9a', 'SV8', 'SV7a'];
  const newEraKeywords = ['ブラックボルト', 'ホワイトフレア', 'ロケット団の栄光', '熱風のアリーナ', 'インフェルノX'];

  let injectedCount = 0;
  official.forEach(oCard => {
    // Extract ID like (SV6a) - fix regex to handle alphanumeric
    const match = oCard.set_name.match(/\(([a-zA-Z0-9]+)\)/);
    const setId = match ? match[1] : 'OFFICIAL';
    
    const isNewSet = setsToInject.includes(setId) || newEraKeywords.some(k => oCard.set_name.includes(k));
    const cardId = 'OFFICIAL-' + oCard.local_id;
    
    // We only inject if neither the exact card (cardId) nor the set (setId) exist in our current local dataset
    // Wait, if we already have SV8 but it was repaired, that is fine.
    // We only want to inject ENTIRELY MISSING sets.
    if (isNewSet && !existingIds.has(cardId) && !existingSetIds.has(setId)) {
      const newCard = {
        id: cardId,
        localId: oCard.local_id,
        name: oCard.name,
        image_url: oCard.image_url,
        rarity: 'Official',
        set_id: setId,
        set_name: oCard.set_name.split(' (')[0],
        serie_id: 'SV',
        serie_name: 'スカーレット&バイオレット',
        region: 'JP'
      };
      cards.push(newCard);
      injectedCount++;
    }
  });

  fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2));
  console.log('Successfully injected ' + injectedCount + ' new cards from missing sets.');
} catch (err) {
  console.error('Error during injection:', err.message);
}
