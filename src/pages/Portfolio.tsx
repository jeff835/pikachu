import { useState, useEffect } from 'react'
import { usePortfolioStore, type PokemonCard } from '../store/usePortfolioStore'
import { useAuthStore } from '../store/useAuthStore'
import { Trash2, TrendingUp, TrendingDown, DollarSign, Wallet, Activity, Search as SearchIcon, Edit2, Check, X, RefreshCw, Clock } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts'
import { Link } from 'react-router-dom'
import enrichedMetadata from '../data/enriched-metadata.json'

export default function Portfolio() {
  const { 
    items, removeItem, updatePrice, fetchItems,
    valuations, exchangeRates, isValuationLoading, lastValuationUpdate, refreshValuations
  } = usePortfolioStore()
  const { user } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [tempPrice, setTempPrice] = useState<number>(0)

  // 進入頁面時主動從 Supabase 抓取資產庫（會自動觸發估值刷新）
  useEffect(() => {
    fetchItems()
  }, [])

  const handleStartEdit = (uid: string, currentPrice: number) => {
    setEditingId(uid)
    setTempPrice(currentPrice)
  }

  const handleSaveEdit = (uid: string) => {
    updatePrice(uid, tempPrice)
    setEditingId(null)
  }

  /**
   * 取得卡片的即時市值估價 (TWD)
   * 優先順序：Supabase card_prices (即時匯率換算) > enriched-metadata (舊版 Fallback) > 靜態估算
   */
  const getCurrentMarketValue = (card: PokemonCard) => {
    // 1. 優先使用 Supabase 即時估值
    const valuation = valuations.get(card.id)
    if (valuation && valuation.bestPriceTwd > 0) {
      return valuation.bestPriceTwd
    }

    // 2. Fallback: 從 enriched-metadata 取得（舊版資料，已預先換算 NTD）
    const enriched = (enrichedMetadata as any)[card.id]
    if (enriched) {
      if (enriched.snkrPrice) return Math.floor(enriched.snkrPrice)
      if (enriched.ebayPrice) return Math.floor(enriched.ebayPrice)
    }

    // 3. 最終 Fallback: TCGPlayer 靜態估算
    const marketUsd = card.tcgplayer?.prices?.holofoil?.market || 
                      card.tcgplayer?.prices?.reverseHolofoil?.market || 
                      card.tcgplayer?.prices?.normal?.market;
    
    if (!marketUsd) return 0

    const rate = exchangeRates?.usdToTwd || 32.5
    let baseNtd = marketUsd * rate
    if (card.region === 'JP') baseNtd = baseNtd * 1.3
    else if (card.region === 'TW') baseNtd = baseNtd * 0.75

    return card.region === 'JP' ? Math.floor(baseNtd * 1.1) : Math.floor(baseNtd * 0.95)
  }

  /**
   * 取得卡片估值的來源文字標籤
   */
  const getValuationSource = (card: PokemonCard): string => {
    const valuation = valuations.get(card.id)
    if (valuation && valuation.bestPriceTwd > 0) {
      if (valuation.snkrPriceTwd && valuation.snkrPriceTwd >= (valuation.ebayPriceTwd || 0)) {
        return 'SNKRDUNK'
      }
      return 'eBay'
    }
    const enriched = (enrichedMetadata as any)[card.id]
    if (enriched?.snkrPrice) return 'SNKR (快取)'
    if (enriched?.ebayPrice) return 'eBay (快取)'
    return '估算'
  }

  // 總務計算
  const totalSpent = items.reduce((sum, item) => sum + item.purchasePriceNtd, 0)
  const totalCurrentValue = items.reduce((sum, item) => sum + getCurrentMarketValue(item.card), 0)
  const profitLoss = totalCurrentValue - totalSpent
  const profitLossPercentage = totalSpent > 0 ? (profitLoss / totalSpent) * 100 : 0

  // 準備圖表資料 (依據卡牌系列分佈)
  const distributionMap = items.reduce((acc, item) => {
    const setName = typeof item.card.set === 'string' ? item.card.set : (item.card.set?.name || '未知系列')
    acc[setName] = (acc[setName] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const pieData = Object.entries(distributionMap).map(([name, value]) => ({ name, value }))
  const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#64748b']

  // 篩選列表
  const filteredItems = items.filter(item => item.card.name.toLowerCase().includes(searchTerm.toLowerCase()))

  // 格式化最後更新時間
  const formatLastUpdate = () => {
    if (!lastValuationUpdate) return null
    const d = new Date(lastValuationUpdate)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
  }

  return (
    <div className="animate-in fade-in duration-500 pb-10">
      <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-start justify-between space-y-2 md:space-y-0 text-center md:text-left">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center justify-center md:justify-start">
            {user?.username} 的資產收藏庫
          </h1>
          <p className="text-slate-400 font-bold mt-1 md:mt-2 text-xs md:text-sm">追蹤您的卡牌投資組合與實時市值</p>
        </div>

        {/* 匯率與刷新狀態指示 */}
        {items.length > 0 && (
          <div className="flex items-center gap-3 text-xs">
            {exchangeRates && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-sm">
                <DollarSign className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-slate-600 font-bold">
                  USD {exchangeRates.usdToTwd.toFixed(1)} · JPY {exchangeRates.jpyToTwd.toFixed(3)}
                </span>
              </div>
            )}
            <button 
              onClick={() => refreshValuations()}
              disabled={isValuationLoading}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-1.5 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50 group"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-400 group-hover:text-red-500 transition-colors ${isValuationLoading ? 'animate-spin' : ''}`} />
              <span className="text-slate-500 font-bold group-hover:text-slate-700">
                {isValuationLoading ? '更新中...' : '刷新估值'}
              </span>
            </button>
            {lastValuationUpdate && (
              <div className="hidden sm:flex items-center gap-1 text-slate-400">
                <Clock className="w-3 h-3" />
                <span className="font-medium">{formatLastUpdate()}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 總覽指標卡片區 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
        <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 bg-blue-50 w-20 h-20 md:w-24 md:h-24 rounded-full group-hover:scale-110 transition-transform flex items-center justify-center">
            <Wallet className="w-6 h-6 md:w-8 md:h-8 text-blue-400 opacity-40 absolute bottom-4 left-4" />
          </div>
          <p className="text-slate-400 text-[10px] md:text-xs font-bold mb-1 relative z-10 uppercase tracking-widest">總投入成本</p>
          <div className="flex items-baseline space-x-2 relative z-10">
            <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">NT$ {totalSpent.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 bg-indigo-50 w-20 h-20 md:w-24 md:h-24 rounded-full group-hover:scale-110 transition-transform flex items-center justify-center">
            <Activity className="w-6 h-6 md:w-8 md:h-8 text-indigo-400 opacity-40 absolute bottom-4 left-4" />
          </div>
          <p className="text-slate-400 text-[10px] md:text-xs font-bold mb-1 relative z-10 uppercase tracking-widest">
            當前總市值估價
            {isValuationLoading && <span className="ml-1 text-blue-400 animate-pulse">⟳</span>}
          </p>
          <div className="flex items-baseline space-x-2 relative z-10">
            <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">NT$ {totalCurrentValue.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-200 shadow-sm relative overflow-hidden group sm:col-span-2 lg:col-span-1">
          <div className={`absolute -right-4 -top-4 w-20 h-20 md:w-24 md:h-24 rounded-full group-hover:scale-110 transition-transform flex items-center justify-center ${profitLoss >= 0 ? 'bg-red-50' : 'bg-green-50'}`}>
            <DollarSign className={`w-6 h-6 md:w-8 md:h-8 opacity-40 absolute bottom-4 left-4 ${profitLoss >= 0 ? 'text-red-400' : 'text-green-400'}`} />
          </div>
          <p className="text-slate-400 text-[10px] md:text-xs font-bold mb-1 relative z-10 uppercase tracking-widest">未實現帳面損益</p>
          <div className="flex items-baseline space-x-2 md:space-x-3 relative z-10">
            <h3 className={`text-2xl md:text-3xl font-black tracking-tight ${profitLoss >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {profitLoss > 0 ? '+' : ''}{profitLoss.toLocaleString()}
            </h3>
            <div className={`flex items-center text-[10px] md:text-sm font-bold px-1.5 md:px-2 py-0.5 rounded-md ${profitLoss >= 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {profitLoss >= 0 ? <TrendingUp className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1" /> : <TrendingDown className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1" />}
              {profitLossPercentage.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 border-dashed shadow-sm">
          <div className="w-24 h-24 bg-slate-50 rounded-full mx-auto flex items-center justify-center mb-6">
            <Wallet className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">您的收藏庫空空如也</h3>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto font-medium">看來您還沒加入任何寶可夢卡牌。立刻前往探索大廳，把心儀的卡牌加入資產組合吧！</p>
          <Link to="/search" className="inline-block px-8 py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-md active:scale-95">
            前往卡牌大廳逛逛
          </Link>
        </div>
      ) : (
        <div className="flex flex-col xl:flex-row gap-8">
          {/* 左側列表區 */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 space-y-4 sm:space-y-0 text-center sm:text-left">
              <h2 className="text-lg md:text-xl font-black text-slate-800">卡牌資產明細 ({items.length})</h2>
              <div className="relative">
                <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="搜尋收藏..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-red-200 focus:border-red-500 outline-none w-full sm:w-48 md:w-64 bg-white"
                />
              </div>
            </div>

            <div className="space-y-3 md:space-y-4">
              {filteredItems.map(({ uid, card, purchasePriceNtd }) => {
                const currentVal = getCurrentMarketValue(card)
                const diff = currentVal - purchasePriceNtd
                const diffPct = purchasePriceNtd > 0 ? (diff / purchasePriceNtd) * 100 : 0
                const noPrice = currentVal === 0
                const source = getValuationSource(card)
                
                return (
                  <div key={uid} className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-200 shadow-sm flex items-center hover:shadow-md transition-shadow group relative overflow-hidden">
                    <img src={card.images.small} alt={card.name} className="w-12 h-16 md:w-16 md:h-24 object-contain mr-3 md:mr-5 drop-shadow-sm rounded-md" onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (!target.src.includes('tcg-card-back')) {
                        target.src = 'https://tcg.pokemon.com/assets/img/global/tcg-card-back-2x.jpg';
                      }
                    }} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-0.5 md:mb-1">
                        <span className="text-[8px] md:text-[10px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded mr-1.5">{card.region}版</span>
                        <h4 className="font-black text-slate-800 truncate text-sm md:text-lg pr-8">{card.name}</h4>
                      </div>
                      <div className="flex items-center gap-1.5 mb-2 md:mb-3">
                        <p className="text-[10px] md:text-xs text-slate-400 font-bold truncate">{typeof card.set === 'string' ? card.set : card.set?.name}</p>
                        {!noPrice && (
                          <span className={`text-[7px] md:text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                            source.includes('SNKR') ? 'bg-purple-100 text-purple-600' :
                            source.includes('eBay') ? 'bg-blue-100 text-blue-600' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {source}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 md:gap-6 overflow-x-auto no-scrollbar">
                        <div className="flex flex-col shrink-0 min-w-[70px] md:min-w-[100px]">
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="text-[8px] md:text-[10px] text-slate-400 uppercase tracking-widest font-black whitespace-nowrap">購入</span>
                            {editingId !== uid && (
                              <button 
                                onClick={() => handleStartEdit(uid, purchasePriceNtd)}
                                className="text-slate-300 hover:text-red-500 transition-colors"
                              >
                                <Edit2 className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                          
                          {editingId === uid ? (
                            <div className="flex items-center gap-1 mt-1">
                              <div className="relative">
                                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[8px] md:text-xs font-black text-slate-400">¥</span>
                                <input 
                                  type="number"
                                  value={tempPrice}
                                  onChange={(e) => setTempPrice(Number(e.target.value))}
                                  className="pl-4 pr-1 py-0.5 w-16 md:w-24 bg-slate-50 border border-red-300 rounded text-[10px] md:text-sm font-black text-slate-700 outline-none focus:ring-1 focus:ring-red-200"
                                  autoFocus
                                />
                              </div>
                              <button 
                                onClick={() => handleSaveEdit(uid)}
                                className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 shadow-sm"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => setEditingId(null)}
                                className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] md:text-sm font-black text-slate-700">¥ {purchasePriceNtd.toLocaleString()}</span>
                          )}
                        </div>
                        <div className="flex flex-col shrink-0">
                          <span className="text-[8px] md:text-[10px] text-slate-400 uppercase tracking-widest font-black mb-0.5 whitespace-nowrap">現值</span>
                          <span className="text-[10px] md:text-sm font-black text-slate-800">{noPrice ? '--' : `¥ ${currentVal.toLocaleString()}`}</span>
                        </div>
                        {!noPrice && (
                          <div className="flex flex-col items-end flex-auto pr-6 md:pr-10 shrink-0">
                            <span className="text-[8px] md:text-[10px] text-slate-400 uppercase tracking-widest font-black mb-0.5">預估損益</span>
                            <div className={`flex items-center ${diff >= 0 ? 'text-red-500' : 'text-green-500'} font-black text-[10px] md:text-sm`}>
                              {diff > 0 ? '+' : ''}{diffPct.toFixed(1)}%
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        if (window.confirm('確定要把這張卡片從資產庫中拋售/移除嗎？')) removeItem(uid)
                      }}
                      className="w-8 h-8 md:w-10 md:h-10 bg-slate-50 hover:bg-rose-100 hover:text-rose-600 text-slate-400 rounded-full flex items-center justify-center transition-colors absolute right-2 md:right-4"
                      title="賣出/移除此卡"
                    >
                      <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                  </div>
                )
              })}
              
              {filteredItems.length === 0 && searchTerm && (
                <div className="text-center py-10 text-slate-500 font-bold border border-slate-200 border-dashed rounded-xl bg-slate-50">找不到符合「{searchTerm}」的收藏紀錄。</div>
              )}
            </div>
          </div>

          {/* 右側圖表區 */}
          <div className="xl:w-80 2xl:w-96 shrink-0 mt-8 xl:mt-0">
            <h2 className="text-xl font-bold text-slate-800 mb-6">資產血統主題佔比</h2>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#1e293b', fontWeight: 900 }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* 匯率與更新時間資訊 */}
              {exchangeRates && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>💱 即時匯率</span>
                    <span>USD→TWD: {exchangeRates.usdToTwd.toFixed(2)} | JPY→TWD: {exchangeRates.jpyToTwd.toFixed(4)}</span>
                  </div>
                  {lastValuationUpdate && (
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                      <span>🕐 最後更新</span>
                      <span>{formatLastUpdate()}</span>
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-center text-slate-400 font-bold mt-4">上述圓餅圖顯示您收藏投資的不同系列卡包佔比分佈，有助於分散風險。</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
