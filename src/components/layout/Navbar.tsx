import { useState, useEffect } from 'react'
import { Search as SearchIcon, Bell, User, X } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

import { useAuthStore } from '../../store/useAuthStore'

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  
  const { user, isAuthenticated, logout } = useAuthStore()

  // 若路由改變或清除搜尋，同步更新導覽列的文字
  useEffect(() => {
    if (location.pathname !== '/search') {
      setSearchQuery('')
    } else {
      const urlParams = new URLSearchParams(location.search)
      const q = urlParams.get('q')
      if (q) {
        setSearchQuery(q)
      } else {
        setSearchQuery('')
      }
    }
  }, [location.search, location.pathname])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shrink-0 z-10 shadow-sm relative">
      <div className="flex-1 flex justify-start items-center">
        {/* 手機版顯示 Logo */}
        <div className="md:hidden h-8 w-8 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center relative overflow-hidden mr-3 shadow-sm shrink-0">
           <div className="absolute top-0 left-0 w-full h-1/2 bg-red-600 border-b border-slate-900"></div>
           <div className="absolute z-10 w-2 h-2 bg-white border border-slate-900 rounded-full"></div>
        </div>

        <form onSubmit={handleSearch} className="relative w-full max-w-md">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-4 w-4 md:h-5 md:w-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-9 md:pl-10 pr-10 py-2 md:py-2.5 border border-slate-200 rounded-full leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-200 text-xs md:text-sm transition-all shadow-inner"
              placeholder="搜尋寶可夢..."
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  if (location.pathname === '/search') {
                    navigate('/search');
                  }
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-red-500 transition-colors"
                title="清除搜尋"
              >
                <X className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            )}
          </div>
        </form>
      </div>
      <div className="flex items-center space-x-2 md:space-x-3 ml-2">
        <button 
          className="p-2 rounded-full text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0"
          onClick={() => alert('通知功能準備中！')}
        >
          <Bell className="h-4 w-4 md:h-5 md:w-5" />
        </button>
        <div className="w-px h-6 bg-slate-200 mx-1 md:mx-2 shrink-0"></div>
        <button 
          className="flex items-center space-x-2 text-slate-700 hover:text-red-600 transition-colors shrink-0"
          onClick={() => {
            if (isAuthenticated) {
              if (window.confirm('確定要登出此裝置的訓練家帳號嗎？')) {
                logout()
                navigate('/')
              }
            } else {
              navigate('/login')
            }
          }}
        >
          <div className="h-7 w-7 md:h-9 md:w-9 rounded-full bg-slate-100 flex items-center justify-center border-2 border-slate-200 overflow-hidden hover:border-red-200 transition-colors">
            {isAuthenticated ? (
              <div className="h-full w-full bg-red-600 text-white font-black flex items-center justify-center text-[10px] md:text-xs">
                {user?.username.charAt(0).toUpperCase()}
              </div>
            ) : (
              <User className="h-4 w-4 md:h-5 md:w-5 text-slate-500" />
            )}
          </div>
          <span className="font-semibold text-xs md:text-sm hidden lg:block">
            {isAuthenticated ? user?.username : '登入'}
          </span>
        </button>
      </div>
    </header>
  )
}
