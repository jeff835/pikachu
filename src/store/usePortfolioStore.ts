import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export interface PokemonCard {
  id: string
  name: string
  images: { small: string, large: string }
  set: string | { name: string }
  region?: 'US' | 'JP' | 'TW'
  tcgplayer?: {
    prices?: {
      holofoil?: { market: number }
      reverseHolofoil?: { market: number }
      normal?: { market: number }
    }
  }
}

export interface PortfolioItem {
  uid: string
  card: PokemonCard
  purchasePriceNtd: number
  addedAt: string
}

interface PortfolioState {
  items: PortfolioItem[]
  isLoading: boolean
  fetchItems: () => Promise<void>
  addItem: (card: PokemonCard, purchasePriceNtd: number) => Promise<void>
  removeItem: (uid: string) => Promise<void>
  updatePrice: (uid: string, newPrice: number) => Promise<void>
  clear: () => void
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  items: [],
  isLoading: false,
  fetchItems: async () => {
    set({ isLoading: true })
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData?.session?.user) {
      set({ items: [], isLoading: false })
      return
    }

    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      set({
        items: data.map(row => ({
          uid: row.id,
          card: row.card_data,
          purchasePriceNtd: row.purchase_price_ntd,
          addedAt: row.created_at
        })),
        isLoading: false
      })
    } else {
      set({ isLoading: false })
    }
  },
  addItem: async (card, purchasePriceNtd) => {
    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData?.session?.user
    if (!user) return

    const { data, error } = await supabase
      .from('portfolios')
      .insert({
        user_id: user.id,
        card_id: card.id,
        card_data: card,
        purchase_price_ntd: purchasePriceNtd
      })
      .select()
      .single()

    if (!error && data) {
      const newItem: PortfolioItem = {
        uid: data.id,
        card: data.card_data,
        purchasePriceNtd: data.purchase_price_ntd,
        addedAt: data.created_at
      }
      set({ items: [newItem, ...get().items] })
    }
  },
  removeItem: async (uid) => {
    const { error } = await supabase.from('portfolios').delete().eq('id', uid)
    if (!error) {
      set({ items: get().items.filter(i => i.uid !== uid) })
    }
  },
  updatePrice: async (uid, newPrice) => {
    const { error } = await supabase.from('portfolios').update({ purchase_price_ntd: newPrice }).eq('id', uid)
    if (!error) {
      set({ items: get().items.map(i => i.uid === uid ? { ...i, purchasePriceNtd: newPrice } : i) })
    }
  },
  clear: () => set({ items: [] })
}))
