const fs = require('fs');

const cardsFile = 'src/data/cards.json';
const cards = JSON.parse(fs.readFileSync(cardsFile, 'utf8'));

let updated = 0;
cards.forEach(c => {
  const region = c.region || 'JP';
  if (!c.id.endsWith(`-${region}`)) {
    c.id = `${c.id}-${region}`;
    updated++;
  }
});

fs.writeFileSync(cardsFile, JSON.stringify(cards, null, 2));
console.log(`✅ Appended region suffix to ${updated} cards in cards.json`);
