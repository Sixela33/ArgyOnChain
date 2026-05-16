import { encodeAbiParameters, parseAbiParameters } from 'viem'

type VerificationData = { input: unknown; solcLongVersion: string }
let cached: VerificationData | null = null

async function getVerificationData(): Promise<VerificationData> {
  if (!cached) {
    cached = (await import('@/lib/tokenVerification.json')).default as VerificationData
  }
  return cached
}

const ROUTESCAN_API =
  import.meta.env.VITE_SNOWTRACE_API_URL ??
  'https://api.routescan.io/v2/network/testnet/evm/43113/etherscan/api'

export type VerifyResult = { status: string; result: string; message: string }

export async function verifyToken(params: {
  address: `0x${string}`
  name: string
  symbol: string
  defaultAdmin: `0x${string}`
  enforcer: `0x${string}`
  identityFactory: `0x${string}`
  requiredClaims?: bigint[]
}): Promise<VerifyResult> {
  const data = await getVerificationData()

  const constructorArgs = encodeAbiParameters(
    parseAbiParameters('string, string, address, address, address, uint256[]'),
    [
      params.name,
      params.symbol,
      params.defaultAdmin,
      params.enforcer,
      params.identityFactory,
      params.requiredClaims ?? [],
    ],
  ).slice(2) // strip 0x prefix

  const body = new URLSearchParams({
    module: 'contract',
    action: 'verifysourcecode',
    contractaddress: params.address,
    sourceCode: JSON.stringify(data.input),
    codeformat: 'solidity-standard-json-input',
    contractname: 'src/Token.sol:Token',
    compilerversion: `v${data.solcLongVersion}`,
    constructorArguements: constructorArgs,
    apikey: import.meta.env.VITE_SNOWTRACE_API_KEY ?? '',
  })

  const res = await fetch(ROUTESCAN_API, { method: 'POST', body })
  const json = await res.json()
  console.log('[verifyToken] API response:', JSON.stringify(json))
  return json
}
