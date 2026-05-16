import type { Abi } from 'viem'
import TokenFactoryArtifact from '@/lib/abis/TokenFactory.json'
import TokenArtifact from '@/lib/abis/Token.json'
import USDCArtifact from '@/lib/abis/USDC.json'
import ClaimIssuerManagerArtifact from '@/lib/abis/ClaimIssuerManager.json'

export const TokenFactoryABI: Abi = TokenFactoryArtifact.abi
export const TokenABI: Abi = TokenArtifact.abi
export const USDCABI: Abi = USDCArtifact.abi
export const ClaimIssuerManagerABI: Abi = ClaimIssuerManagerArtifact.abi

export const TOKEN_FACTORY_ADDRESS = import.meta.env.VITE_TOKEN_FACTORY_ADDRESS as `0x${string}`
export const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS as `0x${string}`
export const IDENTITY_FACTORY_ADDRESS = import.meta.env.VITE_IDENTITY_FACTORY_ADDRESS as `0x${string}`
export const CLAIM_ISSUER_MANAGER_ADDRESS = import.meta.env.VITE_CLAIM_ISSUER_MANAGER_ADDRESS as `0x${string}`
export const FROM_BLOCK = BigInt(import.meta.env.VITE_FROM_BLOCK ?? 0)
