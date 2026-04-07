import fs from 'fs'
import path from 'path'

const cardsPath = path.resolve(process.cwd(), 'src/data/cards.json')
const cardsData = JSON.parse(fs.readFileSync(cardsPath, 'utf-8'))

const structure: Record<string, {name: string, sets: {id: string, name: string, logo: string}[]}> = {}

for (const c of cardsData) {
  const serieId = c.serie_id || 'other'
  const serieName = c.serie_name || '未分類'
  const setId = c.set_id || c.set?.id || 'unknown'
  const setName = c.set_name || c.set?.name || '未知擴充包'
  const setLogo = c.set?.logo || ''

  if (!structure[serieId]) {
    structure[serieId] = { name: serieName, sets: [] }
  }

  const existingSet = structure[serieId].sets.find(s => s.id === setId)
  if (!existingSet) {
    structure[serieId].sets.push({ id: setId, name: setName, logo: setLogo })
  }
}

const outPath = path.resolve(process.cwd(), 'src/data/catalog-structure.json')
fs.writeFileSync(outPath, JSON.stringify(structure, null, 2))
console.log('✅ 目錄結構產生完成！')
