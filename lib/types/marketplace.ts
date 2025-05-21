// Types for the NFT marketplace
export interface TicketListing {
  id: string;
  tokenId: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  ticketType: string;
  seller: string;
  price: string;
  listingDate: string;
  image: string;
}

export interface Offer {
  id: string;
  tokenId: string;
  buyer: string;
  price: string;
  expirationDate: string;
  timestamp: string;
  status: 'active' | 'accepted' | 'rejected' | 'expired';
}
