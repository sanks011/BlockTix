"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext } from "react"
import { ethers } from "ethers"
import Web3Modal from "web3modal"
import WalletConnectProvider from "@walletconnect/web3-provider"
import CoinbaseWalletSDK from "@coinbase/wallet-sdk"

interface Web3ContextType {
  provider: ethers.providers.Web3Provider | null
  signer: ethers.Signer | null
  address: string | null
  chainId: number | null
  connectWallet: (providerType?: string) => Promise<void>
  disconnectWallet: () => Promise<void>
  isConnecting: boolean
  error: Error | null
  walletType: string | null
}

const Web3Context = createContext<Web3ContextType>({
  provider: null,
  signer: null,
  address: null,
  chainId: null,
  connectWallet: async () => {},
  disconnectWallet: async () => {},
  isConnecting: false,
  error: null,
  walletType: null,
})

let web3Modal: Web3Modal

if (typeof window !== "undefined") {
  web3Modal = new Web3Modal({
    network: "mainnet",
    cacheProvider: true,
    providerOptions: {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          infuraId: process.env.NEXT_PUBLIC_INFURA_ID || "",
        },
      },
      coinbasewallet: {
        package: CoinbaseWalletSDK,
        options: {
          appName: "BlockTix",
          infuraId: process.env.NEXT_PUBLIC_INFURA_ID || "",
        },
      },
    },
  })
}

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [walletType, setWalletType] = useState<string | null>(null)

  const connectWallet = async (providerType?: string) => {
    try {
      setIsConnecting(true)
      setError(null)

      let instance

      if (providerType) {
        // Connect to specific provider
        switch (providerType) {
          case "metamask":
            if (window.ethereum) {
              instance = window.ethereum
            } else {
              throw new Error("MetaMask is not installed")
            }
            setWalletType("metamask")
            break
          case "coinbase":
            // Use web3Modal with only Coinbase option
            instance = await web3Modal.connectTo("coinbasewallet")
            setWalletType("coinbase")
            break
          case "walletconnect":
            // Use web3Modal with only WalletConnect option
            instance = await web3Modal.connectTo("walletconnect")
            setWalletType("walletconnect")
            break
          default:
            instance = await web3Modal.connect()
            setWalletType(providerType)
        }
      } else {
        // Let user choose from web3Modal
        instance = await web3Modal.connect()

        // Determine wallet type
        if (instance.isMetaMask) {
          setWalletType("metamask")
        } else if (instance.isCoinbaseWallet) {
          setWalletType("coinbase")
        } else if (instance.isWalletConnect) {
          setWalletType("walletconnect")
        } else {
          setWalletType("unknown")
        }
      }

      const web3Provider = new ethers.providers.Web3Provider(instance)
      const web3Signer = web3Provider.getSigner()
      const accounts = await web3Provider.listAccounts()
      const network = await web3Provider.getNetwork()

      setProvider(web3Provider)
      setSigner(web3Signer)
      setAddress(accounts[0])
      setChainId(network.chainId)

      // Setup event listeners
      instance.on("accountsChanged", (accounts: string[]) => {
        setAddress(accounts[0])
      })

      instance.on("chainChanged", (chainId: number) => {
        window.location.reload()
      })

      instance.on("disconnect", () => {
        disconnectWallet()
      })
    } catch (err) {
      console.error("Error connecting wallet:", err)
      setError(err as Error)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = async () => {
    if (web3Modal) {
      web3Modal.clearCachedProvider()
    }
    setProvider(null)
    setSigner(null)
    setAddress(null)
    setChainId(null)
    setWalletType(null)
  }

  useEffect(() => {
    if (web3Modal && web3Modal.cachedProvider) {
      connectWallet()
    }
  }, [])

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        address,
        chainId,
        connectWallet,
        disconnectWallet,
        isConnecting,
        error,
        walletType,
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}

export const useWeb3 = () => useContext(Web3Context)
