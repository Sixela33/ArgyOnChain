import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import CustomConnectButton from './CustomConnectButton'

const navLinks = [
  { to: '/investor', label: 'Marketplace' },
  { to: '/issuer',   label: 'Issuer Panel' },
  { to: '/admin',    label: 'Admin' },
]

export function NavBar() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  return (
    <nav style={{
      borderBottom: '1px solid rgba(0, 255, 110, 0.08)',
      backdropFilter: 'blur(24px)',
      background: 'rgba(2, 11, 24, 0.9)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div className="px-6 py-3 flex items-center justify-between" style={{ maxWidth: '100%' }}>
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div style={{
              width: 8, height: 8,
              background: '#00FF6E',
              borderRadius: '50%',
              boxShadow: '0 0 10px #00FF6E',
            }} />
            <span style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 20,
              letterSpacing: '0.06em',
              color: '#E4F0FF',
              lineHeight: 1,
            }}>
              Ramelax
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => {
              const active = pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 11,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    padding: '6px 12px',
                    borderRadius: 6,
                    color: active ? '#00FF6E' : '#3D5A7A',
                    background: active ? 'rgba(0, 255, 110, 0.08)' : 'transparent',
                    transition: 'color 0.15s, background 0.15s',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.color = '#E4F0FF'
                  }}
                  onMouseLeave={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.color = '#3D5A7A'
                  }}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CustomConnectButton />

          {/* Hamburger — mobile only */}
          <button
            className="md:hidden p-1.5 rounded-md transition-colors"
            style={{ color: '#3D5A7A' }}
            onClick={() => setOpen(v => !v)}
            aria-label="Toggle menu"
            onMouseEnter={e => (e.currentTarget.style.color = '#E4F0FF')}
            onMouseLeave={e => (e.currentTarget.style.color = '#3D5A7A')}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden px-4 py-2 flex flex-col gap-1"
             style={{ borderTop: '1px solid rgba(0, 255, 110, 0.08)' }}>
          {navLinks.map(({ to, label }) => {
            const active = pathname === to
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '10px 12px',
                  borderRadius: 6,
                  color: active ? '#00FF6E' : '#3D5A7A',
                  background: active ? 'rgba(0, 255, 110, 0.08)' : 'transparent',
                  textDecoration: 'none',
                  display: 'block',
                }}
              >
                {label}
              </Link>
            )
          })}
        </div>
      )}
    </nav>
  )
}
