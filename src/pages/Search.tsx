import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Search as SearchIcon, Loader2 } from 'lucide-react'
import axios from 'axios'

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

export default function Search() {
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const searchQuery = queryParams.get('q') || ''

  const [cards, setCards] = useState<PokemonCard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!searchQuery.trim()) return

    const fetchCards = async () => {
      setLoading(true)
      setError('')
      try {
        // Querying Pokemon TCG API
        const response = await axios.get(`https://api.pokemontcg.io/v2/cards`, {
          params: {
            q: `name:"*${searchQuery}*"`,
            pageSize: 24
          }
        })
        setCards(response.data.data)
      } catch (err) {
        setError('無法取得卡牌資料，請稍後再試。')
      } finally {
        setLoading(false)
      }
    }

    fetchCards()
  }, [searchQuery])

  // Helper to get simulated prices (or exact TCGPlayer prices converted to NTD approximately x 32)
  const getPrice = (card: PokemonCard, platform: 'snkr' | 'ebay') => {
    const marketUsd = card.tcgplayer?.prices?.holofoil?.market || 
                      card.tcgplayer?.prices?.normal?.market || 
                      card.tcgplayer?.prices?.reverseHolofoil?.market || 
                      Math.random() * 50 + 5; // fallback random price if no data
                      
    const baseNtd = marketUsd * 32
    // Simulate slight platform differences for UI display
    return platform === 'snkr' ? Math.floor(baseNtd * 1.05) : Math.floor(baseNtd * 0.98)
  }

  if (!searchQuery) {
    return (
      <div className="animate-in fade-in duration-500">
        <h1 className="text-3xl font-black text-slate-800 mb-6 tracking-tight">搜尋卡牌</h1>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-50 via-white to-white pointers-events-none"></div>
          <p className="text-slate-500 text-lg font-bold relative z-10">請在上方導覽列輸入寶可夢名稱進行搜尋（建議輸入英文，例如 Pikachu）。</p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-2 sm:space-y-0">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">
          "{searchQuery}" 的搜尋結果
        </h1>
        <span className="text-slate-500 font-bold bg-white px-3 py-1.5 border border-slate-200 rounded-full text-sm shadow-sm">
          找到 {cards.length} 張卡牌
        </span>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Loader2 className="h-12 w-12 text-red-500 animate-spin mb-4" />
          <p className="text-slate-600 font-bold">正在從卡牌資料庫搜尋中...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 p-6 rounded-2xl border border-rose-200 text-center py-16">
          <p className="text-rose-600 font-bold">{error}</p>
        </div>
      ) : cards.length === 0 ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center py-32 relative overflow-hidden">
          <SearchIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg font-bold relative z-10">找不到與 "{searchQuery}" 相關的卡牌。</p>
          <p className="text-slate-400 mt-2 font-medium">請確認拼字無誤，建議使用英文名稱搜尋（例如 "Charizard"）。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cards.map((card) => {
            const snkrPrice = getPrice(card, 'snkr')
            const ebayPrice = getPrice(card, 'ebay')
            
            return (
              <div key={card.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-red-300 transition-all overflow-hidden flex flex-col group cursor-pointer">
                <div className="bg-slate-50 p-4 flex justify-center items-center relative min-h-[280px] border-b border-slate-100">
                  <img src={card.images.small} alt={card.name} className="h-64 object-contain group-hover:scale-105 transition-transform drop-shadow-md" loading="lazy" />
                  <div className="absolute top-2 right-2 bg-slate-800/80 backdrop-blur text-white text-xs px-2 py-1.5 rounded font-bold">
                    {card.set.name}
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-black text-slate-800 line-clamp-1" title={card.name}>{card.name}</h3>
                  <p className="text-slate-400 text-xs mt-1 mb-4 font-bold tracking-wider">ID: {card.id}</p>
                  
                  <div className="mt-auto space-y-2.5">
                    <div className="flex justify-between items-center px-3 py-2.5 bg-red-50 rounded-xl border border-red-100">
                      <span className="text-xs font-black text-red-600 tracking-wider">SNKRDUNK</span>
                      <span className="font-black text-slate-800">NT$ {snkrPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center px-3 py-2.5 bg-blue-50 rounded-xl border border-blue-100">
                      <span className="text-xs font-black text-blue-600 tracking-wider">eBay</span>
                      <span className="font-black text-slate-800">NT$ {ebayPrice.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <button className="w-full mt-5 py-3 bg-white border-2 border-slate-200 hover:border-red-600 hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold rounded-xl transition-colors">
                    + 加入收藏庫
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
