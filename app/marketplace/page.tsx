"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { MainNav } from "@/components/main-nav"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { 
  Search, Filter, Grid3X3, Grid2X2, ListFilter, Clock, Ticket, 
  Wallet, History, Tag, Loader2
} from "lucide-react"
import Link from "next/link"
import { useTicketMarketplaceContract } from "@/lib/hooks/use-contracts"
import { useEventTicketContract } from "@/lib/hooks/use-contracts" 
import { useWeb3 } from "@/lib/hooks/use-web3"
import { useToast } from "@/components/ui/use-toast"
import type { TicketListing } from "@/lib/types/marketplace"

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState("all")
  const [viewMode, setViewMode] = useState("grid")
  const [priceRange, setPriceRange] = useState([0, 10])  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [ticketListings, setTicketListings] = useState<TicketListing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { address } = useWeb3()
  const { contract: marketplaceContract } = useTicketMarketplaceContract()
  const { contract: eventTicketContract } = useEventTicketContract()
  
  useEffect(() => {
    const fetchTicketListings = async () => {
      if (!marketplaceContract || !eventTicketContract) return
      
      try {
        setIsLoading(true)
        
        // Get active listings from marketplace contract
        const listingCount = await marketplaceContract.getActiveListingsCount()
        const listingsArray = []
        
        for (let i = 0; i < listingCount; i++) {
          try {
            const listing = await marketplaceContract.getActiveListing(i)
            
            // Fetch additional ticket details from the event ticket contract
            const ticket = await eventTicketContract.tickets(listing.tokenId)
            const eventId = ticket.eventId
            const ticketTypeId = ticket.ticketTypeId
            
            // Get event details
            const event = await eventTicketContract.events(eventId)
            const eventName = event.name
            const eventDate = new Date(event.startTime.toNumber() * 1000).toLocaleDateString('en-US', { 
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })
            
            // Get ticket type details
            const ticketType = await eventTicketContract.ticketTypes(ticketTypeId)
            const ticketTypeName = ticketType.name
            
            // Format the listing data
            const formattedListing = {
              id: listing.listingId.toString(),
              tokenId: listing.tokenId.toString(),
              eventId: eventId.toString(),
              eventName,
              eventDate,
              ticketType: ticketTypeName,
              seller: listing.seller,
              price: ethers.utils.formatEther(listing.price),
              listingDate: new Date(listing.timestamp.toNumber() * 1000).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }),
              image: "/placeholder.jpg" // Would be replaced by IPFS image from metadata
            }
            
            listingsArray.push(formattedListing)
          } catch (err) {
            console.error(`Error fetching listing ${i}:`, err)
          }
        }
        
        setTicketListings(listingsArray)
      } catch (err) {
        console.error("Error fetching ticket listings:", err)
        setError((err as Error).message)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchTicketListings()
  }, [marketplaceContract, eventTicketContract])

  return (
    <div className="min-h-screen">
      <MainNav />

      <main className="container px-4 pt-24 pb-16 md:px-6 relative z-10">
        <section className="py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">NFT Ticket Marketplace</h1>
              <p className="text-zinc-400 mt-2">Buy and sell event tickets as NFTs with proof of authenticity</p>
            </div>
            {address && (
              <Button 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                asChild
              >
                <Link href="/my-tickets?action=sell">
                  <Tag className="mr-2 h-4 w-4" />
                  Sell My Tickets
                </Link>
              </Button>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filters sidebar */}
            <div className="w-full lg:w-72 flex-shrink-0">
              <Card className="bg-zinc-900/50 backdrop-blur border-zinc-800 sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                      <Input 
                        placeholder="Search tickets" 
                        className="pl-9 bg-zinc-800/50 border-zinc-700"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Event Category</label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="bg-zinc-800/50 border-zinc-700">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="conference">Conferences</SelectItem>
                        <SelectItem value="music">Music & Festivals</SelectItem>
                        <SelectItem value="art">Art & Exhibitions</SelectItem>
                        <SelectItem value="workshop">Workshops</SelectItem>
                        <SelectItem value="gaming">Gaming</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Price Range (ETH)</label>
                    <div className="pt-5 px-2">
                      <Slider 
                        min={0}
                        max={10}
                        step={0.1}
                        value={priceRange}
                        onValueChange={setPriceRange}
                      />
                      <div className="flex justify-between mt-2 text-xs text-zinc-400">
                        <span>{priceRange[0].toFixed(1)} ETH</span>
                        <span>{priceRange[1].toFixed(1)} ETH</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Event Date</label>
                    <Select>
                      <SelectTrigger className="bg-zinc-800/50 border-zinc-700">
                        <SelectValue placeholder="Any Date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Date</SelectItem>
                        <SelectItem value="upcoming">Next 7 days</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="next">Next Month</SelectItem>
                        <SelectItem value="further">Further Ahead</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Button 
                      variant="outline" 
                      className="w-full mt-2 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                      onClick={() => {
                        // Reset filters to default
                        setSearchQuery("");
                        setSelectedCategory("all");
                        setPriceRange([0, 10]);
                      }}
                    >
                      Reset Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main content */}
            <div className="flex-1">              
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-10 w-10 text-purple-500 animate-spin mb-4" />
                  <p className="text-zinc-400">Loading ticket listings...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-red-500 mb-4">⚠️</div>
                  <h3 className="text-xl font-medium">Error loading ticket listings</h3>
                  <p className="text-zinc-400 mt-2 max-w-md">{error}</p>
                </div>
              ) : (
                <>
                  <div className="mb-6 flex justify-between items-center">
                    <Tabs defaultValue="all" className="flex-1 md:flex-initial">
                      <TabsList>
                        <TabsTrigger value="all" onClick={() => setActiveTab("all")}>All</TabsTrigger>
                        <TabsTrigger value="recent" onClick={() => setActiveTab("recent")}>Recently Added</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    
                    <div className="flex items-center gap-2">
                      <Select defaultValue="price-asc" onValueChange={(value) => {
                        // Sort logic would be implemented here
                      }}>
                        <SelectTrigger className="bg-zinc-800/50 border-zinc-700 w-[140px]">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="price-asc">Price: Low to High</SelectItem>
                          <SelectItem value="price-desc">Price: High to Low</SelectItem>
                          <SelectItem value="date-asc">Event Date: Earliest</SelectItem>
                          <SelectItem value="date-desc">Event Date: Latest</SelectItem>
                          <SelectItem value="recent">Recently Listed</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <div className="flex bg-zinc-800 rounded overflow-hidden">
                        <Button
                          variant={viewMode === "grid" ? "secondary" : "ghost"}
                          size="icon"
                          className="rounded-none h-9 w-9"
                          onClick={() => setViewMode("grid")}
                        >
                          <Grid3X3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={viewMode === "list" ? "secondary" : "ghost"}
                          size="icon"
                          className="rounded-none h-9 w-9"
                          onClick={() => setViewMode("list")}
                        >
                          <ListFilter className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {ticketListings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Ticket className="h-12 w-12 text-zinc-400 mb-4" />
                      <h3 className="text-xl font-medium">No tickets currently listed</h3>
                      <p className="text-zinc-400 mt-2 max-w-md">
                        Be the first to list your tickets on the marketplace!
                      </p>
                      <Button 
                        className="mt-6 bg-purple-600 hover:bg-purple-700"
                        asChild
                      >
                        <Link href="/my-tickets?action=sell">
                          <Tag className="mr-2 h-4 w-4" />
                          Sell My Tickets
                        </Link>
                      </Button>
                    </div>
                  ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {ticketListings
                        .filter(ticket => {
                          // Apply filters
                          if (searchQuery && !ticket.eventName.toLowerCase().includes(searchQuery.toLowerCase())) {
                            return false;
                          }
                          
                          if (selectedCategory !== "all") {
                            // Category filtering would be implemented here
                            return true;
                          }
                          
                          const ticketPrice = parseFloat(ticket.price);
                          return ticketPrice >= priceRange[0] && ticketPrice <= priceRange[1];
                        })
                        .map((ticket) => (
                          <TicketCard key={ticket.id} ticket={ticket} />
                        ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {ticketListings
                        .filter(ticket => {
                          // Apply filters (same as above)
                          if (searchQuery && !ticket.eventName.toLowerCase().includes(searchQuery.toLowerCase())) {
                            return false;
                          }
                          
                          if (selectedCategory !== "all") {
                            // Category filtering would be implemented here
                            return true;
                          }
                          
                          const ticketPrice = parseFloat(ticket.price);
                          return ticketPrice >= priceRange[0] && ticketPrice <= priceRange[1];
                        })
                        .map((ticket) => (
                          <TicketListItem key={ticket.id} ticket={ticket} />
                        ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

function TicketCard({ ticket }: { ticket: TicketListing }) {
  const { toast } = useToast()
  const { address } = useWeb3()
  const [isPurchasing, setIsPurchasing] = useState(false)
  const { contract: marketplaceContract, buyTicket } = useTicketMarketplaceContract()
  
  const handlePurchase = async () => {
    if (!address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to purchase a ticket",
        variant: "destructive",
      })
      return
    }
    
    if (address.toLowerCase() === ticket.seller.toLowerCase()) {
      toast({
        title: "Cannot purchase your own ticket",
        description: "You cannot purchase a ticket that you've listed",
        variant: "destructive",
      })
      return
    }
    
    setIsPurchasing(true)
    
    try {
      const success = await buyTicket(ticket.tokenId, ticket.price)
      
      if (success) {
        toast({
          title: "Ticket purchased successfully",
          description: `You've purchased a ticket for ${ticket.eventName}`,
        })
        // Could redirect to my-tickets page or refresh the listings
        setTimeout(() => {
          window.location.href = '/my-tickets'
        }, 2000)
      }
    } catch (err) {
      console.error("Error purchasing ticket:", err)
      toast({
        title: "Failed to purchase ticket",
        description: (err as Error).message || "An error occurred during the purchase",
        variant: "destructive",
      })
    } finally {
      setIsPurchasing(false)
    }
  }
  
  return (
    <Card className="border border-zinc-800 bg-zinc-900/50 backdrop-blur overflow-hidden">
      <div className="relative">
        <div className="h-48 overflow-hidden">
          <img 
            src={ticket.image} 
            alt={ticket.eventName}
            className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
          />
        </div>
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold">
          {ticket.tokenId}
        </div>
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{ticket.eventName}</CardTitle>
        <div className="text-xs text-zinc-400 flex items-center mt-1">
          <Clock className="h-3 w-3 mr-1" />
          <span>{ticket.eventDate}</span>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm">{ticket.ticketType}</div>
          <div className="text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
            {ticket.price} ETH
          </div>
        </div>
        
        <div className="text-xs text-zinc-400 flex items-center justify-between">
          <div className="flex items-center">
            <Wallet className="h-3 w-3 mr-1" />
            <span>{ticket.seller.substring(0, 6)}...{ticket.seller.substring(ticket.seller.length - 4)}</span>
          </div>
          <div className="flex items-center">
            <History className="h-3 w-3 mr-1" />
            <span>Listed: {ticket.listingDate}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>        <Button 
          className="w-full bg-purple-600 hover:bg-purple-700"
          onClick={handlePurchase}
          disabled={isPurchasing || Boolean(address && address.toLowerCase() === ticket.seller.toLowerCase())}
        >
          {isPurchasing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (address && address.toLowerCase() === ticket.seller.toLowerCase()) ? (
            "Your Listing"
          ) : (
            "Purchase Ticket"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

function TicketListItem({ ticket }: { ticket: TicketListing }) {
  const { toast } = useToast()
  const { address } = useWeb3()
  const [isPurchasing, setIsPurchasing] = useState(false)
  const { contract: marketplaceContract, buyTicket } = useTicketMarketplaceContract()
  
  const handlePurchase = async () => {
    if (!address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to purchase a ticket",
        variant: "destructive",
      })
      return
    }
    
    if (address.toLowerCase() === ticket.seller.toLowerCase()) {
      toast({
        title: "Cannot purchase your own ticket",
        description: "You cannot purchase a ticket that you've listed",
        variant: "destructive",
      })
      return
    }
    
    setIsPurchasing(true)
    
    try {
      const success = await buyTicket(ticket.tokenId, ticket.price)
      
      if (success) {
        toast({
          title: "Ticket purchased successfully",
          description: `You've purchased a ticket for ${ticket.eventName}`,
        })
        // Could redirect to my-tickets page or refresh the listings
        setTimeout(() => {
          window.location.href = '/my-tickets'
        }, 2000)
      }
    } catch (err) {
      console.error("Error purchasing ticket:", err)
      toast({
        title: "Failed to purchase ticket",
        description: (err as Error).message || "An error occurred during the purchase",
        variant: "destructive",
      })
    } finally {
      setIsPurchasing(false)
    }
  }
  
  return (
    <Card className="border border-zinc-800 bg-zinc-900/50 backdrop-blur overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-48 h-48 md:h-auto relative overflow-hidden">
          <img 
            src={ticket.image} 
            alt={ticket.eventName}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold">
            {ticket.tokenId}
          </div>
        </div>
        
        <div className="flex-1 p-4 flex flex-col">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div>
              <h3 className="text-lg font-semibold">{ticket.eventName}</h3>
              <div className="text-xs text-zinc-400 flex items-center mt-1">
                <Clock className="h-3 w-3 mr-1" />
                <span>{ticket.eventDate}</span>
              </div>
              <div className="mt-2 text-sm">{ticket.ticketType}</div>
            </div>
            
            <div className="text-right">
              <div className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
                {ticket.price} ETH
              </div>
              <div className="text-xs text-zinc-400 mt-1">Listed: {ticket.listingDate}</div>
            </div>
          </div>
          
          <div className="mt-auto flex flex-col md:flex-row items-start md:items-center justify-between pt-4 gap-3">
            <div className="text-xs text-zinc-400 flex items-center">
              <Wallet className="h-3 w-3 mr-1" />
              <span>Seller: {ticket.seller.substring(0, 6)}...{ticket.seller.substring(ticket.seller.length - 4)}</span>
            </div>
            
            <Button 
              className="w-full md:w-auto bg-purple-600 hover:bg-purple-700"
              onClick={handlePurchase}
              disabled={isPurchasing || (address && address.toLowerCase() === ticket.seller.toLowerCase())}
            >
              {isPurchasing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (address && address.toLowerCase() === ticket.seller.toLowerCase()) ? (
                "Your Listing"
              ) : (
                "Purchase Ticket"
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
