"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { MainNav } from "@/components/main-nav"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  Ticket, Calendar, Clock, QrCode, Share2, Download, Tag, Info,
  ArrowRight, ExternalLink, Wallet, Store, Loader2
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useWeb3 } from "@/lib/hooks/use-web3"
import { useEventTicketContract, useTicketMarketplaceContract } from "@/lib/hooks/use-contracts"
import { useToast } from "@/components/ui/use-toast"
import type { UserTicket } from "@/lib/types/ticket"

export default function MyTicketsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('action') === 'sell' ? "sellable" : "upcoming")
  const { address, connectWallet } = useWeb3()
  const { toast } = useToast()
  const [showSellDialog, setShowSellDialog] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<UserTicket | null>(null)
  const [price, setPrice] = useState("")
  const [userTickets, setUserTickets] = useState<UserTicket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { contract: eventTicketContract } = useEventTicketContract()
  const { contract: marketplaceContract, listTicket } = useTicketMarketplaceContract()
  
  useEffect(() => {
    const fetchUserTickets = async () => {
      if (!eventTicketContract || !address) return
      
      try {
        setIsLoading(true)
        
        // Get all tickets owned by the user
        const tokenIds = await eventTicketContract.getTicketsByOwner(address)
        const currentTimestamp = Math.floor(Date.now() / 1000)
        const tickets: UserTicket[] = []
        
        for (const tokenId of tokenIds) {
          try {
            // Get ticket details
            const ticketData = await eventTicketContract.tickets(tokenId)
            const eventId = ticketData.eventId
            const ticketTypeId = ticketData.ticketTypeId
            
            // Get event details
            const event = await eventTicketContract.events(eventId)
            const eventName = event.name
            const startTime = event.startTime.toNumber()
            const isPast = startTime < currentTimestamp
            
            // Get ticket type details
            const ticketType = await eventTicketContract.ticketTypes(ticketTypeId)
            const ticketTypeName = ticketType.name
            const price = ethers.utils.formatEther(ticketType.price)
            
            // Format ticket data
            const userTicket: UserTicket = {
              tokenId: tokenId.toString(),
              eventId: eventId.toString(),
              eventName,
              eventDate: new Date(startTime * 1000).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }),
              location: "Metaverse Convention Center", // This would come from event metadata
              ticketType: ticketTypeName,
              issuer: event.creator,
              purchaseDate: new Date(ticketData.purchaseDate.toNumber() * 1000).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }),
              price,
              image: "/placeholder.jpg", // Would be from IPFS metadata
              status: isPast ? 'past' : 'upcoming',
              isUsed: ticketData.isUsed
            }
            
            tickets.push(userTicket)
          } catch (err) {
            console.error(`Error fetching ticket ${tokenId}:`, err)
          }
        }
        
        setUserTickets(tickets)
      } catch (err: any) {
        console.error("Error fetching user tickets:", err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (address) {
      fetchUserTickets()
    } else {
      setIsLoading(false)
    }
  }, [address, eventTicketContract])

  if (!address) {
    return (
      <div className="min-h-screen">
        <MainNav />
        <main className="container px-4 pt-24 pb-16 md:px-6 relative z-10">
          <section className="py-12 flex flex-col items-center justify-center text-center">
            <Wallet className="h-12 w-12 text-zinc-400 mb-4" />
            <h2 className="text-3xl font-bold mb-2">Connect Wallet to View Your Tickets</h2>
            <p className="text-zinc-400 max-w-md mb-8">
              You need to connect your wallet to access your NFT tickets and manage your event passes.
            </p>
            <Button onClick={connectWallet} className="bg-purple-600 hover:bg-purple-700">
              Connect Wallet
            </Button>
          </section>
        </main>
        <Footer />
      </div>
    )
  }
  const handleSellTicket = (ticket: UserTicket) => {
    setSelectedTicket(ticket)
    setShowSellDialog(true)
  }

  const confirmSell = async () => {
    if (!selectedTicket || !price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price for your ticket.",
        variant: "destructive",
      })
      return
    }
    
    if (!address || !marketplaceContract) {
      toast({
        title: "Error",
        description: "Please connect your wallet.",
        variant: "destructive",
      })
      return
    }
    
    try {
      // First approve the marketplace contract to transfer the ticket
      const approveTx = await eventTicketContract.approve(
        marketplaceContract.address, 
        selectedTicket.tokenId
      )
      await approveTx.wait()
      
      // List the ticket for sale
      const priceInWei = ethers.utils.parseEther(price)
      const listTx = await marketplaceContract.listTicket(
        selectedTicket.tokenId, 
        priceInWei
      )
      await listTx.wait()
      
      toast({
        title: "Ticket listed for sale",
        description: `Your ticket for ${selectedTicket.eventName} has been listed for ${price} ETH.`,
      })
      
      // Update the UI to reflect the change
      setUserTickets(prevTickets => 
        prevTickets.filter(t => t.tokenId !== selectedTicket.tokenId)
      )
      
      setShowSellDialog(false)
      setSelectedTicket(null)
      setPrice("")
      
      // Redirect to marketplace
      router.push("/marketplace")
    } catch (err: any) {
      console.error("Error listing ticket:", err)
      toast({
        title: "Error listing ticket",
        description: err.message,
        variant: "destructive",
      })
    }
  }
  return (
    <div className="min-h-screen">
      <MainNav />

      <main className="container px-4 pt-24 pb-16 md:px-6 relative z-10">
        <section className="py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">My NFT Tickets</h1>
              <p className="text-zinc-400 mt-2">Manage your event passes and collectible tickets</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                asChild
              >
                <Link href="/events">
                  <Calendar className="mr-2 h-4 w-4" />
                  Browse Events
                </Link>
              </Button>
              <Button 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                asChild
              >
                <Link href="/marketplace">
                  <Store className="mr-2 h-4 w-4" />
                  NFT Marketplace
                </Link>
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 text-purple-500 animate-spin mb-4" />
              <p className="text-zinc-400">Loading your tickets...</p>
            </div>
          ) : !address ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Wallet className="h-12 w-12 text-zinc-400 mb-4" />
              <h3 className="text-xl font-medium">Connect Wallet to View Your Tickets</h3>
              <p className="text-zinc-400 mt-2 max-w-md mb-6">
                You need to connect your wallet to access your NFT tickets and manage your event passes.
              </p>
              <Button onClick={connectWallet} className="bg-purple-600 hover:bg-purple-700">
                Connect Wallet
              </Button>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-red-500 mb-4">⚠️</div>
              <h3 className="text-xl font-medium">Error loading tickets</h3>
              <p className="text-zinc-400 mt-2 max-w-md">
                {error}
              </p>
            </div>
          ) : (
            <Tabs defaultValue={activeTab} className="mb-8">
              <TabsList className="mb-4">
                <TabsTrigger value="upcoming" onClick={() => setActiveTab("upcoming")}>
                  Upcoming Events
                </TabsTrigger>
                <TabsTrigger value="sellable" onClick={() => setActiveTab("sellable")}>
                  Sellable Tickets
                </TabsTrigger>
                <TabsTrigger value="past" onClick={() => setActiveTab("past")}>
                  Past Events
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="mt-0">
                {userTickets.filter(ticket => ticket.status === "upcoming" && !ticket.isUsed).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userTickets
                      .filter(ticket => ticket.status === "upcoming" && !ticket.isUsed)
                      .map((ticket) => (
                        <TicketCard 
                          key={ticket.tokenId} 
                          ticket={ticket} 
                          actions={[
                            { label: "View Ticket", icon: <QrCode className="h-4 w-4 mr-2" />, onClick: () => {} },
                            { label: "Sell Ticket", icon: <Tag className="h-4 w-4 mr-2" />, onClick: () => handleSellTicket(ticket) }
                          ]}
                        />
                      ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Ticket className="h-12 w-12 text-zinc-400 mb-4" />
                    <h3 className="text-xl font-medium">No upcoming tickets</h3>
                    <p className="text-zinc-400 mt-2 max-w-md mb-6">
                      You don't have any tickets for upcoming events.
                    </p>
                    <Button className="bg-purple-600 hover:bg-purple-700" asChild>
                      <Link href="/events">Browse Events</Link>
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="sellable" className="mt-0">
                {userTickets.filter(ticket => ticket.status === "upcoming" && !ticket.isUsed).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userTickets
                      .filter(ticket => ticket.status === "upcoming" && !ticket.isUsed)
                      .map((ticket) => (
                        <TicketCard 
                          key={ticket.tokenId} 
                          ticket={ticket}
                          sellMode={true}
                          onSell={() => handleSellTicket(ticket)}
                        />
                      ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Tag className="h-12 w-12 text-zinc-400 mb-4" />
                    <h3 className="text-xl font-medium">No sellable tickets</h3>
                    <p className="text-zinc-400 mt-2 max-w-md mb-6">
                      You don't have any tickets available to sell.
                    </p>
                    <Button className="bg-purple-600 hover:bg-purple-700" asChild>
                      <Link href="/events">Purchase Tickets</Link>
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="past" className="mt-0">
                {userTickets.filter(ticket => ticket.status === "past" || ticket.isUsed).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userTickets
                      .filter(ticket => ticket.status === "past" || ticket.isUsed)
                      .map((ticket) => (
                        <TicketCard 
                          key={ticket.tokenId} 
                          ticket={ticket}
                          isPast={true}
                          actions={[
                            { label: "Download Proof", icon: <Download className="h-4 w-4 mr-2" />, onClick: () => {} },
                            { label: "Share", icon: <Share2 className="h-4 w-4 mr-2" />, onClick: () => {} }
                          ]}
                        />
                      ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Clock className="h-12 w-12 text-zinc-400 mb-4" />
                    <h3 className="text-xl font-medium">No past events</h3>
                    <p className="text-zinc-400 mt-2 max-w-md">
                      You don't have any tickets from past events.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </section>
      </main>

      <Dialog open={showSellDialog} onOpenChange={setShowSellDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle>List Ticket for Sale</DialogTitle>
            <DialogDescription>
              Your NFT ticket will be listed on the marketplace once approved.
            </DialogDescription>
          </DialogHeader>
          
          {selectedTicket && (
            <>
              <div className="grid gap-4 py-4">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="w-20 h-20 rounded-lg overflow-hidden">
                    <img src={selectedTicket.image} alt={selectedTicket.eventName} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{selectedTicket.eventName}</h4>
                    <div className="text-sm text-zinc-400">{selectedTicket.ticketType} · {selectedTicket.tokenId}</div>
                    <div className="text-xs text-zinc-500 mt-1">{selectedTicket.eventDate}</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sell-price">Listing Price (ETH)</Label>
                  <Input
                    id="sell-price"
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="bg-zinc-800 border-zinc-700"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                
                <div className="bg-zinc-800/50 rounded-md p-3 border border-zinc-700 flex items-start gap-3">
                  <Info className="h-5 w-5 text-zinc-400 flex-shrink-0" />
                  <div className="text-xs text-zinc-400">
                    <p className="mb-1">
                      Once listed, your ticket will be available for others to purchase. A 2.5% platform fee will be applied to sales.
                    </p>
                    <p>
                      You can cancel your listing at any time before someone purchases it.
                    </p>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSellDialog(false)}>Cancel</Button>
                <Button 
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={confirmSell}
                >
                  List for Sale
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}

function TicketCard({ ticket, actions, sellMode = false, isPast = false, onSell }) {
  return (
    <Card className={`border ${isPast ? 'border-zinc-800/50 opacity-80' : 'border-zinc-800'} bg-zinc-900/50 backdrop-blur overflow-hidden`}>
      <div className="relative">
        <div className="h-48 overflow-hidden">
          <img 
            src={ticket.image} 
            alt={ticket.eventName}
            className={`w-full h-full object-cover ${isPast ? 'grayscale' : 'hover:scale-105 transition-transform duration-300'}`}
          />
        </div>
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold">
          {ticket.tokenId}
        </div>
        {isPast && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-black/80 text-white text-xs font-bold px-3 py-1 rounded transform rotate-12">
              PAST EVENT
            </div>
          </div>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{ticket.eventName}</CardTitle>
        <div className="text-xs text-zinc-400 flex flex-wrap gap-y-1 gap-x-3 mt-1">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>{ticket.eventDate}</span>
          </div>
          <div className="flex items-center">
            <Ticket className="h-3 w-3 mr-1" />
            <span>{ticket.ticketType}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        {!sellMode ? (
          <div className="text-xs text-zinc-400 space-y-1">
            <div className="flex justify-between">
              <span>Issued by:</span>
              <span className="text-zinc-300">{ticket.issuer}</span>
            </div>
            <div className="flex justify-between">
              <span>Purchased:</span>
              <span className="text-zinc-300">{ticket.purchaseDate}</span>
            </div>
            <div className="flex justify-between">
              <span>Price paid:</span>
              <span className="text-zinc-300">{ticket.price} ETH</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-3">
            <div className="text-xs text-zinc-400 mb-2">Original purchase price</div>
            <div className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
              {ticket.price} ETH
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        {sellMode ? (
          <Button 
            onClick={onSell}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            <Tag className="mr-2 h-4 w-4" />
            Sell Ticket
          </Button>
        ) : (
          <div className="flex gap-2 w-full">
            {actions?.map((action, index) => (
              <Button
                key={index}
                variant={index === 0 ? "default" : "outline"}
                className={
                  index === 0 
                    ? "flex-1 bg-purple-600 hover:bg-purple-700" 
                    : "flex-1 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                }
                onClick={action.onClick}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
