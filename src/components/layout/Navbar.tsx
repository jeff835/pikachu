import { useState } from 'react'
import { Bell, Search as SearchIcon, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
      <div className="flex-1 flex justify-start">
        <form onSubmit={handleSearch} className="relative w-full max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-full leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-200 sm:text-sm transition-all shadow-inner"
            placeholder="輸入中文寶可夢名稱（例如: 皮卡丘、烈空坐）..."
          />
        </form>
      </div>
      <div className="flex items-center space-x-3">
        <button 
          className="p-2 rounded-full text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          onClick={() => alert('通知功能準備中！')}
        >
          <Bell className="h-5 w-5" />
        </button>
        <div className="w-px h-6 bg-slate-200 mx-2"></div>
        <button 
          className="flex items-center space-x-2 text-slate-700 hover:text-red-600 transition-colors"
          onClick={() => alert('用戶設定庫準備中！')}
        >
          <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center border-2 border-slate-200 overflow-hidden hover:border-red-200 transition-colors">
            <User className="h-5 w-5 text-slate-500" />
          </div>
          <span className="font-semibold text-sm hidden sm:block">訓練家</span>
        </button>
      </div>
    </header>
  )
}
