import { Link } from 'react-router-dom'
import '@/styles/landing.css'

const STOCKS = [
  { ticker: 'GGAL',      name: 'Grupo Galicia',      flag: '🇦🇷', price: '42.18',   change: '+2.3%',  up: true  },
  { ticker: 'BBAR',      name: 'BBVA Argentina',     flag: '🇦🇷', price: '15.74',   change: '+1.8%',  up: true  },
  { ticker: 'TECO2',     name: 'Telecom AR',         flag: '🇦🇷', price: '23.91',   change: '−0.4%',  up: false },
  { ticker: 'VALE3',     name: 'Vale S.A.',          flag: '🇧🇷', price: '67.20',   change: '+0.9%',  up: true  },
  { ticker: 'PRIO3',     name: 'PetroRio',           flag: '🇧🇷', price: '18.55',   change: '+3.1%',  up: true  },
  { ticker: 'WALMEX',    name: 'Walmart MX',         flag: '🇲🇽', price: '87.32',   change: '+1.1%',  up: true  },
  { ticker: 'AMX',       name: 'América Móvil',      flag: '🇲🇽', price: '16.80',   change: '−0.8%',  up: false },
  { ticker: 'FALABELLA', name: 'Falabella',          flag: '🇨🇱', price: '1,840',   change: '−1.2%',  up: false },
  { ticker: 'ECOPETROL', name: 'Ecopetrol',          flag: '🇨🇴', price: '8,920',   change: '+0.7%',  up: true  },
  { ticker: 'CEMENTOS',  name: 'Pacasmayo',          flag: '🇵🇪', price: '6.45',    change: '+4.2%',  up: true  },
]

function Ticker() {
  const doubled = [...STOCKS, ...STOCKS]
  return (
    <div style={{ background: 'rgba(0 0 0 / 0.5)', borderBottom: '1px solid var(--border)', overflow: 'hidden' }}>
      <div className="land-ticker-track py-2">
        {doubled.map((s, i) => (
          <div key={i} className="flex items-center gap-3 px-6 shrink-0">
            <span style={{ fontSize: 12 }}>{s.flag}</span>
            <span className="land-mono" style={{ fontSize: 11, fontWeight: 500, color: 'var(--text)' }}>{s.ticker}</span>
            <span className="land-mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{s.price}</span>
            <span className="land-mono" style={{ fontSize: 10, fontWeight: 500, color: s.up ? 'var(--teal)' : 'var(--red)' }}>{s.change}</span>
            <span style={{ color: 'var(--border)', fontSize: 18, lineHeight: 1 }}>·</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Nav() {
  return (
    <nav style={{ borderBottom: '1px solid var(--border)', backdropFilter: 'blur(24px)', background: 'rgba(6 6 14 / 0.85)', position: 'sticky', top: 0, zIndex: 50 }}>
      <div className="flex items-center justify-between px-8 py-4 mx-auto" style={{ maxWidth: 1280 }}>
        <div className="flex items-center gap-2.5">
          <div style={{ width: 9, height: 9, background: 'var(--gold)', borderRadius: '50%', boxShadow: '0 0 12px var(--gold)' }} />
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: '0.05em', color: 'var(--text)' }}>
            Ramelax
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <Link to="/investor" className="land-mono text-xs uppercase tracking-widest transition-colors"
                style={{ color: 'var(--muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}>
            Marketplace
          </Link>
          <Link to="/issuer" className="land-mono text-xs uppercase tracking-widest transition-colors"
                style={{ color: 'var(--muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}>
            Issue Token
          </Link>
          <Link to="/investor" className="land-btn-primary px-6 py-2.5 rounded-lg text-sm">
            Launch App →
          </Link>
        </div>
      </div>
    </nav>
  )
}

function TokenCard({ style, floatClass, flag, ticker, name, sector, price, change, up }: {
  style?: React.CSSProperties
  floatClass: string
  flag: string
  ticker: string
  name: string
  sector: string
  price: string
  change: string
  up: boolean
}) {
  return (
    <div className={`land-card rounded-2xl p-5 absolute ${floatClass}`} style={style}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 14 }}>{flag}</span>
          <span className="land-mono" style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em' }}>{ticker}</span>
        </div>
        <span className="land-mono px-2 py-0.5 rounded-full" style={{
          fontSize: 10, fontWeight: 500,
          background: up ? 'rgba(0 212 160 / 0.12)' : 'rgba(255 80 80 / 0.12)',
          color: up ? 'var(--teal)' : 'var(--red)',
        }}>
          {change}
        </span>
      </div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{name}</div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12, fontFamily: "'IBM Plex Mono', monospace" }}>{sector}</div>
      <div className="land-divider mb-3" />
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: 'var(--gold)', letterSpacing: '0.04em' }}>
        {price} USDC
      </div>
    </div>
  )
}

export function LandingPage() {
  return (
    <div className="landing-root">
      <Ticker />
      <Nav />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="land-grid-bg relative overflow-hidden" style={{ minHeight: '92vh', display: 'flex', alignItems: 'center', padding: '80px 0' }}>
        <div className="land-orb land-orb-gold" style={{ width: 700, height: 700, top: -200, left: -250 }} />
        <div className="land-orb land-orb-teal"  style={{ width: 500, height: 500, bottom: -100, right: -100 }} />
        <div className="land-scan" />

        <div className="mx-auto px-8 w-full" style={{ maxWidth: 1280 }}>
          <div className="grid gap-16 items-center" style={{ gridTemplateColumns: '1fr 1fr' }}>

            {/* Left */}
            <div>
              {/* Badge */}
              <div className="land-anim land-d1 inline-flex items-center gap-2.5 mb-8 px-4 py-2 rounded-full"
                   style={{ border: '1px solid rgba(0 255 110 / 0.3)', background: 'rgba(0 255 110 / 0.05)' }}>
                <div className="land-dot" />
                <span className="land-mono" style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.06em' }}>
                  Live on Avalanche Fuji Testnet
                </span>
              </div>

              {/* Headline */}
              <h1 className="land-anim land-d2 land-display mb-6"
                  style={{ fontSize: 'clamp(4rem, 9vw, 8rem)' }}>
                <span className="land-grad-text">LATAM</span>
                <br />
                <span>STOCKS.</span>
                <br />
                <span style={{ color: 'var(--teal)' }}>GLOBAL</span>
                <br />
                <span>ACCESS.</span>
              </h1>

              <p className="land-anim land-d3 mb-10"
                 style={{ color: 'var(--muted)', fontSize: 17, lineHeight: 1.75, maxWidth: 460, fontWeight: 400 }}>
                Companies from Buenos Aires to Bogotá have always needed Wall Street's approval to raise global capital.{' '}
                <span style={{ color: 'var(--text)' }}>Not anymore.</span>
              </p>

              <div className="land-anim land-d4 flex flex-wrap gap-4 mb-12">
                <Link to="/investor" className="land-btn-primary px-9 py-4 rounded-xl text-base">
                  Explore Assets →
                </Link>
                <Link to="/issuer" className="land-btn-ghost px-9 py-4 rounded-xl text-base">
                  Issue Your Shares
                </Link>
              </div>

              {/* Mini-stats */}
              <div className="land-anim land-d5 flex gap-10 pt-8"
                   style={{ borderTop: '1px solid var(--border)' }}>
                {[
                  { n: '50+',   l: 'LATAM exchanges' },
                  { n: '$0',    l: 'ADR setup fees'  },
                  { n: '∞',     l: 'Global investors' },
                ].map(s => (
                  <div key={s.l}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: 'var(--gold)', letterSpacing: '0.04em', lineHeight: 1 }}>
                      {s.n}
                    </div>
                    <div className="land-mono mt-1" style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {s.l}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: floating cards */}
            <div className="relative hidden lg:block" style={{ height: 580 }}>
              <TokenCard
                floatClass="land-float"
                style={{ width: 270, top: '50%', left: '50%', transform: 'translate(-52%, -56%)', zIndex: 10 }}
                flag="🇦🇷" ticker="GGAL" name="Grupo Galicia" sector="Finance / Argentina"
                price="42.18" change="+2.3%" up
              />
              <TokenCard
                floatClass="land-float2"
                style={{ width: 220, top: '12%', right: '4%', zIndex: 9 }}
                flag="🇧🇷" ticker="VALE3" name="Vale S.A." sector="Mining / Brazil"
                price="67.20" change="+0.9%" up
              />
              <TokenCard
                floatClass="land-float3"
                style={{ width: 220, bottom: '15%', left: '0%', zIndex: 9 }}
                flag="🇲🇽" ticker="AMX" name="América Móvil" sector="Telecom / Mexico"
                price="16.80" change="−0.8%" up={false}
              />

              {/* Decorative ring */}
              <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.12, pointerEvents: 'none' }}>
                <circle cx="50%" cy="50%" r="180" fill="none" stroke="#00FF6E" strokeWidth="0.6" strokeDasharray="8 16" />
                <circle cx="50%" cy="50%" r="260" fill="none" stroke="#3B9EFF" strokeWidth="0.4" strokeDasharray="4 20" />
                <line x1="50%" y1="30%" x2="72%" y2="20%" stroke="#00FF6E" strokeWidth="0.5" strokeDasharray="3 5" />
                <line x1="50%" y1="68%" x2="22%" y2="76%" stroke="#3B9EFF" strokeWidth="0.5" strokeDasharray="3 5" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ── Problem / Solution ───────────────────────────────── */}
      <section style={{ padding: '120px 0', background: 'var(--surf)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="mx-auto px-8" style={{ maxWidth: 1280 }}>
          <div className="text-center mb-16">
            <p className="land-mono mb-4" style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              The Problem
            </p>
            <h2 className="land-display" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}>
              Wall Street gatekeeps LATAM capital
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Before */}
            <div className="rounded-2xl p-8" style={{ border: '1px solid rgba(255 80 80 / 0.18)', background: 'rgba(255 80 80 / 0.03)' }}>
              <p className="land-mono mb-6" style={{ fontSize: 11, color: 'var(--red)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
                ✕  The ADR System Today
              </p>
              {[
                'Requires a US custodian bank to sponsor you',
                '$10M+ setup costs, years of legal work',
                'Only large-cap companies ever qualify',
                '6–18 month approval process',
                'Restricted to specific exchanges and jurisdictions',
                'Ongoing compliance fees eat into capital',
              ].map(item => (
                <div key={item} className="flex gap-3 mb-4">
                  <span style={{ color: 'var(--red)', flexShrink: 0, marginTop: 3 }}>—</span>
                  <span style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>{item}</span>
                </div>
              ))}
            </div>

            {/* After */}
            <div className="rounded-2xl p-8" style={{ border: '1px solid rgba(0 212 160 / 0.2)', background: 'rgba(0 212 160 / 0.03)' }}>
              <p className="land-mono mb-6" style={{ fontSize: 11, color: 'var(--teal)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
                ✓  Ramelax
              </p>
              {[
                'Deploy a compliant token in minutes, no middlemen',
                'Zero setup cost — pay only gas fees',
                'Any company, any size, any country in LATAM',
                'Global from the moment you deploy',
                'On-chain KYC identity verification built in',
                'Programmable compliance — transfer restrictions enforced by code',
              ].map(item => (
                <div key={item} className="flex gap-3 mb-4">
                  <span style={{ color: 'var(--teal)', flexShrink: 0, marginTop: 3 }}>+</span>
                  <span style={{ fontSize: 14, lineHeight: 1.7 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section style={{ padding: '120px 0' }}>
        <div className="mx-auto px-8" style={{ maxWidth: 1280 }}>
          <div className="text-center mb-16">
            <p className="land-mono mb-4" style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              How It Works
            </p>
            <h2 className="land-display" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}>
              Three steps to global markets
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                n: '01',
                icon: '⬡',
                title: 'Company Tokenizes',
                desc: 'A LATAM company connects their wallet and deploys a regulated ERC-20 token on Avalanche. Identity-gated transfers are enforced by the contract itself.',
              },
              {
                n: '02',
                icon: '◈',
                title: 'Investors Onboard',
                desc: 'Global investors complete on-chain KYC and receive compliance claims. Once verified, they unlock access to all tokenized LATAM assets.',
              },
              {
                n: '03',
                icon: '◎',
                title: 'Capital Flows',
                desc: 'Investors buy tokens with USDC. Capital flows directly to the company — no ADR, no US custodian bank, no Wall Street gatekeepers.',
              },
            ].map(step => (
              <div key={step.n} className="relative group">
                <div className="land-step-n mb-1">{step.n}</div>
                <div className="land-card rounded-2xl p-6">
                  <div style={{ fontSize: 28, marginBottom: 14, color: 'var(--gold)' }}>{step.icon}</div>
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 10 }}>{step.title}</h3>
                  <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.75 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────── */}
      <section style={{ padding: '80px 0', background: 'var(--surf)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="mx-auto px-8" style={{ maxWidth: 1280 }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { n: '$5T',    l: 'in LATAM market cap locked\nout of global markets'    },
              { n: '0',      l: 'US bank sponsors\nrequired'                           },
              { n: '< 5min', l: 'from company to\nglobal listing'                     },
              { n: '∞',      l: 'companies that can now\naccess global capital'        },
            ].map(s => (
              <div key={s.l} className="px-4">
                <div className="land-stat-num land-grad-text mb-3">{s.n}</div>
                <div className="land-mono" style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="land-grid-bg relative overflow-hidden" style={{ padding: '160px 0' }}>
        <div className="land-orb land-orb-gold" style={{ width: 800, height: 800, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.7 }} />
        <div className="mx-auto px-8 text-center relative" style={{ maxWidth: 900, zIndex: 1 }}>
          <p className="land-mono mb-6" style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Built on Avalanche
          </p>
          <h2 className="land-display mb-6" style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)' }}>
            The future of LATAM capital<br />markets is on-chain.
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: 17, lineHeight: 1.75, maxWidth: 520, margin: '0 auto 48px' }}>
            Whether you're a company looking to raise capital globally or an investor seeking LATAM exposure — Ramelax is your gateway.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/investor" className="land-btn-primary px-10 py-5 rounded-xl text-lg">
              Start Investing →
            </Link>
            <Link to="/issuer" className="land-btn-ghost px-10 py-5 rounded-xl text-lg">
              Issue Your Shares
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '36px 0', background: 'rgba(0 0 0 / 0.5)' }}>
        <div className="mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ maxWidth: 1280 }}>
          <div className="flex items-center gap-2">
            <div style={{ width: 7, height: 7, background: 'var(--gold)', borderRadius: '50%' }} />
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: '0.05em' }}>Ramelax</span>
          </div>
          <p className="land-mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
            Built at LatAm Institucional Hackathon · Avalanche · May 2025
          </p>
          <div className="flex gap-6">
            {[
              { to: '/investor', label: 'Marketplace' },
              { to: '/issuer',   label: 'Issue Token'  },
              { to: '/admin',    label: 'Admin'        },
            ].map(l => (
              <Link key={l.to} to={l.to} className="land-mono transition-colors"
                    style={{ fontSize: 11, color: 'var(--muted)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
