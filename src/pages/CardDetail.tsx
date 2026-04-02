import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ChevronLeft, 
  ArrowUpRight, 
  ArrowDownRight, 
  Globe, 
  TrendingUp, 
  Info, 
  ExternalLink,
  ShieldCheck,
  Zap,
  Loader2
} from 'lucide-react'
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'

import { supabase } from '../lib/supabase'
import enrichedMetadata from '../data/enriched-metadata.json'

interface PricePoint {
  time: string
  price: number
}

interface CardDetailData {
  id: string
  name: string
  image: string
  currentPrice: number
  changePercent: string
  isUp: boolean
  region: string
  rarity: string
  set: string
  setLogo: string
  description: string
  platforms: {
    name: string
    price: number
    status: 'High' | 'Low' | 'Stable'
    lastUpdate: string
  }[]
  history: {
    day: PricePoint[]
    month: PricePoint[]
    year: PricePoint[]
  }
}

export default function CardDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [timeframe, setTimeframe] = useState<'day' | 'month' | 'year'>('month')
  const [data, setData] = useState<CardDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  
  // 從 Supabase 抓取卡牌詳情
  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return
      setLoading(true)
      
      try {
        const { data: card, error } = await supabase
          .from('cards')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error

        const meta = (enrichedMetadata as any)[id]
        const currentPrice = Math.floor(meta?.snkrPrice || meta?.ebayPrice || 2000)
        const isUp = Math.random() > 0.5

        // 生成模擬歷史數據
        const generateHistory = (count: number, base: number) => {
          return Array.from({ length: count }).map((_, i) => ({
            time: `T-${count - i}`,
            price: Math.floor(base * (0.8 + Math.random() * 0.4))
          }))
        }

        setData({
          id: card.id,
          name: card.name,
          image: card.image_url || '',
          currentPrice,
          changePercent: (2 + Math.random() * 8).toFixed(1) + '%',
          isUp,
          region: card.region || 'JP',
          rarity: card.rarity || 'Normal',
          set: card.set_name || '未知系列',
          setLogo: card.set_logo || '',
          description: `此卡牌為 ${card.set_name || '未知系列'} 的一部分。具有高度的收藏價值。`,
          platforms: [
            { name: 'SNKRDUNK', price: Math.floor(currentPrice * 0.95), status: 'Low', lastUpdate: '10 mins ago' },
            { name: 'eBay', price: Math.floor(currentPrice * 1.05), status: 'High', lastUpdate: '1 hour ago' },
          ],
          history: {
            day: generateHistory(12, currentPrice),
            month: generateHistory(10, currentPrice),
            year: generateHistory(8, currentPrice),
          }
        })
      } catch (err) {
        console.error('Fetch Card Detail Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDetail()
  }, [id])

  const chartData = useMemo(() => data?.history[timeframe] || [], [data, timeframe])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-48">
        <Loader2 className="h-12 w-12 text-red-600 animate-spin mb-4" />
        <p className="text-slate-600 font-bold">正在讀取卡牌詳細數據...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-48 bg-white rounded-3xl border border-slate-200">
        <p className="text-slate-500 font-bold text-xl">找不到該卡牌的詳細資料</p>
        <button onClick={() => navigate('/search')} className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl font-bold">返回搜尋</button>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 pb-20 max-w-7xl mx-auto">
      {/* Top Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-black text-sm"
        >
          <div className="p-2 bg-white rounded-xl border border-slate-200 group-hover:border-slate-300 shadow-sm">
            <ChevronLeft className="w-5 h-5" />
          </div>
          返回列表
        </button>
        <div className="flex items-center gap-2">
           <button className="p-2 bg-white rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 transition-all">
             <ExternalLink className="w-5 h-5" />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Aspect: Card Image & Quick Stats */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white opacity-50"></div>
            <img 
              src={data.image} 
              alt={data.name} 
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('tcg-card-back')) {
                  target.src = 'https://tcg.pokemon.com/assets/img/global/tcg-card-back-2x.jpg';
                }
              }}
              className="relative z-10 w-full h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)] group-hover:scale-[1.02] transition-transform duration-500" 
            />
            {/* Rarity Tag */}
            <div className="absolute top-6 right-6 z-20">
              <span className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-xs font-black tracking-widest shadow-lg">
                {data.rarity}
              </span>
            </div>
          </div>


          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">發行地區</p>
                <div className="flex items-center gap-2">
                   <Globe className="w-4 h-4 text-blue-500" />
                   <span className="font-black text-slate-800">{data.region === 'JP' ? '日版 (JP)' : '台版 (TW)'}</span>
                </div>
             </div>
             <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">認證狀況</p>
                <div className="flex items-center gap-2">
                   <ShieldCheck className="w-4 h-4 text-emerald-500" />
                   <span className="font-black text-slate-800">官方正品</span>
                </div>
             </div>
          </div>
        </div>

        {/* Right Aspect: Detailed Info & Charts */}
        <div className="lg:col-span-8 space-y-8">
          {/* Main Title & Price */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
               {data.setLogo && <img src={data.setLogo} alt={data.set} className="h-6 object-contain opacity-50" />}
               <span className="text-slate-400 font-bold text-sm tracking-tight">{data.set} • {data.id}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-800 tracking-tighter leading-none italic">{data.name}</h1>
            <div className="flex flex-wrap items-end gap-6 pt-2">
               <div className="space-y-1">
                 <p className="text-xs font-black text-slate-400 uppercase tracking-widest">目前估值 (Est.)</p>
                 <p className="text-5xl font-black text-slate-900">NT$ {data.currentPrice.toLocaleString()}</p>
               </div>
               <div className={`mb-1 px-4 py-2 rounded-2xl flex items-center gap-2 font-black ${
                 data.isUp ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
               }`}>
                 {data.isUp ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                 <span className="text-xl">{data.changePercent}</span>
               </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-slate-50 rounded-xl">
                   <TrendingUp className="w-5 h-5 text-slate-800" />
                 </div>
                 <h3 className="font-black text-slate-800 tracking-tight">市場價格走勢</h3>
               </div>
               <div className="flex bg-slate-100 p-1 rounded-xl">
                 {(['day', 'month', 'year'] as const).map(t => (
                   <button
                     key={t}
                     onClick={() => setTimeframe(t)}
                     className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                       timeframe === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                     }`}
                   >
                     {t === 'day' ? '24H' : t === 'month' ? '30D' : '1Y'}
                   </button>
                 ))}
               </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={data.isUp ? "#10b981" : "#ef4444"} stopOpacity={0.1}/>
                      <stop offset="95%" stopColor={data.isUp ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                    tickFormatter={(v) => `NT$${v}`}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload?.[0]) {
                        return (
                          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700">
                            <p className="text-[10px] text-slate-400 font-bold mb-1">{payload[0].payload.time}</p>
                            <p className="text-xl font-black">NT$ {payload[0].value?.toLocaleString()}</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke={data.isUp ? "#10b981" : "#ef4444"} 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorPrice)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Platform Prices & Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <h4 className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-widest">
                 <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                 各平台即時報價
               </h4>
               <div className="space-y-3">
                 {data.platforms.map(p => (
                   <div key={p.name} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 hover:shadow-md transition-shadow">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center font-black text-slate-400 text-xs">
                         {p.name[0]}
                       </div>
                       <div>
                         <p className="font-black text-slate-800 text-sm">{p.name}</p>
                         <p className="text-[10px] text-slate-400 font-bold uppercase">{p.lastUpdate}</p>
                       </div>
                     </div>
                     <div className="text-right">
                       <p className="font-black text-slate-900">NT$ {p.price.toLocaleString()}</p>
                       <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                         p.status === 'Low' ? 'bg-rose-50 text-rose-500' : p.status === 'High' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-400'
                       }`}>
                         {p.status}
                       </span>
                     </div>
                   </div>
                 ))}
               </div>
            </div>

            <div className="space-y-4">
               <h4 className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-widest">
                 <Info className="w-4 h-4 text-blue-500" />
                 卡牌簡介
               </h4>
               <div className="bg-slate-100/50 p-6 rounded-[2rem] border border-slate-200">
                 <p className="text-slate-600 font-medium leading-relaxed text-sm">
                   {data.description}
                 </p>
                 <div className="mt-6 flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-white rounded-full text-[10px] font-black text-slate-500 border border-slate-200 uppercase tracking-wider">{data.set}</span>
                    <span className="px-3 py-1 bg-white rounded-full text-[10px] font-black text-slate-500 border border-slate-200 uppercase tracking-wider">High Liquidity</span>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
