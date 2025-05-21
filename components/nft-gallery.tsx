"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Ticket } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { useWeb3 } from "@/lib/hooks/use-web3"

export function NFTGallery() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [nfts, setNfts] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { address, connectWallet } = useWeb3()

  useEffect(() => {
    async function fetchNFTs() {
      try {
        const q = query(
          collection(db, "tickets"),
          where("isNFT", "==", true),
          orderBy("purchaseDate", "desc"),
          limit(4),
        )

        const querySnapshot = await getDocs(q)
        const nftsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Ticket[]

        setNfts(nftsList)
      } catch (err) {
        console.error("Error fetching NFTs:", err)
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchNFTs()
  }, [])

  const nextNft = () => {
    setCurrentIndex((prev) => (prev + 1) % nfts.length)
  }

  const prevNft = () => {
    setCurrentIndex((prev) => (prev - 1 + nfts.length) % nfts.length)
  }

  if (loading) {
    return (
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl blur-3xl -z-10" />
        <div className="grid md:grid-cols-2 gap-8 rounded-3xl border border-zinc-800 bg-zinc-900/50 backdrop-blur p-6 md:p-8">
          <Skeleton className="aspect-square rounded-xl" />
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <div className="space-y-4 mb-6">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || nfts.length === 0) {
    return (
      <div className="p-6 text-center border border-zinc-800 bg-zinc-900/50 backdrop-blur rounded-xl">
        <p className="text-zinc-400">No NFT tickets available at the moment.</p>
        <Button
          className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          asChild
        >
          <Link href="/marketplace">Explore Marketplace</Link>
        </Button>
      </div>
    )
  }

  const currentNft = nfts[currentIndex]
  const rarityLevel = getRarityLevel(currentNft)

  function getRarityLevel(ticket: Ticket) {
    // This would normally be determined by the NFT metadata
    // For now, we'll use a simple algorithm based on the ticket price
    if (ticket.purchasePrice > 1.0) return "Legendary"
    if (ticket.purchasePrice > 0.5) return "Epic"
    if (ticket.purchasePrice > 0.2) return "Rare"
    return "Common"
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl blur-3xl -z-10" />
      <div className="grid md:grid-cols-2 gap-8 rounded-3xl border border-zinc-800 bg-zinc-900/50 backdrop-blur p-6 md:p-8">
        <div className="relative aspect-square rounded-xl overflow-hidden">
          <Image
            src={`/placeholder.svg?height=400&width=400&text=NFT%20Ticket%20%23${currentNft.tokenId || "000"}`}
            alt={`NFT Ticket #${currentNft.tokenId}`}
            fill
            className="object-cover"
          />
          <Badge className="absolute top-3 right-3 bg-gradient-to-r from-purple-600 to-pink-600">{rarityLevel}</Badge>
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold">Event Ticket #{currentNft.tokenId || "000"}</h3>
                <p className="text-zinc-400 text-sm">Token ID: {currentNft.tokenId || "N/A"}</p>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full" asChild>
                <a href={`https://etherscan.io/token/${currentNft.tokenId}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  <span className="sr-only">View on marketplace</span>
                </a>
              </Button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <div className="text-sm text-zinc-400 mb-1">Current Price</div>
                <div className="text-2xl font-bold">
                  {currentNft.purchasePrice} {currentNft.purchaseCurrency}
                </div>
              </div>

              <div>
                <div className="text-sm text-zinc-400 mb-1">Owner</div>
                <div className="font-mono text-sm bg-zinc-800 rounded-full px-3 py-1 inline-block">
                  {currentNft.ownerAddress.substring(0, 6)}...
                  {currentNft.ownerAddress.substring(currentNft.ownerAddress.length - 4)}
                </div>
              </div>

              <div>
                <div className="text-sm text-zinc-400 mb-1">Benefits</div>
                <ul className="text-sm space-y-1">
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2">•</span>
                    Exclusive access to VIP areas
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2">•</span>
                    Limited edition digital collectibles
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2">•</span>
                    Priority access to future events
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            {address ? (
              <Button
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                asChild
              >
                <Link href={`/marketplace/${currentNft.id}`}>Make Offer</Link>
              </Button>
            ) : (
              <Button
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={() => connectWallet()}
              >
                Connect Wallet
              </Button>
            )}
            <div className="flex border border-zinc-800 rounded-lg overflow-hidden">
              <Button variant="ghost" size="icon" onClick={prevNft} className="rounded-none border-r border-zinc-800">
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous NFT</span>
              </Button>
              <Button variant="ghost" size="icon" onClick={nextNft} className="rounded-none">
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next NFT</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
