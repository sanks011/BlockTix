"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MainNav } from "@/components/main-nav"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useWeb3 } from "@/lib/hooks/use-web3"
import { useEvents } from "@/lib/hooks/use-events"
import { EventCard } from "@/components/event-card"
import { Ticket, CalendarDays, Coins, BarChart3, Plus } from "lucide-react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function DashboardPage() {
  const router = useRouter()
  const { address } = useWeb3()
  const [activeTab, setActiveTab] = useState("overview")

  // Redirect if not connected
  useEffect(() => {
    if (!address) {
      router.push("/")
    }
  }, [address, router])

  if (!address) {
    return (
      <div className="min-h-screen">
        <MainNav />
        <main className="container px-4 pt-24 pb-16 md:px-6 relative z-10">
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <Skeleton className="h-12 w-64 mx-auto mb-4" />
              <Skeleton className="h-4 w-80 mx-auto mb-8" />
              <Skeleton className="h-10 w-40 mx-auto" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <MainNav />

      <main className="container px-4 pt-24 pb-16 md:px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Creator Dashboard</h1>
            <p className="text-zinc-400">Manage your events, tickets, and fundraising campaigns</p>
          </div>
          <Button
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            asChild
          >
            <Link href="/create">
              <Plus className="mr-2 h-4 w-4" />
              Create New Event
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-zinc-900/50 border border-zinc-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="events">My Events</TabsTrigger>
            <TabsTrigger value="tickets">My Tickets</TabsTrigger>
            <TabsTrigger value="fundraising">Fundraising</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <DashboardCard
                title="Total Events"
                value="5"
                description="Events you've created"
                icon={<CalendarDays className="h-5 w-5 text-purple-500" />}
              />
              <DashboardCard
                title="Tickets Sold"
                value="128"
                description="Across all events"
                icon={<Ticket className="h-5 w-5 text-purple-500" />}
              />
              <DashboardCard
                title="Revenue"
                value="3.45 ETH"
                description="Total earnings"
                icon={<BarChart3 className="h-5 w-5 text-purple-500" />}
              />
              <DashboardCard
                title="Fundraising"
                value="1.2 ETH"
                description="Total raised"
                icon={<Coins className="h-5 w-5 text-purple-500" />}
              />
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4">Upcoming Events</h2>
              <CreatorEvents limit={3} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest transactions and updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <ActivityList />
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks and shortcuts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <Link href="/create">
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Event
                    </Link>
                  </Button>
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <Link href="/fundraising/create">
                      <Coins className="mr-2 h-4 w-4" />
                      Start Fundraising Campaign
                    </Link>
                  </Button>
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <Link href="/dashboard/analytics">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Analytics
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="events">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">My Events</h2>
                <Button asChild>
                  <Link href="/create">Create New Event</Link>
                </Button>
              </div>
              <CreatorEvents />
            </div>
          </TabsContent>

          <TabsContent value="tickets">
            <div className="space-y-6">
              <h2 className="text-xl font-bold">My Tickets</h2>
              <p className="text-zinc-400">Manage your purchased tickets and NFTs</p>
              <UserTickets />
            </div>
          </TabsContent>

          <TabsContent value="fundraising">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">My Fundraising Campaigns</h2>
                <Button asChild>
                  <Link href="/fundraising/create">Start New Campaign</Link>
                </Button>
              </div>
              <UserFundraising />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  )
}

function DashboardCard({
  title,
  value,
  description,
  icon,
}: { title: string; value: string; description: string; icon: React.ReactNode }) {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-zinc-400 mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}

function CreatorEvents({ limit }: { limit?: number }) {
  // In a real app, you would fetch events created by the current user
  const { events, loading, error } = useEvents({ limit: limit || 6 })

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(limit || 3)].map((_, index) => (
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
        <p className="text-zinc-400">You haven't created any events yet.</p>
        <Button
          className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          asChild
        >
          <Link href="/create">Create Your First Event</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
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
  )
}

function ActivityList() {
  // This would be fetched from your database in a real app
  const activities = [
    { id: 1, type: "sale", description: "Ticket sold for Ethereum Conference", time: "2 hours ago", amount: "0.5 ETH" },
    {
      id: 2,
      type: "donation",
      description: "Donation received for Charity Concert",
      time: "5 hours ago",
      amount: "0.2 ETH",
    },
    { id: 3, type: "event", description: "New attendee for Virtual Hackathon", time: "1 day ago", amount: "" },
    { id: 4, type: "sale", description: "NFT ticket resold on marketplace", time: "2 days ago", amount: "0.8 ETH" },
  ]

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex justify-between items-start pb-4 border-b border-zinc-800 last:border-0 last:pb-0"
        >
          <div>
            <p className="font-medium">{activity.description}</p>
            <p className="text-xs text-zinc-400">{activity.time}</p>
          </div>
          {activity.amount && <span className="text-sm font-medium text-green-500">{activity.amount}</span>}
        </div>
      ))}
    </div>
  )
}

function UserTickets() {
  // This would be fetched from your database in a real app
  const loading = false
  const error = null
  const tickets = []

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <Skeleton key={index} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center border border-red-500/20 bg-red-500/10 rounded-xl">
        <p className="text-red-400">Failed to load tickets. Please try again later.</p>
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <div className="p-6 text-center border border-zinc-800 bg-zinc-900/50 backdrop-blur rounded-xl">
        <p className="text-zinc-400">You don't have any tickets yet.</p>
        <Button
          className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          asChild
        >
          <Link href="/events">Browse Events</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <div key={ticket.id}>{/* Ticket component would go here */}</div>
      ))}
    </div>
  )
}

function UserFundraising() {
  const { address } = useWeb3()
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUserCampaigns() {
      if (!address) {
        setLoading(false)
        return
      }

      try {
        // Query Firestore for campaigns created by the current user
        const q = query(
          collection(db, "campaigns"), 
          where("creatorAddress", "==", address)
        )
        const querySnapshot = await getDocs(q)
        
        const userCampaigns = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        setCampaigns(userCampaigns)
        setError(null)
      } catch (err) {
        console.error("Error fetching user campaigns:", err)
        setError("Failed to load your fundraising campaigns")
      } finally {
        setLoading(false)
      }
    }

    fetchUserCampaigns()
  }, [address])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, index) => (
          <Skeleton key={index} className="h-40 w-full" />
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

  if (!campaigns.length) {
    return (
      <div className="p-6 text-center border border-zinc-800 bg-zinc-900/50 backdrop-blur rounded-xl">
        <p className="text-zinc-400">You haven't created any fundraising campaigns yet.</p>
        <Button
          className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          asChild
        >
          <Link href="/fundraising/create">Start Your First Campaign</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {campaigns.map((campaign) => (
        <div key={campaign.id} className="flex border border-zinc-800 bg-zinc-900/50 rounded-lg overflow-hidden">
          <div className="w-48 h-auto relative hidden md:block">
            <img 
              src={campaign.image || "/placeholder.jpg"} 
              alt={campaign.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{campaign.title}</h3>
                <p className="text-sm text-zinc-400 line-clamp-2">{campaign.description}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{campaign.goal} ETH goal</div>
                <div className="text-xs text-zinc-500">
                  {new Date(campaign.endDate?.seconds * 1000).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Progress value={Math.min((campaign.current || 0) / campaign.goal * 100, 100)} className="h-1" />
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" className="mr-2" asChild>
                <Link href={`/fundraising/${campaign.id}`}>
                  View
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
