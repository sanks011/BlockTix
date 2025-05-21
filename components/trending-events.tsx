"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EventCard } from "@/components/event-card"
import { useEvents } from "@/lib/hooks/use-events"
import { Skeleton } from "@/components/ui/skeleton"

export function TrendingEvents() {
  const [currentPage, setCurrentPage] = useState(0)
  const { events, loading, error } = useEvents({ limit: 6 })

  const eventsPerPage = 3
  const totalPages = Math.ceil((events?.length || 0) / eventsPerPage)
  const displayedEvents = events?.slice(currentPage * eventsPerPage, (currentPage + 1) * eventsPerPage) || []

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages)
  }

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages)
  }

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur overflow-hidden">
            <Skeleton className="aspect-video w-full" />
            <div className="p-4 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center border border-red-500/20 bg-red-500/10 rounded-xl">
        <p className="text-red-400">Failed to load events. Please try again later.</p>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="p-6 text-center border border-zinc-800 bg-zinc-900/50 backdrop-blur rounded-xl">
        <p className="text-zinc-400">No events found. Be the first to create an event!</p>
        <Button
          className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          asChild
        >
          <Link href="/create">Create Event</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedEvents.map((event) => (
          <EventCard
            key={event.id}
            id={event.id}
            title={event.title}
            date={`${event.startDate.toDate().toLocaleDateString()} - ${event.endDate.toDate().toLocaleDateString()}`}
            location={
              event.location.type === "virtual" ? "Virtual Event" : `${event.location.city}, ${event.location.country}`
            }
            image={event.bannerImage}
            price={
              event.ticketTypes[0]?.price ? `${event.ticketTypes[0].price} ${event.ticketTypes[0].currency}` : "Free"
            }
            category={event.category}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-8 gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={prevPage}
            className="border-zinc-800 hover:border-purple-500 hover:bg-purple-500/10"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          <div className="flex items-center gap-1 px-3 text-sm">
            <span className="text-white">{currentPage + 1}</span>
            <span className="text-zinc-500">/</span>
            <span className="text-zinc-500">{totalPages}</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={nextPage}
            className="border-zinc-800 hover:border-purple-500 hover:bg-purple-500/10"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
        </div>
      )}
    </div>
  )
}
