import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search as SearchIcon, Loader2, Globe, Filter, Layers, ChevronRight, LayoutGrid } from 'lucide-react'
import axios from 'axios'
import { getEnglishPokemonName, getJapanesePokemonName } from '../lib/pokemonMap'
import localCardsData from '../data/cards.json'
import { useAuthStore } from '../store/useAuthStore'
import { usePortfolioStore } from '../store/usePortfolioStore'

interface PokemonCard {
  id: string
  name: string
  images: { small: string, large: string }
  set: { name: string }
  region?: 'US' | 'JP' | 'TW'
  tcgplayer?: {
    prices?: {
      holofoil?: { market: number }
      reverseHolofoil?: { market: number }
      normal?: { market: number }
    }
  }
}

type CardVersion = 'US' | 'JP' | 'TW'

export default function Search() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryParams = new URLSearchParams(location.search)
  const searchQuery = queryParams.get('q') || ''

  const [cards, setCards] = useState<PokemonCard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [version, setVersion] = useState<CardVersion>('US')
  const [popularCards, setPopularCards] = useState<PokemonCard[]>([])
  const [selectedSet, setSelectedSet] = useState<string>('ALL')
  const [showFilters, setShowFilters] = useState(false)

  const { isAuthenticated } = useAuthStore()
  const { addItem } = usePortfolioStore()

  // 取得所有可用的系列 (從 ID 解析)
  const availableSets = Array.from(new Set(localCardsData.map(c => c.id.split('-')[0]))).sort()

  // 抓取遠端與本地搜尋結果
  useEffect(() => {
    if (!searchQuery.trim()) return

    const fetchCards = async () => {
      setLoading(true)
      setError('')
      try {
        const jpSearchQuery = getJapanesePokemonName(searchQuery.trim())
        const localResults: PokemonCard[] = localCardsData
          .filter(c => c.name.includes(searchQuery.trim()) || c.name.includes(jpSearchQuery))
          .map(c => c as PokemonCard)

        const englishSearchQuery = getEnglishPokemonName(searchQuery.trim())
        let remoteResults: PokemonCard[] = []
        
        try {
          const response = await axios.get(`https://api.pokemontcg.io/v2/cards`, {
            params: {
              q: `name:"*${englishSearchQuery}*"`,
              pageSize: 48
            }
          })
          remoteResults = response.data.data.map((c: any) => ({ ...c, region: 'US' }))
        } catch (apiErr) {
          console.warn("遠端英文 API 網路連線異常，僅呈現本地結果", apiErr)
        }

        const merged = [...localResults, ...remoteResults]
        const uniqueCards = Array.from(new Map(merged.map(c => [c.id, c])).values())
        setCards(uniqueCards)
      } catch (err) {
        setError('無法取得卡牌資料，請稍後檢查網路或再試一次。')
      } finally {
        setLoading(false)
      }
    }

    fetchCards()
  }, [searchQuery])

  // 產生探索頁面的隨機熱門卡牌 (包含美國版 API 預載)
  useEffect(() => {
    if (!searchQuery) {
      const fetchUSPopular = async () => {
        try {
          const res = await axios.get(`https://api.pokemontcg.io/v2/cards?q=set.id:base1 OR set.id:swsh1&pageSize=30`)
          const usCards = res.data.data.map((c: any) => ({...c, region: 'US'}))
          
          const famousNames = ['噴火龍', '皮卡丘', '夢幻', '超夢', '伊布', '洛奇亞', '烈空坐', '沙奈朵', '耿鬼']
          const famousNamesJp = famousNames.map(name => getJapanesePokemonName(name))
          
          const curated = localCardsData.filter(c => 
            famousNames.some(name => c.name.includes(name)) ||
            famousNamesJp.some(name => c.name.includes(name))
          )
          
          const allExplore = [...curated, ...usCards]
          setPopularCards(allExplore.sort(() => 0.5 - Math.random()) as PokemonCard[])
        } catch(e) {
          const famousNames = ['噴火龍', '皮卡丘', '夢幻', '超夢', '伊布', '洛奇亞', '烈空坐', '沙奈朵', '耿鬼']
          const famousNamesJp = famousNames.map(name => getJapanesePokemonName(name))
          
          const curated = localCardsData.filter(c => 
            famousNames.some(name => c.name.includes(name)) ||
            famousNamesJp.some(name => c.name.includes(name))
          )
          setPopularCards(curated.sort(() => 0.5 - Math.random()) as PokemonCard[])
        }
      }
      fetchUSPopular()
    }
  }, [searchQuery])

  // 取得真實 TCGPlayer 美金報價
  const getBasePriceUsd = (card: PokemonCard) => {
    return card.tcgplayer?.prices?.holofoil?.market || 
           card.tcgplayer?.prices?.reverseHolofoil?.market || 
           card.tcgplayer?.prices?.normal?.market;
  }

  const versionTabs = [
    { id: 'US', label: '🇺🇸 美版 (US)' },
    { id: 'JP', label: '🇯🇵 日版 (JP)' },
    { id: 'TW', label: '🇹🇼 繁中版 (TW)' },
  ]

  // 快速過濾標籤
  const quickFilters = ['噴火龍', '皮卡丘', '伊布家族', '神獸精選', '耿鬼', '超夢']
  const handleQuickFilter = (tag: string) => {
     let query = tag
     if (tag === '伊布家族') query = '伊布'
     if (tag === '神獸精選') query = '洛奇亞'
     navigate(`/search?q=${encodeURIComponent(query)}`)
  }

  // 渲染單一卡片小工具 (優化版：更精簡且顯示更多資訊)
  const renderCard = (card: PokemonCard) => {
    const marketUsd = getBasePriceUsd(card)
    let snkrPriceDisplay = '---'
    let ebayPriceDisplay = '---'

    if (marketUsd) {
      let baseNtd = marketUsd * 32
      if (version === 'JP') baseNtd = baseNtd * 1.3
      else if (version === 'TW') baseNtd = baseNtd * 0.75

      const snkrVal = version === 'JP' ? baseNtd * 1.1 : baseNtd * 0.95
      snkrPriceDisplay = `¥ ${Math.floor(snkrVal).toLocaleString()}`

      const ebayVal = version === 'US' ? baseNtd * 1.05 : baseNtd * 0.85
      ebayPriceDisplay = `¥ ${Math.floor(ebayVal).toLocaleString()}`
    }

    const setId = card.id.split('-')[0]
    
    return (
      <div 
        key={card.id} 
        onClick={() => navigate(`/card/${card.id}`)}
        className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 hover:border-red-500 transition-all overflow-hidden flex flex-col group cursor-pointer relative"
      >
        {/* 背景裝飾 */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-yellow-500 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="bg-slate-50/50 p-3 md:p-4 flex justify-center items-center relative aspect-[3/4] overflow-hidden">
          <img src={card.images.small} alt={card.name} className="h-full object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-xl" loading="lazy" />
          
          <div className="absolute top-2 left-2 flex flex-col gap-1">
             <span className="bg-white/90 backdrop-blur px-1.5 py-0.5 rounded text-[8px] font-black text-slate-800 shadow-sm border border-slate-100 uppercase tracking-tighter">
                {setId}
             </span>
          </div>
          
          <div className="absolute top-2 right-2 bg-slate-900/90 text-[8px] text-white px-2 py-1 rounded font-black flex items-center shadow-lg transform translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all">
            <Globe className="w-2 h-2 mr-1" />
            {card.region}
          </div>
        </div>

        <div className="p-3 md:p-4 flex-1 flex flex-col bg-white">
          <div className="mb-2">
            <h3 className="text-xs md:text-sm font-black text-slate-800 line-clamp-1 group-hover:text-red-600 transition-colors" title={card.name}>{card.name}</h3>
            <p className="text-[8px] md:text-[10px] text-slate-400 font-bold tracking-widest">{card.id}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-red-50/50 rounded-lg p-1.5 border border-red-50 flex flex-col">
              <span className="text-[7px] font-black text-red-400 uppercase tracking-widest leading-none mb-1">SNKR</span>
              <span className={`text-[10px] md:text-xs font-black text-slate-800`}>
                {snkrPriceDisplay}
              </span>
            </div>
            <div className="bg-blue-50/50 rounded-lg p-1.5 border border-blue-50 flex flex-col">
              <span className="text-[7px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">eBay</span>
              <span className={`text-[10px] md:text-xs font-black text-slate-800`}>
                {ebayPriceDisplay}
              </span>
            </div>
          </div>
          
          <button 
            onClick={(e) => {
               e.stopPropagation();
               if (!isAuthenticated) {
                 alert('提示：請先登入訓練家帳號以解鎖資產庫功能！即將導向登入大廳...')
                 navigate('/login')
                 return;
               }

               let cost = 0
               if (marketUsd) {
                 let baseNtd = marketUsd * 32
                 if (version === 'JP') baseNtd = baseNtd * 1.3
                 else if (version === 'TW') baseNtd = baseNtd * 0.75
                 cost = Math.floor(version === 'JP' ? baseNtd * 1.1 : baseNtd * 0.95)
               }
              
               addItem(card, cost);
               alert(`✅ 成功將 ${card.name} 加入個人收藏庫！`)
            }}
            className="w-full py-1.5 md:py-2 bg-slate-50 hover:bg-red-600 text-slate-600 hover:text-white border border-slate-100 hover:border-red-600 rounded-lg text-[10px] font-bold transition-all active:scale-95 flex items-center justify-center"
          >
            + 加入蒐藏
          </button>
        </div>
      </div>
    )
  }

  // 取得當前真實過濾的顯示卡牌
  const displayCards = cards.filter(c => 
    c.region === version && 
    (selectedSet === 'ALL' || c.id.startsWith(selectedSet + '-'))
  )
  const displayPopular = popularCards.filter(c => 
    c.region === version && 
    (selectedSet === 'ALL' || c.id.startsWith(selectedSet + '-'))
  ).slice(0, 16)

  const renderVersionTabs = () => (
    <div className="flex items-center bg-white p-1 rounded-lg md:rounded-xl border border-slate-200 shadow-sm self-start mb-4 md:mb-0 overflow-x-auto max-w-full no-scrollbar">
      {versionTabs.map((tab) => (
         <button 
           key={tab.id}
           onClick={() => setVersion(tab.id as CardVersion)}
           className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-sm font-bold transition-all whitespace-nowrap ${version === tab.id ? 'bg-red-50 text-red-600 shadow-sm border border-red-200 pointer-events-none' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-transparent'}`}
         >
           {tab.label}
         </button>
      ))}
    </div>
  )

  return (
    <div className="animate-in fade-in duration-500 pb-20 max-w-[1600px] mx-auto">
      {/* 頂部控制與標題區 */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 pt-4 px-2">
        <div className="space-y-1">
           <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
             {searchQuery ? (
               <><span className="text-red-600">"{searchQuery}"</span> 搜尋結果</>
             ) : (
               <>熱門卡牌探索</>
             )}
           </h1>
           <p className="text-slate-500 font-bold text-sm">
             共計 {displayCards.length || displayPopular.length} 筆結果
           </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {renderVersionTabs()}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`md:hidden p-3 rounded-2xl border shadow-sm transition-all ${showFilters ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 快捷篩選區塊 (第一層) */}
      <div className="mb-8 px-2 overflow-x-auto no-scrollbar">
         <div className="flex items-center gap-2 pb-2">
           <div className="flex items-center gap-2 mr-4 shrink-0">
             <LayoutGrid className="w-4 h-4 text-blue-500" />
             <span className="text-xs font-black text-slate-400 uppercase tracking-widest text-[10px]">Quick Filters</span>
           </div>
           {quickFilters.map(tag => (
             <button 
               key={tag}
               onClick={() => handleQuickFilter(tag)}
               className="px-4 py-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-full text-xs font-bold transition-all shadow-sm whitespace-nowrap"
             >
               {tag}
             </button>
           ))}
         </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* 左側過濾欄 (Desktop) / 下拉式過濾 (Mobile) */}
        <aside className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-64 shrink-0 space-y-6`}>
           <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
             <div className="flex items-center justify-between mb-5">
               <h3 className="text-sm font-black text-slate-800 flex items-center tracking-wider">
                 <Layers className="w-4 h-4 mr-2 text-red-500" />
                 擴充包系列 (Expansion)
               </h3>
               {selectedSet !== 'ALL' && (
                 <button onClick={() => setSelectedSet('ALL')} className="text-[10px] font-bold text-red-500 hover:underline">清除</button>
               )}
             </div>
             
             <div className="space-y-1.5 max-h-[400px] overflow-y-auto no-scrollbar pr-1">
               <button 
                 onClick={() => setSelectedSet('ALL')}
                 className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between group ${selectedSet === 'ALL' ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
               >
                 全部系列 (ALL)
                 <ChevronRight className={`w-3 h-3 group-hover:translate-x-0.5 transition-transform ${selectedSet === 'ALL' ? 'opacity-100' : 'opacity-0'}`} />
               </button>
               {availableSets.map(set => (
                 <button 
                   key={set}
                   onClick={() => setSelectedSet(set)}
                   className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between group ${selectedSet === set ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                 >
                   {set} 系列
                   <ChevronRight className={`w-3 h-3 group-hover:translate-x-0.5 transition-transform ${selectedSet === set ? 'opacity-100' : 'opacity-0'}`} />
                 </button>
               ))}
             </div>
           </div>

        </aside>

        {/* 右側內容區 */}
        <main className="flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <Loader2 className="h-10 w-10 text-red-600 animate-spin mb-4" />
              <p className="text-slate-600 font-bold">正在從各地區數據庫載入卡牌...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-50 p-6 rounded-2xl border border-rose-200 text-center py-16">
              <p className="text-rose-600 font-bold">{error}</p>
            </div>
          ) : (displayCards.length || (!searchQuery && displayPopular.length)) === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-sm text-center py-24">
              <SearchIcon className="h-12 w-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 text-lg font-bold">找不到符合條件的卡牌。</p>
              <p className="text-slate-400 mt-2 text-sm">請嘗試修改過濾條件或清除搜尋關鍵字。</p>
              <button 
                onClick={() => {
                   setSelectedSet('ALL')
                   navigate('/search')
                }}
                className="mt-6 px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
                >
                清除所有過濾
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {searchQuery ? displayCards.map(renderCard) : displayPopular.map(renderCard)}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
