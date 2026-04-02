/**
 * 卡牌價格服務
 * 從 Supabase card_prices 表查詢即時報價
 * 並整合匯率換算成 TWD
 */
import { supabase } from '../lib/supabase'
import { fetchExchangeRates, type ExchangeRates } from './exchangeRate'

export interface CardValuation {
  cardId: string
  snkrPriceJpy: number | null   // SNKRDUNK 原始報價 (JPY)
  ebayPriceUsd: number | null   // eBay 原始報價 (USD)
  snkrPriceTwd: number | null   // 換算後 TWD
  ebayPriceTwd: number | null   // 換算後 TWD
  bestPriceTwd: number          // 推薦估值 (取較高者)
  lastUpdated: string | null
}

// 快取已查詢的價格
let priceCache: Map<string, CardValuation> = new Map()
let priceCacheTimestamp = 0
const PRICE_CACHE_TTL = 3 * 60 * 1000 // 3 分鐘快取

/**
 * 批次查詢多張卡片的即時估值
 * @param cardIds 要查詢的卡片 ID 列表
 * @param forceRefresh 強制刷新（忽略快取）
 */
export async function fetchCardValuations(
  cardIds: string[], 
  forceRefresh = false
): Promise<Map<string, CardValuation>> {
  // 如果快取有效且不強制刷新
  if (!forceRefresh && priceCache.size > 0 && (Date.now() - priceCacheTimestamp) < PRICE_CACHE_TTL) {
    return priceCache
  }

  // 1. 並行取得匯率與價格資料
  const [rates, pricesResult] = await Promise.all([
    fetchExchangeRates(),
    supabase
      .from('card_prices')
      .select('*')
      .in('card_id', cardIds)
  ])

  const valuations = new Map<string, CardValuation>()

  if (pricesResult.error) {
    console.error('❌ 查詢 card_prices 失敗:', pricesResult.error.message)
    return valuations
  }

  // 2. 將每筆資料換算為 TWD
  for (const row of (pricesResult.data || [])) {
    const snkrTwd = row.snkr_price ? Math.round(row.snkr_price * rates.jpyToTwd) : null
    const ebayTwd = row.ebay_price ? Math.round(row.ebay_price * rates.usdToTwd) : null
    
    // 取較高的估值作為推薦價
    const bestPrice = Math.max(snkrTwd || 0, ebayTwd || 0)

    valuations.set(row.card_id, {
      cardId: row.card_id,
      snkrPriceJpy: row.snkr_price,
      ebayPriceUsd: row.ebay_price,
      snkrPriceTwd: snkrTwd,
      ebayPriceTwd: ebayTwd,
      bestPriceTwd: bestPrice,
      lastUpdated: row.last_updated
    })
  }

  // 更新快取
  priceCache = valuations
  priceCacheTimestamp = Date.now()

  console.log(`📊 已載入 ${valuations.size} 筆卡牌估值 (匯率: 1 USD = ${rates.usdToTwd} TWD)`)
  return valuations
}

/**
 * 取得單張卡片估值（從快取或 fallback 到 enriched-metadata）
 */
export function getCardValuation(cardId: string): CardValuation | null {
  return priceCache.get(cardId) || null
}

/**
 * 取得目前使用的匯率資訊（供 UI 顯示）
 */
export async function getCurrentRates(): Promise<ExchangeRates> {
  return await fetchExchangeRates()
}
