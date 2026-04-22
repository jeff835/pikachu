import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search as SearchIcon, Loader2, Globe, Layers, ChevronRight, ArrowLeft } from 'lucide-react'

import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/useAuthStore'
import { usePortfolioStore } from '../store/usePortfolioStore'
import gradedPrices from '../data/graded-prices.json'
import enrichedMetadata from '../data/enriched-metadata.json'
import catalogStructure from '../data/catalog-structure.json'
import { translateSeriesName } from '../services/cardDictionary'

interface PokemonCard {
  id: string
  localId?: string
  name: string
  images?: { small: string, large: string }
  image?: string 
  set: string | { name: string; id?: string }
  region?: 'US' | 'JP' | 'TW'
  rarity?: string
  tcgplayer?: {
    prices?: { holofoil?: { market: number }; reverseHolofoil?: { market: number }; normal?: { market: number } }
  }
}

interface CatalogSeries {
  id: string
  name: string
  sets: { id: string, name: string, logo: string }[]
}

export default function Catalog() {
  const navigate = useNavigate()

  const [cards, setCards] = useState<PokemonCard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 目錄狀態
  const [selectedSeries, setSelectedSeries] = useState<string>('sv')
  const [selectedSet, setSelectedSet] = useState<{ id: string, name: string } | null>(null)

  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore()
  const { addItem } = usePortfolioStore()

  // 將 catalogStructure 轉換為方便渲染的陣列
  const seriesList: CatalogSeries[] = Object.entries(catalogStructure).map(([id, data]) => ({
    id,
    name: translateSeriesName(id) || data.name,
    sets: data.sets
  })).sort((a, b) => b.id.localeCompare(a.id))

  // 核心查詢邏輯
  useEffect(() => {
    const fetchCards = async () => {
      if (!selectedSet) {
        setCards([])
        return
      }

      setLoading(true)
      setError('')
      try {
        const { data: dbResults, error: dbError } = await supabase
           .from('cards')
           .select('*')
           .eq('set_id', selectedSet.id)
           .order('local_id', { ascending: true })
           .limit(1000)

        if (dbError) throw dbError

        const mappedResults: PokemonCard[] = (dbResults || []).map(c => ({
           id: c.id,
           localId: c.local_id,
           name: c.name,
           image: c.image_url,
           region: c.region as any,
           rarity: c.rarity,
           set: { id: c.set_id, name: c.set_name }
        }))

        setCards(mappedResults)
      } catch (err) {
        console.error(err)
        setError('無法取得卡牌資料，請稍後再試。')
      } finally {
        setLoading(false)
      }
    }

    fetchCards()
  }, [selectedSet])

  const renderCard = (card: PokemonCard) => {
    let snkrPriceDisplay = '---'
    let ebayPriceDisplay = '---'

    const enriched = (enrichedMetadata as any)[card.id]
    const hotGraded = (gradedPrices as any)[card.id]
    const finalMetadata = enriched || hotGraded
    const realImageUrl = finalMetadata?.ebayImageUrl || finalMetadata?.snkrImageUrl

    if (finalMetadata) {
      if (finalMetadata.snkrPrice || finalMetadata.snkr) {
        snkrPriceDisplay = `NT$ ${Math.floor(finalMetadata.snkrPrice || finalMetadata.snkr).toLocaleString()}`
      }
      if (finalMetadata.ebayPrice || finalMetadata.ebay) {
        ebayPriceDisplay = `NT$ ${Math.floor(finalMetadata.ebayPrice || finalMetadata.ebay).toLocaleString()}`
      }
    }

    const cardImage = card.image || '';
    const setId = typeof card.set === 'string' ? card.set : card.set?.id || card.id.split('-')[0];
    
    return (
      <div 
        key={card.id} 
        onClick={() => navigate(`/card/${card.id}`)}
        className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 hover:border-red-500 transition-all overflow-hidden flex flex-col group cursor-pointer relative"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-yellow-500 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="bg-slate-50/50 p-3 md:p-4 flex justify-center items-center relative aspect-[3/4] overflow-hidden">
          <img 
            src={realImageUrl || cardImage} 
            alt={card.name} 
            className={`h-full object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-xl ${realImageUrl ? 'border-2 border-slate-200 rounded' : ''}`} 
            loading="lazy" 
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.src.includes('tcg-card-back')) {
                target.src = 'https://tcg.pokemon.com/assets/img/global/tcg-card-back-2x.jpg';
              }
            }}
          />
          <div className="absolute top-2 left-2 flex flex-col gap-1">
             <span className="bg-white/90 backdrop-blur px-1.5 py-0.5 rounded text-[8px] font-black text-slate-800 shadow-sm border border-slate-100 uppercase tracking-tighter">
                {setId}
             </span>
          </div>
          <div className="absolute top-2 right-2 bg-slate-900/90 text-[8px] text-white px-2 py-1 rounded font-black flex items-center shadow-lg transform translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all">
            <Globe className="w-2 h-2 mr-1" />
            {card.region || 'JP'}
          </div>
        </div>

        <div className="p-3 md:p-4 flex-1 flex flex-col bg-white">
          <div className="mb-2">
            <h3 className="text-xs md:text-sm font-black text-slate-800 line-clamp-1 group-hover:text-red-600 transition-colors" title={card.name}>{card.name}</h3>
            <p className="text-[8px] md:text-[10px] text-slate-400 font-bold tracking-widest">{card.id}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-red-50/50 rounded-lg p-1.5 border border-red-50 flex flex-col">
              <span className="text-[7px] font-black text-red-400 uppercase tracking-widest leading-none mb-1">SNKR PSA 10</span>
              <span className={`text-[10px] md:text-xs font-black text-slate-800`}>{snkrPriceDisplay}</span>
            </div>
            <div className="bg-blue-50/50 rounded-lg p-1.5 border border-blue-50 flex flex-col">
              <span className="text-[7px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">eBay PSA 10</span>
              <span className={`text-[10px] md:text-xs font-black text-slate-800`}>{ebayPriceDisplay}</span>
            </div>
          </div>
          <button 
            onClick={async (e) => {
                e.stopPropagation();
                if (!isAuthenticated) {
                  if (isAuthLoading) return;
                  alert('提示：請先登入訓練家帳號以解鎖資產庫功能！即將導向登入大廳...')
                  navigate('/login')
                  return;
                }
                const success = await addItem({
                   ...card,
                   images: card.images || { small: card.image || '', large: card.image || '' }
                } as any, 0);
                if (success) {
                  alert(`✅ 成功加入！`)
                }
            }}
            className="w-full py-1.5 md:py-2 bg-slate-50 hover:bg-red-600 text-slate-600 hover:text-white border border-slate-100 hover:border-red-600 rounded-lg text-[10px] font-bold transition-all active:scale-95 flex items-center justify-center font-black"
          >
            + 加入蒐藏
          </button>
        </div>
      </div>
    )
  }

  const activeSeries = seriesList.find(s => s.id === selectedSeries)

  return (
    <div className="animate-in fade-in duration-500 pb-20 max-w-[1600px] mx-auto">
      <div className="mb-0 pt-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6 pb-6 mt-4">
          <div className="space-y-1 shrink-0">
            <h1 className="text-lg md:text-xl font-bold text-slate-800 flex flex-wrap items-center gap-x-1.5 md:gap-x-2">
              {selectedSet ? (
                <>
                  <span className="text-slate-400 font-medium whitespace-nowrap">擴充包卡表:</span>
                  <span className="text-red-600 font-black tracking-tight max-w-[200px] sm:max-w-xs md:max-w-sm truncate">
                    {selectedSet.name}
                  </span>
                  <span className="text-slate-400 font-bold text-xs md:text-sm whitespace-nowrap">({cards.length} 筆)</span>
                </>
              ) : (
                <><Layers className="w-5 h-5 text-red-500" /> <span className="whitespace-nowrap">圖鑑目錄大廳</span></>
              )}
            </h1>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        
        {/* 左側卡本世代（Series）選擇 */}
        <aside className="w-full md:w-56 shrink-0 space-y-4">
           <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
             <h3 className="text-sm font-black text-slate-800 flex items-center tracking-wider mb-4">
               <Layers className="w-4 h-4 mr-2 text-red-500" />
               世代目錄 (Series)
             </h3>
             <div className="space-y-1.5 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
               {seriesList.map((serie) => (
                 <button 
                   key={serie.id}
                   onClick={() => {
                     setSelectedSeries(serie.id)
                     setSelectedSet(null) // 切換世代時清空選定的擴充包
                   }}
                   className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${selectedSeries === serie.id ? 'bg-red-50 text-red-600 border-red-100 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 border-transparent'}`}
                 >
                   <span className="truncate pr-2">{serie.name}</span>
                   <ChevronRight className={`w-3 h-3 group-hover:translate-x-0.5 transition-transform shrink-0 ${selectedSeries === serie.id ? 'opacity-100 text-red-500' : 'opacity-0'}`} />
                 </button>
               ))}
             </div>
           </div>
        </aside>

        {/* 右側主內容區 */}
        <main className="flex-1 min-w-0">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <Loader2 className="h-10 w-10 text-red-600 animate-spin mb-4" />
              <p className="text-slate-600 font-bold">正在讀取擴充包卡牌庫...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-50 p-6 rounded-2xl border border-rose-200 text-center py-16">
              <p className="text-rose-600 font-bold">{error}</p>
            </div>
          ) : (
            <>
               {/* 還沒選定特定擴充包時：顯示擴充包矩陣 */}
               {!selectedSet && activeSeries && (
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center">
                      {activeSeries.name} <span className="text-sm font-medium text-slate-400 ml-2">({activeSeries.sets.length} 個擴充包)</span>
                    </h2>
                    {activeSeries.sets.length === 0 ? (
                       <p className="text-slate-400 py-10 text-center font-bold">這個世代目前沒有資料</p>
                    ) : (
                       <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                         {activeSeries.sets.map(s => (
                           <button 
                             key={s.id}
                             onClick={() => setSelectedSet({ id: s.id, name: s.name })}
                             className="text-left bg-slate-50 hover:bg-red-50 p-3 rounded-xl border border-slate-100 hover:border-red-200 transition-all flex flex-col group relative overflow-hidden"
                           >
                             <div className="absolute top-0 right-0 w-8 h-8 md:w-12 md:h-12 bg-white/40 -mr-2 -mt-2 rounded-full group-hover:scale-150 transition-transform blur-md"></div>
                             <span className="text-[10px] md:text-xs font-black text-slate-400 mb-1 group-hover:text-red-400 transition-colors uppercase">{s.id}</span>
                             <span className="text-xs md:text-sm font-bold text-slate-700 leading-snug line-clamp-2" title={s.name}>{s.name}</span>
                           </button>
                         ))}
                       </div>
                    )}
                 </div>
               )}

               {/* 目錄已經選定卡牌時：列出卡牌 */}
               {selectedSet && (
                 <>
                   <div className="mb-6">
                     <button 
                       onClick={() => setSelectedSet(null)}
                       className="flex items-center text-sm font-bold text-slate-500 hover:text-red-600 transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 hover:border-red-200"
                     >
                       <ArrowLeft className="w-4 h-4 mr-2" />
                       返回 {activeSeries?.name} 擴充包列表
                     </button>
                   </div>
                   
                   {cards.length === 0 ? (
                      <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-sm text-center py-24">
                        <SearchIcon className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-500 text-lg font-bold">這個擴充包目前無卡牌紀錄。</p>
                      </div>
                   ) : (
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] xl:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 md:gap-5">
                        {cards.map(renderCard)}
                      </div>
                   )}
                 </>
               )}
            </>
          )}

        </main>
      </div>
    </div>
  )
}
