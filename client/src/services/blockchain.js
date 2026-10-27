/**
 * blockchain.js — Centralized Ethers.js service layer.
 *
 * All contract interactions happen here.
 * Components import functions from this file instead of using ethers directly.
 *
 * Ethers v6 is used (BrowserProvider, parseEther, formatEther, etc.)
 */

import { ethers } from 'ethers'
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  EXPECTED_CHAIN_ID,
  NETWORK_NAME,
  RPC_URL,
} from '../utils/contractConfig.js'

// ─────────────────────────────────────────────────────────────
//  Provider / Signer helpers
// ─────────────────────────────────────────────────────────────

/**
 * Returns a read-only provider for the configured blockchain.
 * Reading campaigns does not require MetaMask.
 */
export function getProvider() {
  return new ethers.JsonRpcProvider(RPC_URL, EXPECTED_CHAIN_ID)
}

function getWalletProvider() {
  if (!window.ethereum) throw new Error('MetaMask is not installed. Install it to make a donation.')
  return new ethers.BrowserProvider(window.ethereum)
}

/**
 * Returns a signer (the connected wallet account).
 * Required for sending transactions.
 */
export async function getSigner() {
  const provider = getWalletProvider()
  await assertExpectedNetwork(provider)
  return await provider.getSigner()
}

/**
 * Returns the contract instance (read-only).
 */
export function getContract(providerOrSigner) {
  assertContractAddress()
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, providerOrSigner)
}

function assertContractAddress() {
  if (!CONTRACT_ADDRESS || !ethers.isAddress(CONTRACT_ADDRESS)) {
    throw new Error('Contract address is missing or invalid. Set VITE_CONTRACT_ADDRESS in client/.env.')
  }
}

async function assertExpectedNetwork(provider) {
  let network
  try {
    network = await provider.getNetwork()
  } catch (error) {
    throw new Error(
      `Hardhat Local is unavailable at ${RPC_URL}. Start it with "cd contracts" and "npx hardhat node".`,
      { cause: error }
    )
  }
  if (Number(network.chainId) !== EXPECTED_CHAIN_ID) {
    throw new Error(`Wrong network. Switch MetaMask to ${NETWORK_NAME} (chain ID ${EXPECTED_CHAIN_ID}).`)
  }
}

async function assertContractDeployed(provider) {
  assertContractAddress()
  const code = await provider.getCode(CONTRACT_ADDRESS)
  if (code === '0x' || code === '0x0') {
    throw new Error(
      `The CharityDonation contract is not deployed at ${CONTRACT_ADDRESS}. Run "npm run deploy" from the contracts folder.`
    )
  }
}

export async function getWalletInfo(address, provider = getWalletProvider()) {
  const network = await provider.getNetwork()
  const chainId = Number(network.chainId)
  let balanceEth = null
  if (chainId === EXPECTED_CHAIN_ID) {
    const localProvider = getProvider()
    await assertExpectedNetwork(localProvider)
    balanceEth = ethers.formatEther(await localProvider.getBalance(address))
  }

  return {
    address,
    balanceEth,
    chainId,
    networkName: chainId === EXPECTED_CHAIN_ID ? NETWORK_NAME : `Chain ${chainId}`,
  }
}

function donationMatchesEvent(donation, event) {
  return (
    donation.campaignId === Number(event.args.campaignId) &&
    donation.donor.toLowerCase() === event.args.donor.toLowerCase() &&
    donation.amount === event.args.amount.toString() &&
    donation.timestamp === Number(event.args.timestamp)
  )
}

function addTransactionHashes(donations, logs) {
  const remainingLogs = [...logs]
  return donations.map((donation) => {
    const logIndex = remainingLogs.findIndex(
      (log) => log.args && donationMatchesEvent(donation, log)
    )
    const [log] = logIndex >= 0 ? remainingLogs.splice(logIndex, 1) : []
    return { ...donation, transactionHash: log?.transactionHash ?? null }
  })
}

// ─────────────────────────────────────────────────────────────
//  Wallet helpers
// ─────────────────────────────────────────────────────────────

/**
 * Requests MetaMask to expose the user's accounts.
 * Returns the connected address string.
 */
export async function connectWallet(chooseAccount = false) {
  if (!window.ethereum) throw new Error('MetaMask is not installed. Please install it from metamask.io')

  const provider = getWalletProvider()
  let accounts
  if (chooseAccount) {
    try {
      await provider.send('wallet_requestPermissions', [{ eth_accounts: {} }])
      accounts = await provider.send('eth_accounts', [])
    } catch (error) {
      if (error.code !== 4200 && error.code !== -32601) throw error
      accounts = await provider.send('eth_requestAccounts', [])
    }
  } else {
    accounts = await provider.send('eth_requestAccounts', [])
  }
  if (!accounts.length) throw new Error('No MetaMask account is available. Unlock MetaMask and try again.')
  return getWalletInfo(accounts[0], provider)
}

/**
 * Reads the current accounts without prompting MetaMask.
 * Returns the first account or null.
 */
export async function getConnectedAccount() {
  if (!window.ethereum) return null
  const accounts = await window.ethereum.request({ method: 'eth_accounts' })
  if (!accounts || accounts.length === 0) return null

  return getWalletInfo(accounts[0], getWalletProvider())
}

export async function getWalletBalance(address) {
  const provider = getWalletProvider()
  await assertExpectedNetwork(provider)
  const balance = await provider.getBalance(address)
  return {
    balanceEth: ethers.formatEther(balance),
    chainId: EXPECTED_CHAIN_ID,
    networkName: NETWORK_NAME,
  }
}

export async function switchToHardhatLocal() {
  if (!window.ethereum) throw new Error('MetaMask is not installed. Install it to connect a wallet.')

  const chainId = ethers.toQuantity(EXPECTED_CHAIN_ID)
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    })
  } catch (error) {
    if (error.code !== 4902) throw error

    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId,
        chainName: NETWORK_NAME,
        rpcUrls: [RPC_URL],
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      }],
    })
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    })
  }
}

// ─────────────────────────────────────────────────────────────
//  Campaign read functions
// ─────────────────────────────────────────────────────────────

/**
 * Serializes a raw Campaign struct from the contract into a plain JS object.
 * Converts BigInt values to strings to make them Redux-safe and JSON-safe.
 */
function serializeCampaign(raw) {
  return {
    id: Number(raw.id),
    title: raw.title,
    description: raw.description,
    creator: raw.creator,
    recipient: raw.recipient,
    goal: raw.goal.toString(),           // wei as string
    amountRaised: raw.amountRaised.toString(),
    deadline: Number(raw.deadline),       // Unix seconds
    active: raw.active,
    // Computed helpers
    goalEth: ethers.formatEther(raw.goal),
    amountRaisedEth: ethers.formatEther(raw.amountRaised),
    progressPercent: raw.goal > 0n
      ? Math.min(100, Math.round(Number((raw.amountRaised * 10000n) / raw.goal) / 100))
      : 0,
    isExpired: Number(raw.deadline) < Math.floor(Date.now() / 1000),
  }
}

/**
 * Serializes a raw Donation struct.
 */
function serializeDonation(raw) {
  return {
    donor: raw.donor,
    amount: raw.amount.toString(),
    amountEth: ethers.formatEther(raw.amount),
    timestamp: Number(raw.timestamp),
    campaignId: Number(raw.campaignId),
  }
}

/**
 * Fetches all campaigns from the contract.
 * Returns an array of serialized campaign objects.
 */
export async function fetchAllCampaigns() {
  const provider = getProvider()
  await assertExpectedNetwork(provider)
  await assertContractDeployed(provider)
  const contract = getContract(provider)
  const raw = await contract.getAllCampaigns()
  return raw.map(serializeCampaign)
}

/**
 * Fetches a single campaign by ID.
 */
export async function fetchCampaign(id) {
  const provider = getProvider()
  await assertExpectedNetwork(provider)
  await assertContractDeployed(provider)
  const contract = getContract(provider)
  const raw = await contract.getCampaign(id)
  return serializeCampaign(raw)
}

/**
 * Fetches all donations for a specific campaign.
 */
export async function fetchCampaignDonations(campaignId) {
  const provider = getProvider()
  await assertExpectedNetwork(provider)
  await assertContractDeployed(provider)
  const contract = getContract(provider)
  const raw = await contract.getCampaignDonations(campaignId)
  const donations = raw.map(serializeDonation)
  const logs = await contract.queryFilter(
    contract.filters.DonationReceived(campaignId),
    0,
    'latest'
  )
  return addTransactionHashes(donations, logs).map((donation) => ({
    ...donation,
    status: 'Confirmed',
  }))
}

/**
 * Fetches global stats (campaign count, total raised, total donations).
 */
export async function fetchStats() {
  const provider = getProvider()
  await assertExpectedNetwork(provider)
  await assertContractDeployed(provider)
  const contract = getContract(provider)
  const [count, raised, donations] = await Promise.all([
    contract.campaignCount(),
    contract.getTotalRaised(),
    contract.getTotalDonations(),
  ])
  return {
    totalCampaigns: Number(count),
    totalRaised: ethers.formatEther(raised),
    totalDonations: Number(donations),
  }
}

/**
 * Fetches all donations made by a specific donor address.
 */
export async function fetchDonorHistory(donorAddress) {
  const provider = getProvider()
  await assertExpectedNetwork(provider)
  await assertContractDeployed(provider)
  const contract = getContract(provider)
  const indices = await contract.getDonorDonationIds(donorAddress)
  const donations = await Promise.all(
    indices.map((idx) => contract.getDonation(idx))
  )
  const logs = await contract.queryFilter(
    contract.filters.DonationReceived(null, donorAddress),
    0,
    'latest'
  )
  return addTransactionHashes(donations.map(serializeDonation), logs).map((donation) => ({
    ...donation,
    status: 'Confirmed',
  }))
}

// ─────────────────────────────────────────────────────────────
//  Write functions (require signer / MetaMask)
// ─────────────────────────────────────────────────────────────

/**
 * Submits a donation transaction to the contract.
 * @param {number} campaignId - The campaign to donate to.
 * @param {string} amountEth  - The donation amount in ETH (string from form).
 * @returns {object} The transaction receipt.
 */
export async function donateToCampaign(campaignId, amountEth) {
  const signer = await getSigner()
  const provider = signer.provider
  const contract = getContract(signer)
  await assertContractDeployed(provider)

  if (!/^\d+(?:\.\d{1,18})?$/.test(amountEth)) {
    throw new Error('Enter a valid ETH amount with no more than 18 decimal places.')
  }
  const valueInWei = ethers.parseEther(amountEth)
  if (valueInWei <= 0n) throw new Error('Donation amount must be greater than zero.')

  const address = await signer.getAddress()
  const [balance, gasLimit, feeData] = await Promise.all([
    provider.getBalance(address),
    contract.donate.estimateGas(campaignId, { value: valueInWei }),
    provider.getFeeData(),
  ])
  const feePerGas = feeData.maxFeePerGas ?? feeData.gasPrice
  if (feePerGas === null) {
    throw new Error('Unable to estimate transaction fees. Check that Hardhat Local is running and try again.')
  }
  if (balance < valueInWei + gasLimit * feePerGas) {
    throw new Error('Insufficient test ETH for the donation amount and transaction gas fees.')
  }

  const tx = await contract.donate(campaignId, { value: valueInWei })
  const receipt = await tx.wait()
  if (!receipt || receipt.status !== 1) {
    throw new Error('The donation transaction failed on the blockchain.')
  }
  return { receipt, donor: address, amountEth: ethers.formatEther(valueInWei), transactionHash: tx.hash }
}

// ─────────────────────────────────────────────────────────────
//  Transaction verification
// ─────────────────────────────────────────────────────────────

/**
 * Looks up a transaction by its hash and returns details.
 * Works for any transaction on the connected network.
 */
export async function verifyTransaction(txHash) {
  if (!ethers.isHexString(txHash, 32)) {
    throw new Error('Enter a valid 66-character transaction hash.')
  }

  const provider = getProvider()
  await assertExpectedNetwork(provider)
  await assertContractDeployed(provider)
  const contract = getContract(provider)

  const [tx, receipt] = await Promise.all([
    provider.getTransaction(txHash),
    provider.getTransactionReceipt(txHash),
  ])

  if (!tx) return null

  const isToOurContract =
    tx.to?.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()
  let donation = null

  if (
    isToOurContract &&
    receipt?.status === 1 &&
    receipt.hash.toLowerCase() === tx.hash.toLowerCase()
  ) {
    const donationEvent = receipt.logs
      .filter((log) => log.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase())
      .map((log) => contract.interface.parseLog(log))
      .find((event) => event?.name === 'DonationReceived')

    if (donationEvent && tx.value === donationEvent.args.amount) {
      const campaignId = Number(donationEvent.args.campaignId)
      const recordedDonations = await contract.getCampaignDonations(campaignId)
      const matchingRecord = recordedDonations.find((record) =>
        record.donor.toLowerCase() === donationEvent.args.donor.toLowerCase() &&
        record.amount === donationEvent.args.amount &&
        record.timestamp === donationEvent.args.timestamp &&
        record.campaignId === donationEvent.args.campaignId
      )

      if (matchingRecord) {
        donation = serializeDonation(matchingRecord)
      }
    }
  }

  const block = receipt ? await provider.getBlock(receipt.blockNumber) : null
  let verificationMessage = 'Transaction is not a recorded donation to this contract.'
  if (!isToOurContract) {
    verificationMessage = 'Transaction was not sent to the configured CharityChain contract.'
  } else if (!receipt) {
    verificationMessage = 'Transaction is pending and has not been confirmed.'
  } else if (receipt.status !== 1) {
    verificationMessage = 'Transaction failed on-chain.'
  } else if (!donation) {
    verificationMessage = 'No matching donation event and on-chain donation record were found.'
  } else {
    verificationMessage = 'Successful donation confirmed by the contract event and on-chain record.'
  }

  return {
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: tx.value.toString(),
    valueEth: ethers.formatEther(tx.value),
    blockNumber: receipt?.blockNumber ?? null,
    status: receipt ? (receipt.status === 1 ? 'Success' : 'Failed') : 'Pending',
    timestamp: block?.timestamp ?? null,
    gasUsed: receipt?.gasUsed?.toString() ?? null,
    contractAddress: CONTRACT_ADDRESS,
    isToOurContract,
    isVerified: Boolean(donation),
    verificationMessage,
    donation,
  }
}
