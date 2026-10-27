import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Wallet } from 'lucide-react'
import { useWallet } from '../hooks/useWallet.js'
import DonationHistory from '../components/DonationHistory.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { fetchDonorHistory } from '../services/blockchain.js'
import { shortenAddress } from '../utils/helpers.js'

export default function DonationsPage() {
  const { wallet, connect } = useWallet()
  const [donations, setDonations] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!wallet.isConnected || !wallet.address) return

    let isCurrent = true
    async function loadHistory() {
      setIsLoading(true)
      setError(null)
      try {
        const records = await fetchDonorHistory(wallet.address)
        if (isCurrent) setDonations(records)
      } catch (err) {
        if (isCurrent) setError(err.message || 'Unable to load donation history.')
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    loadHistory()
    return () => {
      isCurrent = false
    }
  }, [wallet.address, wallet.isConnected, reloadKey])

  if (!wallet.isConnected) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <Wallet className="w-12 h-12 mx-auto mb-4 text-primary-500" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Donation History</h1>
          <p className="text-gray-600 mb-5">Connect the wallet used to donate to view its on-chain records.</p>
          <button onClick={connect} disabled={wallet.isLoading} className="btn-primary mx-auto">
            <Wallet className="w-4 h-4" />
            {wallet.isLoading ? 'Connecting...' : 'Connect MetaMask'}
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[60vh] bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900">Donation History</h1>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          On-chain donations from {shortenAddress(wallet.address, 6)}
        </p>
        {!wallet.isCorrectNetwork && (
          <p className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Switch MetaMask to the configured network to load this wallet&apos;s donation records.
          </p>
        )}

        <section className="card p-5 sm:p-6">
          {isLoading ? (
            <LoadingSpinner message="Loading donation records from the blockchain..." />
          ) : error ? (
            <div role="alert" className="text-center py-6 text-red-700">
              <p>{error}</p>
              <button
                onClick={() => setReloadKey((current) => current + 1)}
                className="mt-3 text-sm font-semibold underline"
              >
                Try again
              </button>
            </div>
          ) : (
            <DonationHistory
              donations={donations}
              showCampaignId
              emptyText="This wallet has no recorded donations yet."
            />
          )}
        </section>
        <Link to="/campaigns" className="inline-block mt-5 text-sm font-semibold text-primary-700 hover:underline">
          Browse campaigns
        </Link>
      </div>
    </main>
  )
}
