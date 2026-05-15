import { useState } from 'react'
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { parseAbiItem } from 'viem'
import { Button } from '@/components/ui/button'
import { TOKEN_FACTORY_ADDRESS, TokenFactoryABI, FROM_BLOCK } from '@/lib/contracts'

const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`

const ROLE_GRANTED_EVENT = parseAbiItem(
  'event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)',
)
const ROLE_REVOKED_EVENT = parseAbiItem(
  'event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)',
)

function useFactoryAdminRole() {
  const client = usePublicClient()
  return useQuery({
    queryKey: ['factory-admin-role'],
    queryFn: async () =>
      client!.readContract({
        address: TOKEN_FACTORY_ADDRESS,
        abi: TokenFactoryABI as never[],
        functionName: 'FACTORY_ADMIN_ROLE',
      }) as Promise<`0x${string}`>,
    enabled: !!client,
  })
}

function useActiveIssuers(factoryAdminRole: `0x${string}` | undefined) {
  const client = usePublicClient()
  return useQuery({
    queryKey: ['active-issuers', factoryAdminRole],
    queryFn: async () => {
      const [granted, revoked] = await Promise.all([
        client!.getLogs({
          address: TOKEN_FACTORY_ADDRESS,
          event: ROLE_GRANTED_EVENT,
          args: { role: factoryAdminRole },
          fromBlock: FROM_BLOCK,
        }),
        client!.getLogs({
          address: TOKEN_FACTORY_ADDRESS,
          event: ROLE_REVOKED_EVENT,
          args: { role: factoryAdminRole },
          fromBlock: FROM_BLOCK,
        }),
      ])

      const revokedSet = new Set(revoked.map(l => (l.args.account as string).toLowerCase()))
      const seen = new Set<string>()
      const active: string[] = []

      for (const log of granted) {
        const account = (log.args.account as string).toLowerCase()
        if (!revokedSet.has(account) && !seen.has(account)) {
          seen.add(account)
          active.push(log.args.account as string)
        }
      }

      return active
    },
    enabled: !!client && !!factoryAdminRole,
  })
}

export function FactoryAdminPage() {
  const { address: wallet, isConnected } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const { data: factoryAdminRole } = useFactoryAdminRole()
  const { data: isAdmin } = useReadContract({
    address: TOKEN_FACTORY_ADDRESS,
    abi: TokenFactoryABI,
    functionName: 'hasRole',
    args: [DEFAULT_ADMIN_ROLE, wallet ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!wallet },
  })
  const { data: issuers = [], refetch } = useActiveIssuers(factoryAdminRole)

  const [grantAddress, setGrantAddress] = useState('')
  const [pending, setPending] = useState(false)

  const handleGrant = async () => {
    if (!factoryAdminRole || !grantAddress) return
    setPending(true)
    try {
      await writeContractAsync({
        address: TOKEN_FACTORY_ADDRESS,
        abi: TokenFactoryABI,
        functionName: 'grantRole',
        args: [factoryAdminRole, grantAddress as `0x${string}`],
      })
      setGrantAddress('')
      refetch()
    } finally { setPending(false) }
  }

  const handleRevoke = async (account: string) => {
    if (!factoryAdminRole) return
    await writeContractAsync({
      address: TOKEN_FACTORY_ADDRESS,
      abi: TokenFactoryABI,
      functionName: 'revokeRole',
      args: [factoryAdminRole, account as `0x${string}`],
    })
    refetch()
  }

  if (!isConnected) {
    return <div className="py-24 text-center text-muted-foreground">Connect your wallet to access factory administration.</div>
  }

  if (isAdmin === false) {
    return (
      <div className="py-24 text-center">
        <p className="font-medium">Access denied</p>
        <p className="text-sm text-muted-foreground mt-1">Your wallet does not have DEFAULT_ADMIN_ROLE on the TokenFactory.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Factory Administration</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage who can deploy tokenized assets</p>
        <p className="text-xs text-muted-foreground font-mono mt-1">{TOKEN_FACTORY_ADDRESS}</p>
      </div>

      {/* Grant new issuer */}
      <div className="border rounded-lg p-5 flex flex-col gap-3">
        <h2 className="font-medium text-sm">Grant issuer role</h2>
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded-md px-3 py-1.5 text-sm bg-background"
            placeholder="Wallet address (0x...)"
            value={grantAddress}
            onChange={e => setGrantAddress(e.target.value)}
          />
          <Button size="sm" disabled={!grantAddress || pending} onClick={handleGrant}>
            {pending ? 'Granting…' : 'Grant'}
          </Button>
        </div>
      </div>

      {/* Current issuers */}
      <div className="border rounded-lg p-5 flex flex-col gap-3">
        <h2 className="font-medium text-sm">Active issuers</h2>
        {issuers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active issuers.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {issuers.map(account => (
              <li key={account} className="flex items-center justify-between gap-3 py-1.5 border-b last:border-0">
                <span className="text-sm font-mono break-all">{account}</span>
                <Button size="sm" variant="destructive" onClick={() => handleRevoke(account)}>
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
