import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search as SearchIcon, Loader2, Globe, Sparkles } from 'lucide-react'
import axios from 'axios'
import { getEnglishPokemonName, getJapanesePokemonName } from '../lib/pokemonMap'
import localCardsData from '../data/cards.json'

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
      <div key={card.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-red-300 transition-all overflow-hidden flex flex-col group cursor-pointer">
        <div className="bg-slate-50 p-4 flex justify-center items-center relative min-h-[280px] border-b border-slate-100">
          <img src={card.images.small} alt={card.name} className="h-64 object-contain group-hover:scale-105 transition-transform drop-shadow-md" loading="lazy" />
          <div className="absolute top-2 right-2 bg-slate-800/80 backdrop-blur text-white text-xs px-2.5 py-1.5 rounded-lg font-bold flex items-center shadow-sm">
            <Globe className="w-3.5 h-3.5 mr-1.5" opacity={0.8} />
            {card.region}版原卡
          </div>
        </div>
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="text-lg font-black text-slate-800 line-clamp-1" title={card.name}>{card.name}</h3>
          <p className="text-slate-400 text-xs mt-1 mb-4 font-bold tracking-wider">ID: {card.id} &bull; {card.set.name}</p>
          
          <div className="mt-auto space-y-2.5">
            <div className="flex justify-between items-center px-4 py-2.5 bg-red-50 rounded-xl border border-red-100 transition-colors group-hover:bg-red-100/50">
              <span className="text-xs font-black text-red-600 tracking-wider">SNKRDUNK</span>
              <span className={`font-black ${snkrPriceDisplay === '無歷史價格' ? 'text-slate-400 text-xs' : 'text-slate-800'}`}>{snkrPriceDisplay}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-2.5 bg-blue-50 rounded-xl border border-blue-100 transition-colors group-hover:bg-blue-100/50">
              <span className="text-xs font-black text-blue-600 tracking-wider">eBay</span>
              <span className={`font-black ${ebayPriceDisplay === '無歷史價格' ? 'text-slate-400 text-xs' : 'text-slate-800'}`}>{ebayPriceDisplay}</span>
            </div>
          </div>
          
          <button className="w-full mt-5 py-3 bg-white border-2 border-slate-200 hover:border-red-600 hover:bg-red-50 hover:text-red-700 text-slate-700 font-bold rounded-xl transition-colors shadow-sm active:scale-[0.98]">
            + 加入個人收藏
          </button>
        </div>
      </div>
    )
  }

  // 取得當前真實過濾的顯示卡牌
  const displayCards = cards.filter(c => c.region === version)
  const displayPopular = popularCards.filter(c => c.region === version).slice(0, 16)

  const renderVersionTabs = () => (
    <div className="flex items-center bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm self-start mb-6 md:mb-0">
      {versionTabs.map((tab) => (
         <button 
           key={tab.id}
           onClick={() => setVersion(tab.id as CardVersion)}
           className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${version === tab.id ? 'bg-red-50 text-red-600 shadow-sm border border-red-200 pointer-events-none' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-transparent'}`}
         >
           {tab.label}
         </button>
      ))}
    </div>
  )

  if (!searchQuery) {
    return (
      <div className="animate-in fade-in duration-500">
        <h1 className="text-3xl font-black text-slate-800 mb-6 tracking-tight flex items-center">
          <Sparkles className="w-8 h-8 text-yellow-500 mr-2" />
          探索卡牌庫
        </h1>
        
        {/* 快速瀏覽快篩區 (卡拍拍風格) */}
        <div className="flex flex-wrap gap-2 mb-8">
           {quickFilters.map(tag => (
             <button 
               key={tag}
               onClick={() => handleQuickFilter(tag)}
               className="px-5 py-2 bg-white border border-slate-200 hover:border-red-400 hover:bg-red-50 hover:text-red-700 text-slate-600 rounded-full font-bold text-sm transition-all shadow-sm"
             >
               {tag}
             </button>
           ))}
        </div>

        {/* 版本切換區 */}
        {renderVersionTabs()}

        <h2 className="text-xl font-bold text-slate-800 flex items-center mb-6 mt-6">
           <span className="w-1.5 h-6 bg-red-500 rounded-full mr-2"></span>
           精選熱門卡片目錄 ({version}版)
        </h2>

        {/* 隨機展示本地圖鑑 */}
        {displayPopular.length === 0 ? (
          <div className="bg-slate-50 p-6 flex flex-col items-center justify-center rounded-2xl border border-slate-200 border-dashed text-slate-500 py-20">
            <Globe className="w-8 h-8 mb-3 opacity-50" />
            <p className="font-bold">目前區域尚未加載此語言版本的熱門推薦卡片</p>
            <p className="text-sm mt-1">請嘗試直接在上方搜尋特定的卡片名稱</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
             {displayPopular.map(renderCard)}
          </div>
        )}
      </div>
    )
  }

  // 以下為原本完整的搜尋結果渲染邏輯
  return (
    <div className="animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-start lg:items-center justify-between mb-8 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            "{searchQuery}" 的搜尋結果
          </h1>
          <p className="text-slate-500 font-medium mt-1">找到 {displayCards.length} 張 {version} 版本的卡牌插畫設計</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {renderVersionTabs()}
          
          <button 
            onClick={() => {
              setVersion('US') // reset default
              navigate('/search')
            }}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-red-600 rounded-xl text-sm font-bold transition-all shadow-sm whitespace-nowrap mb-6 md:mb-0"
          >
             清除篩選 ✕
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Loader2 className="h-12 w-12 text-red-600 animate-spin mb-4" />
          <p className="text-slate-600 font-bold">正在從卡牌資料庫雙軌搜尋中...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 p-6 rounded-2xl border border-rose-200 text-center py-16 shadow-sm">
          <p className="text-rose-600 font-bold">{error}</p>
        </div>
      ) : displayCards.length === 0 ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center py-32 relative overflow-hidden">
          <SearchIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg font-bold relative z-10">找不到與 "{searchQuery}" 相關的 {version} 版本卡牌。</p>
          <p className="text-slate-400 mt-2 text-sm">您可以嘗試切換至其他語言版本 (例如日版、繁中版) 來獲得更多結果。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayCards.map(renderCard)}
        </div>
      )}
    </div>
  )
}
