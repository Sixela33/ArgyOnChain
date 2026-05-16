import { useState } from 'react'
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { parseAbiItem, keccak256, toBytes } from 'viem'
import { Button } from '@/components/ui/button'
import {
  TOKEN_FACTORY_ADDRESS, TokenFactoryABI, FROM_BLOCK,
  CLAIM_ISSUER_MANAGER_ADDRESS, ClaimIssuerManagerABI,
} from '@/lib/contracts'

const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`
const CLAIM_ISSUER_ADMIN_ROLE = keccak256(toBytes('CLAIM_ISSUER_ADMIN')) as `0x${string}`

const ROLE_GRANTED_EVENT = parseAbiItem(
  'event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)',
)
const ROLE_REVOKED_EVENT = parseAbiItem(
  'event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)',
)
const CLAIM_ISSUER_ADDED_EVENT = parseAbiItem(
  'event ClaimIssuerAdded(address indexed issuer, uint256[] possibleClaims)',
)
const CLAIM_ISSUER_REMOVED_EVENT = parseAbiItem(
  'event ClaimIssuerRemoved(address indexed issuer)',
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

function useActiveFactoryIssuers(factoryAdminRole: `0x${string}` | undefined) {
  const client = usePublicClient()
  return useQuery({
    queryKey: ['active-factory-issuers', factoryAdminRole],
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

function useActiveClaimIssuers() {
  const client = usePublicClient()
  return useQuery({
    queryKey: ['active-claim-issuers'],
    queryFn: async () => {
      const [added, removed] = await Promise.all([
        client!.getLogs({
          address: CLAIM_ISSUER_MANAGER_ADDRESS,
          event: CLAIM_ISSUER_ADDED_EVENT,
          fromBlock: FROM_BLOCK,
        }),
        client!.getLogs({
          address: CLAIM_ISSUER_MANAGER_ADDRESS,
          event: CLAIM_ISSUER_REMOVED_EVENT,
          fromBlock: FROM_BLOCK,
        }),
      ])

      const removedSet = new Set(removed.map(l => (l.args.issuer as string).toLowerCase()))
      const seen = new Set<string>()
      const active: string[] = []

      for (const log of added) {
        const issuer = (log.args.issuer as string).toLowerCase()
        if (!removedSet.has(issuer) && !seen.has(issuer)) {
          seen.add(issuer)
          active.push(log.args.issuer as string)
        }
      }

      return active
    },
    enabled: !!client,
  })
}

// ─── Factory Issuers Section ──────────────────────────────────────────────────

function FactoryIssuersSection({ wallet }: { wallet: `0x${string}` }) {
  const { writeContractAsync } = useWriteContract()
  const { data: factoryAdminRole } = useFactoryAdminRole()
  const { data: issuers = [], refetch } = useActiveFactoryIssuers(factoryAdminRole)
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Factory Administration</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage who can deploy tokenized assets</p>
        <p className="text-xs text-muted-foreground font-mono mt-1">{TOKEN_FACTORY_ADDRESS}</p>
      </div>

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

// ─── Claim Issuers Section ────────────────────────────────────────────────────

function ClaimIssuersSection({ wallet }: { wallet: `0x${string}` }) {
  const { writeContractAsync } = useWriteContract()
  const { data: claimIssuers = [], refetch } = useActiveClaimIssuers()
  const { data: isClaimAdmin } = useReadContract({
    address: CLAIM_ISSUER_MANAGER_ADDRESS,
    abi: ClaimIssuerManagerABI,
    functionName: 'hasRole',
    args: [CLAIM_ISSUER_ADMIN_ROLE, wallet],
  })

  const [issuerAddress, setIssuerAddress] = useState('')
  const [claimsInput, setClaimsInput] = useState('')
  const [pending, setPending] = useState(false)

  const parsedClaims: bigint[] = claimsInput
    .split(',')
    .map(s => s.trim())
    .filter(s => s !== '' && /^\d+$/.test(s))
    .map(s => BigInt(s))

  const handleAdd = async () => {
    if (!issuerAddress || parsedClaims.length === 0) return
    setPending(true)
    try {
      await writeContractAsync({
        address: CLAIM_ISSUER_MANAGER_ADDRESS,
        abi: ClaimIssuerManagerABI,
        functionName: 'addClaimIssuer',
        args: [issuerAddress as `0x${string}`, parsedClaims],
      })
      setIssuerAddress('')
      setClaimsInput('')
      refetch()
    } finally { setPending(false) }
  }

  const handleRemove = async (issuer: string) => {
    await writeContractAsync({
      address: CLAIM_ISSUER_MANAGER_ADDRESS,
      abi: ClaimIssuerManagerABI,
      functionName: 'removeClaimIssuer',
      args: [issuer as `0x${string}`],
    })
    refetch()
  }

  return (
    <div className="flex flex-col gap-6 pt-8 border-t">
      <div>
        <h2 className="text-xl font-semibold">Claim Issuers</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage who can issue compliance claims to identities</p>
        <p className="text-xs text-muted-foreground font-mono mt-1">{CLAIM_ISSUER_MANAGER_ADDRESS}</p>
      </div>

      {isClaimAdmin === false ? (
        <p className="text-sm text-muted-foreground">
          Your wallet does not have <span className="font-mono">CLAIM_ISSUER_ADMIN</span> on the ClaimIssuerManager.
        </p>
      ) : (
        <>
          <div className="border rounded-lg p-5 flex flex-col gap-3">
            <h3 className="font-medium text-sm">Add claim issuer</h3>
            <div className="flex gap-2">
              <input
                className="flex-1 border rounded-md px-3 py-1.5 text-sm bg-background"
                placeholder="Issuer address (0x...)"
                value={issuerAddress}
                onChange={e => setIssuerAddress(e.target.value)}
              />
              <input
                className="w-40 border rounded-md px-3 py-1.5 text-sm bg-background"
                placeholder="Claim IDs (e.g. 1,2)"
                value={claimsInput}
                onChange={e => setClaimsInput(e.target.value)}
              />
              <Button
                size="sm"
                disabled={!issuerAddress || parsedClaims.length === 0 || pending}
                onClick={handleAdd}
              >
                {pending ? 'Adding…' : 'Add'}
              </Button>
            </div>
          </div>

          <div className="border rounded-lg p-5 flex flex-col gap-3">
            <h3 className="font-medium text-sm">Active claim issuers</h3>
            {claimIssuers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active claim issuers.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {claimIssuers.map(issuer => (
                  <li key={issuer} className="flex items-center justify-between gap-3 py-1.5 border-b last:border-0">
                    <span className="text-sm font-mono break-all">{issuer}</span>
                    <Button size="sm" variant="destructive" onClick={() => handleRemove(issuer)}>
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function FactoryAdminPage() {
  const { address: wallet, isConnected } = useAccount()
  const { data: isAdmin } = useReadContract({
    address: TOKEN_FACTORY_ADDRESS,
    abi: TokenFactoryABI,
    functionName: 'hasRole',
    args: [DEFAULT_ADMIN_ROLE, wallet ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!wallet },
  })

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
      <FactoryIssuersSection wallet={wallet!} />
      <ClaimIssuersSection wallet={wallet!} />
    </div>
  )
}
