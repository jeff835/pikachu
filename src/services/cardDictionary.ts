import { getJapanesePokemonName, getEnglishPokemonName } from '../lib/pokemonMap'

// 世代名稱字典，將 TCGDex 抓回來的 serie.id 或 serie.name 轉譯成當地化名稱
export const SERIES_MAP: Record<string, string> = {
  'sv': '朱＆紫',
  'scarlet & violet': '朱紫 (Scarlet & Violet)',
  'sword & shield': '劍盾 (Sword & Shield)',
  'sun & moon': '太陽與月亮 (Sun & Moon)',
  'xy': 'XY系列',
  'black & white': '黑白 (Black & White)',
  'heartgold & soulsilver': '心金魂銀 (HGSS)',
  'platinum': '白金 (Platinum)',
  'diamond & pearl': '鑽石與珍珠 (DP)',
  'ruby & sapphire': '寶石版 (EX)',
  'e-card': 'e-Card 系列',
  'neo': 'Neo 系列',
  'base': '無印/初代 (Base)',
  'gym': '道館系列 (Gym)',
  'pop': 'POP 系列',
  'misc': '附錄/其他 (Misc)',
  'other': '其他 (Other)'
}

export function translateSeriesName(serieIdOrName: string): string {
  if (!serieIdOrName) return '未分類'
  const key = serieIdOrName.toLowerCase()
  return SERIES_MAP[key] || serieIdOrName
}

export function translateCardSearch(chineseQuery: string, region: 'JP' | 'US' | 'TW'): string {
  if (!chineseQuery) return ''
  
  if (region === 'JP') {
    return getJapanesePokemonName(chineseQuery)
  }
  if (region === 'US') {
    return getEnglishPokemonName(chineseQuery)
  }
  return chineseQuery
}
