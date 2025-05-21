import type { Timestamp } from "firebase/firestore"

export type WalletType = "metamask" | "coinbase" | "walletconnect" | "phantom" | "trust" | string

export interface User {
  id: string
  walletAddress: string
  walletType: WalletType
  displayName?: string
  profileImage?: string
  bio?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Event {
  id: string
  title: string
  description: string
  startDate: Timestamp
  endDate: Timestamp
  location: {
    type: "physical" | "virtual" | "hybrid"
    address?: string
    city?: string
    country?: string
    virtualUrl?: string
  }
  bannerImage: string
  creatorId: string
  creatorAddress: string
  category: string
  tags: string[]
  ticketTypes: TicketType[]
  totalTickets: number
  soldTickets: number
  isFeatured: boolean
  isPublished: boolean
  hasFundraising: boolean
  fundraisingGoal?: number
  fundraisingCurrent?: number
  fundraisingCurrency?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface TicketType {
  id: string
  name: string
  description: string
  price: number
  currency: string
  supply: number
  sold: number
  isNFT: boolean
  contractAddress?: string
  benefits: string[]
  saleStartDate: Timestamp
  saleEndDate: Timestamp
}

export interface Ticket {
  id: string
  eventId: string
  ticketTypeId: string
  ownerId: string
  ownerAddress: string
  purchaseDate: Timestamp
  purchasePrice: number
  purchaseCurrency: string
  isNFT: boolean
  tokenId?: string
  isUsed: boolean
  usedDate?: Timestamp
  qrCode: string
  transferHistory: TicketTransfer[]
}

export interface TicketTransfer {
  fromAddress: string
  toAddress: string
  transferDate: Timestamp
  price?: number
  currency?: string
}

export interface Fundraising {
  id: string
  eventId: string
  title: string
  description: string
  goal: number
  current: number
  currency: string
  startDate: Timestamp
  endDate: Timestamp
  donations: Donation[]
  createdAt: Timestamp
  updatedAt: Timestamp
  image?: string
}

export interface Donation {
  id: string
  donorId?: string
  donorAddress: string
  amount: number
  currency: string
  message?: string
  isAnonymous: boolean
  donationDate: Timestamp
  transactionHash: string
}
