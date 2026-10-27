import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Target, User } from 'lucide-react'
import { useCampaigns } from '../hooks/useCampaigns.js'
import CampaignProgress from '../components/CampaignProgress.jsx'
import DonationForm from '../components/DonationForm.jsx'
import DonationHistory from '../components/DonationHistory.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import { fetchCampaignDonations } from '../services/blockchain.js'
import { formatDate, timeRemaining, shortenAddress } from '../utils/helpers.js'

export default function CampaignDetailsPage() {
  const { id } = useParams()
  const campaignId = Number(id)
  const { selected: campaign, isLoadingSelected, error, loadCampaign, refreshCampaign } = useCampaigns()
  const [donations, setDonations] = useState([])
  const [isLoadingDonations, setIsLoadingDonations] = useState(true)
  const [donationError, setDonationError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (id) loadCampaign(campaignId)
  }, [campaignId, id, loadCampaign])

  useEffect(() => {
    if (!id) return undefined
    let isCurrent = true

    async function loadDonations() {
      setIsLoadingDonations(true)
      setDonationError(null)
      try {
        const records = await fetchCampaignDonations(campaignId)
        if (isCurrent) setDonations(records)
      } catch (err) {
        if (isCurrent) setDonationError(err.message || 'Unable to load campaign donations.')
      } finally {
        if (isCurrent) setIsLoadingDonations(false)
      }
    }

    loadDonations()
    return () => {
      isCurrent = false
    }
  }, [campaignId, id, reloadKey])

  async function handleDonationSuccess() {
    await refreshCampaign(campaignId)
    setReloadKey((current) => current + 1)
  }

  if (isLoadingSelected) return <LoadingSpinner message="Loading campaign from blockchain..." />
  if (error) return <ErrorMessage message={error} onRetry={() => loadCampaign(campaignId)} />
  if (!campaign || campaign.id !== campaignId) {
    return <ErrorMessage message="Campaign not found." onRetry={() => loadCampaign(campaignId)} />
  }

  return (
    <main className="min-h-[60vh] bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link to="/campaigns" className="btn-ghost mb-5">
          <ArrowLeft className="w-4 h-4" /> Back to Campaigns
        </Link>

        <header className="mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900">{campaign.title}</h1>
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <User className="w-4 h-4" /> Creator: {shortenAddress(campaign.creator)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Target className="w-4 h-4" /> Goal: {campaign.goalEth} ETH
            </span>
            <span>{formatDate(campaign.deadline)} · {timeRemaining(campaign.deadline)}</span>
          </div>
        </header>

        <section className="card p-5 sm:p-6 mb-6">
          <CampaignProgress campaign={campaign} />
          <p className="mt-5 text-gray-700 leading-relaxed whitespace-pre-line">{campaign.description}</p>
          <p className="mt-4 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
            This is a demonstration campaign. Blockchain records donations but does not verify the charity or use of funds.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <section className="card p-5 sm:p-6 lg:col-span-3">
            <h2 className="font-bold text-gray-900 text-lg mb-4">Recorded Donations</h2>
            {isLoadingDonations ? (
              <LoadingSpinner message="Loading on-chain donation records..." />
            ) : donationError ? (
              <div role="alert" className="text-sm text-red-700">
                <p>{donationError}</p>
                <button
                  onClick={() => setReloadKey((current) => current + 1)}
                  className="mt-2 font-semibold underline"
                >
                  Try again
                </button>
              </div>
            ) : (
              <DonationHistory donations={donations} />
            )}
          </section>

          <section className="card p-5 sm:p-6 lg:col-span-2">
            <h2 className="font-bold text-gray-900 text-lg mb-4">Donate ETH</h2>
            <DonationForm campaign={campaign} onSuccess={handleDonationSuccess} />
          </section>
        </div>
      </div>
    </main>
  )
}
