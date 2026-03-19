import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const mockPriceData = [
  { date: '1月', ebay: 3800, snkrdunk: 4000 },
  { date: '2月', ebay: 4100, snkrdunk: 4200 },
  { date: '3月', ebay: 3950, snkrdunk: 4150 },
  { date: '4月', ebay: 4300, snkrdunk: 4500 },
  { date: '5月', ebay: 4400, snkrdunk: 4700 },
  { date: '6月', ebay: 4200, snkrdunk: 4500 },
]

const recentTrades = [
  { id: 1, cardId: 'sv3-125', card: '噴火龍 ex (SAR)', price: 4200, platform: 'SNKRDUNK', time: '10 分鐘前', trend: 'up' },
  { id: 2, cardId: 'sv4a-131', card: '皮卡丘 VMAX', price: 1800, platform: 'eBay', time: '1 小時前', trend: 'down' },
  { id: 3, cardId: 'sv4a-131', card: '夢幻 ex (UR)', price: 2100, platform: 'SNKRDUNK', time: '2 小時前', trend: 'up' },
  { id: 4, cardId: 'sv4a-131', card: '烈空坐 VMAX (SA)', price: 8500, platform: 'eBay', time: '4 小時前', trend: 'up' },
]

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 md:mb-6 space-y-3 sm:space-y-0">
        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">市場總覽</h1>
        <div className="flex items-center space-x-2 text-[10px] md:text-sm text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm self-start sm:self-auto">
          <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4 text-emerald-500" />
          <span className="font-medium">大盤情緒：<strong className="text-emerald-600">看漲</strong></span>
        </div>
      </div>
      
      {/* 頂部數據卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md hover:border-red-200 transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 md:w-24 md:h-24 bg-red-50 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10">
            <h3 className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-wider">PTCG 價格指數</h3>
            <div className="flex items-baseline mt-1 md:mt-2">
              <p className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight">12,450</p>
              <div className="ml-2 md:ml-3 flex items-center text-[10px] md:text-sm font-bold text-emerald-600 bg-emerald-50 px-1.5 md:px-2 py-0.5 rounded border border-emerald-100">
                <ArrowUpRight className="h-3 w-3 md:h-4 md:w-4 mr-0.5 stroke-[3]" />
                <span>+2.4%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md hover:border-red-200 transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 md:w-24 md:h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10">
            <h3 className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-wider">24H 交易量</h3>
            <div className="flex items-baseline mt-1 md:mt-2">
              <p className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight">2.8M</p>
              <div className="ml-2 md:ml-3 flex items-center text-[10px] md:text-sm font-bold text-emerald-600 bg-emerald-50 px-1.5 md:px-2 py-0.5 rounded border border-emerald-100">
                <ArrowUpRight className="h-3 w-3 md:h-4 md:w-4 mr-0.5 stroke-[3]" />
                <span>+12%</span>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={() => navigate('/market-alerts/drop')}
          className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-xl hover:border-red-500 transition-all cursor-pointer active:scale-95 text-left w-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          <div className="absolute top-0 right-0 w-20 h-20 md:w-24 md:h-24 bg-rose-50 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-125 transition-transform duration-500"></div>
          <div className="relative z-10">
            <h3 className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-wider">當日跌幅排行</h3>
            <div className="flex items-baseline mt-1 md:mt-2">
              <p className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight">18 <span className="text-base md:text-xl text-slate-400">張</span></p>
              <div className="ml-2 md:ml-3 flex items-center text-[10px] md:text-sm font-bold text-rose-600 bg-rose-50 px-1.5 md:px-2 py-0.5 rounded border border-rose-100">
                <ArrowDownRight className="h-3 w-3 md:h-4 md:w-4 mr-0.5 stroke-[3]" />
                <span>&gt; 10%</span>
              </div>
            </div>
            <div className="mt-4 flex items-center text-[10px] font-bold text-slate-400 group-hover:text-red-600 transition-colors">
              <span className="bg-slate-100 group-hover:bg-red-50 px-2 py-1 rounded transition-colors">點擊查看詳情 &rarr;</span>
            </div>
          </div>
        </button>

        <button 
          onClick={() => navigate('/market-alerts/rise')}
          className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-xl hover:border-emerald-500 transition-all cursor-pointer active:scale-95 text-left w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          <div className="absolute top-0 right-0 w-20 h-20 md:w-24 md:h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-125 transition-transform duration-500"></div>
          <div className="relative z-10">
            <h3 className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-wider">當日漲幅排行</h3>
            <div className="flex items-baseline mt-1 md:mt-2">
              <p className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight">12 <span className="text-base md:text-xl text-slate-400">張</span></p>
              <div className="ml-2 md:ml-3 flex items-center text-[10px] md:text-sm font-bold text-emerald-600 bg-emerald-50 px-1.5 md:px-2 py-0.5 rounded border border-emerald-100">
                <ArrowUpRight className="h-3 w-3 md:h-4 md:w-4 mr-0.5 stroke-[3]" />
                <span>&gt; 10%</span>
              </div>
            </div>
            <div className="mt-4 flex items-center text-[10px] font-bold text-slate-400 group-hover:text-emerald-600 transition-colors">
              <span className="bg-slate-100 group-hover:bg-emerald-50 px-2 py-1 rounded transition-colors">點擊查看詳情 &rarr;</span>
            </div>
          </div>
        </button>
      </div>

      {/* 主要圖表與列表區域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側：大盤趨勢圖 */}
        <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-base md:text-lg font-bold text-slate-800 mb-4 md:mb-6 flex items-center">
            <span className="w-1.5 h-5 bg-red-500 rounded-full mr-2"></span>
            市場指標走勢 (eBay vs SNKR)
          </h3>
          <div className="h-[250px] md:h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockPriceData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', border: 'none', borderRadius: '0.75rem', color: '#0f172a', fontSize: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 700 }}
                  labelStyle={{ color: '#64748b', marginBottom: '0.25rem', fontWeight: 500 }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '10px', fontWeight: 600 }} />
                <Line type="monotone" dataKey="snkrdunk" name="SNKR" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: '#ef4444' }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="ebay" name="eBay" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 右側：最新交易紀錄 */}
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
          <h3 className="text-base md:text-lg font-bold text-slate-800 mb-4 md:mb-6 flex items-center">
            <span className="w-1.5 h-5 bg-blue-500 rounded-full mr-2"></span>
            最新成交紀錄
          </h3>
          <div className="space-y-2.5 md:space-y-3 flex-1">
            {recentTrades.map((trade) => (
              <div 
                key={trade.id} 
                onClick={() => navigate(`/card/${trade.cardId}`)}
                className="flex items-center justify-between p-2.5 md:p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-red-50 hover:border-red-100 transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <div className="min-w-0 flex-1 mr-2">
                  <p className="font-bold text-slate-800 text-xs md:text-sm truncate">{trade.card}</p>
                  <div className="flex items-center text-[10px] mt-1 space-x-2">
                    <span className={`px-1.5 py-0.5 rounded font-black border ${trade.platform === 'SNKRDUNK' ? "bg-red-100 text-red-600 border-red-200" : "bg-blue-100 text-blue-600 border-blue-200"}`}>{trade.platform}</span>
                    <span className="text-slate-400 font-medium">{trade.time}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black text-slate-800 text-xs md:text-sm">NT$ {trade.price.toLocaleString()}</p>
                  <div className={`flex items-center justify-end text-[10px] font-bold ${trade.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {trade.trend === 'up' ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                    <span>{trade.trend === 'up' ? '漲' : '跌'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2.5 text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-slate-200 hover:border-red-200">
            查看全部紀錄 &rarr;
          </button>
        </div>
      </div>
    </div>
  )
}
