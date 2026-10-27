/**
 * contractConfig.js
 *
 * Centralized configuration for the CharityDonation smart contract.
 * Update CONTRACT_ADDRESS after each new deployment.
 *
 * The ABI below is the minimal ABI needed by the frontend.
 * After compiling, the full ABI is at:
 *   contracts/artifacts/contracts/CharityDonation.sol/CharityDonation.json
 */

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS

export const EXPECTED_CHAIN_ID = 31337

export const NETWORK_NAME = 'Hardhat Local'

export const RPC_URL = 'http://127.0.0.1:8545'

export const CONTRACT_ABI = [
  // ── Read-only (view) functions ────────────────────────────────
  'function campaignCount() view returns (uint256)',
  'function getAllCampaigns() view returns (tuple(uint256 id, string title, string description, address creator, address recipient, uint256 goal, uint256 amountRaised, uint256 deadline, bool active, uint256 withdrawnAmount)[])',
  'function getCampaign(uint256 _campaignId) view returns (tuple(uint256 id, string title, string description, address creator, address recipient, uint256 goal, uint256 amountRaised, uint256 deadline, bool active, uint256 withdrawnAmount))',
  'function getCampaignDonations(uint256 _campaignId) view returns (tuple(address donor, uint256 amount, uint256 timestamp, uint256 campaignId)[])',
  'function getDonorDonationIds(address _donor) view returns (uint256[])',
  'function getDonation(uint256 _index) view returns (tuple(address donor, uint256 amount, uint256 timestamp, uint256 campaignId))',
  'function getTotalDonations() view returns (uint256)',
  'function getTotalRaised() view returns (uint256)',
  // ── State-changing functions ──────────────────────────────────
  'function donate(uint256 _campaignId) payable',
  // ── Events ───────────────────────────────────────────────────
  'event DonationReceived(uint256 indexed campaignId, address indexed donor, uint256 amount, uint256 timestamp)',
]
