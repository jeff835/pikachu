import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  addItem: (card: PokemonCard, purchasePriceNtd: number) => void
  removeItem: (uid: string) => void
  updatePrice: (uid: string, newPrice: number) => void
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (card, purchasePriceNtd) => set((state) => ({ 
        items: [...state.items, { uid: Date.now().toString() + Math.random().toString(), card, purchasePriceNtd, addedAt: new Date().toISOString() }] 
      })),
      removeItem: (uid) => set((state) => ({ 
        items: state.items.filter(item => item.uid !== uid) 
      })),
      updatePrice: (uid, newPrice) => set((state) => ({
        items: state.items.map(item => item.uid === uid ? { ...item, purchasePriceNtd: newPrice } : item)
      })),
    }),
    {
      name: 'pikachu-portfolio-storage',
    }
  )
)
