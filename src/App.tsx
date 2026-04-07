import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Sidebar from './components/layout/Sidebar'
import Navbar from './components/layout/Navbar'
import BottomNav from './components/layout/BottomNav'
import Dashboard from './pages/Dashboard'
import Search from './pages/Search'
import Portfolio from './pages/Portfolio'
import Catalog from './pages/Catalog'
import Login from './pages/Login'
import MarketAlerts from './pages/MarketAlerts'
import CardDetail from './pages/CardDetail'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { useAuthStore } from './store/useAuthStore'
import { usePortfolioStore } from './store/usePortfolioStore'

function App() {
  const { isAuthenticated } = useAuthStore()
  const { fetchItems, clear } = usePortfolioStore()

  useEffect(() => {
    if (isAuthenticated) {
      fetchItems()
    } else {
      clear()
    }
  }, [isAuthenticated, fetchItems, clear])

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden relative">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 relative">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/search" element={<Search />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/market-alerts/:type" element={<MarketAlerts />} />
            <Route path="/card/:id" element={<CardDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/portfolio" element={
              <ProtectedRoute>
                <Portfolio />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </div>
  )
}

export default App
