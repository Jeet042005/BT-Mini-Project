// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CharityDonation
 * @dev A transparent charity donation contract where donors can fund campaigns
 *      and campaign administrators can manage campaigns and withdraw funds.
 *
 * Key design decisions:
 * - The contract deployer becomes the admin (owner).
 * - Campaigns are created by the admin and stored on-chain.
 * - All donations are recorded on-chain for transparency.
 * - Campaign updates (text) are stored on-chain for simplicity.
 * - Funds are locked in the contract until the admin withdraws to the recipient.
 * - Reentrancy is prevented using the checks-effects-interactions pattern.
 */
contract CharityDonation {
    // ─────────────────────────────────────────────────────────
    //  STATE VARIABLES
    // ─────────────────────────────────────────────────────────

    /// @dev The deployer of the contract becomes the admin.
    address public admin;

    /// @dev Auto-incrementing counter for campaign IDs.
    uint256 public campaignCount;

    /// @dev Auto-incrementing counter for total donations.
    uint256 public totalDonationCount;

    // ─────────────────────────────────────────────────────────
    //  STRUCTS
    // ─────────────────────────────────────────────────────────

    /// @dev Represents a single charity campaign.
    struct Campaign {
        uint256 id;           // Unique campaign ID
        string title;         // Campaign title
        string description;   // Full description
        address creator;      // Address that created the campaign (admin)
        address payable recipient; // Address that receives withdrawn funds
        uint256 goal;         // Fundraising goal in wei
        uint256 amountRaised; // Total ETH raised so far (in wei)
        uint256 deadline;     // Unix timestamp for campaign end
        bool active;          // Whether the campaign is active
        uint256 withdrawnAmount; // Total amount already withdrawn
    }

    /// @dev Represents a single donation record.
    struct Donation {
        address donor;      // Who donated
        uint256 amount;     // How much (in wei)
        uint256 timestamp;  // When the donation happened
        uint256 campaignId; // Which campaign received the donation
    }

    /// @dev Represents a campaign update published by the admin.
    struct CampaignUpdate {
        string message;    // The update message
        uint256 timestamp; // When the update was posted
    }

    // ─────────────────────────────────────────────────────────
    //  MAPPINGS
    // ─────────────────────────────────────────────────────────

    /// @dev Maps campaign ID to Campaign struct.
    mapping(uint256 => Campaign) public campaigns;

    /// @dev Maps campaign ID to its list of donations.
    mapping(uint256 => Donation[]) public campaignDonations;

    /// @dev Maps donor address to list of donation indices they made.
    mapping(address => uint256[]) public donorDonationIds;

    /// @dev Stores all donations in a flat array for global history.
    Donation[] public allDonations;

    /// @dev Maps campaign ID to its list of updates.
    mapping(uint256 => CampaignUpdate[]) public campaignUpdates;

    // ─────────────────────────────────────────────────────────
    //  EVENTS
    // ─────────────────────────────────────────────────────────

    /// @notice Emitted when a new campaign is created.
    event CampaignCreated(
        uint256 indexed campaignId,
        string title,
        address indexed creator,
        address recipient,
        uint256 goal,
        uint256 deadline
    );

    /// @notice Emitted when a donation is received.
    event DonationReceived(
        uint256 indexed campaignId,
        address indexed donor,
        uint256 amount,
        uint256 timestamp
    );

    /// @notice Emitted when funds are withdrawn to the recipient.
    event FundsWithdrawn(
        uint256 indexed campaignId,
        address indexed recipient,
        uint256 amount
    );

    /// @notice Emitted when an admin posts a campaign update.
    event CampaignUpdated(
        uint256 indexed campaignId,
        string message,
        uint256 timestamp
    );

    /// @notice Emitted when a campaign is closed by the admin.
    event CampaignClosed(uint256 indexed campaignId);

    // ─────────────────────────────────────────────────────────
    //  MODIFIERS
    // ─────────────────────────────────────────────────────────

    /// @dev Restricts a function to the admin only.
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    /// @dev Ensures the campaign ID is valid (exists).
    modifier validCampaign(uint256 _campaignId) {
        require(_campaignId > 0 && _campaignId <= campaignCount, "Invalid campaign ID");
        _;
    }

    // ─────────────────────────────────────────────────────────
    //  CONSTRUCTOR
    // ─────────────────────────────────────────────────────────

    /// @dev Sets the deployer as admin.
    constructor() {
        admin = msg.sender;
    }

    // ─────────────────────────────────────────────────────────
    //  ADMIN FUNCTIONS
    // ─────────────────────────────────────────────────────────

    /**
     * @notice Creates a new charity campaign.
     * @param _title       Campaign title.
     * @param _description Full campaign description.
     * @param _recipient   Address that will receive withdrawn funds.
     * @param _goal        Fundraising goal in wei.
     * @param _deadline    Unix timestamp when donations will no longer be accepted.
     */
    function createCampaign(
        string calldata _title,
        string calldata _description,
        address payable _recipient,
        uint256 _goal,
        uint256 _deadline
    ) external onlyAdmin {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(_recipient != address(0), "Invalid recipient address");
        require(_goal > 0, "Goal must be greater than zero");
        require(_deadline > block.timestamp, "Deadline must be in the future");

        campaignCount++;

        campaigns[campaignCount] = Campaign({
            id: campaignCount,
            title: _title,
            description: _description,
            creator: msg.sender,
            recipient: _recipient,
            goal: _goal,
            amountRaised: 0,
            deadline: _deadline,
            active: true,
            withdrawnAmount: 0
        });

        emit CampaignCreated(campaignCount, _title, msg.sender, _recipient, _goal, _deadline);
    }

    /**
     * @notice Posts a textual update for a campaign.
     * @param _campaignId The campaign to update.
     * @param _message    The update message (progress, fund usage, etc.).
     */
    function postCampaignUpdate(
        uint256 _campaignId,
        string calldata _message
    ) external onlyAdmin validCampaign(_campaignId) {
        require(bytes(_message).length > 0, "Update message cannot be empty");

        campaignUpdates[_campaignId].push(CampaignUpdate({
            message: _message,
            timestamp: block.timestamp
        }));

        emit CampaignUpdated(_campaignId, _message, block.timestamp);
    }

    /**
     * @notice Closes a campaign, preventing further donations.
     * @param _campaignId The campaign to close.
     */
    function closeCampaign(uint256 _campaignId)
        external
        onlyAdmin
        validCampaign(_campaignId)
    {
        require(campaigns[_campaignId].active, "Campaign is already closed");
        campaigns[_campaignId].active = false;
        emit CampaignClosed(_campaignId);
    }

    /**
     * @notice Withdraws eligible funds from a campaign to its recipient.
     * @dev Uses checks-effects-interactions to prevent reentrancy.
     *      Admin can withdraw the full available balance (raised - already withdrawn).
     * @param _campaignId The campaign to withdraw from.
     */
    function withdrawFunds(uint256 _campaignId)
        external
        onlyAdmin
        validCampaign(_campaignId)
    {
        Campaign storage campaign = campaigns[_campaignId];

        uint256 available = campaign.amountRaised - campaign.withdrawnAmount;
        require(available > 0, "No funds available for withdrawal");

        // --- CHECKS done above ---

        // --- EFFECTS: update state before external call ---
        campaign.withdrawnAmount += available;

        // --- INTERACTIONS: send ETH after state update ---
        (bool success, ) = campaign.recipient.call{value: available}("");
        require(success, "Transfer to recipient failed");

        emit FundsWithdrawn(_campaignId, campaign.recipient, available);
    }

    // ─────────────────────────────────────────────────────────
    //  DONOR FUNCTIONS
    // ─────────────────────────────────────────────────────────

    /**
     * @notice Donates ETH to a campaign.
     * @dev The msg.value is the donation amount in wei.
     *      The function is payable so it can receive ETH.
     * @param _campaignId The campaign to donate to.
     */
    function donate(uint256 _campaignId)
        external
        payable
        validCampaign(_campaignId)
    {
        Campaign storage campaign = campaigns[_campaignId];

        require(campaign.active, "Campaign is not active");
        require(block.timestamp <= campaign.deadline, "Campaign deadline has passed");
        require(msg.value > 0, "Donation amount must be greater than zero");

        // Record the donation
        Donation memory newDonation = Donation({
            donor: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp,
            campaignId: _campaignId
        });

        campaignDonations[_campaignId].push(newDonation);

        uint256 donationIndex = allDonations.length;
        allDonations.push(newDonation);
        donorDonationIds[msg.sender].push(donationIndex);

        totalDonationCount++;
        campaign.amountRaised += msg.value;

        emit DonationReceived(_campaignId, msg.sender, msg.value, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────
    //  VIEW FUNCTIONS
    // ─────────────────────────────────────────────────────────

    /**
     * @notice Returns all campaigns as an array.
     * @dev Loops through all campaigns and returns them.
     *      For a college project this is fine; avoid in production with many campaigns.
     */
    function getAllCampaigns() external view returns (Campaign[] memory) {
        Campaign[] memory result = new Campaign[](campaignCount);
        for (uint256 i = 1; i <= campaignCount; i++) {
            result[i - 1] = campaigns[i];
        }
        return result;
    }

    /**
     * @notice Returns a single campaign by ID.
     * @param _campaignId The campaign ID.
     */
    function getCampaign(uint256 _campaignId)
        external
        view
        validCampaign(_campaignId)
        returns (Campaign memory)
    {
        return campaigns[_campaignId];
    }

    /**
     * @notice Returns all donations for a specific campaign.
     * @param _campaignId The campaign ID.
     */
    function getCampaignDonations(uint256 _campaignId)
        external
        view
        validCampaign(_campaignId)
        returns (Donation[] memory)
    {
        return campaignDonations[_campaignId];
    }

    /**
     * @notice Returns all updates for a specific campaign.
     * @param _campaignId The campaign ID.
     */
    function getCampaignUpdates(uint256 _campaignId)
        external
        view
        validCampaign(_campaignId)
        returns (CampaignUpdate[] memory)
    {
        return campaignUpdates[_campaignId];
    }

    /**
     * @notice Returns the donation indices for a specific donor.
     * @param _donor The donor's wallet address.
     */
    function getDonorDonationIds(address _donor)
        external
        view
        returns (uint256[] memory)
    {
        return donorDonationIds[_donor];
    }

    /**
     * @notice Returns a donation by its global index.
     * @param _index The global donation index.
     */
    function getDonation(uint256 _index) external view returns (Donation memory) {
        require(_index < allDonations.length, "Invalid donation index");
        return allDonations[_index];
    }

    /**
     * @notice Returns the total number of donations across all campaigns.
     */
    function getTotalDonations() external view returns (uint256) {
        return totalDonationCount;
    }

    /**
     * @notice Returns the total ETH raised across all campaigns (in wei).
     */
    function getTotalRaised() external view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 1; i <= campaignCount; i++) {
            total += campaigns[i].amountRaised;
        }
        return total;
    }

    /**
     * @notice Returns the available (not yet withdrawn) balance for a campaign.
     * @param _campaignId The campaign ID.
     */
    function getAvailableBalance(uint256 _campaignId)
        external
        view
        validCampaign(_campaignId)
        returns (uint256)
    {
        Campaign storage campaign = campaigns[_campaignId];
        return campaign.amountRaised - campaign.withdrawnAmount;
    }

    /**
     * @notice Returns the actual ETH balance held by this contract.
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
