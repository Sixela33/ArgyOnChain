import '@rainbow-me/rainbowkit/styles.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { NavBar } from '@/components/NavBar'
import { IssuerPage } from '@/pages/IssuerPage'
import { InvestorPage } from '@/pages/InvestorPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-svh bg-background text-foreground">
        <NavBar />
        <main className="container mx-auto px-6 py-8 max-w-6xl">
          <Routes>
            <Route path="/investor" element={<InvestorPage />} />
            <Route path="/issuer" element={<IssuerPage />} />
            <Route path="*" element={<Navigate to="/investor" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
