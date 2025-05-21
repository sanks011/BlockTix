// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./EventTicket.sol";

/**
 * @title TicketMarketplace
 * @dev Contract for buying and selling event tickets on a secondary marketplace
 */
contract TicketMarketplace is ReentrancyGuard, Ownable {
    EventTicket private eventTicketContract;
    
    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool isActive;
    }
    
    struct Offer {
        uint256 tokenId;
        address buyer;
        uint256 price;
        uint256 expirationTime;
        bool isActive;
    }
    
    // Mappings
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Offer[]) public offers;
    
    // Platform fee percentage (in basis points, e.g., 250 = 2.5%)
    uint256 public platformFeePercentage = 250;
    
    // Events
    event TicketListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event TicketSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);
    event OfferCreated(uint256 indexed tokenId, address indexed buyer, uint256 price, uint256 expirationTime);
    event OfferAccepted(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event OfferCancelled(uint256 indexed tokenId, address indexed buyer);
    event PlatformFeeUpdated(uint256 newFeePercentage);
    
    constructor(address _eventTicketAddress) {
        eventTicketContract = EventTicket(_eventTicketAddress);
    }
    
    /**
     * @dev List a ticket for sale
     */
    function listTicket(uint256 tokenId, uint256 price) public {
        require(eventTicketContract.ownerOf(tokenId) == msg.sender, "You don't own this ticket");
        require(price > 0, "Price must be greater than zero");
        require(!listings[tokenId].isActive, "Ticket is already listed");
        
        // Ensure the contract is approved to transfer the NFT
        require(
            eventTicketContract.getApproved(tokenId) == address(this) || 
            eventTicketContract.isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved to transfer ticket"
        );
        
        listings[tokenId] = Listing({
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            isActive: true
        });
        
        emit TicketListed(tokenId, msg.sender, price);
    }
    
    /**
     * @dev Buy a listed ticket
     */
    function buyTicket(uint256 tokenId) public payable nonReentrant {
        Listing storage listing = listings[tokenId];
        
        require(listing.isActive, "Ticket is not listed for sale");
        require(msg.value >= listing.price, "Insufficient payment");
        require(msg.sender != listing.seller, "Seller cannot buy their own ticket");
        
        // Calculate platform fee
        uint256 platformFee = (listing.price * platformFeePercentage) / 10000;
        uint256 sellerAmount = listing.price - platformFee;
        
        // Transfer ownership of the ticket
        address seller = listing.seller;
        eventTicketContract.safeTransferFrom(seller, msg.sender, tokenId);
        
        // Transfer funds
        payable(seller).transfer(sellerAmount);
        
        // Deactivate listing
        listing.isActive = false;
        
        emit TicketSold(tokenId, seller, msg.sender, listing.price);
    }
    
    /**
     * @dev Cancel a ticket listing
     */
    function cancelListing(uint256 tokenId) public {
        Listing storage listing = listings[tokenId];
        
        require(listing.isActive, "Listing is not active");
        require(listing.seller == msg.sender, "Only seller can cancel listing");
        
        listing.isActive = false;
        
        emit ListingCancelled(tokenId, msg.sender);
    }
    
    /**
     * @dev Make an offer for a ticket
     */
    function makeOffer(uint256 tokenId, uint256 expirationTime) public payable {
        require(eventTicketContract.ownerOf(tokenId) != msg.sender, "You already own this ticket");
        require(msg.value > 0, "Offer price must be greater than zero");
        require(expirationTime > block.timestamp, "Expiration time must be in the future");
        
        offers[tokenId].push(Offer({
            tokenId: tokenId,
            buyer: msg.sender,
            price: msg.value,
            expirationTime: expirationTime,
            isActive: true
        }));
        
        emit OfferCreated(tokenId, msg.sender, msg.value, expirationTime);
    }
    
    /**
     * @dev Accept an offer for a ticket
     */
    function acceptOffer(uint256 tokenId, uint256 offerIndex) public nonReentrant {
        require(eventTicketContract.ownerOf(tokenId) == msg.sender, "You don't own this ticket");
        require(offerIndex < offers[tokenId].length, "Invalid offer index");
        
        Offer storage offer = offers[tokenId][offerIndex];
        
        require(offer.isActive, "Offer is not active");
        require(offer.expirationTime > block.timestamp, "Offer has expired");
        
        // Ensure the contract is approved to transfer the NFT
        require(
            eventTicketContract.getApproved(tokenId) == address(this) || 
            eventTicketContract.isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved to transfer ticket"
        );
        
        // Calculate platform fee
        uint256 platformFee = (offer.price * platformFeePercentage) / 10000;
        uint256 sellerAmount = offer.price - platformFee;
        
        // Transfer ownership of the ticket
        address buyer = offer.buyer;
        eventTicketContract.safeTransferFrom(msg.sender, buyer, tokenId);
        
        // Transfer funds to seller
        payable(msg.sender).transfer(sellerAmount);
        
        // Deactivate offer
        offer.isActive = false;
        
        // If the ticket was listed, deactivate the listing
        if (listings[tokenId].isActive) {
            listings[tokenId].isActive = false;
        }
        
        emit OfferAccepted(tokenId, msg.sender, buyer, offer.price);
    }
    
    /**
     * @dev Cancel an offer
     */
    function cancelOffer(uint256 tokenId, uint256 offerIndex) public nonReentrant {
        require(offerIndex < offers[tokenId].length, "Invalid offer index");
        
        Offer storage offer = offers[tokenId][offerIndex];
        
        require(offer.buyer == msg.sender, "Only the buyer can cancel the offer");
        require(offer.isActive, "Offer is not active");
        
        // Refund the buyer
        payable(msg.sender).transfer(offer.price);
        
        // Deactivate offer
        offer.isActive = false;
        
        emit OfferCancelled(tokenId, msg.sender);
    }
    
    /**
     * @dev Update platform fee percentage (owner only)
     */
    function updatePlatformFee(uint256 newFeePercentage) public onlyOwner {
        require(newFeePercentage <= 1000, "Fee cannot exceed 10%");
        platformFeePercentage = newFeePercentage;
        
        emit PlatformFeeUpdated(newFeePercentage);
    }
    
    /**
     * @dev Withdraw platform fees (owner only)
     */
    function withdrawFees() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        payable(owner()).transfer(balance);
    }
    
    /**
     * @dev Get all active offers for a ticket
     */
    function getActiveOffers(uint256 tokenId) public view returns (Offer[] memory) {
        Offer[] memory allOffers = offers[tokenId];
        uint256 activeCount = 0;
        
        // Count active offers
        for (uint256 i = 0; i < allOffers.length; i++) {
            if (allOffers[i].isActive && allOffers[i].expirationTime > block.timestamp) {
                activeCount++;
            }
        }
        
        // Create array of active offers
        Offer[] memory activeOffers = new Offer[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allOffers.length; i++) {
            if (allOffers[i].isActive && allOffers[i].expirationTime > block.timestamp) {
                activeOffers[index] = allOffers[i];
                index++;
            }
        }
        
        return activeOffers;
    }
}
