"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Calendar, MapPin, Users, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useEvents } from "@/lib/hooks/use-events"
import { Skeleton } from "@/components/ui/skeleton"
import { useWeb3 } from "@/lib/hooks/use-web3"

export function FeaturedEvent() {
  const [ticketCount, setTicketCount] = useState(1)
  const { events, loading, error } = useEvents({ featured: true, limit: 1 })
  const { address, connectWallet } = useWeb3()

  const featuredEvent = events && events.length > 0 ? events[0] : null

  if (loading) {
    return (
      <div className="overflow-hidden">
        <div className="relative aspect-video">
          <Skeleton className="w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        </div>
        <div className="p-6 space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !featuredEvent) {
    return (
      <div className="p-6 text-center border border-zinc-800 bg-zinc-900/50 backdrop-blur rounded-xl">
        <p className="text-zinc-400">No featured event available at the moment.</p>
      </div>
    )
  }

  const ticketType = featuredEvent.ticketTypes[0]
  const ticketPercentRemaining = Math.round(((ticketType.supply - ticketType.sold) / ticketType.supply) * 100)
  const eventDate = featuredEvent.startDate.toDate()
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(eventDate)

  return (
    <div className="overflow-hidden">
      <div className="relative aspect-video">
        <Image
          src={featuredEvent.bannerImage || "/placeholder.svg?height=600&width=1200"}
          alt={featuredEvent.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 z-10">
          <Badge className="mb-2 bg-purple-500 hover:bg-purple-600">Featured Event</Badge>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">{featuredEvent.title}</h2>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1 text-purple-400" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1 text-purple-400" />
              <span>
                {featuredEvent.location.type === "virtual"
                  ? "Virtual Event"
                  : `${featuredEvent.location.city}, ${featuredEvent.location.country}`}
              </span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1 text-purple-400" />
              <span>{featuredEvent.soldTickets} attendees</span>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-zinc-400 mb-1">Tickets remaining</div>
            <div className="flex items-center gap-2">
              <Progress value={ticketPercentRemaining} className="w-32 h-2" />
              <span className="text-sm font-medium">{ticketPercentRemaining}%</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-zinc-400 mb-1">Price</div>
            <div className="flex items-center text-xl font-bold">
              <Wallet className="h-4 w-4 mr-2 text-purple-500" />
              {ticketType.price} {ticketType.currency}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center border border-zinc-800 rounded-lg overflow-hidden">
            <button
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
            >
              -
            </button>
            <div className="px-4 py-2 font-medium">{ticketCount}</div>
            <button
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              onClick={() => setTicketCount(ticketCount + 1)}
            >
              +
            </button>
          </div>
          {address ? (
            <Button
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              asChild
            >
              <Link href={`/events/${featuredEvent.id}/checkout?quantity=${ticketCount}`}>Buy Ticket</Link>
            </Button>
          ) : (
            <Button
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={() => connectWallet()}
            >
              Connect Wallet to Buy
            </Button>
          )}
        </div>

        <div className="pt-4 border-t border-zinc-800">
          <h3 className="font-medium mb-2">Event Highlights</h3>
          <p className="text-sm text-zinc-400 mb-4 line-clamp-3">{featuredEvent.description}</p>
          <Button variant="link" className="text-purple-400 p-0 h-auto" asChild>
            <Link href={`/events/${featuredEvent.id}`}>View Event Details</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
