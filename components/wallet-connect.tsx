"use client"

import { useState, useEffect } from "react"
import { Wallet, ChevronDown, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useWeb3 } from "@/lib/hooks/use-web3"
import { useToast } from "@/components/ui/use-toast"

export function WalletConnect() {
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()
  const { address, connectWallet, disconnectWallet, isConnecting, error, walletType } = useWeb3()

  // Handle connection errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Wallet Connection Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }, [error, toast])

  const handleConnect = async (walletType: string) => {
    try {
      await connectWallet(walletType)
      setIsOpen(false)
    } catch (err) {
      console.error("Failed to connect wallet:", err)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnectWallet()
    } catch (err) {
      console.error("Failed to disconnect wallet:", err)
    }
  }

  // Format wallet address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  // Get wallet icon based on type
  const getWalletIcon = (type: string | null) => {
    switch (type) {
      case "metamask":
        return "M"
      case "coinbase":
        return "C"
      case "walletconnect":
        return "W"
      default:
        return "W"
    }
  }

  // Get wallet color based on type
  const getWalletColor = (type: string | null) => {
    switch (type) {
      case "metamask":
        return "bg-orange-500"
      case "coinbase":
        return "bg-blue-500"
      case "walletconnect":
        return "bg-zinc-700"
      default:
        return "bg-purple-500"
    }
  }

  if (address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="border-zinc-800 bg-zinc-900/50 backdrop-blur hover:bg-zinc-800">
            <div className="flex items-center">
              <div className={`h-2 w-2 rounded-full bg-green-500 mr-2`} />
              <div
                className={`w-5 h-5 mr-2 rounded-full ${getWalletColor(walletType)} flex items-center justify-center text-white text-xs font-bold`}
              >
                {getWalletIcon(walletType)}
              </div>
              <span className="font-mono text-xs truncate w-24 md:w-32">{formatAddress(address)}</span>
              <ChevronDown className="ml-2 h-4 w-4" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800">
          <DropdownMenuLabel>My Wallet</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-zinc-800" />
          <DropdownMenuItem className="cursor-pointer" asChild>
            <a
              href={`https://etherscan.io/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex justify-between items-center"
            >
              <span>View on Etherscan</span>
              <span className="text-xs text-zinc-500">↗</span>
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={() => navigator.clipboard.writeText(address)}>
            Copy Address
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-zinc-800" />
          <DropdownMenuItem className="cursor-pointer" asChild>
            <a href="/dashboard">Dashboard</a>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" asChild>
            <a href="/my-tickets">My Tickets</a>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" asChild>
            <a href="/my-events">My Events</a>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-zinc-800" />
          <DropdownMenuItem className="cursor-pointer text-red-500 focus:text-red-500" onClick={handleDisconnect}>
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-zinc-800 bg-zinc-900/50 backdrop-blur hover:bg-zinc-800"
          disabled={isConnecting}
        >
          <Wallet className="mr-2 h-4 w-4" />
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle>Connect your wallet</DialogTitle>
          <DialogDescription>Connect your wallet to buy and sell tickets as NFTs.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button
            variant="outline"
            className="flex justify-between items-center border-zinc-800 hover:border-purple-500 hover:bg-purple-500/10"
            onClick={() => handleConnect("metamask")}
            disabled={isConnecting}
          >
            <div className="flex items-center">
              <div className="w-8 h-8 mr-3 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                M
              </div>
              MetaMask
            </div>
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          </Button>

          <Button
            variant="outline"
            className="flex justify-between items-center border-zinc-800 hover:border-purple-500 hover:bg-purple-500/10"
            onClick={() => handleConnect("coinbase")}
            disabled={isConnecting}
          >
            <div className="flex items-center">
              <div className="w-8 h-8 mr-3 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                C
              </div>
              Coinbase Wallet
            </div>
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          </Button>

          <Button
            variant="outline"
            className="flex justify-between items-center border-zinc-800 hover:border-purple-500 hover:bg-purple-500/10"
            onClick={() => handleConnect("walletconnect")}
            disabled={isConnecting}
          >
            <div className="flex items-center">
              <div className="w-8 h-8 mr-3 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold">
                W
              </div>
              WalletConnect
            </div>
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          </Button>

          <Button
            variant="outline"
            className="flex justify-between items-center border-zinc-800 hover:border-purple-500 hover:bg-purple-500/10"
            onClick={() => handleConnect("phantom")}
            disabled={isConnecting}
          >
            <div className="flex items-center">
              <div className="w-8 h-8 mr-3 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                P
              </div>
              Phantom
            </div>
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          </Button>
        </div>
        <div className="flex items-center border border-zinc-800 rounded-lg p-3 bg-zinc-950">
          <AlertCircle className="h-4 w-4 text-zinc-500 mr-2 flex-shrink-0" />
          <p className="text-xs text-zinc-400">
            By connecting your wallet, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
