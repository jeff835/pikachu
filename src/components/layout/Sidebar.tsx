import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Search, Briefcase } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function Sidebar() {
  const location = useLocation()

  const links = [
    { name: '市場總覽', href: '/', icon: LayoutDashboard },
    { name: '搜尋卡牌', href: '/search', icon: Search },
    { name: '個人收藏庫', href: '/portfolio', icon: Briefcase },
  ]

  return (
    <aside className="hidden md:flex w-64 bg-red-600 border-r border-red-700 shadow-xl flex-col shrink-0 transition-all z-20">
      <Link 
        to="/" 
        className="h-16 flex items-center justify-center px-6 border-b border-red-500/50 bg-red-700/30 hover:bg-red-700/50 transition-colors relative z-30"
      >
        <div className="h-8 w-8 rounded-full bg-white border-4 border-slate-900 flex items-center justify-center relative overflow-hidden mr-3 shadow-md">
           <div className="absolute top-0 left-0 w-full h-1/2 bg-red-600 border-b-2 border-slate-900"></div>
           <div className="absolute z-10 w-3 h-3 bg-white border-2 border-slate-900 rounded-full"></div>
        </div>
        <span className="text-xl font-black text-white tracking-widest drop-shadow-sm">PokePrice</span>
      </Link>
      <nav className="flex-1 px-4 py-8 space-y-3">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = location.pathname === link.href
          return (
            <Link
              key={link.name}
              to={link.href}
              className={cn(
                "flex items-center px-4 py-3 rounded-xl transition-all font-semibold shadow-sm",
                isActive 
                  ? "bg-white text-red-600 shadow-md scale-105" 
                  : "text-red-100 hover:bg-red-500 hover:text-white"
              )}
            >
              <Icon className={cn("h-5 w-5 mr-3", isActive ? "text-red-600" : "text-red-200")} />
              <span>{link.name}</span>
            </Link>
          )
        })}
      </nav>
      <div className="p-4 text-center text-red-200/60 text-xs font-medium">
        v1.0.0
      </div>
    </aside>
  )
}
