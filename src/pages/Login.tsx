import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Loader2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate(from, { replace: true })
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${from}`
          }
        })
        if (error) throw error
        setMessage({ type: 'success', text: '註冊成功！請去新信箱收信並點取驗證連結，接著即可回來登入。' })
      }
    } catch (error: any) {
      let errorMsg = error.message
      if (errorMsg.includes('Invalid login credentials')) errorMsg = '帳號或密碼錯誤。'
      else if (errorMsg.includes('User already registered')) errorMsg = '此 Email 已經註冊過。'
      else if (errorMsg.includes('Password should be at least')) errorMsg = '密碼長度太短。'
      setMessage({ type: 'error', text: errorMsg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 min-h-screen relative overflow-hidden -mt-16">
      <style>{`header { display: none !important; } aside { display: none !important; }`}</style>
      
      <div className="absolute -top-[400px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-red-600 rounded-full blur-[100px] opacity-10 pointer-events-none"></div>

      <div className="w-full max-w-[360px] bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-red-600 h-2.5 w-full"></div>
        <div className="p-8">
          
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center border border-red-100 shadow-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-red-600 w-full h-1/2 border-b-[3px] border-slate-800"></div>
              <div className="absolute h-full w-full border-[3px] border-transparent"></div>
              <div className="absolute h-4 w-4 bg-white rounded-full border-[3.5px] border-slate-800 z-10 shadow-sm transition-all"></div>
            </div>
          </div>
          
          <h2 className="text-2xl font-black text-center text-slate-800 tracking-tight">{isLogin ? '訓練家登入' : '註冊通行證'}</h2>
          <p className="text-center text-slate-500 text-sm mt-2 mb-6 font-medium">使用 Supabase 進行安全雲端授權</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Email 信箱</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-500 transition-all font-bold text-slate-800 placeholder-slate-400"
                placeholder="ash@trainer.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">密碼</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-500 transition-all font-bold text-slate-800 placeholder-slate-400"
                placeholder="請輸入密碼"
              />
            </div>
            
            {message.text && (
              <div className={`text-xs font-bold p-3 rounded-xl border ${message.type === 'error' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                {message.text}
              </div>
            )}
            
            <button 
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-black tracking-wider transition-colors shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-50 flex justify-center items-center"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? '進入系統' : '註冊帳號')}
            </button>
            
            <div className="text-center mt-5">
              <button 
                type="button" 
                onClick={() => { setIsLogin(!isLogin); setMessage({type:'', text:''}); }}
                className="text-[12px] text-slate-500 hover:text-red-500 font-bold transition-colors"
              >
                {isLogin ? '還沒有帳號嗎？點我註冊' : '已經有帳號了？點我登入'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
