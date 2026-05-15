import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import CustomConnectButton from './CustomConnectButton'

const navLinks = [
  { to: '/investor', label: 'Marketplace' },
  { to: '/issuer', label: 'Issuer Panel' },
  { to: '/admin', label: 'Admin' },
]

export function NavBar() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  return (
    <nav className="border-b">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <span className="font-semibold text-base tracking-tight">ArgyOnChain</span>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  pathname === to
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                )}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CustomConnectButton />

          {/* Hamburger — mobile only */}
          <button
            className="md:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t px-4 py-2 flex flex-col gap-1">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={cn(
                'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                pathname === to
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
