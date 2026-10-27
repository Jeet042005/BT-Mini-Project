import { Link } from 'react-router-dom'
import {
  Clock,
  Target,
  Users,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react'
import {
  shortenAddress,
  formatDate,
  timeRemaining,
  clampProgress,
  getCampaignStatus,
} from '../utils/helpers.js'

/**
 * CampaignCard — displays a summary of a campaign in a card format.
 * @param {object} campaign - Serialized campaign object from blockchain.js
 */
export default function CampaignCard({ campaign }) {
  const status = getCampaignStatus(campaign)
  const progress = clampProgress(campaign.progressPercent)

  const canDonate = campaign.active && !campaign.isExpired

  return (
    <div className="card flex flex-col h-full animate-fade-in overflow-hidden group">
      {/* Status bar at the top */}
      <div
        className={`h-1.5 ${
          !campaign.active
            ? 'bg-gray-300'
            : campaign.isExpired
            ? 'bg-amber-300'
            : progress >= 100
            ? 'bg-gradient-to-r from-primary-400 to-teal-400'
            : 'bg-gradient-to-r from-primary-500 to-teal-500'
        }`}
        style={{
          width: campaign.active && !campaign.isExpired ? `${progress}%` : '100%',
        }}
      />

      <div className="p-6 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-bold text-gray-900 text-base leading-tight group-hover:text-primary-700 transition-colors line-clamp-2">
            {campaign.title}
          </h3>
          <span className={`${status.color} whitespace-nowrap flex-shrink-0`}>
            {status.label === 'Active' && <CheckCircle2 className="w-3 h-3" />}
            {status.label === 'Expired' && <AlertCircle className="w-3 h-3" />}
            {status.label === 'Closed' && <XCircle className="w-3 h-3" />}
            {status.label}
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-4 flex-1">
          {campaign.description}
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div className="bg-gray-50 rounded-lg p-2.5">
            <p className="text-gray-400 text-xs mb-0.5">Raised</p>
            <p className="font-bold text-gray-900">{campaign.amountRaisedEth} ETH</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2.5">
            <p className="text-gray-400 text-xs mb-0.5">Goal</p>
            <p className="font-bold text-gray-900">{campaign.goalEth} ETH</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>{progress}% funded</span>
            <span>{timeRemaining(campaign.deadline)}</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-5">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Deadline: {formatDate(campaign.deadline)}
          </span>
        </div>

        {/* Recipient */}
        <p className="text-xs text-gray-400 mb-5">
          Recipient:{' '}
          <span className="hash-text">{shortenAddress(campaign.recipient)}</span>
        </p>

        {/* Action buttons */}
        <div className="flex gap-2 mt-auto">
          <Link
            to={`/campaigns/${campaign.id}`}
            className="btn-secondary flex-1 justify-center py-2 text-xs"
          >
            View Details
          </Link>
          {canDonate && (
            <Link
              to={`/campaigns/${campaign.id}`}
              className="btn-primary flex-1 justify-center py-2 text-xs"
            >
              Donate Now <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
