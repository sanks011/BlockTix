// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title EventTicket
 * @dev Contract for creating events and minting tickets as NFTs
 */
contract EventTicket is ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    // Counters for IDs
    Counters.Counter private _eventIds;
    Counters.Counter private _ticketTypeIds;
    Counters.Counter private _tokenIds;
    
    // Structs
    struct Event {
        uint256 id;
        string name;
        string description;
        uint256 startDate;
        uint256 endDate;
        address creator;
        bool isActive;
    }
    
    struct TicketType {
        uint256 id;
        uint256 eventId;
        string name;
        string description;
        uint256 price;
        uint256 supply;
        uint256 sold;
        bool isActive;
    }
    
    struct Ticket {
        uint256 eventId;
        uint256 ticketTypeId;
        bool isUsed;
        uint256 purchaseDate;
    }
    
    // Mappings
    mapping(uint256 => Event) public events;
    mapping(uint256 => TicketType) public ticketTypes;
    mapping(uint256 => Ticket) public tickets;
    mapping(address => uint256[]) private _creatorToEvents;
    mapping(uint256 => uint256[]) private _eventToTicketTypes;
    mapping(address => uint256[]) private _ownerToTickets;
    
    // Events
    event EventCreated(uint256 indexed eventId, string name, address indexed creator);
    event TicketTypeCreated(uint256 indexed eventId, uint256 indexed ticketTypeId, string name, uint256 price);
    event TicketPurchased(uint256 indexed eventId, uint256 indexed ticketTypeId, uint256 indexed tokenId, address buyer);
    event TicketUsed(uint256 indexed tokenId);
    event EventUpdated(uint256 indexed eventId);
    event TicketTypeUpdated(uint256 indexed ticketTypeId);
    
    constructor() ERC721("BlockTix Event Ticket", "BTIX") {}
    
    /**
     * @dev Create a new event
     */
    function createEvent(
        string memory name,
        string memory description,
        uint256 startDate,
        uint256 endDate
    ) public returns (uint256) {
        require(startDate >= block.timestamp, "Start date must be in the future");
        require(endDate > startDate, "End date must be after start date");
        
        _eventIds.increment();
        uint256 newEventId = _eventIds.current();
        
        events[newEventId] = Event({
            id: newEventId,
            name: name,
            description: description,
            startDate: startDate,
            endDate: endDate,
            creator: msg.sender,
            isActive: true
        });
        
        _creatorToEvents[msg.sender].push(newEventId);
        
        emit EventCreated(newEventId, name, msg.sender);
        
        return newEventId;
    }
    
    /**
     * @dev Create a new ticket type for an event
     */
    function createTicketType(
        uint256 eventId,
        string memory name,
        string memory description,
        uint256 price,
        uint256 supply
    ) public returns (uint256) {
        require(events[eventId].creator == msg.sender, "Only event creator can create ticket types");
        require(events[eventId].isActive, "Event is not active");
        require(supply > 0, "Supply must be greater than zero");
        
        _ticketTypeIds.increment();
        uint256 newTicketTypeId = _ticketTypeIds.current();
        
        ticketTypes[newTicketTypeId] = TicketType({
            id: newTicketTypeId,
            eventId: eventId,
            name: name,
            description: description,
            price: price,
            supply: supply,
            sold: 0,
            isActive: true
        });
        
        _eventToTicketTypes[eventId].push(newTicketTypeId);
        
        emit TicketTypeCreated(eventId, newTicketTypeId, name, price);
        
        return newTicketTypeId;
    }
    
    /**
     * @dev Purchase a ticket
     */
    function purchaseTicket(uint256 ticketTypeId, string memory tokenURI) public payable nonReentrant returns (uint256) {
        TicketType storage ticketType = ticketTypes[ticketTypeId];
        Event storage event_ = events[ticketType.eventId];
        
        require(ticketType.isActive, "Ticket type is not active");
        require(event_.isActive, "Event is not active");
        require(block.timestamp < event_.endDate, "Event has ended");
        require(ticketType.sold < ticketType.supply, "Ticket type is sold out");
        require(msg.value >= ticketType.price, "Insufficient payment");
        
        // Mint new token
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        
        // Create ticket record
        tickets[newTokenId] = Ticket({
            eventId: ticketType.eventId,
            ticketTypeId: ticketTypeId,
            isUsed: false,
            purchaseDate: block.timestamp
        });
        
        // Update ticket type sold count
        ticketType.sold++;
        
        // Track owner's tickets
        _ownerToTickets[msg.sender].push(newTokenId);
        
        // Transfer payment to event creator
        payable(event_.creator).transfer(msg.value);
        
        emit TicketPurchased(ticketType.eventId, ticketTypeId, newTokenId, msg.sender);
        
        return newTokenId;
    }
    
    /**
     * @dev Mark a ticket as used
     */
    function useTicket(uint256 tokenId) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Caller is not owner nor approved");
        require(!tickets[tokenId].isUsed, "Ticket has already been used");
        
        tickets[tokenId].isUsed = true;
        
        emit TicketUsed(tokenId);
    }
    
    /**
     * @dev Update event details
     */
    function updateEvent(
        uint256 eventId,
        string memory name,
        string memory description,
        uint256 startDate,
        uint256 endDate,
        bool isActive
    ) public {
        Event storage event_ = events[eventId];
        
        require(event_.creator == msg.sender, "Only event creator can update event");
        require(block.timestamp < event_.startDate, "Event has already started");
        
        if (startDate > 0) {
            require(startDate >= block.timestamp, "Start date must be in the future");
            event_.startDate = startDate;
        }
        
        if (endDate > 0) {
            require(endDate > event_.startDate, "End date must be after start date");
            event_.endDate = endDate;
        }
        
        if (bytes(name).length > 0) {
            event_.name = name;
        }
        
        if (bytes(description).length > 0) {
            event_.description = description;
        }
        
        event_.isActive = isActive;
        
        emit EventUpdated(eventId);
    }
    
    /**
     * @dev Update ticket type details
     */
    function updateTicketType(
        uint256 ticketTypeId,
        string memory name,
        string memory description,
        uint256 price,
        uint256 supply,
        bool isActive
    ) public {
        TicketType storage ticketType = ticketTypes[ticketTypeId];
        Event storage event_ = events[ticketType.eventId];
        
        require(event_.creator == msg.sender, "Only event creator can update ticket type");
        require(block.timestamp < event_.startDate, "Event has already started");
        
        if (bytes(name).length > 0) {
            ticketType.name = name;
        }
        
        if (bytes(description).length > 0) {
            ticketType.description = description;
        }
        
        if (price > 0) {
            ticketType.price = price;
        }
        
        if (supply > 0) {
            require(supply >= ticketType.sold, "Supply cannot be less than sold tickets");
            ticketType.supply = supply;
        }
        
        ticketType.isActive = isActive;
        
        emit TicketTypeUpdated(ticketTypeId);
    }
    
    /**
     * @dev Get all events created by an address
     */
    function getEventsByCreator(address creator) public view returns (uint256[] memory) {
        return _creatorToEvents[creator];
    }
    
    /**
     * @dev Get all ticket types for an event
     */
    function getTicketTypesByEvent(uint256 eventId) public view returns (uint256[] memory) {
        return _eventToTicketTypes[eventId];
    }
    
    /**
     * @dev Get all tickets owned by an address
     */
    function getTicketsByOwner(address owner) public view returns (uint256[] memory) {
        return _ownerToTickets[owner];
    }
    
    /**
     * @dev Check if a ticket is valid for entry
     */
    function isTicketValid(uint256 tokenId) public view returns (bool) {
        if (!_exists(tokenId)) {
            return false;
        }
        
        Ticket memory ticket = tickets[tokenId];
        Event memory event_ = events[ticket.eventId];
        
        return (
            !ticket.isUsed &&
            event_.isActive &&
            block.timestamp >= event_.startDate &&
            block.timestamp <= event_.endDate
        );
    }
}
