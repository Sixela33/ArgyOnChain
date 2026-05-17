import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccount, useWriteContract, usePublicClient, useReadContract } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { formatUnits, parseAbiItem, decodeEventLog } from 'viem'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TOKEN_FACTORY_ADDRESS, TokenFactoryABI, TokenABI, IDENTITY_FACTORY_ADDRESS, FROM_BLOCK } from '@/lib/contracts'
import { verifyToken } from '@/lib/verifyToken'

const TOKEN_CREATED_EVENT = parseAbiItem(
  'event TokenCreated(address indexed token, address indexed defaultAdmin, string name, string symbol, uint256[] requiredClaims, uint256 initialSupply)',
)

type TokenInfo = { address: `0x${string}`; name: string; symbol: string }

function useIssuedTokens(issuer: `0x${string}` | undefined) {
  const client = usePublicClient()
  return useQuery({
    queryKey: ['issued-tokens', issuer],
    queryFn: async () => {
      const logs = await client!.getLogs({
        address: TOKEN_FACTORY_ADDRESS,
        event: TOKEN_CREATED_EVENT,
        args: { defaultAdmin: issuer },
        fromBlock: FROM_BLOCK,
      })
      return logs.map(log => ({
        address: log.args.token  as `0x${string}`,
        name:    log.args.name   as string,
        symbol:  log.args.symbol as string,
      }))
    },
    enabled: !!client && !!issuer,
  })
}

function IssuerTokenCard({ token }: { token: TokenInfo }) {
  const { data: totalSupply } = useReadContract({ address: token.address, abi: TokenABI, functionName: 'totalSupply' })
  const { data: isPaused }    = useReadContract({ address: token.address, abi: TokenABI, functionName: 'paused' })
  const supply = totalSupply ? Number(formatUnits(totalSupply as bigint, 18)).toLocaleString() : '—'

  return (
    <div className="border rounded-xl p-5 flex flex-col gap-3" style={{ borderColor: 'rgba(0,255,110,0.12)' }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold">{token.name}</p>
          <p className="font-mono text-sm text-muted-foreground">{token.symbol}</p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: isPaused ? 'rgba(255,69,96,0.15)' : 'rgba(0,255,110,0.12)', color: isPaused ? '#FF4560' : '#00FF6E' }}>
          {isPaused ? 'Paused' : 'Active'}
        </span>
      </div>
      <div>
        <p style={{ fontSize: 10, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'IBM Plex Mono',monospace" }}>Total supply</p>
        <p className="font-semibold mt-0.5">{supply} {token.symbol}</p>
      </div>
      <p style={{ fontSize: 10, color: 'var(--muted-foreground)', fontFamily: "'IBM Plex Mono',monospace", wordBreak: 'break-all' }}>{token.address}</p>
      <Link to={`/token/${token.address}`} className="inline-flex items-center gap-1 text-sm font-medium mt-1" style={{ color: '#00FF6E' }}>
        Manage <ArrowRight size={14} />
      </Link>
    </div>
  )
}

function DeployTokenForm({ onDeployed }: { onDeployed: () => void }) {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const [name, setName]                     = useState('')
  const [symbol, setSymbol]                 = useState('')
  const [claimsInput, setClaimsInput]       = useState('')
  const [status, setStatus]                 = useState<'idle' | 'deploying' | 'verifying' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg]             = useState('')
  const [lastDeployed, setLastDeployed]     = useState<`0x${string}` | null>(null)
  const { writeContractAsync } = useWriteContract()

  const parsedClaims: bigint[] = claimsInput
    .split(',').map(s => s.trim())
    .filter(s => s !== '' && /^\d+$/.test(s))
    .map(s => BigInt(s))

  const busy = status === 'deploying' || status === 'verifying'

  const handleDeploy = async () => {
    if (!name || !symbol || !address || !publicClient) return
    setStatus('deploying')
    setErrorMsg('')
    setLastDeployed(null)
    try {
      const hash = await writeContractAsync({
        address: TOKEN_FACTORY_ADDRESS, abi: TokenFactoryABI,
        functionName: 'deployToken',
        args: [name, symbol, address, address, parsedClaims],
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      let newTokenAddress: `0x${string}` | undefined
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({ abi: TokenFactoryABI, ...log })
          if (decoded.eventName === 'TokenCreated') {
            newTokenAddress = (decoded.args as { token: `0x${string}` }).token
            break
          }
        } catch { /* skip unrelated logs */ }
      }

      const deployedName = name; const deployedSymbol = symbol; const deployedClaims = parsedClaims
      setName(''); setSymbol(''); setClaimsInput('')
      if (newTokenAddress) setLastDeployed(newTokenAddress)
      onDeployed()

      if (newTokenAddress) {
        setStatus('verifying')
        verifyToken({ address: newTokenAddress, name: deployedName, symbol: deployedSymbol, defaultAdmin: TOKEN_FACTORY_ADDRESS, enforcer: address, identityFactory: IDENTITY_FACTORY_ADDRESS, requiredClaims: deployedClaims })
          .then(() => setStatus('done')).catch(() => setStatus('done'))
      } else { setStatus('done') }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setErrorMsg(msg.length > 140 ? msg.slice(0, 140) + '…' : msg)
      setStatus('error')
    }
  }

  return (
    <div className="border rounded-xl p-5 flex flex-col gap-4" style={{ borderColor: 'rgba(0,255,110,0.12)' }}>
      <h2 className="font-semibold">Deploy new token</h2>

      <div className="flex gap-3">
        <input className="flex-1 border rounded-md px-3 py-1.5 text-sm bg-background" placeholder="Company name (e.g. Grupo Galicia)" value={name} onChange={e => setName(e.target.value)} disabled={busy} />
        <input className="w-32 border rounded-md px-3 py-1.5 text-sm bg-background" placeholder="Ticker (GGAL)" value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} maxLength={8} disabled={busy} />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex gap-3 items-center">
          <input className="flex-1 border rounded-md px-3 py-1.5 text-sm bg-background" placeholder="Required claim IDs (e.g. 1)" value={claimsInput} onChange={e => setClaimsInput(e.target.value)} disabled={busy} />
          <Button onClick={handleDeploy} disabled={!name || !symbol || busy}>
            {status === 'deploying' ? 'Deploying…' : status === 'verifying' ? 'Verifying…' : 'Deploy'}
          </Button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
          Claim IDs define what KYC credentials holders must have. Use <code style={{ color: '#00FF6E' }}>1</code> for standard KYC. Leave empty for no restrictions.
        </p>
      </div>

      {/* Success banner */}
      {(status === 'done' || status === 'verifying') && lastDeployed && (
        <div className="rounded-lg px-4 py-3 flex items-center justify-between gap-4"
             style={{ background: 'rgba(0,255,110,0.07)', border: '1px solid rgba(0,255,110,0.2)' }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#00FF6E' }}>✓ Token deployed</p>
            <p style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: 'var(--muted-foreground)', marginTop: 2 }}>{lastDeployed}</p>
            <p style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>
              {status === 'verifying' ? 'Submitting to Snowtrace for verification…' : 'Verification submitted to Snowtrace.'}
            </p>
          </div>
          <Link to={`/token/${lastDeployed}`}><Button size="sm" variant="outline">Manage →</Button></Link>
        </div>
      )}

      {/* Error banner */}
      {status === 'error' && (
        <div className="rounded-lg px-4 py-3" style={{ background: 'rgba(255,69,96,0.07)', border: '1px solid rgba(255,69,96,0.2)' }}>
          <p className="text-sm font-semibold" style={{ color: '#FF4560' }}>✕ Deploy failed</p>
          {errorMsg && <p style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 4 }}>{errorMsg}</p>}
        </div>
      )}
    </div>
  )
}

export function IssuerPage() {
  const { address } = useAccount()
  const { data: tokens = [], refetch } = useIssuedTokens(address)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Issuer Panel</h1>
        <p className="text-sm text-muted-foreground mt-1">Deploy and manage tokenized LATAM stocks</p>
      </div>

      <DeployTokenForm onDeployed={refetch} />

      <div>
        <h2 className="font-semibold mb-3">Your tokens</h2>
        {tokens.length === 0 ? (
          <div className="border rounded-xl p-8 text-center" style={{ borderColor: 'rgba(0,255,110,0.08)', background: 'rgba(0,255,110,0.02)' }}>
            <p className="font-semibold mb-1">No tokens issued yet</p>
            <p className="text-sm text-muted-foreground">Use the form above to tokenize your first LATAM stock. Each token gets its own verified smart contract on Avalanche.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tokens.map(token => <IssuerTokenCard key={token.address} token={token} />)}
          </div>
        )}
      </div>
    </div>
  )
}
