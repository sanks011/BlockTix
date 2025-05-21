"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MainNav } from "@/components/main-nav"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { CalendarIcon, Plus, Trash2, ImageIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useWeb3 } from "@/lib/hooks/use-web3"
import { useEventTicketContract, useFundraisingContract } from "@/lib/hooks/use-contracts"
import { useToast } from "@/components/ui/use-toast"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ImageUpload } from "@/components/image-upload"

export default function CreateEventPage() {
  const router = useRouter()
  const { address } = useWeb3()
  const { toast } = useToast()
  const { createEvent, createTicketType, loading: eventLoading } = useEventTicketContract()
  const { createCampaign, loading: fundraisingLoading } = useFundraisingContract()

  // Event details state
  const [eventName, setEventName] = useState("")
  const [eventDescription, setEventDescription] = useState("")
  const [eventImage, setEventImage] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [locationType, setLocationType] = useState("physical")
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [virtualUrl, setVirtualUrl] = useState("")
  const [isNftTickets, setIsNftTickets] = useState(true)
  const [hasFundraising, setHasFundraising] = useState(false)
  const [category, setCategory] = useState("")
  const [tags, setTags] = useState("")

  // Ticket types state
  const [ticketTypes, setTicketTypes] = useState([
    {
      name: "",
      description: "",
      price: "",
      supply: "",
      benefits: [""],
    },
  ])

  // Fundraising state
  const [fundraisingGoal, setFundraisingGoal] = useState("")
  const [fundraisingDescription, setFundraisingDescription] = useState("")
  const [fundraisingImage, setFundraisingImage] = useState("")

  // Loading state
  const loading = eventLoading || fundraisingLoading

  // Add a ticket type
  const addTicketType = () => {
    setTicketTypes([
      ...ticketTypes,
      {
        name: "",
        description: "",
        price: "",
        supply: "",
        benefits: [""],
      },
    ])
  }

  // Remove a ticket type
  const removeTicketType = (index: number) => {
    if (ticketTypes.length > 1) {
      setTicketTypes(ticketTypes.filter((_, i) => i !== index))
    }
  }

  // Update ticket type field
  const updateTicketType = (index: number, field: string, value: string) => {
    const updatedTicketTypes = [...ticketTypes]
    updatedTicketTypes[index] = {
      ...updatedTicketTypes[index],
      [field]: value,
    }
    setTicketTypes(updatedTicketTypes)
  }

  // Add a benefit to a ticket type
  const addBenefit = (ticketIndex: number) => {
    const updatedTicketTypes = [...ticketTypes]
    updatedTicketTypes[ticketIndex].benefits.push("")
    setTicketTypes(updatedTicketTypes)
  }

  // Remove a benefit from a ticket type
  const removeBenefit = (ticketIndex: number, benefitIndex: number) => {
    if (ticketTypes[ticketIndex].benefits.length > 1) {
      const updatedTicketTypes = [...ticketTypes]
      updatedTicketTypes[ticketIndex].benefits = updatedTicketTypes[ticketIndex].benefits.filter(
        (_, i) => i !== benefitIndex,
      )
      setTicketTypes(updatedTicketTypes)
    }
  }

  // Update benefit text
  const updateBenefit = (ticketIndex: number, benefitIndex: number, value: string) => {
    const updatedTicketTypes = [...ticketTypes]
    updatedTicketTypes[ticketIndex].benefits[benefitIndex] = value
    setTicketTypes(updatedTicketTypes)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create an event",
        variant: "destructive",
      })
      return
    }

    if (!eventName || !eventDescription || !startDate || !endDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (locationType === "physical" && (!city || !country)) {
      toast({
        title: "Missing location information",
        description: "Please provide city and country for physical events",
        variant: "destructive",
      })
      return
    }

    if (locationType === "virtual" && !virtualUrl) {
      toast({
        title: "Missing virtual URL",
        description: "Please provide a URL for virtual events",
        variant: "destructive",
      })
      return
    }

    // Validate ticket types
    for (const ticketType of ticketTypes) {
      if (!ticketType.name || !ticketType.supply || (isNftTickets && !ticketType.price)) {
        toast({
          title: "Invalid ticket information",
          description: "Please fill in all ticket type fields",
          variant: "destructive",
        })
        return
      }
    }

    try {
      // Create event on blockchain
      const eventId = await createEvent(eventName, eventDescription, startDate, endDate)

      if (!eventId) {
        toast({
          title: "Failed to create event",
          description: "There was an error creating your event on the blockchain",
          variant: "destructive",
        })
        return
      }

      // Create ticket types on blockchain
      const ticketTypeIds = []
      for (const ticketType of ticketTypes) {
        const ticketTypeId = await createTicketType(
          eventId,
          ticketType.name,
          ticketType.description,
          ticketType.price || "0",
          Number.parseInt(ticketType.supply),
        )

        if (ticketTypeId) {
          ticketTypeIds.push(ticketTypeId)
        }
      }

      // Create fundraising campaign if enabled
      let fundraisingId = null
      if (hasFundraising && fundraisingGoal && fundraisingDescription) {
        fundraisingId = await createCampaign(
          `${eventName} Fundraiser`,
          fundraisingDescription,
          fundraisingGoal,
          startDate,
          endDate,
        )
      }

      // Store additional data in Firebase
      const eventData = {
        id: eventId,
        title: eventName,
        description: eventDescription,
        startDate,
        endDate,
        location: {
          type: locationType,
          city: locationType !== "virtual" ? city : "",
          country: locationType !== "virtual" ? country : "",
          virtualUrl: locationType !== "physical" ? virtualUrl : "",
        },
        bannerImage: eventImage || "/placeholder.svg?height=600&width=1200",
        creatorId: address,
        creatorAddress: address,
        category,
        tags: tags.split(",").map((tag) => tag.trim()),
        ticketTypes: ticketTypeIds.map((id, index) => ({
          id,
          name: ticketTypes[index].name,
          description: ticketTypes[index].description,
          price: ticketTypes[index].price || "0",
          currency: "ETH",
          supply: Number.parseInt(ticketTypes[index].supply),
          sold: 0,
          isNFT: isNftTickets,
          benefits: ticketTypes[index].benefits.filter((b) => b.trim() !== ""),
        })),
        totalTickets: ticketTypes.reduce((total, type) => total + Number.parseInt(type.supply || "0"), 0),
        soldTickets: 0,
        isFeatured: false,
        isPublished: true,
        hasFundraising: !!fundraisingId,
        fundraisingId,
        fundraisingGoal: hasFundraising ? fundraisingGoal : null,
        fundraisingCurrent: "0",
        fundraisingCurrency: "ETH",
        fundraisingImage: hasFundraising ? (fundraisingImage || eventImage || "/placeholder.svg?height=600&width=1200") : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      // Save to Firestore
      await addDoc(collection(db, "events"), eventData)

      toast({
        title: "Event created successfully",
        description: "Your event has been created and is now live",
      })

      // Redirect to event page
      router.push(`/events/${eventId}`)
    } catch (error) {
      console.error("Error creating event:", error)
      toast({
        title: "Error creating event",
        description: (error as Error).message,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen">
      <MainNav />

      <main className="container px-4 pt-24 pb-16 md:px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Create New Event</h1>
          <p className="text-zinc-400 mb-8">Fill in the details below to create your blockchain-powered event</p>

          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="details" className="space-y-8">
              <TabsList className="bg-zinc-900/50 border border-zinc-800">
                <TabsTrigger value="details">Event Details</TabsTrigger>
                <TabsTrigger value="tickets">Tickets</TabsTrigger>
                {hasFundraising && <TabsTrigger value="fundraising">Fundraising</TabsTrigger>}
              </TabsList>

              {/* Event Details Tab */}
              <TabsContent value="details" className="space-y-6">
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Provide the basic details about your event</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="event-name">Event Name</Label>
                      <Input
                        id="event-name"
                        placeholder="Enter event name"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        className="bg-zinc-800/50 border-zinc-700"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="event-description">Event Description</Label>
                      <Textarea
                        id="event-description"
                        placeholder="Describe your event"
                        value={eventDescription}
                        onChange={(e) => setEventDescription(e.target.value)}
                        className="min-h-32 bg-zinc-800/50 border-zinc-700"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="event-image">Event Image</Label>
                      <ImageUpload 
                        value={eventImage}
                        onChange={setEventImage}
                        disabled={loading}
                      />
                      <p className="text-xs text-zinc-400">Upload a cover image for your event. Recommended size 1200x600px.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal bg-zinc-800/50 border-zinc-700",
                                !startDate && "text-zinc-500",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {startDate ? format(startDate, "PPP") : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800">
                            <Calendar
                              mode="single"
                              selected={startDate}
                              onSelect={setStartDate}
                              initialFocus
                              disabled={(date) => date < new Date()}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal bg-zinc-800/50 border-zinc-700",
                                !endDate && "text-zinc-500",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {endDate ? format(endDate, "PPP") : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800">
                            <Calendar
                              mode="single"
                              selected={endDate}
                              onSelect={setEndDate}
                              initialFocus
                              disabled={(date) => date < (startDate || new Date())}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Input
                          id="category"
                          placeholder="e.g., Music, Tech, Art"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="bg-zinc-800/50 border-zinc-700"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tags">Tags</Label>
                        <Input
                          id="tags"
                          placeholder="e.g., blockchain, concert, workshop"
                          value={tags}
                          onChange={(e) => setTags(e.target.value)}
                          className="bg-zinc-800/50 border-zinc-700"
                        />
                        <p className="text-xs text-zinc-500">Separate tags with commas</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch id="fundraising" checked={hasFundraising} onCheckedChange={setHasFundraising} />
                      <Label htmlFor="fundraising">Enable fundraising for this event</Label>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle>Location</CardTitle>
                    <CardDescription>Specify where your event will take place</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Button
                        type="button"
                        variant={locationType === "physical" ? "default" : "outline"}
                        className={locationType === "physical" ? "" : "bg-zinc-800/50 border-zinc-700"}
                        onClick={() => setLocationType("physical")}
                      >
                        Physical
                      </Button>
                      <Button
                        type="button"
                        variant={locationType === "virtual" ? "default" : "outline"}
                        className={locationType === "virtual" ? "" : "bg-zinc-800/50 border-zinc-700"}
                        onClick={() => setLocationType("virtual")}
                      >
                        Virtual
                      </Button>
                      <Button
                        type="button"
                        variant={locationType === "hybrid" ? "default" : "outline"}
                        className={locationType === "hybrid" ? "" : "bg-zinc-800/50 border-zinc-700"}
                        onClick={() => setLocationType("hybrid")}
                      >
                        Hybrid
                      </Button>
                    </div>

                    {(locationType === "physical" || locationType === "hybrid") && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            placeholder="Enter city"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="bg-zinc-800/50 border-zinc-700"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            placeholder="Enter country"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="bg-zinc-800/50 border-zinc-700"
                          />
                        </div>
                      </div>
                    )}

                    {(locationType === "virtual" || locationType === "hybrid") && (
                      <div className="space-y-2">
                        <Label htmlFor="virtual-url">Virtual Event URL</Label>
                        <Input
                          id="virtual-url"
                          placeholder="Enter URL for virtual event"
                          value={virtualUrl}
                          onChange={(e) => setVirtualUrl(e.target.value)}
                          className="bg-zinc-800/50 border-zinc-700"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tickets Tab */}
              <TabsContent value="tickets" className="space-y-6">
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle>Ticket Settings</CardTitle>
                    <CardDescription>Configure your ticket types and pricing</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch id="nft-tickets" checked={isNftTickets} onCheckedChange={setIsNftTickets} />
                      <Label htmlFor="nft-tickets">Issue tickets as NFTs</Label>
                    </div>
                    <p className="text-sm text-zinc-400">
                      NFT tickets can be traded on the secondary market and provide additional benefits to attendees.
                    </p>
                  </CardContent>
                </Card>

                {ticketTypes.map((ticketType, index) => (
                  <Card key={index} className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Ticket Type {index + 1}</CardTitle>
                        <CardDescription>Define the details for this ticket type</CardDescription>
                      </div>
                      {ticketTypes.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTicketType(index)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`ticket-name-${index}`}>Ticket Name</Label>
                          <Input
                            id={`ticket-name-${index}`}
                            placeholder="e.g., General Admission, VIP"
                            value={ticketType.name}
                            onChange={(e) => updateTicketType(index, "name", e.target.value)}
                            className="bg-zinc-800/50 border-zinc-700"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`ticket-supply-${index}`}>Supply</Label>
                          <Input
                            id={`ticket-supply-${index}`}
                            placeholder="Number of tickets available"
                            type="number"
                            min="1"
                            value={ticketType.supply}
                            onChange={(e) => updateTicketType(index, "supply", e.target.value)}
                            className="bg-zinc-800/50 border-zinc-700"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`ticket-description-${index}`}>Description</Label>
                        <Textarea
                          id={`ticket-description-${index}`}
                          placeholder="Describe what this ticket includes"
                          value={ticketType.description}
                          onChange={(e) => updateTicketType(index, "description", e.target.value)}
                          className="bg-zinc-800/50 border-zinc-700"
                        />
                      </div>

                      {isNftTickets && (
                        <div className="space-y-2">
                          <Label htmlFor={`ticket-price-${index}`}>Price (ETH)</Label>
                          <Input
                            id={`ticket-price-${index}`}
                            placeholder="e.g., 0.1"
                            type="number"
                            step="0.001"
                            min="0"
                            value={ticketType.price}
                            onChange={(e) => updateTicketType(index, "price", e.target.value)}
                            className="bg-zinc-800/50 border-zinc-700"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Benefits</Label>
                        {ticketType.benefits.map((benefit, benefitIndex) => (
                          <div key={benefitIndex} className="flex gap-2 mt-2">
                            <Input
                              placeholder={`Benefit ${benefitIndex + 1}`}
                              value={benefit}
                              onChange={(e) => updateBenefit(index, benefitIndex, e.target.value)}
                              className="bg-zinc-800/50 border-zinc-700"
                            />
                            {ticketType.benefits.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeBenefit(index, benefitIndex)}
                                className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addBenefit(index)}
                          className="mt-2 bg-zinc-800/50 border-zinc-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Benefit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addTicketType}
                  className="w-full bg-zinc-800/50 border-zinc-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Ticket Type
                </Button>
              </TabsContent>

              {/* Fundraising Tab */}
              {hasFundraising && (
                <TabsContent value="fundraising" className="space-y-6">
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <CardTitle>Fundraising Campaign</CardTitle>
                      <CardDescription>Set up a fundraising campaign for your event</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fundraising-goal">Fundraising Goal (ETH)</Label>
                        <Input
                          id="fundraising-goal"
                          placeholder="e.g., 10"
                          type="number"
                          step="0.01"
                          min="0"
                          value={fundraisingGoal}
                          onChange={(e) => setFundraisingGoal(e.target.value)}
                          className="bg-zinc-800/50 border-zinc-700"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fundraising-description">Campaign Description</Label>
                        <Textarea
                          id="fundraising-description"
                          placeholder="Describe what the funds will be used for"
                          value={fundraisingDescription}
                          onChange={(e) => setFundraisingDescription(e.target.value)}
                          className="min-h-32 bg-zinc-800/50 border-zinc-700"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fundraising-image">Campaign Image</Label>
                        <ImageUpload 
                          value={fundraisingImage}
                          onChange={setFundraisingImage}
                          disabled={loading}
                        />
                        <p className="text-xs text-zinc-400">Upload a cover image for your fundraising campaign. Recommended size 1200x600px.</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="bg-zinc-800/50 border-zinc-700"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating Event..." : "Create Event"}
                </Button>
              </div>
            </Tabs>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
