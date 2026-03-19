import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Search as SearchIcon, Loader2, Globe } from 'lucide-react'
import axios from 'axios'
import { getEnglishPokemonName } from '../lib/pokemonMap'
import localCardsData from '../data/cards.json'

interface PokemonCard {
  id: string
  name: string
  images: { small: string, large: string }
  set: { name: string }
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
  const queryParams = new URLSearchParams(location.search)
  const searchQuery = queryParams.get('q') || ''

  const [cards, setCards] = useState<PokemonCard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [version, setVersion] = useState<CardVersion>('US')

  useEffect(() => {
    if (!searchQuery.trim()) return

    const fetchCards = async () => {
      setLoading(true)
      setError('')
      try {
        // 第一軌：從本地 2000+ 張繁中卡牌大補帖中光速搜尋
        const localResults: PokemonCard[] = localCardsData
          .filter(c => c.name.includes(searchQuery.trim()))
          .map(c => c as PokemonCard) // 強制轉換確保格式一致

        // 第二軌：利用字典將中文查詢轉換為英文後，向官方英文 API 進行廣泛查找
        const englishSearchQuery = getEnglishPokemonName(searchQuery.trim())
        let remoteResults: PokemonCard[] = []
        
        try {
          const response = await axios.get(`https://api.pokemontcg.io/v2/cards`, {
            params: {
              q: `name:"*${englishSearchQuery}*"`,
              pageSize: 24
            }
          })
          remoteResults = response.data.data
        } catch (apiErr) {
          console.warn("遠端英文 API 網路連線異常，僅呈現本地結果", apiErr)
        }

        // 完美合併兩方結果：本地繁中版優先展示，並將重複 ID 去除
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

  // 模擬依據卡牌版本的匯率與地區溢價計算
  const getPrice = (card: PokemonCard, platform: 'snkr' | 'ebay', currentVersion: CardVersion) => {
    const marketUsd = card.tcgplayer?.prices?.holofoil?.market || 
                      card.tcgplayer?.prices?.reverseHolofoil?.market || 
                      card.tcgplayer?.prices?.normal?.market || 
                      (Math.random() * 40 + 10);
                      
    let baseNtd = marketUsd * 32
    
    // 不同版本的基底價差模擬
    if (currentVersion === 'JP') {
      baseNtd = baseNtd * 1.3 // 日版通常因為限定卡而在市場上溢價
    } else if (currentVersion === 'TW') {
      baseNtd = baseNtd * 0.75 // 繁體中文版發行量與市場流通原因通常較美日版低
    }

    // 平台偏好差異
    if (platform === 'snkr') {
      // SNKRDUNK 作為日本主要平台，日版卡熱度最高價格最好
      return currentVersion === 'JP' ? Math.floor(baseNtd * 1.1) : Math.floor(baseNtd * 0.95)
    } else {
      // eBay 作為全球平台，美版卡接受度最廣
      return currentVersion === 'US' ? Math.floor(baseNtd * 1.05) : Math.floor(baseNtd * 0.85)
    }
  }

  // 版本切換設定
  const versionTabs = [
    { id: 'US', label: '🇺🇸 美版 (US)' },
    { id: 'JP', label: '🇯🇵 日版 (JP)' },
    { id: 'TW', label: '🇹🇼 繁中版 (TW)' },
  ]

  if (!searchQuery) {
    return (
      <div className="animate-in fade-in duration-500">
        <h1 className="text-3xl font-black text-slate-800 mb-6 tracking-tight">搜尋卡牌</h1>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-50 via-white to-white pointers-events-none"></div>
          <p className="text-slate-500 text-lg font-bold relative z-10">請在上方導覽列輸入中文寶可夢名稱（如 皮卡丘、噴火龍）進行搜尋。</p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            "{searchQuery}" 的搜尋結果
          </h1>
          <p className="text-slate-500 font-medium mt-1">找到 {cards.length} 張相關的卡牌插畫設計</p>
        </div>
        
        {/* 版本切換欄 (Version Switcher) */}
        <div className="flex items-center bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm self-start">
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
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Loader2 className="h-12 w-12 text-red-600 animate-spin mb-4" />
          <p className="text-slate-600 font-bold">正在從卡牌資料庫搜尋中...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 p-6 rounded-2xl border border-rose-200 text-center py-16 shadow-sm">
          <p className="text-rose-600 font-bold">{error}</p>
        </div>
      ) : cards.length === 0 ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center py-32 relative overflow-hidden">
          <SearchIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg font-bold relative z-10">找不到與 "{searchQuery}" 相關的卡牌。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cards.map((card) => {
            const snkrPrice = getPrice(card, 'snkr', version)
            const ebayPrice = getPrice(card, 'ebay', version)
            
            return (
              <div key={card.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-red-300 transition-all overflow-hidden flex flex-col group cursor-pointer">
                <div className="bg-slate-50 p-4 flex justify-center items-center relative min-h-[280px] border-b border-slate-100">
                  <img src={card.images.small} alt={card.name} className="h-64 object-contain group-hover:scale-105 transition-transform drop-shadow-md" loading="lazy" />
                  <div className="absolute top-2 right-2 bg-slate-800/80 backdrop-blur text-white text-xs px-2.5 py-1.5 rounded-lg font-bold flex items-center shadow-sm">
                    <Globe className="w-3.5 h-3.5 mr-1.5" opacity={0.8} />
                    {version}版
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-black text-slate-800 line-clamp-1" title={card.name}>{card.name}</h3>
                  <p className="text-slate-400 text-xs mt-1 mb-4 font-bold tracking-wider">ID: {card.id} &bull; {card.set.name}</p>
                  
                  <div className="mt-auto space-y-2.5">
                    <div className="flex justify-between items-center px-4 py-2.5 bg-red-50 rounded-xl border border-red-100 transition-colors group-hover:bg-red-100/50">
                      <span className="text-xs font-black text-red-600 tracking-wider">SNKRDUNK</span>
                      <span className="font-black text-slate-800">NT$ {snkrPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-2.5 bg-blue-50 rounded-xl border border-blue-100 transition-colors group-hover:bg-blue-100/50">
                      <span className="text-xs font-black text-blue-600 tracking-wider">eBay</span>
                      <span className="font-black text-slate-800">NT$ {ebayPrice.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <button className="w-full mt-5 py-3 bg-white border-2 border-slate-200 hover:border-red-600 hover:bg-red-50 hover:text-red-700 text-slate-700 font-bold rounded-xl transition-colors shadow-sm active:scale-[0.98]">
                    + 加入個人收藏
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
