import { ethers } from "ethers"

// ABI imports
import EventTicketABI from "@/contracts/abis/EventTicket.json"
import TicketMarketplaceABI from "@/contracts/abis/TicketMarketplace.json"
import FundraisingABI from "@/contracts/abis/Fundraising.json"

// Contract addresses - these would be the deployed contract addresses
// For development, you can use hardcoded addresses or environment variables
export const CONTRACT_ADDRESSES = {
  // Replace these with your actual deployed contract addresses
  EventTicket: process.env.NEXT_PUBLIC_EVENT_TICKET_ADDRESS || "0x123...",
  TicketMarketplace: process.env.NEXT_PUBLIC_TICKET_MARKETPLACE_ADDRESS || "0x456...",
  Fundraising: process.env.NEXT_PUBLIC_FUNDRAISING_ADDRESS || "0x789...",
}

// Contract ABIs
export const CONTRACT_ABIS = {
  EventTicket: EventTicketABI,
  TicketMarketplace: TicketMarketplaceABI,
  Fundraising: FundraisingABI,
}

// Helper function to get contract instance
export function getContract(
  name: "EventTicket" | "TicketMarketplace" | "Fundraising",
  providerOrSigner: ethers.providers.Web3Provider | ethers.Signer,
) {
  const address = CONTRACT_ADDRESSES[name]
  const abi = CONTRACT_ABIS[name]

  return new ethers.Contract(address, abi, providerOrSigner)
}

// Helper function to format event data from blockchain to our app format
export function formatEventData(eventData: any) {
  return {
    id: eventData.id.toString(),
    title: eventData.name,
    description: eventData.description,
    startDate: new Date(eventData.startDate.toNumber() * 1000),
    endDate: new Date(eventData.endDate.toNumber() * 1000),
    creatorAddress: eventData.creator,
    isActive: eventData.isActive,
  }
}

// Helper function to format ticket type data
export function formatTicketTypeData(ticketTypeData: any) {
  return {
    id: ticketTypeData.id.toString(),
    eventId: ticketTypeData.eventId.toString(),
    name: ticketTypeData.name,
    description: ticketTypeData.description,
    price: ethers.utils.formatEther(ticketTypeData.price),
    supply: ticketTypeData.supply.toNumber(),
    sold: ticketTypeData.sold.toNumber(),
    isActive: ticketTypeData.isActive,
  }
}

// Helper function to format campaign data
export function formatCampaignData(campaignData: any) {
  return {
    id: campaignData.id.toString(),
    title: campaignData.title,
    description: campaignData.description,
    goal: ethers.utils.formatEther(campaignData.goal),
    raised: ethers.utils.formatEther(campaignData.raised),
    startDate: new Date(campaignData.startDate.toNumber() * 1000),
    endDate: new Date(campaignData.endDate.toNumber() * 1000),
    creator: campaignData.creator,
    isActive: campaignData.isActive,
    fundsWithdrawn: campaignData.fundsWithdrawn,
  }
}
