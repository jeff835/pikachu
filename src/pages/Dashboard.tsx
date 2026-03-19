import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react'

const mockPriceData = [
  { date: '1月', ebay: 3800, snkrdunk: 4000 },
  { date: '2月', ebay: 4100, snkrdunk: 4200 },
  { date: '3月', ebay: 3950, snkrdunk: 4150 },
  { date: '4月', ebay: 4300, snkrdunk: 4500 },
  { date: '5月', ebay: 4400, snkrdunk: 4700 },
  { date: '6月', ebay: 4200, snkrdunk: 4500 },
]

const recentTrades = [
  { id: 1, card: '噴火龍 ex (SAR)', price: 4200, platform: 'SNKRDUNK', time: '10 分鐘前', trend: 'up' },
  { id: 2, card: '皮卡丘 VMAX', price: 1800, platform: 'eBay', time: '1 小時前', trend: 'down' },
  { id: 3, card: '夢幻 ex (UR)', price: 2100, platform: 'SNKRDUNK', time: '2 小時前', trend: 'up' },
  { id: 4, card: '烈空坐 VMAX (SA)', price: 8500, platform: 'eBay', time: '4 小時前', trend: 'up' },
]

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">市場總覽</h1>
        <div className="flex items-center space-x-2 text-sm text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          <span className="font-medium">大盤情緒：<strong className="text-emerald-600">看漲</strong></span>
        </div>
      </div>
      
      {/* 頂部數據卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md hover:border-red-200 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10">
            <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider">PTCG 價格指數</h3>
            <div className="flex items-baseline mt-2">
              <p className="text-4xl font-black text-slate-800 tracking-tight">12,450</p>
              <div className="ml-3 flex items-center text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                <ArrowUpRight className="h-4 w-4 mr-0.5 stroke-[3]" />
                <span>+2.4%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md hover:border-red-200 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10">
            <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider">24H 交易量 (SNKRDUNK)</h3>
            <div className="flex items-baseline mt-2">
              <p className="text-4xl font-black text-slate-800 tracking-tight">2.8M</p>
              <div className="ml-3 flex items-center text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                <ArrowUpRight className="h-4 w-4 mr-0.5 stroke-[3]" />
                <span>+12%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md hover:border-red-200 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10">
            <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider">跌幅警告</h3>
            <div className="flex items-baseline mt-2">
              <p className="text-4xl font-black text-slate-800 tracking-tight">18 <span className="text-xl text-slate-400">張</span></p>
              <div className="ml-3 flex items-center text-sm font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                <ArrowDownRight className="h-4 w-4 mr-0.5 stroke-[3]" />
                <span>&gt; 10%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主要圖表與列表區域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側：大盤趨勢圖 */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
            <span className="w-1.5 h-5 bg-red-500 rounded-full mr-2"></span>
            市場指標走勢 (eBay vs SNKR)
          </h3>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockPriceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#64748b', fontWeight: 500 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontWeight: 500 }} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.75rem', color: '#0f172a', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 700 }}
                  labelStyle={{ color: '#64748b', marginBottom: '0.25rem', fontWeight: 500 }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 600 }} />
                <Line type="monotone" dataKey="snkrdunk" name="SNKRDUNK" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2, fill: '#fff' }} />
                <Line type="monotone" dataKey="ebay" name="eBay" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 右側：最新交易紀錄 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
            <span className="w-1.5 h-5 bg-blue-500 rounded-full mr-2"></span>
            最新成交紀錄
          </h3>
          <div className="space-y-3 flex-1">
            {recentTrades.map((trade) => (
              <div key={trade.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-red-50 hover:border-red-100 transition-all hover:-translate-y-0.5 cursor-pointer">
                <div>
                  <p className="font-bold text-slate-800">{trade.card}</p>
                  <div className="flex items-center text-xs mt-1.5 space-x-2">
                    <span className={`px-2 py-0.5 rounded font-bold border ${trade.platform === 'SNKRDUNK' ? "bg-red-100 text-red-700 border-red-200" : "bg-blue-100 text-blue-700 border-blue-200"}`}>{trade.platform}</span>
                    <span className="text-slate-300">&bull;</span>
                    <span className="text-slate-500 font-medium">{trade.time}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-800">NT$ {trade.price.toLocaleString()}</p>
                  {trade.trend === 'up' ? (
                    <div className="flex items-center justify-end text-emerald-600 text-sm mt-0.5 font-bold">
                      <ArrowUpRight className="h-3.5 w-3.5 stroke-[3] mr-0.5" />
                      <span>漲</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end text-rose-600 text-sm mt-0.5 font-bold">
                      <ArrowDownRight className="h-3.5 w-3.5 stroke-[3] mr-0.5" />
                      <span>跌</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-3 text-sm font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-slate-200 hover:border-red-200">
            查看全部紀錄 &rarr;
          </button>
        </div>
      </div>
    </div>
  )
}
