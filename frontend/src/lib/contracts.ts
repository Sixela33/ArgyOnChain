import TokenFactoryArtifact from '@/lib/abis/TokenFactory.json'
import TokenArtifact from '@/lib/abis/Token.json'
import USDCArtifact from '@/lib/abis/USDC.json'

export const TokenFactoryABI = TokenFactoryArtifact.abi as const
export const TokenABI = TokenArtifact.abi as const
export const USDCABI = USDCArtifact.abi as const

export const TOKEN_FACTORY_ADDRESS = import.meta.env.VITE_TOKEN_FACTORY_ADDRESS as `0x${string}`
export const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS as `0x${string}`
export const FROM_BLOCK = BigInt(import.meta.env.VITE_FROM_BLOCK ?? 0)
