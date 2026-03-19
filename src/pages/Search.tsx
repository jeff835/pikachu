import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search as SearchIcon, Loader2, Globe, Sparkles } from 'lucide-react'
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

  const { isAuthenticated } = useAuthStore()
  const { addItem } = usePortfolioStore()

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

  // 快速過濾標籤 (類似卡拍拍介面)
  const quickFilters = ['噴火龍', '皮卡丘', '伊布家族', '神獸精選', '耿鬼', '超夢']
  const handleQuickFilter = (tag: string) => {
     let query = tag
     if (tag === '伊布家族') query = '伊布'
     if (tag === '神獸精選') query = '洛奇亞'
     navigate(`/search?q=${encodeURIComponent(query)}`)
  }

  // 渲染單一卡片小工具
  const renderCard = (card: PokemonCard) => {
    const marketUsd = getBasePriceUsd(card)
    let snkrPriceDisplay = '無歷史價格'
    let ebayPriceDisplay = '無歷史價格'

    // 若有真實的美金報價，則進行台幣換算與溢價估計
    if (marketUsd) {
      let baseNtd = marketUsd * 32 // 暫時以固定匯率 32 換算為台幣
      
      if (version === 'JP') baseNtd = baseNtd * 1.3
      else if (version === 'TW') baseNtd = baseNtd * 0.75

      const snkrVal = version === 'JP' ? baseNtd * 1.1 : baseNtd * 0.95
      snkrPriceDisplay = `NT$ ${Math.floor(snkrVal).toLocaleString()}`

      const ebayVal = version === 'US' ? baseNtd * 1.05 : baseNtd * 0.85
      ebayPriceDisplay = `NT$ ${Math.floor(ebayVal).toLocaleString()}`
    }
    
    return (
      <div key={card.id} className="bg-white rounded-xl md:rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-red-300 transition-all overflow-hidden flex flex-col group cursor-pointer">
        <div className="bg-slate-50 p-3 md:p-4 flex justify-center items-center relative min-h-[160px] md:min-h-[280px] border-b border-slate-100">
          <img src={card.images.small} alt={card.name} className="h-32 md:h-64 object-contain group-hover:scale-105 transition-transform drop-shadow-md" loading="lazy" />
          <div className="absolute top-1 right-1 md:top-2 md:right-2 bg-slate-800/80 backdrop-blur text-white text-[8px] md:text-xs px-1.5 md:px-2.5 py-0.5 md:py-1.5 rounded md:rounded-lg font-bold flex items-center shadow-sm">
            <Globe className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 mr-1 md:mr-1.5" opacity={0.8} />
            {card.region}版
          </div>
        </div>
        <div className="p-3 md:p-5 flex-1 flex flex-col">
          <h3 className="text-sm md:text-lg font-black text-slate-800 line-clamp-1" title={card.name}>{card.name}</h3>
          <p className="text-slate-400 text-[10px] mt-0.5 md:mt-1 mb-2 md:mb-4 font-bold tracking-wider truncate">ID: {card.id}</p>
          
          <div className="mt-auto space-y-1.5 md:space-y-2.5">
            <div className="flex justify-between items-center px-2 md:px-4 py-1.5 md:py-2.5 bg-red-50 rounded-lg md:rounded-xl border border-red-100">
              <span className="text-[8px] md:text-xs font-black text-red-600 tracking-wider">SNKR</span>
              <span className={`font-black text-[10px] md:text-base ${snkrPriceDisplay === '無歷史價格' ? 'text-slate-400 text-[8px]' : 'text-slate-800'}`}>
                {snkrPriceDisplay.replace('NT$ ', '¥')}
              </span>
            </div>
            <div className="flex justify-between items-center px-2 md:px-4 py-1.5 md:py-2.5 bg-blue-50 rounded-lg md:rounded-xl border border-blue-100">
              <span className="text-[8px] md:text-xs font-black text-blue-600 tracking-wider">eBay</span>
              <span className={`font-black text-[10px] md:text-base ${ebayPriceDisplay === '無歷史價格' ? 'text-slate-400 text-[8px]' : 'text-slate-800'}`}>
                {ebayPriceDisplay.replace('NT$ ', '¥')}
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
            className="w-full mt-3 md:mt-5 py-2 md:py-3 bg-white border-2 border-slate-200 hover:border-red-600 hover:bg-red-50 hover:text-red-700 text-slate-700 font-bold rounded-lg md:rounded-xl text-[10px] md:text-sm transition-all shadow-sm active:scale-[0.98]"
          >
            + 加入收藏
          </button>
        </div>
      </div>
    )
  }

  // 取得當前真實過濾的顯示卡牌
  const displayCards = cards.filter(c => c.region === version)
  const displayPopular = popularCards.filter(c => c.region === version).slice(0, 16)

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

  if (!searchQuery) {
    return (
      <div className="animate-in fade-in duration-500 pb-10">
        <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-4 md:mb-6 tracking-tight flex items-center">
          <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-yellow-500 mr-2" />
          探索卡牌庫
        </h1>
        
        {/* 快速瀏覽快篩區 (卡拍拍風格) */}
        <div className="flex flex-wrap gap-2 mb-6 md:mb-8">
           {quickFilters.map(tag => (
             <button 
               key={tag}
               onClick={() => handleQuickFilter(tag)}
               className="px-4 md:px-5 py-1.5 md:py-2 bg-white border border-slate-200 hover:border-red-400 hover:bg-red-50 hover:text-red-700 text-slate-600 rounded-full font-bold text-[10px] md:text-sm transition-all shadow-sm"
             >
               {tag}
             </button>
           ))}
        </div>

        {/* 版本切換區 */}
        <div className="mb-4 md:mb-6">
          {renderVersionTabs()}
        </div>

        <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center mb-4 md:mb-6">
           <span className="w-1.5 h-6 bg-red-500 rounded-full mr-2"></span>
           精選熱門卡片 ({version}版)
        </h2>

        {/* 隨機展示本地圖鑑 */}
        {displayPopular.length === 0 ? (
          <div className="bg-slate-50 p-6 flex flex-col items-center justify-center rounded-2xl border border-slate-200 border-dashed text-slate-500 py-20 text-center">
            <Globe className="w-8 h-8 mb-3 opacity-50" />
            <p className="font-bold text-sm md:text-base">目前區域尚未加載此語言版本的熱門推薦卡片</p>
            <p className="text-xs md:text-sm mt-1">請嘗試直接在上方搜尋特定的卡片名稱</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
             {displayPopular.map(renderCard)}
          </div>
        )}
      </div>
    )
  }

  // 以下為原本完整的搜尋結果渲染邏輯
  return (
    <div className="animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-start lg:items-center justify-between mb-6 md:mb-8 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
            "{searchQuery}"
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-xs md:text-base">找到 {displayCards.length} 張 {version} 版本的卡牌系列</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {renderVersionTabs()}
          
          <button 
            onClick={() => {
              setVersion('US') // reset default
              navigate('/search')
            }}
            className="px-3 md:px-4 py-1.5 md:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-red-600 rounded-lg md:rounded-xl text-[10px] md:text-sm font-bold transition-all shadow-sm whitespace-nowrap"
          >
             清除篩選 ✕
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 md:py-32 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Loader2 className="h-10 w-10 md:h-12 md:w-12 text-red-600 animate-spin mb-4" />
          <p className="text-slate-600 font-bold text-sm md:text-base">正在全力搜尋資料庫中...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 p-6 rounded-2xl border border-rose-200 text-center py-16 shadow-sm">
          <p className="text-rose-600 font-bold">{error}</p>
        </div>
      ) : displayCards.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-sm text-center py-20 md:py-32 relative overflow-hidden">
          <SearchIcon className="h-10 w-10 md:h-12 md:w-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 text-sm md:text-lg font-bold relative z-10">找不到與 "{searchQuery}" 相關的 {version} 版本卡牌。</p>
          <p className="text-slate-400 mt-2 text-xs md:text-sm">您可以嘗試切換至其他區域版本或檢查名稱正確性。</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
          {displayCards.map(renderCard)}
        </div>
      )}
    </div>
  )
}
