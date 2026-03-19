import { useState, useMemo } from 'react'
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
  Zap
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

// 模擬卡牌詳細數據 (實際應根據 ID Fetch)
const mockCardDetail: Record<string, CardDetailData> = {
  'sv4a-131': {
    id: 'sv4a-131',
    name: '噴火龍 ex (SSR)',
    image: 'https://images.pokemontcg.io/sv4a/131_hierarchical_image.png',
    currentPrice: 3200,
    changePercent: '12.5%',
    isUp: false,
    region: 'JP',
    rarity: 'SSR',
    set: 'Shiny Treasure ex',
    setLogo: 'https://images.pokemontcg.io/sv4a/logo.png',
    description: '此卡牌為 2023 年底發行的 Shiny Treasure ex 系列中的頂級收藏品。由於噴火龍的高人氣與 SSR 稀有度，其二級市場波動劇烈。',
    platforms: [
      { name: 'SNKRDUNK', price: 3200, status: 'Low', lastUpdate: '5 mins ago' },
      { name: 'eBay', price: 3450, status: 'Stable', lastUpdate: '1 hour ago' },
      { name: 'Cardrush', price: 3100, status: 'High', lastUpdate: '10 mins ago' },
    ],
    history: {
      day: [
        { time: '00:00', price: 3600 },
        { time: '06:00', price: 3500 },
        { time: '12:00', price: 3400 },
        { time: '18:00', price: 3200 },
        { time: '23:59', price: 3200 },
      ],
      month: [
        { time: '03/01', price: 4200 },
        { time: '03/05', price: 4000 },
        { time: '03/10', price: 3800 },
        { time: '03/15', price: 3500 },
        { time: '03/19', price: 3200 },
      ],
      year: [
        { time: '2023 Q3', price: 5500 },
        { time: '2023 Q4', price: 4800 },
        { time: '2024 Q1', price: 4200 },
        { time: '2024 MAR', price: 3200 },
      ]
    }
  },
  'sv5m-071': {
    id: 'sv5m-071',
    name: '皮卡丘 ex (SAR)',
    image: 'https://images.pokemontcg.io/sv5m/71_hierarchical_image.png',
    currentPrice: 15600,
    changePercent: '18.4%',
    isUp: true,
    region: 'JP',
    rarity: 'SAR',
    set: 'Crimson Haze',
    setLogo: 'https://images.pokemontcg.io/sv5m/logo.png',
    description: '最新的 SAR 規格皮卡丘，畫風獨特，具有極高的收藏價值與比賽實用性。',
    platforms: [
      { name: 'SNKRDUNK', price: 15600, status: 'High', lastUpdate: '2 mins ago' },
      { name: 'eBay', price: 16800, status: 'High', lastUpdate: '30 mins ago' },
    ],
    history: {
      day: [
        { time: '00:00', price: 13000 },
        { time: '12:00', price: 14500 },
        { time: '23:59', price: 15600 },
      ],
      month: [
        { time: '03/01', price: 10000 },
        { time: '03/10', price: 12500 },
        { time: '03/19', price: 15600 },
      ],
      year: [
        { time: '2023', price: 8000 },
        { time: '2024', price: 15600 },
      ]
    }
  }
}

export default function CardDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [timeframe, setTimeframe] = useState<'day' | 'month' | 'year'>('month')
  
  // 取得資料，若無則用預設值（正常應有 Not Found 處理）
  const data = useMemo(() => mockCardDetail[id || 'sv4a-131'] || mockCardDetail['sv4a-131'], [id])
  const chartData = useMemo(() => data.history[timeframe], [data, timeframe])

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
               <img src={data.setLogo} alt={data.set} className="h-6 object-contain opacity-50" />
               <span className="text-slate-400 font-bold text-sm tracking-tight">{data.set} • {data.id}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-800 tracking-tighter leading-none italic">{data.name}</h1>
            <div className="flex flex-wrap items-end gap-6 pt-2">
               <div className="space-y-1">
                 <p className="text-xs font-black text-slate-400 uppercase tracking-widest">目前估值 (Est.)</p>
                 <p className="text-5xl font-black text-slate-900">¥ {data.currentPrice.toLocaleString()}</p>
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
                    tickFormatter={(v) => `¥${v}`}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload?.[0]) {
                        return (
                          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700">
                            <p className="text-[10px] text-slate-400 font-bold mb-1">{payload[0].payload.time}</p>
                            <p className="text-xl font-black">¥ {payload[0].value?.toLocaleString()}</p>
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
                       <p className="font-black text-slate-900">¥ {p.price.toLocaleString()}</p>
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
                    <span className="px-3 py-1 bg-white rounded-full text-[10px] font-black text-slate-500 border border-slate-200 uppercase tracking-wider">Shiny Treasure</span>
                    <span className="px-3 py-1 bg-white rounded-full text-[10px] font-black text-slate-500 border border-slate-200 uppercase tracking-wider">Charizard</span>
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
