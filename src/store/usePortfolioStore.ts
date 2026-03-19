import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PokemonCard {
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
    }),
    {
      name: 'pikachu-portfolio-storage',
    }
  )
)
