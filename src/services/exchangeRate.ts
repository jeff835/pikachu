/**
 * 即時匯率服務
 * 使用 open.er-api.com 免費 API 獲取 USD/JPY → TWD 匯率
 * 每次進入 Portfolio 頁面時自動刷新
 */

export interface ExchangeRates {
  usdToTwd: number
  jpyToTwd: number
  lastUpdated: string
}

// 預設匯率（作為 API 失敗時的 Fallback）
const FALLBACK_RATES: ExchangeRates = {
  usdToTwd: 32.5,
  jpyToTwd: 0.22,
  lastUpdated: 'fallback'
}

// 快取匯率（避免短時間內重複請求）
let cachedRates: ExchangeRates | null = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 分鐘快取

export async function fetchExchangeRates(): Promise<ExchangeRates> {
  // 如果快取有效，直接返回
  if (cachedRates && (Date.now() - cacheTimestamp) < CACHE_TTL) {
    return cachedRates
  }

  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD')
    
    if (!response.ok) {
      throw new Error(`匯率 API 回應異常: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.result !== 'success' || !data.rates) {
      throw new Error('匯率 API 資料格式錯誤')
    }

    const twdRate = data.rates.TWD // 1 USD = ? TWD
    const jpyRate = data.rates.JPY // 1 USD = ? JPY

    if (!twdRate || !jpyRate) {
      throw new Error('找不到 TWD 或 JPY 匯率')
    }

    const rates: ExchangeRates = {
      usdToTwd: twdRate,
      jpyToTwd: twdRate / jpyRate, // 1 JPY = ? TWD
      lastUpdated: new Date().toISOString()
    }

    // 更新快取
    cachedRates = rates
    cacheTimestamp = Date.now()

    console.log(`💱 匯率更新成功: 1 USD = ${twdRate} TWD, 1 JPY = ${rates.jpyToTwd.toFixed(4)} TWD`)
    return rates
  } catch (error) {
    console.warn('⚠️ 匯率 API 請求失敗，使用預設匯率:', error)
    return cachedRates || FALLBACK_RATES
  }
}
