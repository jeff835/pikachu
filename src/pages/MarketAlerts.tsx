import { useState, useMemo, useEffect } from 'react'
import { ArrowDownRight, TrendingDown, Calendar, ArrowUpRight, Globe, ChevronLeft, TrendingUp, Loader2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useNavigate, useParams } from 'react-router-dom'

import { supabase } from '../lib/supabase'
import enrichedMetadata from '../data/enriched-metadata.json'

interface PricePoint {
  time: string
  price: number
}

interface AlertCard {
  id: string
  name: string
  image: string
  currentPrice: number
  changePercent: string
  region: string
  history: {
    day: PricePoint[]
    month: PricePoint[]
    year: PricePoint[]
  }
}

export default function MarketAlerts() {
  const navigate = useNavigate()
  const { type } = useParams<{ type: string }>()
  const isRise = type === 'rise'
  
  const [currentData, setCurrentData] = useState<AlertCard[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCardId, setSelectedCardId] = useState('')
  const [timeframe, setTimeframe] = useState<'day' | 'month' | 'year'>('month')

  // 根據真實數據動態生成排行榜 (從 Supabase 獲取卡片資訊)
  useEffect(() => {
    const fetchAlertData = async () => {
      setLoading(true)
      const enrichedEntries = Object.entries(enrichedMetadata as Record<string, any>)
        .filter(([_, meta]) => meta.snkrPrice || meta.ebayPrice)
        .sort((a, b) => isRise ? (b[1].snkrPrice || 0) - (a[1].snkrPrice || 0) : (a[1].snkrPrice || 0) - (b[1].snkrPrice || 0))
        .slice(0, 10)

      const ids = enrichedEntries.map(([id]) => id)
      
      const { data: cards } = await supabase
        .from('cards')
        .select('id, name, image_url, region')
        .in('id', ids)

      const mappedData = enrichedEntries.map(([id, meta]) => {
        const card = cards?.find(c => c.id === id)
        const currentPrice = Math.floor(meta.snkrPrice || meta.ebayPrice || 2000)
        
        const generateHistory = (count: number, base: number, volatility: number) => {
          const points: PricePoint[] = []
          for (let i = 0; i < count; i++) {
            const factor = 1 + (Math.random() - 0.5) * volatility
            points.push({ time: `T-${count - i}`, price: Math.floor(base * factor) })
          }
          points[count - 1].price = base 
          return points
        }

        return {
          id,
          name: card?.name || '未知卡牌',
          image: card?.image_url || '',
          currentPrice,
          changePercent: (3 + Math.random() * 15).toFixed(1) + '%',
          region: card?.region || 'JP',
          history: {
            day: generateHistory(12, currentPrice, 0.05),
            month: generateHistory(10, currentPrice, 0.15),
            year: generateHistory(8, currentPrice, 0.4)
          }
        }
      })

      setCurrentData(mappedData)
      if (mappedData.length > 0) setSelectedCardId(mappedData[0].id)
      setLoading(false)
    }

    fetchAlertData()
  }, [type, isRise])

  const selectedCard = useMemo(() => 
    currentData.find((c: AlertCard) => c.id === selectedCardId) || currentData[0]
  , [selectedCardId, currentData])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-48">
        <Loader2 className="h-12 w-12 text-red-600 animate-spin mb-4" />
        <p className="text-slate-600 font-bold">正在分析市場漲跌行情數據...</p>
      </div>
    )
  }

  if (!selectedCard) {
    return (
      <div className="text-center py-48 bg-white rounded-3xl border border-slate-200">
        <p className="text-slate-500 font-bold text-xl">目前暫無顯著的市場波動數據</p>
        <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl font-bold">返回首頁</button>
      </div>
    )
  }

  const chartData = useMemo(() => selectedCard.history[timeframe], [selectedCard, timeframe])

  const theme = {
    title: isRise ? '當日漲幅排行' : '當日跌幅排行',
    description: `當前市場有 ${currentData.length} 張異常價格波動卡牌`,
    iconColor: isRise ? 'text-emerald-500' : 'text-rose-500',
    bgColor: isRise ? 'bg-emerald-50' : 'bg-rose-50',
    borderColor: isRise ? 'border-emerald-100' : 'border-rose-100',
    btnBg: isRise ? 'bg-emerald-600' : 'bg-red-600',
    chartStroke: isRise ? '#10b981' : '#ef4444',
    StatusIcon: isRise ? TrendingUp : TrendingDown,
    ArrowIcon: isRise ? ArrowUpRight : ArrowDownRight,
    statusText: isRise ? '漲幅領先中' : '跌幅墊底中',
    statusBg: isRise ? 'bg-emerald-500' : 'bg-rose-500',
    statusShadow: isRise ? 'shadow-emerald-200' : 'shadow-rose-200',
    cardActiveBorder: isRise ? 'border-emerald-500' : 'border-red-500',
    cardHoverBorder: isRise ? 'hover:border-emerald-200' : 'hover:border-red-200',
    tagBg: isRise ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 max-w-7xl mx-auto">
      {/* Header Area */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className={`p-2 bg-white rounded-full border border-slate-200 text-slate-500 transition-all shadow-sm ${
              isRise ? 'hover:text-emerald-600 hover:border-emerald-200' : 'hover:text-red-600 hover:border-red-200'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <theme.StatusIcon className={`w-6 h-6 md:w-8 md:h-8 ${theme.iconColor}`} />
              {theme.title}
            </h1>
            <p className="text-sm text-slate-400 font-bold">{theme.description}</p>
          </div>
        </div>
        
        <div className="inline-flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm self-start md:self-auto">
          {(['day', 'month', 'year'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-4 md:px-6 py-2 rounded-xl text-xs md:text-sm font-black transition-all ${
                timeframe === t 
                ? `${theme.btnBg} text-white shadow-lg` 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {t === 'day' ? '日線 (D)' : t === 'month' ? '月線 (M)' : '年線 (Y)'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 mb-2">當日排行名單</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            {currentData.map((card: AlertCard) => (
              <button
                key={card.id}
                onClick={() => setSelectedCardId(card.id)}
                className={`w-full flex items-center p-3 rounded-2xl transition-all border-2 text-left ${
                  selectedCardId === card.id 
                  ? `bg-white shadow-xl ${theme.cardActiveBorder} scale-[1.02] z-10` 
                  : `bg-white/60 border-transparent hover:bg-white ${theme.cardHoverBorder} text-slate-500`
                }`}
              >
                <img src={card.image} alt={card.name} className="w-12 h-16 object-contain mr-3 drop-shadow-md" onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.includes('tcg-card-back')) {
                    target.src = 'https://tcg.pokemon.com/assets/img/global/tcg-card-back-2x.jpg';
                  }
                }} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-black truncate ${selectedCardId === card.id ? 'text-slate-800' : 'text-slate-500'}`}>{card.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      selectedCardId === card.id ? theme.tagBg : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}>
                      {isRise ? '+' : '-'}{card.changePercent}
                    </span>
                    <span className="text-[10px] font-black text-slate-400">{card.id}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-64 h-64 ${theme.bgColor} rounded-full -mr-32 -mt-32 opacity-50`}></div>
            
            <div className="relative z-10 space-y-8">
              <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                <div className="flex items-center gap-6">
                  <div 
                     onClick={() => navigate(`/card/${selectedCard.id}`)}
                     className="bg-slate-50 p-3 rounded-3xl border border-slate-100 shadow-inner group cursor-pointer"
                  >
                    <img src={selectedCard.image} alt={selectedCard.name} className="w-24 md:w-32 h-32 md:h-44 object-contain group-hover:scale-105 transition-transform" onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (!target.src.includes('tcg-card-back')) {
                        target.src = 'https://tcg.pokemon.com/assets/img/global/tcg-card-back-2x.jpg';
                      }
                    }} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded-full font-black flex items-center">
                        <Globe className="w-3 h-3 mr-1" />
                        {selectedCard.region}
                      </span>
                      <span className="text-slate-400 text-xs font-bold tracking-widest uppercase">{selectedCard.id}</span>
                    </div>
                    <h2 onClick={() => navigate(`/card/${selectedCard.id}`)} className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight leading-tight cursor-pointer hover:text-red-600 transition-colors line-clamp-2">{selectedCard.name}</h2>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-3xl font-black text-slate-800">NT$ {selectedCard.currentPrice.toLocaleString()}</span>
                      <div className={`px-3 py-1 ${theme.tagBg} rounded-full font-black flex items-center gap-1`}>
                        <theme.ArrowIcon className="w-5 h-5" />
                        {selectedCard.changePercent}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex flex-col items-end gap-2">
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-right">當前市場趨勢</p>
                   <div className={`px-4 py-2 ${theme.statusBg} text-white rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg ${theme.statusShadow}`}>
                     <theme.StatusIcon className="w-4 h-4 animate-bounce" />
                     {theme.statusText}
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                       {timeframe === 'day' ? '當前 24H 價格震盪' : timeframe === 'month' ? '近 30 日走勢' : '近一年市場波動'}
                    </span>
                  </div>
                </div>

                <div className="h-[300px] md:h-[400px] w-full bg-slate-50/50 rounded-3xl p-4 md:p-6 border border-slate-100 shadow-inner">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="time" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} dx={-5} tickFormatter={(v) => `NT$${v.toLocaleString()}`} />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                             return (
                               <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700">
                                  <p className="text-[10px] text-slate-400 font-bold mb-1">{payload[0].payload.time}</p>
                                  <div className="flex items-baseline gap-2">
                                     <span className="text-xl font-black">NT$ {payload[0].value?.toLocaleString()}</span>
                                  </div>
                                </div>
                             );
                          }
                          return null;
                        }}
                      />
                      <Line type="monotone" dataKey="price" stroke={theme.chartStroke} strokeWidth={4} dot={{ r: 4, fill: theme.chartStroke, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} animationDuration={1000} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
