import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()
  const location = useLocation()

  // 取得原本想去的路徑，若無則回到首頁
  const from = location.state?.from?.pathname || '/'

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim()) {
      // 本機模擬登入：不需要對後端驗證密碼，只要有輸入帳號即無條件放行
      login(username)
      navigate(from, { replace: true })
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 min-h-screen relative overflow-hidden -mt-16">
      {/* 隱藏外層元件的 Header padding，讓高度滿版 */}
      <style>{`header { display: none !important; } aside { display: none !important; }`}</style>
      
      {/* 巨大的精靈球光暈背景裝飾 */}
      <div className="absolute -top-[400px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-red-600 rounded-full blur-[100px] opacity-10 pointer-events-none"></div>

      <div className="w-full max-w-[360px] bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-red-600 h-2.5 w-full"></div>
        <div className="p-8">
          
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center border border-red-100 shadow-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-red-600 w-full h-1/2 border-b-[3px] border-slate-800"></div>
              <div className="absolute h-full w-full border-[3px] border-transparent"></div>
              <div className="absolute h-4 w-4 bg-white rounded-full border-[3.5px] border-slate-800 z-10 shadow-sm group-hover:scale-110 group-hover:border-red-600 transition-all"></div>
            </div>
          </div>
          
          <h2 className="text-2xl font-black text-center text-slate-800 tracking-tight">訓練家登入</h2>
          <p className="text-center text-slate-500 text-sm mt-2 mb-8 font-medium">登入以使用專屬的寶可夢卡牌庫功能</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">訓練家名稱 / 你的名號</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-500 transition-all font-bold text-slate-800 placeholder-slate-400"
                placeholder="例如：小智"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">登入密碼</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-500 transition-all font-bold text-slate-800 placeholder-slate-400"
                placeholder="在此為模擬展示，請任意輸入"
              />
            </div>
            
            <button 
              type="submit"
              className="w-full mt-4 py-3.5 bg-slate-800 hover:bg-red-600 text-white rounded-2xl font-black tracking-wider transition-colors shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              進入系統
            </button>
            
            <p className="text-center text-[11px] text-slate-400 mt-5 font-bold px-2 leading-relaxed">
              這是儲存於您設備的本機模擬資料，不傳送資料至雲端。<br/>可放心隨意輸入測試帳號。
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
