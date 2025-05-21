"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Fundraising } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Coins, Calendar } from "lucide-react"

export function FundraisingCampaigns() {
  const [campaigns, setCampaigns] = useState<Fundraising[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const q = query(
          collection(db, "campaigns"),
          where("endDate", ">", new Date()),
          orderBy("endDate", "asc"),
          limit(3),
        )

        const querySnapshot = await getDocs(q)
        const campaignsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Fundraising[]

        setCampaigns(campaignsList)
      } catch (err) {
        console.error("Error fetching fundraising campaigns:", err)
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchCampaigns()
  }, [])

  if (loading) {
    return (
      <div className="grid md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur overflow-hidden">
            <Skeleton className="h-40 w-full" />
            <div className="p-4 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center border border-red-500/20 bg-red-500/10 rounded-xl">
        <p className="text-red-400">Failed to load fundraising campaigns. Please try again later.</p>
      </div>
    )
  }

  if (campaigns.length === 0) {
    return (
      <div className="p-6 text-center border border-zinc-800 bg-zinc-900/50 backdrop-blur rounded-xl">
        <p className="text-zinc-400">No active fundraising campaigns at the moment.</p>
        <Button
          className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          asChild
        >
          <Link href="/fundraising/create">Start a Fundraiser</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {campaigns.map((campaign) => {
        const percentRaised = Math.min(Math.round((campaign.current / campaign.goal) * 100), 100)
        const endDate = campaign.endDate.toDate()
        const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))

        return (
          <div
            key={campaign.id}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur overflow-hidden hover:border-purple-500/50 transition-all hover:shadow-md hover:shadow-purple-500/10 hover:translate-y-[-5px]"
          >
            <div className="h-40 relative">
              <Image
                src={campaign.image || `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(campaign.title)}`}
                alt={campaign.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="font-bold text-lg line-clamp-1">{campaign.title}</h3>
                <div className="flex items-center text-sm text-zinc-300">
                  <Calendar className="h-3 w-3 mr-1 text-purple-400" />
                  <span>{daysLeft} days left</span>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-zinc-400 line-clamp-2">{campaign.description}</p>

              <div className="space-y-1">
                <Progress value={percentRaised} className="h-2" />
                <div className="flex justify-between text-sm">
                  <div className="font-medium">
                    {campaign.current} {campaign.currency}
                  </div>
                  <div className="text-zinc-400">
                    of {campaign.goal} {campaign.currency}
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                asChild
              >
                <Link href={`/fundraising/${campaign.id}`}>
                  <Coins className="mr-2 h-4 w-4" />
                  Contribute
                </Link>
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
