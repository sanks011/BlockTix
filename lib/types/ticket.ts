// Types for user tickets
export interface UserTicket {
  tokenId: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  location: string;
  ticketType: string;
  issuer: string;
  purchaseDate: string;
  price: string;
  image: string;
  status: 'upcoming' | 'past';
  isUsed: boolean;
}
