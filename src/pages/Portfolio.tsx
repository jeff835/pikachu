import { useState } from 'react'
import { usePortfolioStore, type PokemonCard } from '../store/usePortfolioStore'
import { useAuthStore } from '../store/useAuthStore'
import { Trash2, TrendingUp, TrendingDown, DollarSign, Wallet, Activity, Search as SearchIcon } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts'
import { Link } from 'react-router-dom'

export default function Portfolio() {
  const { items, removeItem } = usePortfolioStore()
  const { user } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')

  // 取得真實 TCGPlayer 美金報價
  const getBasePriceUsd = (card: PokemonCard) => {
    return card.tcgplayer?.prices?.holofoil?.market || 
           card.tcgplayer?.prices?.reverseHolofoil?.market || 
           card.tcgplayer?.prices?.normal?.market;
  }

  // 計算單張卡牌的當前市值 (以該卡牌版本的 SNKRDUNK 估價基準)
  const getCurrentMarketValue = (card: PokemonCard) => {
    const marketUsd = getBasePriceUsd(card)
    if (!marketUsd) return 0 // 如果沒有查到真實歷史報價，市值視為 0

    let baseNtd = marketUsd * 32
    if (card.region === 'JP') baseNtd = baseNtd * 1.3
    else if (card.region === 'TW') baseNtd = baseNtd * 0.75

    // 回傳預設 SNKRDUNK 平台估值
    return card.region === 'JP' ? Math.floor(baseNtd * 1.1) : Math.floor(baseNtd * 0.95)
  }

  // 總務計算
  const totalSpent = items.reduce((sum, item) => sum + item.purchasePriceNtd, 0)
  const totalCurrentValue = items.reduce((sum, item) => sum + getCurrentMarketValue(item.card), 0)
  const profitLoss = totalCurrentValue - totalSpent
  const profitLossPercentage = totalSpent > 0 ? (profitLoss / totalSpent) * 100 : 0

  // 準備圖表資料 (依據卡牌系列分佈)
  const distributionMap = items.reduce((acc, item) => {
    const setName = item.card.set?.name || '未知系列'
    acc[setName] = (acc[setName] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const pieData = Object.entries(distributionMap).map(([name, value]) => ({ name, value }))
  const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#64748b']

  // 篩選列表
  const filteredItems = items.filter(item => item.card.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="animate-in fade-in duration-500 pb-10">
      <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center">
            {user?.username} 的資產收藏庫
          </h1>
          <p className="text-slate-500 font-medium mt-2">追蹤您的卡牌投資組合與實時市值</p>
        </div>
      </div>

      {/* 總覽指標卡片區 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 bg-blue-50 w-24 h-24 rounded-full group-hover:scale-110 transition-transform flex items-center justify-center">
            <Wallet className="w-8 h-8 text-blue-500 opacity-50 absolute bottom-4 left-4" />
          </div>
          <p className="text-slate-500 font-bold mb-1 relative z-10">總投入成本</p>
          <div className="flex items-baseline space-x-2 relative z-10">
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">NT$ {totalSpent.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 bg-indigo-50 w-24 h-24 rounded-full group-hover:scale-110 transition-transform flex items-center justify-center">
            <Activity className="w-8 h-8 text-indigo-500 opacity-50 absolute bottom-4 left-4" />
          </div>
          <p className="text-slate-500 font-bold mb-1 relative z-10">當前總市值估價</p>
          <div className="flex items-baseline space-x-2 relative z-10">
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">NT$ {totalCurrentValue.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full group-hover:scale-110 transition-transform flex items-center justify-center ${profitLoss >= 0 ? 'bg-red-50' : 'bg-green-50'}`}>
            <DollarSign className={`w-8 h-8 opacity-50 absolute bottom-4 left-4 ${profitLoss >= 0 ? 'text-red-500' : 'text-green-500'}`} />
          </div>
          <p className="text-slate-500 font-bold mb-1 relative z-10">未實現帳面損益</p>
          <div className="flex items-baseline space-x-3 relative z-10">
            <h3 className={`text-3xl font-black tracking-tight ${profitLoss >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {profitLoss > 0 ? '+' : ''}{profitLoss.toLocaleString()}
            </h3>
            <div className={`flex items-center text-sm font-bold px-2 py-0.5 rounded-md ${profitLoss >= 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {profitLoss >= 0 ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">卡牌資產明細 ({items.length})</h2>
              <div className="relative">
                <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="搜尋收藏卡牌名稱..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-200 focus:border-red-500 outline-none w-64 bg-white"
                />
              </div>
            </div>

            <div className="space-y-4">
              {filteredItems.map(({ uid, card, purchasePriceNtd }) => {
                const currentVal = getCurrentMarketValue(card)
                const diff = currentVal - purchasePriceNtd
                const diffPct = purchasePriceNtd > 0 ? (diff / purchasePriceNtd) * 100 : 0
                const noPrice = currentVal === 0
                
                return (
                  <div key={uid} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center hover:shadow-md transition-shadow group relative overflow-hidden">
                    <img src={card.images.small} alt={card.name} className="w-16 h-24 object-contain mr-5 drop-shadow-sm rounded-md" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-1">
                        <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded mr-2">{card.region}版</span>
                        <h4 className="font-black text-slate-800 truncate text-lg pr-4">{card.name}</h4>
                      </div>
                      <p className="text-xs text-slate-400 font-bold mb-3">{card.set.name}</p>
                      
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">購入成本</span>
                          <span className="text-sm font-black text-slate-700">NT$ {purchasePriceNtd.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">當前估價</span>
                          <span className="text-sm font-black text-slate-800">{noPrice ? '無報價' : `NT$ ${currentVal.toLocaleString()}`}</span>
                        </div>
                        {!noPrice && (
                          <div className="flex flex-col items-end flex-auto pr-6">
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">帳面損益</span>
                            <div className={`flex items-center ${diff >= 0 ? 'text-red-500' : 'text-green-500'} font-black text-sm`}>
                              {diff > 0 ? '+' : ''}{diff.toLocaleString()} ({diffPct.toFixed(1)}%)
                            </div>
                          </div>
                        )}
                        {noPrice && (
                           <div className="flex flex-col items-end flex-auto pr-6">
                             <span className="text-[10px] text-slate-300 uppercase tracking-widest font-bold mb-0.5">帳面損益</span>
                             <span className="text-sm font-black text-slate-300">--</span>
                           </div>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        if (window.confirm('確定要把這張卡片從資產庫中拋售/移除嗎？')) removeItem(uid)
                      }}
                      className="w-10 h-10 bg-slate-50 hover:bg-rose-100 hover:text-rose-600 text-slate-400 rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 absolute right-4"
                      title="賣出/移除此卡"
                    >
                      <Trash2 className="w-4 h-4" />
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
              <p className="text-xs text-center text-slate-400 font-bold mt-6">上述圓餅圖顯示您收藏投資的不同系列卡包佔比分佈，有助於分散風險。</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
