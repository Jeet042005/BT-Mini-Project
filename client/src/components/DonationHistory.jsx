import { Clock, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { shortenAddress, formatDateTime } from '../utils/helpers.js'

/**
 * DonationHistory — table of donations for a campaign or donor.
 * @param {Array}  donations  - Array of donation objects from blockchain.js
 * @param {string} emptyText  - Text to display when no donations.
 * @param {boolean} showCampaignId - Whether to show campaign ID column.
 */
export default function DonationHistory({ donations, emptyText, showCampaignId = false }) {
  if (!donations || donations.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">{emptyText || 'No donations yet.'}</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">#</th>
            {showCampaignId && (
              <th className="pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Campaign</th>
            )}
            <th className="pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Donor</th>
            <th className="pb-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Amount</th>
            <th className="pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Transaction</th>
            <th className="pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
            <th className="pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Date</th>
          </tr>
        </thead>
        <tbody>
          {[...donations].reverse().map((d, i) => (
            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="py-3 text-gray-400 text-xs">{donations.length - i}</td>
              {showCampaignId && (
                <td className="py-3">
                  <Link
                    to={`/campaigns/${d.campaignId}`}
                    className="text-primary-600 hover:underline text-xs font-medium"
                  >
                    Campaign #{d.campaignId}
                  </Link>
                </td>
              )}
              <td className="py-3">
                <span className="hash-text">{shortenAddress(d.donor)}</span>
              </td>
              <td className="py-3 text-right font-bold text-gray-900">
                {d.amountEth} ETH
              </td>
              <td className="py-3">
                {d.transactionHash ? (
                  <Link
                    to={`/verify?txHash=${encodeURIComponent(d.transactionHash)}`}
                    title={d.transactionHash}
                    className="inline-flex items-center gap-1 text-primary-700 hover:underline font-mono text-xs"
                  >
                    {shortenAddress(d.transactionHash, 5)}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                ) : (
                  <span className="text-gray-400 text-xs">Unavailable</span>
                )}
              </td>
              <td className="py-3 text-xs text-green-700">{d.status || 'Confirmed'}</td>
              <td className="py-3 text-gray-400 text-xs whitespace-nowrap">
                {formatDateTime(d.timestamp)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
