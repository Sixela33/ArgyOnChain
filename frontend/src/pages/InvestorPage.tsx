import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccount, useWriteContract, usePublicClient, useReadContract } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { formatUnits, parseUnits, parseAbiItem } from 'viem'
import { Button } from '@/components/ui/button'
import { TOKEN_FACTORY_ADDRESS, USDC_ADDRESS, TokenFactoryABI, TokenABI, USDCABI, FROM_BLOCK } from '@/lib/contracts'
import CustomConnectButton from '@/components/CustomConnectButton'

// ── Token display metadata keyed by symbol ────────────────────────────────────
const TOKEN_META: Record<string, { flag: string; country: string; sector: string; from: string; to: string }> = {
  GGAL:      { flag: '🇦🇷', country: 'Argentina', sector: 'Finance',  from: '#1a4080', to: '#5090e0' },
  VALE3:     { flag: '🇧🇷', country: 'Brazil',    sector: 'Mining',   from: '#145c20', to: '#c8a020' },
  WALMEX:    { flag: '🇲🇽', country: 'Mexico',    sector: 'Retail',   from: '#7a1414', to: '#2a8040' },
  PRIO3:     { flag: '🇧🇷', country: 'Brazil',    sector: 'Energy',   from: '#0c2a50', to: '#00b87a' },
  BBAR:      { flag: '🇦🇷', country: 'Argentina', sector: 'Finance',  from: '#2a2070', to: '#5080ff' },
  ECOPETROL: { flag: '🇨🇴', country: 'Colombia',  sector: 'Energy',   from: '#1a3a10', to: '#d09020' },
}

function getTokenMeta(symbol: string) {
  return TOKEN_META[symbol] ?? { flag: '🌎', country: 'LATAM', sector: 'Equity', from: '#102040', to: '#204060' }
}

// ── On-chain query ────────────────────────────────────────────────────────────
const TOKEN_CREATED_EVENT = parseAbiItem(
  'event TokenCreated(address indexed token, address indexed defaultAdmin, string name, string symbol, uint256[] requiredClaims, uint256 initialSupply)',
)

type TokenInfo = { address: `0x${string}`; name: string; symbol: string }

function useAllTokens() {
  const client = usePublicClient()
  return useQuery({
    queryKey: ['all-tokens'],
    queryFn: async () => {
      const logs = await client!.getLogs({ address: TOKEN_FACTORY_ADDRESS, event: TOKEN_CREATED_EVENT, fromBlock: FROM_BLOCK })
      return logs.map(log => ({
        address: log.args.token  as `0x${string}`,
        name:    log.args.name   as string,
        symbol:  log.args.symbol as string,
      }))
    },
    enabled: !!client,
    refetchInterval: 15_000,
  })
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="border rounded-xl overflow-hidden animate-pulse" style={{ borderColor: 'rgba(0,255,110,0.08)' }}>
      <div className="h-24" style={{ background: 'rgba(255,255,255,0.03)' }} />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-4 rounded" style={{ background: 'rgba(255,255,255,0.06)', width: '55%' }} />
        <div className="h-3 rounded" style={{ background: 'rgba(255,255,255,0.04)', width: '35%' }} />
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="h-10 rounded" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <div className="h-10 rounded" style={{ background: 'rgba(255,255,255,0.04)' }} />
        </div>
      </div>
    </div>
  )
}

// ── Token card ────────────────────────────────────────────────────────────────
function TokenCard({ token, investor }: { token: TokenInfo; investor: `0x${string}` | undefined }) {
  const meta = getTokenMeta(token.symbol)

  const { data: totalSupply } = useReadContract({ address: token.address, abi: TokenABI, functionName: 'totalSupply' })
  const { data: balance } = useReadContract({
    address: token.address, abi: TokenABI, functionName: 'balanceOf',
    args: [investor ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!investor },
  })
  const { data: isPaused } = useReadContract({ address: token.address, abi: TokenABI, functionName: 'paused' })

  const supply  = totalSupply ? Number(formatUnits(totalSupply as bigint, 18)).toLocaleString() : '—'
  const holding = balance     ? Number(formatUnits(balance     as bigint, 18)).toLocaleString() : '—'

  return (
    <div className="border rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:border-primary/30"
         style={{ borderColor: 'rgba(0,255,110,0.10)' }}>

      {/* Gradient header with flag + ticker */}
      <div className="relative flex items-end px-4 pb-3 pt-6"
           style={{ background: `linear-gradient(135deg, ${meta.from} 0%, ${meta.to} 100%)`, minHeight: 100 }}>

        <div className="absolute top-3 right-3">
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  backdropFilter: 'blur(8px)',
                  background: isPaused ? 'rgba(255,69,96,0.25)' : 'rgba(0,0,0,0.35)',
                  color: isPaused ? '#FF4560' : '#00FF6E',
                  border: `1px solid ${isPaused ? 'rgba(255,69,96,0.4)' : 'rgba(0,255,110,0.4)'}`,
                }}>
            {isPaused ? 'Paused' : 'Active'}
          </span>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ fontSize: 20 }}>{meta.flag}</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '0.06em' }}>
              {meta.country} · {meta.sector}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: '#fff', letterSpacing: '0.04em', lineHeight: 1 }}>
              {token.symbol}
            </span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{token.name}</span>
          </div>
        </div>
      </div>

      {/* Stats body */}
      <div className="p-4 flex flex-col gap-3 flex-1" style={{ background: 'var(--card)' }}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p style={{ fontSize: 10, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'IBM Plex Mono',monospace" }}>
              Total shares
            </p>
            <p className="font-semibold mt-0.5">{supply}</p>
          </div>
          <div>
            <p style={{ fontSize: 10, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'IBM Plex Mono',monospace" }}>
              Your holdings
            </p>
            <p className="font-semibold mt-0.5">
              {investor ? `${holding} ${token.symbol}` : '—'}
            </p>
          </div>
        </div>

        <p style={{ fontSize: 10, color: 'var(--muted-foreground)', fontFamily: "'IBM Plex Mono',monospace", wordBreak: 'break-all' }}>
          {token.address}
        </p>
      </div>
    </div>
  )
}

// ── USDC widget ───────────────────────────────────────────────────────────────
function USDCWidget({ investor }: { investor: `0x${string}` }) {
  const { writeContractAsync } = useWriteContract()
  const { data: usdcBalance, refetch } = useReadContract({
    address: USDC_ADDRESS, abi: USDCABI, functionName: 'balanceOf', args: [investor],
  })
  const [pending, setPending] = useState(false)

  const handleMint = async () => {
    setPending(true)
    try {
      await writeContractAsync({
        address: USDC_ADDRESS, abi: USDCABI, functionName: 'mint',
        args: [investor, parseUnits('10000', 6)],
      })
      refetch()
    } finally { setPending(false) }
  }

  const balance = usdcBalance !== undefined
    ? Number(formatUnits(usdcBalance as bigint, 6)).toLocaleString(undefined, { maximumFractionDigits: 2 })
    : '—'

  return (
    <div className="flex items-center gap-4 border rounded-lg px-4 py-3" style={{ borderColor: 'rgba(0,255,110,0.15)' }}>
      <div>
        <p style={{ fontSize: 10, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'IBM Plex Mono',monospace" }}>
          USDC Balance
        </p>
        <p className="font-semibold" style={{ color: '#00FF6E' }}>${balance}</p>
      </div>
      <Button size="sm" variant="outline" onClick={handleMint} disabled={pending}>
        {pending ? 'Minting…' : 'Get testnet USDC'}
      </Button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function InvestorPage() {
  const { address, isConnected } = useAccount()
  const { data: tokens = [], isLoading } = useAllTokens()

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Marketplace</h1>
          <p className="text-sm text-muted-foreground mt-1">Tokenized LATAM stocks live on Avalanche Fuji</p>
        </div>
        {isConnected && address ? <USDCWidget investor={address} /> : <CustomConnectButton />}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      ) : tokens.length === 0 ? (
        <div className="border rounded-xl p-10 text-center" style={{ borderColor: 'rgba(0,255,110,0.1)', background: 'rgba(0,255,110,0.02)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <p className="font-semibold mb-1">No live tokens yet</p>
          <p className="text-sm text-muted-foreground mb-4">Be the first to tokenize a LATAM stock.</p>
          <Link to="/issuer"><Button size="sm" variant="outline">Deploy your first token →</Button></Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tokens.map(token => (
            <TokenCard key={token.address} token={token} investor={address} />
          ))}
        </div>
      )}
    </div>
  )
}
