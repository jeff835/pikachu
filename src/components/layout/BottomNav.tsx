import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Search, Briefcase, Layers } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function BottomNav() {
  const location = useLocation()

  const links = [
    { name: '總覽', href: '/', icon: LayoutDashboard },
    { name: '搜尋', href: '/search', icon: Search },
    { name: '圖鑑', href: '/catalog', icon: Layers },
    { name: '收藏', href: '/portfolio', icon: Briefcase },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-2 flex justify-between items-center z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      {links.map((link) => {
        const Icon = link.icon
        const isActive = location.pathname === link.href
        return (
          <Link
            key={link.name}
            to={link.href}
            className={cn(
              "flex flex-col items-center justify-center space-y-1 py-1 px-4 rounded-xl transition-all",
              isActive ? "text-red-600 bg-red-50" : "text-slate-500"
            )}
          >
            <Icon className={cn("h-5 w-5", isActive ? "text-red-600" : "text-slate-400")} />
            <span className="text-[10px] font-bold">{link.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}
