"use client"

import { useState, useEffect, useCallback } from "react"
import { ethers } from "ethers"
import { useWeb3 } from "@/lib/hooks/use-web3"
import { getContract, formatEventData, formatTicketTypeData, formatCampaignData } from "@/lib/contracts"
import { useToast } from "@/components/ui/use-toast"

// Hook for interacting with the EventTicket contract
export function useEventTicketContract() {
  const { provider, signer, address } = useWeb3()
  const { toast } = useToast()
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (provider && signer) {
      try {
        const eventTicketContract = getContract("EventTicket", signer)
        setContract(eventTicketContract)
      } catch (err) {
        console.error("Error initializing EventTicket contract:", err)
        setError(err as Error)
      }
    }
  }, [provider, signer])

  const createEvent = useCallback(
    async (name: string, description: string, startDate: Date, endDate: Date) => {
      if (!contract || !signer) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet to create an event",
          variant: "destructive",
        })
        return null
      }

      setLoading(true)
      setError(null)

      try {
        const startTimestamp = Math.floor(startDate.getTime() / 1000)
        const endTimestamp = Math.floor(endDate.getTime() / 1000)

        const tx = await contract.createEvent(name, description, startTimestamp, endTimestamp)
        const receipt = await tx.wait()

        // Find the EventCreated event in the transaction logs
        const eventCreatedEvent = receipt.events?.find((event: any) => event.event === "EventCreated")
        const eventId = eventCreatedEvent?.args?.eventId.toString()

        toast({
          title: "Event created successfully",
          description: `Your event "${name}" has been created`,
        })

        return eventId
      } catch (err) {
        console.error("Error creating event:", err)
        setError(err as Error)
        toast({
          title: "Failed to create event",
          description: (err as Error).message,
          variant: "destructive",
        })
        return null
      } finally {
        setLoading(false)
      }
    },
    [contract, signer, toast],
  )

  const createTicketType = useCallback(
    async (eventId: string, name: string, description: string, price: string, supply: number) => {
      if (!contract || !signer) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet to create a ticket type",
          variant: "destructive",
        })
        return null
      }

      setLoading(true)
      setError(null)

      try {
        const priceInWei = ethers.utils.parseEther(price)
        const tx = await contract.createTicketType(eventId, name, description, priceInWei, supply)
        const receipt = await tx.wait()

        // Find the TicketTypeCreated event in the transaction logs
        const ticketTypeCreatedEvent = receipt.events?.find((event: any) => event.event === "TicketTypeCreated")
        const ticketTypeId = ticketTypeCreatedEvent?.args?.ticketTypeId.toString()

        toast({
          title: "Ticket type created successfully",
          description: `Your ticket type "${name}" has been created`,
        })

        return ticketTypeId
      } catch (err) {
        console.error("Error creating ticket type:", err)
        setError(err as Error)
        toast({
          title: "Failed to create ticket type",
          description: (err as Error).message,
          variant: "destructive",
        })
        return null
      } finally {
        setLoading(false)
      }
    },
    [contract, signer, toast],
  )

  const purchaseTicket = useCallback(
    async (ticketTypeId: string, price: string, tokenURI: string) => {
      if (!contract || !signer) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet to purchase a ticket",
          variant: "destructive",
        })
        return null
      }

      setLoading(true)
      setError(null)

      try {
        const priceInWei = ethers.utils.parseEther(price)
        const tx = await contract.purchaseTicket(ticketTypeId, tokenURI, { value: priceInWei })
        const receipt = await tx.wait()

        // Find the TicketPurchased event in the transaction logs
        const ticketPurchasedEvent = receipt.events?.find((event: any) => event.event === "TicketPurchased")
        const tokenId = ticketPurchasedEvent?.args?.tokenId.toString()

        toast({
          title: "Ticket purchased successfully",
          description: "Your ticket has been minted as an NFT",
        })

        return tokenId
      } catch (err) {
        console.error("Error purchasing ticket:", err)
        setError(err as Error)
        toast({
          title: "Failed to purchase ticket",
          description: (err as Error).message,
          variant: "destructive",
        })
        return null
      } finally {
        setLoading(false)
      }
    },
    [contract, signer, toast],
  )

  const getEventsByCreator = useCallback(
    async (creatorAddress: string) => {
      if (!contract) return []

      try {
        const eventIds = await contract.getEventsByCreator(creatorAddress)
        const events = []

        for (const eventId of eventIds) {
          const eventData = await contract.events(eventId)
          events.push(formatEventData(eventData))
        }

        return events
      } catch (err) {
        console.error("Error fetching events by creator:", err)
        setError(err as Error)
        return []
      }
    },
    [contract],
  )

  const getTicketTypesByEvent = useCallback(
    async (eventId: string) => {
      if (!contract) return []

      try {
        const ticketTypeIds = await contract.getTicketTypesByEvent(eventId)
        const ticketTypes = []

        for (const ticketTypeId of ticketTypeIds) {
          const ticketTypeData = await contract.ticketTypes(ticketTypeId)
          ticketTypes.push(formatTicketTypeData(ticketTypeData))
        }

        return ticketTypes
      } catch (err) {
        console.error("Error fetching ticket types by event:", err)
        setError(err as Error)
        return []
      }
    },
    [contract],
  )

  const getTicketsByOwner = useCallback(
    async (ownerAddress: string) => {
      if (!contract) return []

      try {
        const tokenIds = await contract.getTicketsByOwner(ownerAddress)
        const tickets = []

        for (const tokenId of tokenIds) {
          const ticketData = await contract.tickets(tokenId)
          const tokenURI = await contract.tokenURI(tokenId)

          tickets.push({
            tokenId: tokenId.toString(),
            eventId: ticketData.eventId.toString(),
            ticketTypeId: ticketData.ticketTypeId.toString(),
            isUsed: ticketData.isUsed,
            purchaseDate: new Date(ticketData.purchaseDate.toNumber() * 1000),
            tokenURI,
          })
        }

        return tickets
      } catch (err) {
        console.error("Error fetching tickets by owner:", err)
        setError(err as Error)
        return []
      }
    },
    [contract],
  )

  return {
    contract,
    loading,
    error,
    createEvent,
    createTicketType,
    purchaseTicket,
    getEventsByCreator,
    getTicketTypesByEvent,
    getTicketsByOwner,
  }
}

// Hook for interacting with the TicketMarketplace contract
export function useTicketMarketplaceContract() {
  const { provider, signer, address } = useWeb3()
  const { toast } = useToast()
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (provider && signer) {
      try {
        const marketplaceContract = getContract("TicketMarketplace", signer)
        setContract(marketplaceContract)
      } catch (err) {
        console.error("Error initializing TicketMarketplace contract:", err)
        setError(err as Error)
      }
    }
  }, [provider, signer])

  const listTicket = useCallback(
    async (tokenId: string, price: string) => {
      if (!contract || !signer) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet to list a ticket",
          variant: "destructive",
        })
        return false
      }

      setLoading(true)
      setError(null)

      try {
        const priceInWei = ethers.utils.parseEther(price)
        const tx = await contract.listTicket(tokenId, priceInWei)
        await tx.wait()

        toast({
          title: "Ticket listed successfully",
          description: `Your ticket has been listed for ${price} ETH`,
        })

        return true
      } catch (err) {
        console.error("Error listing ticket:", err)
        setError(err as Error)
        toast({
          title: "Failed to list ticket",
          description: (err as Error).message,
          variant: "destructive",
        })
        return false
      } finally {
        setLoading(false)
      }
    },
    [contract, signer, toast],
  )

  const buyTicket = useCallback(
    async (tokenId: string, price: string) => {
      if (!contract || !signer) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet to buy a ticket",
          variant: "destructive",
        })
        return false
      }

      setLoading(true)
      setError(null)

      try {
        const priceInWei = ethers.utils.parseEther(price)
        const tx = await contract.buyTicket(tokenId, { value: priceInWei })
        await tx.wait()

        toast({
          title: "Ticket purchased successfully",
          description: "You now own this ticket",
        })

        return true
      } catch (err) {
        console.error("Error buying ticket:", err)
        setError(err as Error)
        toast({
          title: "Failed to buy ticket",
          description: (err as Error).message,
          variant: "destructive",
        })
        return false
      } finally {
        setLoading(false)
      }
    },
    [contract, signer, toast],
  )

  const makeOffer = useCallback(
    async (tokenId: string, price: string, expirationDays: number) => {
      if (!contract || !signer) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet to make an offer",
          variant: "destructive",
        })
        return false
      }

      setLoading(true)
      setError(null)

      try {
        const priceInWei = ethers.utils.parseEther(price)
        const expirationTime = Math.floor(Date.now() / 1000) + expirationDays * 86400 // Convert days to seconds
        const tx = await contract.makeOffer(tokenId, expirationTime, { value: priceInWei })
        await tx.wait()

        toast({
          title: "Offer made successfully",
          description: `Your offer of ${price} ETH has been submitted`,
        })

        return true
      } catch (err) {
        console.error("Error making offer:", err)
        setError(err as Error)
        toast({
          title: "Failed to make offer",
          description: (err as Error).message,
          variant: "destructive",
        })
        return false
      } finally {
        setLoading(false)
      }
    },
    [contract, signer, toast],
  )

  const getActiveOffers = useCallback(
    async (tokenId: string) => {
      if (!contract) return []

      try {
        const offers = await contract.getActiveOffers(tokenId)
        return offers.map((offer: any) => ({
          tokenId: offer.tokenId.toString(),
          buyer: offer.buyer,
          price: ethers.utils.formatEther(offer.price),
          expirationTime: new Date(offer.expirationTime.toNumber() * 1000),
          isActive: offer.isActive,
        }))
      } catch (err) {
        console.error("Error fetching active offers:", err)
        setError(err as Error)
        return []
      }
    },
    [contract],
  )

  return {
    contract,
    loading,
    error,
    listTicket,
    buyTicket,
    makeOffer,
    getActiveOffers,
  }
}

// Hook for interacting with the Fundraising contract
export function useFundraisingContract() {
  const { provider, signer, address } = useWeb3()
  const { toast } = useToast()
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (provider && signer) {
      try {
        const fundraisingContract = getContract("Fundraising", signer)
        setContract(fundraisingContract)
      } catch (err) {
        console.error("Error initializing Fundraising contract:", err)
        setError(err as Error)
      }
    }
  }, [provider, signer])

  const createCampaign = useCallback(
    async (title: string, description: string, goal: string, startDate: Date, endDate: Date) => {
      if (!contract || !signer) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet to create a campaign",
          variant: "destructive",
        })
        return null
      }

      setLoading(true)
      setError(null)

      try {
        const goalInWei = ethers.utils.parseEther(goal)
        const startTimestamp = Math.floor(startDate.getTime() / 1000)
        const endTimestamp = Math.floor(endDate.getTime() / 1000)

        const tx = await contract.createCampaign(title, description, goalInWei, startTimestamp, endTimestamp)
        const receipt = await tx.wait()

        // Find the CampaignCreated event in the transaction logs
        const campaignCreatedEvent = receipt.events?.find((event: any) => event.event === "CampaignCreated")
        const campaignId = campaignCreatedEvent?.args?.campaignId.toString()

        toast({
          title: "Campaign created successfully",
          description: `Your fundraising campaign "${title}" has been created`,
        })

        return campaignId
      } catch (err) {
        console.error("Error creating campaign:", err)
        setError(err as Error)
        toast({
          title: "Failed to create campaign",
          description: (err as Error).message,
          variant: "destructive",
        })
        return null
      } finally {
        setLoading(false)
      }
    },
    [contract, signer, toast],
  )

  const donate = useCallback(
    async (campaignId: string, amount: string, message: string, isAnonymous: boolean) => {
      if (!contract || !signer) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet to donate",
          variant: "destructive",
        })
        return false
      }

      setLoading(true)
      setError(null)

      try {
        const amountInWei = ethers.utils.parseEther(amount)
        const tx = await contract.donate(campaignId, message, isAnonymous, { value: amountInWei })
        await tx.wait()

        toast({
          title: "Donation successful",
          description: `Thank you for your donation of ${amount} ETH`,
        })

        return true
      } catch (err) {
        console.error("Error donating:", err)
        setError(err as Error)
        toast({
          title: "Failed to donate",
          description: (err as Error).message,
          variant: "destructive",
        })
        return false
      } finally {
        setLoading(false)
      }
    },
    [contract, signer, toast],
  )

  const getCampaignsByCreator = useCallback(
    async (creatorAddress: string) => {
      if (!contract) return []

      try {
        const campaignIds = await contract.getCampaignsByCreator(creatorAddress)
        const campaigns = []

        for (const campaignId of campaignIds) {
          const campaignData = await contract.campaigns(campaignId)
          campaigns.push(formatCampaignData(campaignData))
        }

        return campaigns
      } catch (err) {
        console.error("Error fetching campaigns by creator:", err)
        setError(err as Error)
        return []
      }
    },
    [contract],
  )

  const getDonations = useCallback(
    async (campaignId: string) => {
      if (!contract) return []

      try {
        const donations = await contract.getDonations(campaignId)
        return donations.map((donation: any) => ({
          donor: donation.donor,
          amount: ethers.utils.formatEther(donation.amount),
          timestamp: new Date(donation.timestamp.toNumber() * 1000),
          message: donation.message,
          isAnonymous: donation.isAnonymous,
        }))
      } catch (err) {
        console.error("Error fetching donations:", err)
        setError(err as Error)
        return []
      }
    },
    [contract],
  )

  return {
    contract,
    loading,
    error,
    createCampaign,
    donate,
    getCampaignsByCreator,
    getDonations,
  }
}
