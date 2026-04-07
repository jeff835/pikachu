import fs from 'fs';
import path from 'path';

const cardsPath = '/Users/wengyiwei/Desktop/pikachu/src/data/cards.json';
const officialPath = '/Users/wengyiwei/Desktop/pikachu/src/data/cards-official.json';

console.log('Loading datasets...');
const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));
const officialCards = JSON.parse(fs.readFileSync(officialPath, 'utf8'));

// Create a composite map: [setId_cardName] -> imageUrl
const officialMap = new Map();
officialCards.forEach((card: any) => {
  // Extract setId from parentheses, e.g. "(SV3)" or "(M2a)"
  const match = card.set_name.match(/\(([a-zA-Z0-9]+)\)/);
  const setIdFromOfficial = match ? match[1] : null;
  
  // Use card.name as per the actual JSON structure
  const key = setIdFromOfficial ? `${setIdFromOfficial}_${card.name}` : card.name;
  officialMap.set(key, card.image_url);
});

console.log(`Mapping built with ${officialMap.size} unique keys.`);

let updatedCount = 0;
const updatedCards = cards.map((card: any) => {
  // Try matching with setId_Name first
  const setKey = `${card.set_id}_${card.name}`;
  if (officialMap.has(setKey)) {
    card.image_url = officialMap.get(setKey);
    updatedCount++;
  } else if (officialMap.has(card.name)) {
    // Fallback to name only (use with caution for commons)
    card.image_url = officialMap.get(card.name);
    updatedCount++;
  }
  return card;
});

// Optional: Inject missing cards (uncomment if we want to add Rocket-dan etc.)
/*
officialCards.forEach((oCard: any) => {
  const match = oCard.set_name.match(/\((SV[0-9a-zA-Z]+)\)/);
  const setId = match ? match[1] : 'OFFICIAL';
  const customId = `OFFICIAL-${oCard.cardID}`;
  if (!existingIds.has(customId)) {
     // Logic to add new card would go here
  }
});
*/

fs.writeFileSync(cardsPath, JSON.stringify(updatedCards, null, 2));
console.log(`Successfully updated ${updatedCount} existing cards with official high-res images.`);
