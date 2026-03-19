import { useState, useMemo } from 'react'
import { ArrowDownRight, TrendingDown, Calendar, ArrowUpRight, Globe, ChevronLeft } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useNavigate } from 'react-router-dom'

interface PricePoint {
  time: string
  price: number
}

interface PriceDropCard {
  id: string
  name: string
  image: string
  currentPrice: number
  dropPercent: string
  region: string
  history: {
    day: PricePoint[]
    month: PricePoint[]
    year: PricePoint[]
  }
}

// 模擬跌幅較大的卡牌數據
const mockPriceDropCards: PriceDropCard[] = [
  {
    id: 'sv4a-131',
    name: '噴火龍 ex (SSR)',
    image: 'https://images.pokemontcg.io/sv4a/131_hierarchical_image.png',
    currentPrice: 3200,
    dropPercent: '12.5%',
    region: 'JP',
    history: {
      day: [
        { time: '09:00', price: 3650 },
        { time: '12:00', price: 3500 },
        { time: '15:00', price: 3400 },
        { time: '18:00', price: 3200 },
        { time: '21:00', price: 3200 },
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
  {
    id: 'swsh12-160',
    name: '路基亞 V (SA)',
    image: 'https://images.pokemontcg.io/swsh12/160_hierarchical_image.png',
    currentPrice: 18500,
    dropPercent: '10.2%',
    region: 'TW',
    history: {
      day: [
        { time: '09:00', price: 20600 },
        { time: '15:00', price: 19500 },
        { time: '21:00', price: 18500 },
      ],
      month: [
        { time: '03/01', price: 22000 },
        { time: '03/10', price: 20500 },
        { time: '03/19', price: 18500 },
      ],
      year: [
        { time: '2023 Q2', price: 25000 },
        { time: '2023 Q4', price: 23000 },
        { time: '2024 MAR', price: 18500 },
      ]
    }
  },
  {
    id: 'sv1-094',
    name: '密勒頓 ex (SAR)',
    image: 'https://images.pokemontcg.io/sv1/94_hierarchical_image.png',
    currentPrice: 1200,
    dropPercent: '15.8%',
    region: 'JP',
    history: {
      day: [
        { time: '09:00', price: 1450 },
        { time: '18:00', price: 1200 },
      ],
      month: [
        { time: '03/01', price: 1800 },
        { time: '03/15', price: 1400 },
        { time: '03/19', price: 1200 },
      ],
      year: [
        { time: '2023', price: 2800 },
        { time: '2024', price: 1200 },
      ]
    }
  }
]

export default function PriceDrop() {
  const navigate = useNavigate()
  const [selectedCardId, setSelectedCardId] = useState(mockPriceDropCards[0].id)
  const [timeframe, setTimeframe] = useState<'day' | 'month' | 'year'>('month')

  const selectedCard = useMemo(() => 
    mockPriceDropCards.find(c => c.id === selectedCardId) || mockPriceDropCards[0]
  , [selectedCardId])

  const chartData = useMemo(() => selectedCard.history[timeframe], [selectedCard, timeframe])

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header Area */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2 bg-white rounded-full border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <TrendingDown className="w-6 h-6 md:w-8 md:h-8 text-rose-500" />
              跌幅警告詳情
            </h1>
            <p className="text-sm text-slate-400 font-bold">當前市場有 {mockPriceDropCards.length} 張異常價格波動卡牌</p>
          </div>
        </div>
        
        {/* Time Selection */}
        <div className="inline-flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm self-start md:self-auto">
          {(['day', 'month', 'year'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-4 md:px-6 py-2 rounded-xl text-xs md:text-sm font-black transition-all ${
                timeframe === t 
                ? 'bg-red-600 text-white shadow-lg' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {t === 'day' ? '日線 (D)' : t === 'month' ? '月線 (M)' : '年線 (Y)'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar List */}
        <div className="lg:col-span-1 space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 mb-2">警告名單</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            {mockPriceDropCards.map((card) => (
              <button
                key={card.id}
                onClick={() => setSelectedCardId(card.id)}
                className={`w-full flex items-center p-3 rounded-2xl transition-all border-2 text-left ${
                  selectedCardId === card.id 
                  ? 'bg-white shadow-xl border-red-500 scale-[1.02] z-10' 
                  : 'bg-white/60 border-transparent hover:bg-white hover:border-red-200 text-slate-500'
                }`}
              >
                <img src={card.image} alt={card.name} className="w-12 h-16 object-contain mr-3 drop-shadow-md" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-black truncate ${selectedCardId === card.id ? 'text-slate-800' : 'text-slate-500'}`}>{card.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      selectedCardId === card.id ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}>
                      -{card.dropPercent}
                    </span>
                    <span className="text-[10px] font-black text-slate-400">{card.id}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chart & Details Area */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50 rounded-full -mr-32 -mt-32 opacity-50"></div>
            
            <div className="relative z-10 space-y-8">
              {/* Card Meta */}
              <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="bg-slate-50 p-3 rounded-3xl border border-slate-100 shadow-inner group">
                    <img src={selectedCard.image} alt={selectedCard.name} className="w-24 md:w-32 h-32 md:h-44 object-contain group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded-full font-black flex items-center">
                        <Globe className="w-3 h-3 mr-1" />
                        {selectedCard.region}
                      </span>
                      <span className="text-slate-400 text-xs font-bold tracking-widest uppercase">{selectedCard.id}</span>
                    </div>
                    <h2 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight leading-tight">{selectedCard.name}</h2>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-3xl font-black text-slate-800">¥ {selectedCard.currentPrice.toLocaleString()}</span>
                      <div className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full border border-rose-100 font-black flex items-center gap-1">
                        <ArrowDownRight className="w-5 h-5" />
                        {selectedCard.dropPercent}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex flex-col items-end gap-2">
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-right">當前市場趨勢</p>
                   <div className="px-4 py-2 bg-rose-500 text-white rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg shadow-rose-200">
                     <TrendingDown className="w-4 h-4 animate-bounce" />
                     警示價位崩落中
                   </div>
                </div>
              </div>

              {/* Chart */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                       {timeframe === 'day' ? '當前 24H 價格震盪' : timeframe === 'month' ? '近 30 日走勢' : '近一年市場波動'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2">
                       <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                       <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase">估值 (Est. Price)</span>
                     </div>
                  </div>
                </div>

                <div className="h-[300px] md:h-[400px] w-full bg-slate-50/50 rounded-3xl p-4 md:p-6 border border-slate-100 shadow-inner">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis 
                        dataKey="time" 
                        stroke="#94a3b8" 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                        tickLine={false} 
                        axisLine={false} 
                        dy={10}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                        tickLine={false} 
                        axisLine={false} 
                        dx={-5}
                        tickFormatter={(v) => `¥${v.toLocaleString()}`}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                             return (
                               <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700">
                                  <p className="text-[10px] text-slate-400 font-bold mb-1">{payload[0].payload.time}</p>
                                  <div className="flex items-baseline gap-2">
                                     <span className="text-xl font-black">¥ {payload[0].value?.toLocaleString()}</span>
                                     <span className="text-[10px] font-black text-rose-400 flex items-center">
                                       <ArrowDownRight className="w-3 h-3" />
                                       警告
                                     </span>
                                  </div>
                               </div>
                             );
                          }
                          return null;
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#ef4444" 
                        strokeWidth={4} 
                        dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} 
                        activeDot={{ r: 8, strokeWidth: 0 }} 
                        animationDuration={1000}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Insights Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">平均成交週期</p>
                <p className="text-2xl font-black text-slate-800 tracking-tight">4.2 <span className="text-sm text-slate-400">小時</span></p>
                <div className="mt-4 flex items-center gap-2 text-emerald-500 font-bold text-xs bg-emerald-50 px-2 py-1 rounded w-fit">
                   <ArrowUpRight className="w-3 h-3" />
                   交易熱度高
                </div>
             </div>
             <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">歷史高點</p>
                <p className="text-2xl font-black text-slate-800 tracking-tight">¥ {(selectedCard.currentPrice * 1.8).toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase">發生於 2023 Q3</p>
             </div>
             <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">建議買入點</p>
                <p className="text-2xl font-black text-rose-600 tracking-tight">¥ {(selectedCard.currentPrice * 0.9).toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-1">預計 10% 支撐位</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
