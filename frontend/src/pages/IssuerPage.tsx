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

type TokenInfo = {
  address: `0x${string}`
  name: string
  symbol: string
}

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
      return logs.map((log) => ({
        address: log.args.token as `0x${string}`,
        name: log.args.name as string,
        symbol: log.args.symbol as string,
      }))
    },
    enabled: !!client && !!issuer,
  })
}

function IssuerTokenCard({ token }: { token: TokenInfo }) {
  const { data: totalSupply } = useReadContract({ address: token.address, abi: TokenABI, functionName: 'totalSupply' })
  const { data: isPaused } = useReadContract({ address: token.address, abi: TokenABI, functionName: 'paused' })

  return (
    <div className="border rounded-lg p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-base">{token.name}</p>
          <p className="text-sm text-muted-foreground font-mono">{token.symbol}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isPaused ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-600'}`}>
          {isPaused ? 'Paused' : 'Active'}
        </span>
      </div>

      <p className="text-sm text-muted-foreground">
        Total supply:{' '}
        <span className="text-foreground font-medium">
          {totalSupply !== undefined ? Number(formatUnits(totalSupply as bigint, 18)).toLocaleString() : '—'} {token.symbol}
        </span>
      </p>

      <p className="text-xs text-muted-foreground font-mono break-all">{token.address}</p>

      <Link to={`/token/${token.address}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline mt-1">
        Manage <ArrowRight size={14} />
      </Link>
    </div>
  )
}

function DeployTokenForm({ onDeployed }: { onDeployed: () => void }) {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [claimsInput, setClaimsInput] = useState('')
  const [status, setStatus] = useState<'idle' | 'deploying' | 'verifying' | 'done' | 'error'>('idle')
  const { writeContractAsync } = useWriteContract()

  const parsedClaims: bigint[] = claimsInput
    .split(',')
    .map(s => s.trim())
    .filter(s => s !== '' && /^\d+$/.test(s))
    .map(s => BigInt(s))

  const handleDeploy = async () => {
    if (!name || !symbol || !address || !publicClient) return
    setStatus('deploying')
    try {
      const hash = await writeContractAsync({
        address: TOKEN_FACTORY_ADDRESS,
        abi: TokenFactoryABI,
        functionName: 'deployToken',
        args: [name, symbol, address, address, parsedClaims],
      })

      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      // Extract new token address from TokenCreated event log
      let newTokenAddress: `0x${string}` | undefined
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({ abi: TokenFactoryABI, ...log })
          if (decoded.eventName === 'TokenCreated') {
            newTokenAddress = (decoded.args as unknown as { token: `0x${string}` }).token
            break
          }
        } catch { /* skip unrelated logs */ }
      }

      const deployedName = name
      const deployedSymbol = symbol
      const deployedClaims = parsedClaims
      setName('')
      setSymbol('')
      setClaimsInput('')
      onDeployed()

      // Fire-and-forget verification
      if (newTokenAddress) {
        setStatus('verifying')
        verifyToken({
          address: newTokenAddress,
          name: deployedName,
          symbol: deployedSymbol,
          defaultAdmin: TOKEN_FACTORY_ADDRESS,
          enforcer: address,
          identityFactory: IDENTITY_FACTORY_ADDRESS,
          requiredClaims: deployedClaims,
        })
          .then(result => {
            console.log('Verification submitted:', result)
            setStatus('done')
          })
          .catch(err => {
            console.warn('Verification failed:', err)
            setStatus('done')
          })
      } else {
        setStatus('done')
      }
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  const statusMsg = {
    idle: null,
    deploying: 'Deploying…',
    verifying: 'Submitting to Snowtrace for verification…',
    done: 'Deployed and verification submitted.',
    error: 'Something went wrong.',
  }[status]

  return (
    <div className="border rounded-lg p-5 flex flex-col gap-4">
      <h2 className="font-semibold">Deploy new token</h2>
      <div className="flex gap-3">
        <input
          className="flex-1 border rounded-md px-3 py-1.5 text-sm bg-background"
          placeholder="Company name (e.g. Grupo Galicia)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-32 border rounded-md px-3 py-1.5 text-sm bg-background"
          placeholder="Ticker (GGAL)"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          maxLength={8}
        />
      </div>
      <div className="flex gap-3 items-center">
        <input
          className="flex-1 border rounded-md px-3 py-1.5 text-sm bg-background"
          placeholder="Required claim IDs (e.g. 1,2)"
          value={claimsInput}
          onChange={(e) => setClaimsInput(e.target.value)}
        />
        <Button onClick={handleDeploy} disabled={!name || !symbol || status === 'deploying' || status === 'verifying'}>
          {status === 'deploying' ? 'Deploying…' : status === 'verifying' ? 'Verifying…' : 'Deploy'}
        </Button>
      </div>
      {statusMsg && (
        <p className={`text-xs ${status === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>
          {statusMsg}
        </p>
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
          <p className="text-sm text-muted-foreground">No tokens deployed yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tokens.map((token) => (
              <IssuerTokenCard key={token.address} token={token} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
