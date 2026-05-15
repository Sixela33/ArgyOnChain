import { useAccount, useWriteContract, usePublicClient, useReadContract } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { formatUnits, parseUnits, parseAbiItem } from 'viem'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from '@/components/ui/button'
import { TOKEN_FACTORY_ADDRESS, USDC_ADDRESS, TokenFactoryABI, TokenABI, USDCABI, FROM_BLOCK } from '@/lib/contracts'

const TOKEN_CREATED_EVENT = parseAbiItem(
  'event TokenCreated(address indexed token, address indexed defaultAdmin, string name, string symbol, uint256[] requiredClaims, uint256 initialSupply)',
)

type TokenInfo = {
  address: `0x${string}`
  name: string
  symbol: string
}

function useAllTokens() {
  const client = usePublicClient()
  return useQuery({
    queryKey: ['all-tokens'],
    queryFn: async () => {
      const logs = await client!.getLogs({
        address: TOKEN_FACTORY_ADDRESS,
        event: TOKEN_CREATED_EVENT,
        fromBlock: FROM_BLOCK,
      })
      return logs.map((log) => ({
        address: log.args.token as `0x${string}`,
        name: log.args.name as string,
        symbol: log.args.symbol as string,
      }))
    },
    enabled: !!client,
    refetchInterval: 15_000,
  })
}

function TokenCard({ token, investor }: { token: TokenInfo; investor: `0x${string}` | undefined }) {
  const { data: totalSupply } = useReadContract({
    address: token.address,
    abi: TokenABI,
    functionName: 'totalSupply',
  })

  const { data: balance } = useReadContract({
    address: token.address,
    abi: TokenABI,
    functionName: 'balanceOf',
    args: [investor ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!investor },
  })

  const { data: isPaused } = useReadContract({
    address: token.address,
    abi: TokenABI,
    functionName: 'paused',
  })

  const supply = totalSupply !== undefined ? Number(formatUnits(totalSupply as bigint, 18)).toLocaleString() : '—'
  const holding = balance !== undefined ? Number(formatUnits(balance as bigint, 18)).toLocaleString() : '—'

  return (
    <div className="border rounded-lg p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold">{token.name}</p>
          <p className="text-sm text-muted-foreground font-mono">{token.symbol}</p>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isPaused ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-600'
          }`}
        >
          {isPaused ? 'Paused' : 'Active'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total shares</p>
          <p className="font-medium">{supply}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Your holdings</p>
          <p className="font-medium">{holding} {token.symbol}</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground font-mono break-all">{token.address}</p>
    </div>
  )
}

function USDCWidget({ investor }: { investor: `0x${string}` }) {
  const { writeContractAsync } = useWriteContract()

  const { data: usdcBalance, refetch } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDCABI,
    functionName: 'balanceOf',
    args: [investor],
  })

  const handleMintUSDC = async () => {
    await writeContractAsync({
      address: USDC_ADDRESS,
      abi: USDCABI,
      functionName: 'mint',
      args: [investor, parseUnits('10000', 6)],
    })
    refetch()
  }

  const balance = usdcBalance !== undefined
    ? Number(formatUnits(usdcBalance as bigint, 6)).toLocaleString(undefined, { maximumFractionDigits: 2 })
    : '—'

  return (
    <div className="flex items-center gap-4 border rounded-lg px-5 py-3">
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">USDC Balance</p>
        <p className="font-semibold">${balance}</p>
      </div>
      <Button size="sm" variant="outline" onClick={handleMintUSDC}>
        Get testnet USDC
      </Button>
    </div>
  )
}

export function InvestorPage() {
  const { address, isConnected } = useAccount()
  const { data: tokens = [], isLoading } = useAllTokens()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Marketplace</h1>
          <p className="text-sm text-muted-foreground mt-1">Tokenized LATAM stocks on Avalanche</p>
        </div>
        {isConnected && address ? (
          <USDCWidget investor={address} />
        ) : (
          <ConnectButton />
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading tokens…</p>
      ) : tokens.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tokenized assets available yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tokens.map((token) => (
            <TokenCard key={token.address} token={token} investor={address} />
          ))}
        </div>
      )}
    </div>
  )
}
