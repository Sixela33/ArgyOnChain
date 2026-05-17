import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { parseUnits, formatUnits } from 'viem'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TokenABI } from '@/lib/contracts'

const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`

const ROLE_LABELS: Record<string, string> = {
  MINTER_ROLE: 'Minter',
  BURNER_ROLE: 'Burner',
  PAUSER_ROLE: 'Pauser',
  FREEZER_ROLE: 'Freezer',
  ENFORCER_ROLE: 'Enforcer',
  DEFAULT_ADMIN_ROLE: 'Admin',
}

type Permissions = {
  isMinter: boolean
  isBurner: boolean
  isPauser: boolean
  isFreezer: boolean
  isEnforcer: boolean
  isAdmin: boolean
  roles: Record<string, `0x${string}`>
}

function useTokenPermissions(tokenAddress: `0x${string}`, wallet: `0x${string}` | undefined) {
  const client = usePublicClient()
  return useQuery<Permissions>({
    queryKey: ['token-permissions', tokenAddress, wallet],
    queryFn: async () => {
      const read = (functionName: string, args?: unknown[]) =>
        client!.readContract({ address: tokenAddress, abi: TokenABI as never[], functionName, args })

      const [minterRole, burnerRole, pauserRole, freezerRole, enforcerRole] = await Promise.all([
        read('MINTER_ROLE'),
        read('BURNER_ROLE'),
        read('PAUSER_ROLE'),
        read('FREEZER_ROLE'),
        read('ENFORCER_ROLE'),
      ]) as `0x${string}`[]

      const [isMinter, isBurner, isPauser, isFreezer, isEnforcer, isAdmin] = await Promise.all([
        read('hasRole', [minterRole, wallet]),
        read('hasRole', [burnerRole, wallet]),
        read('hasRole', [pauserRole, wallet]),
        read('hasRole', [freezerRole, wallet]),
        read('hasRole', [enforcerRole, wallet]),
        read('hasRole', [DEFAULT_ADMIN_ROLE, wallet]),
      ]) as boolean[]

      return {
        isMinter, isBurner, isPauser, isFreezer, isEnforcer, isAdmin,
        roles: { MINTER_ROLE: minterRole, BURNER_ROLE: burnerRole, PAUSER_ROLE: pauserRole, FREEZER_ROLE: freezerRole, ENFORCER_ROLE: enforcerRole, DEFAULT_ADMIN_ROLE },
      }
    },
    enabled: !!client && !!wallet,
  })
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="border rounded-xl p-5 flex flex-col gap-3" style={{ borderColor: 'rgba(0,255,110,0.10)' }}>
      <div>
        <h3 className="font-medium text-sm">{title}</h3>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  )
}

function AddressAmountForm({ label, onSubmit }: { label: string; onSubmit: (to: string, amount: string) => Promise<void> }) {
  const [addr, setAddr] = useState('')
  const [amount, setAmount] = useState('')
  const [pending, setPending] = useState(false)
  const handle = async () => {
    setPending(true)
    try { await onSubmit(addr, amount); setAddr(''); setAmount('') }
    finally { setPending(false) }
  }
  return (
    <div className="flex flex-col gap-2">
      <input className="border rounded-md px-3 py-1.5 text-sm bg-background" placeholder="Address (0x...)" value={addr} onChange={e => setAddr(e.target.value)} />
      <div className="flex gap-2">
        <input className="flex-1 border rounded-md px-3 py-1.5 text-sm bg-background" placeholder="Amount" type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} />
        <Button size="sm" disabled={!addr || !amount || pending} onClick={handle}>{pending ? 'Sending…' : label}</Button>
      </div>
    </div>
  )
}

function ThreeAddressForm({ label, onSubmit }: { label: string; onSubmit: (from: string, to: string, amount: string) => Promise<void> }) {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [pending, setPending] = useState(false)
  const handle = async () => {
    setPending(true)
    try { await onSubmit(from, to, amount); setFrom(''); setTo(''); setAmount('') }
    finally { setPending(false) }
  }
  return (
    <div className="flex flex-col gap-2">
      <input className="border rounded-md px-3 py-1.5 text-sm bg-background" placeholder="From address (0x...)" value={from} onChange={e => setFrom(e.target.value)} />
      <input className="border rounded-md px-3 py-1.5 text-sm bg-background" placeholder="To address (0x...)" value={to} onChange={e => setTo(e.target.value)} />
      <div className="flex gap-2">
        <input className="flex-1 border rounded-md px-3 py-1.5 text-sm bg-background" placeholder="Amount" type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} />
        <Button size="sm" disabled={!from || !to || !amount || pending} onClick={handle}>{pending ? 'Sending…' : label}</Button>
      </div>
    </div>
  )
}

export function TokenManagePage() {
  const { address: tokenAddress } = useParams<{ address: `0x${string}` }>()
  const { address: wallet, isConnected } = useAccount()
  const { writeContractAsync } = useWriteContract()

  const addr = tokenAddress as `0x${string}`
  const write = (functionName: string, args: unknown[]) =>
    writeContractAsync({ address: addr, abi: TokenABI as never[], functionName, args })

  const { data: tokenName } = useReadContract({ address: addr, abi: TokenABI, functionName: 'name' })
  const { data: tokenSymbol } = useReadContract({ address: addr, abi: TokenABI, functionName: 'symbol' })
  const { data: totalSupply, refetch: refetchSupply } = useReadContract({ address: addr, abi: TokenABI, functionName: 'totalSupply' })
  const { data: isPaused, refetch: refetchPaused } = useReadContract({ address: addr, abi: TokenABI, functionName: 'paused' })
  const { data: requiredClaims } = useReadContract({ address: addr, abi: TokenABI, functionName: 'getRequiredClaims' })
  const { data: perms, refetch: refetchPerms } = useTokenPermissions(addr, wallet)

  const [newClaims, setNewClaims] = useState('')
  const [roleAction, setRoleAction] = useState<'grant' | 'revoke'>('grant')
  const [roleTarget, setRoleTarget] = useState('')
  const [selectedRole, setSelectedRole] = useState('MINTER_ROLE')
  const [rolePending, setRolePending] = useState(false)

  const handleRoleAction = async () => {
    if (!perms || !roleTarget) return
    setRolePending(true)
    try {
      const roleBytes = perms.roles[selectedRole]
      await write(roleAction === 'grant' ? 'grantRole' : 'revokeRole', [roleBytes, roleTarget])
      setRoleTarget('')
      refetchPerms()
    } finally { setRolePending(false) }
  }

  const handleSetClaims = async () => {
    const ids = newClaims.split(',').map(s => BigInt(s.trim())).filter(n => !isNaN(Number(n)))
    await write('setRequiredClaims', [ids])
    setNewClaims('')
  }

  if (!isConnected) return (
    <div className="py-24 text-center text-muted-foreground">Connect your wallet to manage this token.</div>
  )

  const activeBadges = perms ? Object.entries({
    isMinter: 'Minter', isBurner: 'Burner', isPauser: 'Pauser',
    isFreezer: 'Freezer', isEnforcer: 'Enforcer', isAdmin: 'Admin',
  }).filter(([k]) => perms[k as keyof Permissions] === true).map(([, v]) => v) : []

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <Link to="/issuer" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft size={14} /> Back to Issuer Panel
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{String(tokenName ?? '…')} <span className="text-muted-foreground font-normal">({String(tokenSymbol ?? '…')})</span></h1>
            <p className="text-xs text-muted-foreground font-mono mt-1">{addr}</p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isPaused ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-600'}`}>
            {isPaused ? 'Paused' : 'Active'}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Total supply: <span className="text-foreground font-medium">{totalSupply !== undefined ? Number(formatUnits(totalSupply as bigint, 18)).toLocaleString() : '—'} {String(tokenSymbol ?? '')}</span>
        </p>
      </div>

      {/* Role badges */}
      {activeBadges.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Your roles:</span>
          {activeBadges.map(r => (
            <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{r}</span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mint */}
        {perms?.isMinter && (
          <Section title="Mint tokens" desc="Issue new tokens to a wallet that has an identity and required claims.">
            <AddressAmountForm label="Mint" onSubmit={async (to, amt) => { await write('mint', [to, parseUnits(amt, 18)]); refetchSupply() }} />
          </Section>
        )}

        {/* Burn */}
        {perms?.isBurner && (
          <Section title="Burn from address" desc="Destroy tokens from a wallet. Requires prior approval from that address.">
            <AddressAmountForm label="Burn" onSubmit={async (from, amt) => { await write('burnFrom', [from, parseUnits(amt, 18)]); refetchSupply() }} />
          </Section>
        )}

        {/* Pause */}
        {perms?.isPauser && (
          <Section title="Pause / Unpause" desc="Halt all transfers globally. Use in emergencies only.">
            <p className="text-sm text-muted-foreground">Status: <span className="text-foreground font-medium">{isPaused ? 'Paused' : 'Active'}</span></p>
            <Button
              size="sm"
              variant={isPaused ? 'default' : 'destructive'}
              onClick={async () => {
                if (!isPaused && !window.confirm('Pause all token transfers? This affects every holder immediately.')) return
                await write(isPaused ? 'unpause' : 'pause', [])
                refetchPaused()
              }}
            >
              {isPaused ? 'Unpause trading' : 'Pause trading'}
            </Button>
          </Section>
        )}

        {/* Forced transfer */}
        {perms?.isEnforcer && (
          <Section title="Forced transfer" desc="Move tokens between wallets regardless of restrictions. For regulatory compliance use.">
            <ThreeAddressForm label="Transfer" onSubmit={async (from, to, amt) => { await write('forcedTransfer', [from, to, parseUnits(amt, 18)]) }} />
          </Section>
        )}

        {/* Freeze */}
        {perms?.isFreezer && (
          <Section title="Freeze tokens" desc="Lock a specific amount in a wallet. Frozen tokens cannot be transferred.">
            <AddressAmountForm label="Freeze" onSubmit={async (user, amt) => { await write('setFrozenTokens', [user, parseUnits(amt, 18)]) }} />
          </Section>
        )}

        {/* Required claims */}
        {perms?.isAdmin && (
          <Section title="Required claims" desc="Define which compliance claim IDs holders must have to send or receive tokens.">
            <p className="text-xs text-muted-foreground">
              Current: <span className="font-mono text-foreground">{requiredClaims && (requiredClaims as bigint[]).length > 0 ? (requiredClaims as bigint[]).join(', ') : 'none'}</span>
            </p>
            <div className="flex gap-2">
              <input className="flex-1 border rounded-md px-3 py-1.5 text-sm bg-background" placeholder="1, 2, 3 (comma separated)" value={newClaims} onChange={e => setNewClaims(e.target.value)} />
              <Button size="sm" disabled={!newClaims} onClick={handleSetClaims}>Update</Button>
            </div>
          </Section>
        )}

        {/* Grant / Revoke role */}
        {perms?.isAdmin && (
          <Section title="Grant / Revoke role" desc="Assign or remove operational permissions for a wallet on this token.">
            <div className="flex gap-2">
              <select className="border rounded-md px-2 py-1.5 text-sm bg-background flex-1" value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
                {Object.keys(ROLE_LABELS).map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
              <select className="border rounded-md px-2 py-1.5 text-sm bg-background" value={roleAction} onChange={e => setRoleAction(e.target.value as 'grant' | 'revoke')}>
                <option value="grant">Grant</option>
                <option value="revoke">Revoke</option>
              </select>
            </div>
            <div className="flex gap-2">
              <input className="flex-1 border rounded-md px-3 py-1.5 text-sm bg-background" placeholder="Address (0x...)" value={roleTarget} onChange={e => setRoleTarget(e.target.value)} />
              <Button size="sm" disabled={!roleTarget || rolePending} onClick={handleRoleAction}>{rolePending ? '…' : 'Apply'}</Button>
            </div>
          </Section>
        )}
      </div>

      {activeBadges.length === 0 && !perms && (
        <p className="text-sm text-muted-foreground">Loading permissions…</p>
      )}
      {perms && activeBadges.length === 0 && (
        <p className="text-sm text-muted-foreground">Your wallet has no roles on this token.</p>
      )}
    </div>
  )
}
