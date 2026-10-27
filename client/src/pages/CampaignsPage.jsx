import { useEffect, useState } from 'react'
import { Search, Heart } from 'lucide-react'
import { useCampaigns } from '../hooks/useCampaigns.js'
import CampaignCard from '../components/CampaignCard.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'

export default function CampaignsPage() {
  const { campaigns, stats, isLoading, error, loadCampaigns } = useCampaigns()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all | active | expired | closed

  useEffect(() => {
    loadCampaigns()
  }, [loadCampaigns])

  const filtered = campaigns.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())

    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && c.active && !c.isExpired) ||
      (filter === 'expired' && c.isExpired) ||
      (filter === 'closed' && !c.active)

    return matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            Charity Campaigns
          </h1>
          <p className="text-gray-500">
            {stats.totalCampaigns} campaigns on-chain · {stats.totalDonations} donations ·{' '}
            {parseFloat(stats.totalRaised).toFixed(4)} ETH raised
          </p>

          {/* Search & filter */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="campaignSearch"
                type="text"
                placeholder="Search campaigns..."
                className="form-input pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'active', 'expired', 'closed'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                    filter === f
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage message={error} onRetry={loadCampaigns} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Heart className="w-14 h-14 mx-auto mb-4 opacity-20" />
            <p className="font-semibold text-gray-600">No campaigns found</p>
            <p className="text-sm mt-1">
              {search ? 'Try a different search term.' : 'No campaigns have been created yet.'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-6">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((c) => (
                <CampaignCard key={c.id} campaign={c} />
              ))}
            </div>
          </>
        )}

        {/* Disclaimer */}
        <div className="mt-12 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <strong>⚠ Note:</strong> These campaigns were created on a local test blockchain for demonstration purposes.
          They are <strong>not independently verified real-world charities</strong>.
          Blockchain records the transaction; it does not verify the charity organisation.
        </div>
      </div>
    </div>
  )
}
