/**
 * helpers.js — Shared utility functions used across the app.
 */

/**
 * Shortens a wallet address or tx hash for display.
 * e.g. "0xf39F...2266"
 */
export function shortenAddress(address, chars = 4) {
  if (!address) return ''
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

/**
 * Formats a Unix timestamp (seconds) into a readable date string.
 */
export function formatDate(timestamp) {
  if (!timestamp) return 'N/A'
  return new Date(timestamp * 1000).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Formats a Unix timestamp into date + time.
 */
export function formatDateTime(timestamp) {
  if (!timestamp) return 'N/A'
  return new Date(timestamp * 1000).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Returns a human-readable "time remaining" string or "Expired".
 */
export function timeRemaining(deadlineTimestamp) {
  const now = Math.floor(Date.now() / 1000)
  const diff = deadlineTimestamp - now
  if (diff <= 0) return 'Expired'

  const days = Math.floor(diff / 86400)
  const hours = Math.floor((diff % 86400) / 3600)
  const minutes = Math.floor((diff % 3600) / 60)

  if (days > 0) return `${days}d ${hours}h remaining`
  if (hours > 0) return `${hours}h ${minutes}m remaining`
  return `${minutes}m remaining`
}

/**
 * Clamps progress to a max of 100% for display.
 */
export function clampProgress(percent) {
  return Math.min(100, Math.max(0, percent))
}

/**
 * Determines the campaign status label and color class.
 */
export function getCampaignStatus(campaign) {
  if (!campaign.active) {
    return { label: 'Closed', color: 'badge-danger' }
  }
  if (campaign.isExpired) {
    return { label: 'Expired', color: 'badge-warning' }
  }
  if (campaign.progressPercent >= 100) {
    return { label: 'Goal Reached', color: 'badge-success' }
  }
  return { label: 'Active', color: 'badge-success' }
}

/**
 * Parses a contract error message into a user-friendly string.
 */
export function parseContractError(error) {
  if (!error) return 'An unknown error occurred.'

  const message = error?.reason
    || error?.data?.message
    || error?.message
    || String(error)
  const normalizedMessage = message.toLowerCase()

  // MetaMask user rejection
  if (
    error?.code === 4001 ||
    error?.code === 'ACTION_REJECTED' ||
    normalizedMessage.includes('user rejected')
  ) {
    return 'MetaMask request rejected. You cancelled the request.'
  }
  if (normalizedMessage.includes('insufficient funds')) {
    return 'Insufficient test ETH for the donation amount and transaction gas fees.'
  }
  if (normalizedMessage.includes('hardhat local is unavailable')) {
    return message
  }
  if (normalizedMessage.includes('not deployed')) {
    return message
  }
  if (message.includes('Campaign is not active')) {
    return 'This campaign is currently not active.'
  }
  if (message.includes('Campaign deadline has passed')) {
    return 'This campaign has passed its deadline.'
  }
  if (message.includes('Donation amount must be greater than zero')) {
    return 'Donation amount must be greater than zero.'
  }
  if (message.includes('Only admin')) {
    return 'Only the administrator can perform this action.'
  }
  if (message.includes('No funds available')) {
    return 'No funds are available for withdrawal.'
  }
  // Return the raw message trimmed as fallback
  return message.length > 120 ? message.slice(0, 120) + '...' : message
}
