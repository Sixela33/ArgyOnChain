import { useState } from 'react'
import { useAccount, useWriteContract, usePublicClient, useReadContract } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { parseUnits, formatUnits, parseAbiItem } from 'viem'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from '@/components/ui/button'
import { TOKEN_FACTORY_ADDRESS, TokenFactoryABI, TokenABI, FROM_BLOCK } from '@/lib/contracts'

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

function IssuerTokenCard({ token, issuer }: { token: TokenInfo; issuer: `0x${string}` }) {
  const [mintTo, setMintTo] = useState('')
  const [mintAmount, setMintAmount] = useState('')
  const { writeContractAsync } = useWriteContract()

  const { data: totalSupply, refetch: refetchSupply } = useReadContract({
    address: token.address,
    abi: TokenABI,
    functionName: 'totalSupply',
  })

  const { data: isPaused, refetch: refetchPaused } = useReadContract({
    address: token.address,
    abi: TokenABI,
    functionName: 'paused',
  })

  const handleMint = async () => {
    if (!mintTo || !mintAmount) return
    await writeContractAsync({
      address: token.address,
      abi: TokenABI,
      functionName: 'mint',
      args: [mintTo as `0x${string}`, parseUnits(mintAmount, 18)],
    })
    setMintTo('')
    setMintAmount('')
    refetchSupply()
  }

  const handlePauseToggle = async () => {
    await writeContractAsync({
      address: token.address,
      abi: TokenABI,
      functionName: isPaused ? 'unpause' : 'pause',
      args: [],
    })
    refetchPaused()
  }

  return (
    <div className="border rounded-lg p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-base">{token.name}</p>
          <p className="text-sm text-muted-foreground font-mono">{token.symbol}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              isPaused ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-600'
            }`}
          >
            {isPaused ? 'Paused' : 'Active'}
          </span>
          <Button size="sm" variant="outline" onClick={handlePauseToggle}>
            {isPaused ? 'Unpause' : 'Pause'}
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        Total supply:{' '}
        <span className="text-foreground font-medium">
          {totalSupply !== undefined ? formatUnits(totalSupply as bigint, 18) : '—'} {token.symbol}
        </span>
      </div>

      <div className="border-t pt-4 flex flex-col gap-2">
        <p className="text-sm font-medium">Mint tokens</p>
        <input
          className="w-full border rounded-md px-3 py-1.5 text-sm bg-background"
          placeholder="Recipient address (0x...)"
          value={mintTo}
          onChange={(e) => setMintTo(e.target.value)}
        />
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded-md px-3 py-1.5 text-sm bg-background"
            placeholder="Amount"
            type="number"
            min="0"
            value={mintAmount}
            onChange={(e) => setMintAmount(e.target.value)}
          />
          <Button size="sm" onClick={handleMint} disabled={!mintTo || !mintAmount}>
            Mint
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground font-mono break-all">{token.address}</p>
    </div>
  )
}

function DeployTokenForm({ onDeployed }: { onDeployed: () => void }) {
  const { address } = useAccount()
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [isPending, setIsPending] = useState(false)
  const { writeContractAsync } = useWriteContract()

  const handleDeploy = async () => {
    if (!name || !symbol || !address) return
    setIsPending(true)
    try {
      await writeContractAsync({
        address: TOKEN_FACTORY_ADDRESS,
        abi: TokenFactoryABI,
        functionName: 'deployToken',
        args: [name, symbol, address, address, []],
      })
      setName('')
      setSymbol('')
      onDeployed()
    } finally {
      setIsPending(false)
    }
  }

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
        <Button onClick={handleDeploy} disabled={!name || !symbol || isPending}>
          {isPending ? 'Deploying…' : 'Deploy'}
        </Button>
      </div>
    </div>
  )
}

export function IssuerPage() {
  const { address, isConnected } = useAccount()
  const { data: tokens = [], refetch } = useIssuedTokens(address)

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="text-muted-foreground">Connect your wallet to access the Issuer Panel</p>
        <ConnectButton />
      </div>
    )
  }

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
              <IssuerTokenCard key={token.address} token={token} issuer={address!} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
