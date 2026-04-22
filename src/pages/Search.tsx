import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search as SearchIcon, Loader2, Globe, LayoutGrid } from 'lucide-react'
import axios from 'axios'

import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/useAuthStore'
import { usePortfolioStore } from '../store/usePortfolioStore'
import gradedPrices from '../data/graded-prices.json'
import enrichedMetadata from '../data/enriched-metadata.json'
import { translateCardSearch } from '../services/cardDictionary'

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

type CardVersion = 'US' | 'JP' | 'TW'

export default function Search() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryParams = new URLSearchParams(location.search)
  const searchQuery = queryParams.get('q') || ''

  const [cards, setCards] = useState<PokemonCard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [version, setVersion] = useState<CardVersion>('JP') 
  const [popularCards, setPopularCards] = useState<PokemonCard[]>([])

  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore()
  const { addItem } = usePortfolioStore()

  // 核心查詢邏輯
  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true)
      setError('')
      setCards([])
      try {
        let queryBuilder = supabase.from('cards').select('*')
        
        // 搜尋字串處理
        if (searchQuery.trim()) {
           const translatedQuery = translateCardSearch(searchQuery.trim(), version)
           const sq = `%${translatedQuery}%`
           const rawSq = `%${searchQuery.trim()}%`
           queryBuilder = queryBuilder.or(`name.ilike.${sq},id.ilike.${sq},local_id.ilike.${sq},name.ilike.${rawSq}`)
        } else {
           setLoading(false)
           return
        }

        queryBuilder = queryBuilder.eq('region', version).order('local_id', { ascending: true })
        
        // 限制顯示筆數避免瀏覽器過載
        const { data: dbResults, error: dbError } = await queryBuilder.limit(1000)

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

        // 特殊美版外部抓取
        let remoteResults: PokemonCard[] = []
        if (version === 'US' && searchQuery.trim()) {
          try {
            const apiRes = await axios.get(`https://api.pokemontcg.io/v2/cards`, {
              params: { q: `name:"*${searchQuery.trim()}*"`, pageSize: 20 },
              timeout: 5000
            })
            remoteResults = apiRes.data.data.map((c: any) => ({ ...c, region: 'US' }))
          } catch (e) { console.warn("外部 API 失敗") }
        }

        const merged = [...mappedResults, ...remoteResults]
        const uniqueCards = Array.from(new Map(merged.map(c => [c.id, c])).values())
        setCards(uniqueCards)
      } catch (err) {
        console.error(err)
        setError('無法取得卡牌資料，請稍後再試。')
      } finally {
        setLoading(false)
      }
    }

    if (searchQuery) {
      fetchCards()
    } else {
      setCards([])
      setLoading(false)
    }
  }, [searchQuery, version])

  // 探索頁熱門卡牌 (僅在無搜尋時顯示)
  useEffect(() => {
    if (!searchQuery) {
      const fetchExplore = async () => {
        const { data } = await supabase.from('cards').select('*').limit(30)
        if (data) {
          setPopularCards(data.map(c => ({
             id: c.id, localId: c.local_id, name: c.name, image: c.image_url, region: c.region as any, rarity: c.rarity, set: { id: c.set_id, name: c.set_name }
          })))
        }
      }
      fetchExplore()
    }
  }, [searchQuery])

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

  const quickFilters = ['噴火龍', '皮卡丘', '伊布家族', '神獸精選', '耿鬼', '超夢']
  const handleQuickFilter = (tag: string) => {
     let query = tag
     if (tag === '伊布家族') query = '伊布'
     if (tag === '神獸精選') query = '洛奇亞'
     navigate(`/search?q=${encodeURIComponent(query)}`)
  }

  const renderVersionTabs = () => (
    <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm shrink-0">
      {versionTabs.map(tab => (
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

  const renderCard = (card: PokemonCard) => {
    const marketUsd = getBasePriceUsd(card)
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

    if (marketUsd) {
      let baseNtd = marketUsd * 32
      if (version === 'JP') baseNtd = baseNtd * 1.3
      else if (version === 'TW') baseNtd = baseNtd * 0.75
      if (snkrPriceDisplay === '---') {
        const snkrVal = baseNtd * 4.2
        snkrPriceDisplay = `NT$ ${Math.floor(snkrVal).toLocaleString()}`
      }
      if (ebayPriceDisplay === '---') {
        const ebayVal = baseNtd * 3.8
        ebayPriceDisplay = `NT$ ${Math.floor(ebayVal).toLocaleString()}`
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
                const cost = 0
                const success = await addItem({
                   ...card,
                   images: card.images || { small: card.image || '', large: card.image || '' }
                } as any, cost);
                if (success) {
                  alert(`✅ 成功將 ${card.name} 加入個人收藏庫！`)
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

  return (
    <div className="animate-in fade-in duration-500 pb-20 max-w-[1200px] mx-auto pt-6 px-4">
      {/* 搜尋輔助工具列 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
         <div className="flex flex-wrap items-center gap-2 flex-1">
           <div className="flex items-center gap-2 mr-2 shrink-0 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
             <LayoutGrid className="w-4 h-4 text-blue-500" />
             <span className="text-xs font-black text-blue-700 uppercase tracking-widest text-[10px]">自動修正推薦</span>
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
         {renderVersionTabs()}
      </div>

      <main className="w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Loader2 className="h-10 w-10 text-red-600 animate-spin mb-4" />
            <p className="text-slate-600 font-bold">正在搜尋全庫卡牌...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 p-6 rounded-2xl border border-rose-200 text-center py-16">
            <p className="text-rose-600 font-bold">{error}</p>
          </div>
        ) : (!searchQuery && popularCards.length > 0) ? (
          // 探索模式 (熱門卡牌)
          <>
            <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center">
               ⭐️ 熱門隨機卡牌
            </h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] xl:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4 md:gap-6">
              {popularCards.map(renderCard)}
            </div>
          </>
        ) : (cards.length === 0) ? (
          <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-sm text-center py-24">
            <SearchIcon className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 text-lg font-bold">找不到對應的卡牌資訊。</p>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center">
               搜尋結果：<span className="text-red-600 ml-2">{searchQuery}</span>
               <span className="text-slate-400 text-sm ml-3">({cards.length} 筆)</span>
            </h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] xl:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4 md:gap-6">
              {cards.map(renderCard)}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
