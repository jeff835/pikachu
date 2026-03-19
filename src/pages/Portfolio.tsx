import { Briefcase } from 'lucide-react'

export default function Portfolio() {
  const handleAddCard = () => {
    alert('「新增卡牌」功能正在開發中！後續我們將加入搜尋並新增至收藏庫的功能。')
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">個人收藏庫</h1>
        <button 
          onClick={handleAddCard}
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-transform hover:scale-105 shadow-md shadow-red-600/20 active:scale-95 flex items-center"
        >
          <span className="mr-1 text-lg leading-none">+</span> 新增收藏
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-1 flex flex-col justify-center relative overflow-hidden">
           <div className="absolute -right-4 -bottom-4 opacity-[0.03]">
             <Briefcase className="w-32 h-32" />
           </div>
           <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider relative z-10">總資產價值</h3>
           <p className="text-4xl font-black text-slate-800 mt-2 relative z-10">NT$ 0</p>
           <p className="text-slate-400 mt-2 text-sm font-medium relative z-10">無歷史變動資料</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-3 min-h-[160px] flex items-center justify-center">
            <p className="text-slate-400 font-medium border-2 border-dashed border-slate-200 p-8 rounded-xl w-full text-center">資產走勢圖預留區</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm text-center py-24 flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
          <Briefcase className="h-8 w-8 text-slate-400" />
        </div>
        <p className="text-slate-800 text-xl font-bold">目前無任何收藏</p>
        <p className="text-slate-500 text-sm mt-2 max-w-sm">搜尋心儀的卡牌並點擊「加入收藏」，即可在此追蹤您的資產價值變化趨勢。</p>
        <button 
          onClick={handleAddCard}
          className="mt-6 font-bold text-red-600 hover:text-red-700 transition-colors"
        >
          立即探索卡牌市場 &rarr;
        </button>
      </div>
    </div>
  )
}
