import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// 載入本地環境變數
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function migrateCards() {
  console.log('🚀 開始資料遷移專案: JSON -> Supabase')
  
  const cardsPath = path.resolve(process.cwd(), 'src/data/cards.json')
  if (!fs.existsSync(cardsPath)) {
    console.error('❌ 找不到 src/data/cards.json')
    return
  }

  const cardsData = JSON.parse(fs.readFileSync(cardsPath, 'utf-8'))
  console.log(`📦 讀取到 ${cardsData.length} 張卡牌。`)

  // 映射資料格式
  const mappedCards = cardsData.map((c: any) => ({
    id: c.id,
    local_id: c.localId,
    name: c.name,
    image_url: c.image_url || c.image || c.images?.large || c.images?.small,
    rarity: c.rarity,
    region: c.region || 'JP',
    set_id: c.set_id || (typeof c.set === 'string' ? c.set : c.set?.id),
    set_name: c.set_name || (typeof c.set === 'string' ? c.set : c.set?.name),
    serie_id: c.serie_id || '',
    serie_name: c.serie_name || '',
    set_logo: c.set?.logo || ''
  }))


  // 分批上傳 (避免 Request 過大)
  const batchSize = 500
  for (let i = 0; i < mappedCards.length; i += batchSize) {
    const batch = mappedCards.slice(i, i + batchSize)
    const { error } = await supabase
      .from('cards')
      .upsert(batch, { onConflict: 'id' })

    if (error) {
      console.error(`❌ 批次 ${i / batchSize + 1} 上傳失敗:`, error.message)
    } else {
      console.log(`✅ 成功上傳批次 ${i / batchSize + 1} (${Math.min(i + batchSize, mappedCards.length)}/${mappedCards.length})`)
    }
  }

  console.log('🎉 遷移完成！')
}

migrateCards().catch(console.error)
