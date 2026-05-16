import '@rainbow-me/rainbowkit/styles.css'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { NavBar } from '@/components/NavBar'
import { IssuerPage } from '@/pages/IssuerPage'
import { InvestorPage } from '@/pages/InvestorPage'
import { TokenManagePage } from '@/pages/TokenManagePage'
import { FactoryAdminPage } from '@/pages/FactoryAdminPage'
import { LandingPage } from '@/pages/LandingPage'

function AppLayout() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <NavBar />
      <main className="container mx-auto px-6 py-8 max-w-6xl">
        <Outlet />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<AppLayout />}>
          <Route path="/investor" element={<InvestorPage />} />
          <Route path="/issuer"   element={<IssuerPage />} />
          <Route path="/token/:address" element={<TokenManagePage />} />
          <Route path="/admin"    element={<FactoryAdminPage />} />
          <Route path="*" element={<Navigate to="/investor" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
