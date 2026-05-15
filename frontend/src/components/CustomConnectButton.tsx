
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from '@/components/ui/button'

export default function CustomConnectButton() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted
        if (!ready) return null

        if (!account) {
          return (
            <Button size="sm" onClick={openConnectModal}>
              Connect Wallet
            </Button>
          )
        }

        if (chain?.unsupported) {
          return (
            <Button size="sm" variant="destructive" onClick={openChainModal}>
              Wrong Network
            </Button>
          )
        }

        return (
          <Button size="sm" variant="outline" onClick={openAccountModal}>
            {account.displayName}
          </Button>
        )
      }}
    </ConnectButton.Custom>
  )
}