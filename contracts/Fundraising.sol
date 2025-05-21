// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title Fundraising
 * @dev Contract for creating and managing fundraising campaigns
 */
contract Fundraising is Ownable, ReentrancyGuard {
    struct Campaign {
        uint256 id;
        string title;
        string description;
        uint256 goal;
        uint256 raised;
        uint256 startDate;
        uint256 endDate;
        address creator;
        bool isActive;
        bool fundsWithdrawn;
    }
    
    struct Donation {
        address donor;
        uint256 amount;
        uint256 timestamp;
        string message;
        bool isAnonymous;
    }
    
    // Mappings
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => Donation[]) public campaignDonations;
    mapping(address => uint256[]) public creatorToCampaigns;
    mapping(address => uint256[]) public donorToCampaigns;
    
    // Counters
    uint256 private _campaignIds;
    
    // Platform fee percentage (in basis points, e.g., 100 = 1%)
    uint256 public platformFeePercentage = 100;
    
    // Events
    event CampaignCreated(uint256 indexed campaignId, string title, address indexed creator, uint256 goal);
    event DonationReceived(uint256 indexed campaignId, address indexed donor, uint256 amount, bool isAnonymous);
    event CampaignUpdated(uint256 indexed campaignId);
    event FundsWithdrawn(uint256 indexed campaignId, address indexed creator, uint256 amount);
    event PlatformFeeUpdated(uint256 newFeePercentage);
    
    /**
     * @dev Create a new fundraising campaign
     */
    function createCampaign(
        string memory title,
        string memory description,
        uint256 goal,
        uint256 startDate,
        uint256 endDate
    ) public returns (uint256) {
        require(startDate >= block.timestamp, "Start date must be in the future");
        require(endDate > startDate, "End date must be after start date");
        require(goal > 0, "Goal must be greater than zero");
        
        _campaignIds++;
        uint256 newCampaignId = _campaignIds;
        
        campaigns[newCampaignId] = Campaign({
            id: newCampaignId,
            title: title,
            description: description,
            goal: goal,
            raised: 0,
            startDate: startDate,
            endDate: endDate,
            creator: msg.sender,
            isActive: true,
            fundsWithdrawn: false
        });
        
        creatorToCampaigns[msg.sender].push(newCampaignId);
        
        emit CampaignCreated(newCampaignId, title, msg.sender, goal);
        
        return newCampaignId;
    }
    
    /**
     * @dev Donate to a campaign
     */
    function donate(uint256 campaignId, string memory message, bool isAnonymous) public payable nonReentrant {
        Campaign storage campaign = campaigns[campaignId];
        
        require(campaign.isActive, "Campaign is not active");
        require(block.timestamp >= campaign.startDate, "Campaign has not started yet");
        require(block.timestamp <= campaign.endDate, "Campaign has ended");
        require(msg.value > 0, "Donation amount must be greater than zero");
        
        // Add donation to campaign
        campaign.raised += msg.value;
        
        // Record donation
        campaignDonations[campaignId].push(Donation({
            donor: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp,
            message: message,
            isAnonymous: isAnonymous
        }));
        
        // Track donor's campaigns
        if (!isDonorInCampaign(msg.sender, campaignId)) {
            donorToCampaigns[msg.sender].push(campaignId);
        }
        
        emit DonationReceived(campaignId, msg.sender, msg.value, isAnonymous);
    }
    
    /**
     * @dev Check if donor has already donated to a campaign
     */
    function isDonorInCampaign(address donor, uint256 campaignId) internal view returns (bool) {
        uint256[] memory campaigns = donorToCampaigns[donor];
        for (uint256 i = 0; i < campaigns.length; i++) {
            if (campaigns[i] == campaignId) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * @dev Update campaign details
     */
    function updateCampaign(
        uint256 campaignId,
        string memory title,
        string memory description,
        uint256 goal,
        uint256 endDate,
        bool isActive
    ) public {
        Campaign storage campaign = campaigns[campaignId];
        
        require(campaign.creator == msg.sender, "Only campaign creator can update campaign");
        require(block.timestamp < campaign.endDate, "Campaign has already ended");
        require(goal >= campaign.raised, "Goal cannot be less than amount already raised");
        require(endDate > block.timestamp, "End date must be in the future");
        
        campaign.title = title;
        campaign.description = description;
        campaign.goal = goal;
        campaign.endDate = endDate;
        campaign.isActive = isActive;
        
        emit CampaignUpdated(campaignId);
    }
    
    /**
     * @dev Withdraw funds from a campaign
     */
    function withdrawFunds(uint256 campaignId) public nonReentrant {
        Campaign storage campaign = campaigns[campaignId];
        
        require(campaign.creator == msg.sender, "Only campaign creator can withdraw funds");
        require(!campaign.fundsWithdrawn, "Funds have already been withdrawn");
        require(campaign.raised > 0, "No funds to withdraw");
        require(
            block.timestamp > campaign.endDate || campaign.raised >= campaign.goal,
            "Campaign must be ended or goal reached"
        );
        
        // Calculate platform fee
        uint256 platformFee = (campaign.raised * platformFeePercentage) / 10000;
        uint256 creatorAmount = campaign.raised - platformFee;
        
        // Mark funds as withdrawn
        campaign.fundsWithdrawn = true;
        
        // Transfer funds
        payable(campaign.creator).transfer(creatorAmount);
        
        emit FundsWithdrawn(campaignId, campaign.creator, creatorAmount);
    }
    
    /**
     * @dev Update platform fee percentage (owner only)
     */
    function updatePlatformFee(uint256 newFeePercentage) public onlyOwner {
        require(newFeePercentage <= 500, "Fee cannot exceed 5%");
        platformFeePercentage = newFeePercentage;
        
        emit PlatformFeeUpdated(newFeePercentage);
    }
    
    /**
     * @dev Withdraw platform fees (owner only)
     */
    function withdrawPlatformFees() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        payable(owner()).transfer(balance);
    }
    
    /**
     * @dev Get all campaigns created by an address
     */
    function getCampaignsByCreator(address creator) public view returns (uint256[] memory) {
        return creatorToCampaigns[creator];
    }
    
    /**
     * @dev Get all campaigns a user has donated to
     */
    function getCampaignsByDonor(address donor) public view returns (uint256[] memory) {
        return donorToCampaigns[donor];
    }
    
    /**
     * @dev Get all donations for a campaign
     */
    function getDonations(uint256 campaignId) public view returns (Donation[] memory) {
        return campaignDonations[campaignId];
    }
    
    /**
     * @dev Check if a campaign has reached its goal
     */
    function hasReachedGoal(uint256 campaignId) public view returns (bool) {
        Campaign memory campaign = campaigns[campaignId];
        return campaign.raised >= campaign.goal;
    }
}
