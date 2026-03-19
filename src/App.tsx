import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import Navbar from './components/layout/Navbar'
import Dashboard from './pages/Dashboard'
import Search from './pages/Search'
import Portfolio from './pages/Portfolio'

function App() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/search" element={<Search />} />
            <Route path="/portfolio" element={<Portfolio />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
