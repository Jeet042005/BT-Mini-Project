import { clampProgress } from '../utils/helpers.js'

/**
 * CampaignProgress — animated progress bar + stats for a campaign.
 */
export default function CampaignProgress({ campaign }) {
  const progress = clampProgress(campaign.progressPercent)

  return (
    <div className="bg-gradient-to-br from-primary-50 to-teal-50 rounded-2xl p-6 border border-primary-100">
      <div className="flex justify-between items-end mb-3">
        <div>
          <p className="text-sm text-gray-500 mb-0.5">Amount Raised</p>
          <p className="text-3xl font-extrabold text-gray-900">
            {campaign.amountRaisedEth}{' '}
            <span className="text-lg font-semibold text-gray-500">ETH</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 mb-0.5">Goal</p>
          <p className="text-xl font-bold text-gray-700">
            {campaign.goalEth} ETH
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-track h-4 mb-3">
        <div
          className="progress-fill h-full flex items-center justify-end pr-2 text-white text-xs font-semibold transition-all duration-700"
          style={{ width: `${Math.max(progress, progress > 0 ? 8 : 0)}%` }}
        >
          {progress > 10 && `${progress}%`}
        </div>
      </div>

      <div className="flex justify-between text-sm">
        <span className="font-semibold text-primary-700">{progress}% funded</span>
        {progress < 100 ? (
          <span className="text-gray-500">
            {(parseFloat(campaign.goalEth) - parseFloat(campaign.amountRaisedEth)).toFixed(4)} ETH to go
          </span>
        ) : (
          <span className="text-primary-700 font-semibold">🎉 Goal Reached!</span>
        )}
      </div>

    </div>
  )
}
