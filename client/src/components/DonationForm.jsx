import { useForm } from 'react-hook-form'
import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Heart, Loader2, AlertCircle, Wallet } from 'lucide-react'
import { donateToCampaign } from '../services/blockchain.js'
import { parseContractError } from '../utils/helpers.js'
import { useWallet } from '../hooks/useWallet.js'
import { NETWORK_NAME } from '../utils/contractConfig.js'

/**
 * DonationForm — form for submitting a donation to a campaign.
 * Uses React Hook Form for validation.
 * Calls the smart contract via Ethers.js.
 *
 * @param {object}   campaign     - The campaign to donate to.
 * @param {function} onSuccess    - Called after a successful donation to refresh data.
 */
export default function DonationForm({ campaign, onSuccess }) {
  const { wallet, connect, refreshWallet, switchNetwork } = useWallet()
  const [isPending, setIsPending] = useState(false)
  const [lastTxHash, setLastTxHash] = useState(null)
  const pendingLock = useRef(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { amount: '' } })

  const canDonate = campaign.active && !campaign.isExpired

  async function onSubmit({ amount }) {
    if (!wallet.isConnected) {
      toast.error('Please connect your wallet first.')
      return
    }
    if (!wallet.isCorrectNetwork) {
      toast.error(`Please switch to ${NETWORK_NAME}.`)
      return
    }
    if (pendingLock.current) return

    pendingLock.current = true
    setIsPending(true)
    const toastId = toast.loading('Waiting for MetaMask confirmation...')

    try {
      const donation = await donateToCampaign(campaign.id, amount.trim())
      setLastTxHash(donation.transactionHash)
      toast.success('Donation confirmed on-chain! 🎉', { id: toastId })
      reset()
      await refreshWallet()
      if (onSuccess) await onSuccess()
    } catch (err) {
      const msg = parseContractError(err)
      toast.error(msg, { id: toastId })
    } finally {
      pendingLock.current = false
      setIsPending(false)
    }
  }

  if (!canDonate) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 text-center text-gray-500 text-sm">
        <AlertCircle className="w-5 h-5 mx-auto mb-2 text-gray-400" />
        {!campaign.active ? 'This campaign is closed.' : 'This campaign has expired.'}
        <p className="text-xs mt-1">Donations are no longer accepted.</p>
      </div>
    )
  }

  return (
    <div>
      {wallet.isConnected && (
        <div className="mb-4 rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm">
          <p className="text-gray-500">
            Connected wallet: <span className="font-mono">{wallet.address}</span>
          </p>
          <p className="font-semibold text-gray-900">
            Balance{wallet.isCorrectNetwork ? ` on ${NETWORK_NAME}` : ''}:{' '}
            {wallet.balanceEth === null ? 'Unavailable on this network' : `${wallet.balanceEth} ETH`}
          </p>
          {wallet.balanceEth === '0.0' && (
            <p className="mt-1 text-xs text-amber-800">
              This connected account has no local test ETH. If MetaMask currently
              shows another account, use “Change account” above and select it.
            </p>
          )}
        </div>
      )}

      {wallet.error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {wallet.error}
        </p>
      )}

      {!wallet.isConnected ? (
        <div className="mb-4 rounded-lg bg-primary-50 border border-primary-100 p-3 text-sm text-gray-700">
          Connect MetaMask to see your balance and submit a donation.
        </div>
      ) : !wallet.isCorrectNetwork ? (
        <div role="alert" className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          Switch MetaMask to {NETWORK_NAME} to donate. Your amount will stay in the form.
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="donationAmount" className="form-label">
            Donation Amount (ETH)
          </label>
          <div className="relative">
            <input
              id="donationAmount"
              type="number"
              step="any"
              placeholder="e.g. 0.1"
              className="form-input pr-16"
              disabled={isPending}
              {...register('amount', {
                required: 'Donation amount is required.',
                validate: (value) => {
                  const trimmed = value.trim()
                  if (!/^\d+(?:\.\d{1,18})?$/.test(trimmed)) {
                    return 'Enter a valid ETH amount with up to 18 decimal places.'
                  }
                  if (!/[1-9]/.test(trimmed)) {
                    return 'Donation amount must be greater than zero.'
                  }
                  return true
                },
              })}
              inputMode="decimal"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
              ETH
            </span>
          </div>
          {errors.amount && (
            <p className="form-error">
              <AlertCircle className="w-3.5 h-3.5" /> {errors.amount.message}
            </p>
          )}
        </div>

        {!wallet.isConnected ? (
          <button
            type="button"
            id="donateBtn"
            disabled={wallet.isLoading}
            onClick={connect}
            className="btn-primary w-full justify-center text-base py-3.5"
          >
            <Wallet className="w-4 h-4" />
            {wallet.isLoading ? 'Connecting...' : 'Connect MetaMask'}
          </button>
        ) : !wallet.isCorrectNetwork ? (
          <button
            type="button"
            id="donateBtn"
            disabled={wallet.isSwitchingNetwork}
            onClick={switchNetwork}
            className="btn-secondary w-full justify-center text-base py-3.5"
          >
            {wallet.isSwitchingNetwork ? 'Switching network...' : `Switch to ${NETWORK_NAME}`}
          </button>
        ) : (
          <button
            type="submit"
            id="donateBtn"
            disabled={isPending}
            className="btn-primary w-full justify-center text-base py-3.5"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing Transaction...
              </>
            ) : (
              <>
                <Heart className="w-4 h-4" />
                Donate via MetaMask
              </>
            )}
          </button>
        )}
      </form>

      {/* Last transaction hash */}
      {lastTxHash && (
        <div className="mt-4 bg-primary-50 rounded-lg p-3 border border-primary-100">
          <p className="text-xs text-gray-600 mb-1 font-semibold">✅ Last transaction hash:</p>
          <p className="font-mono text-xs text-gray-700 break-all">{lastTxHash}</p>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3 text-center">
        Local Hardhat demo only. Test ETH has no real-world value. MetaMask will
        ask you to confirm each donation.
      </p>
    </div>
  )
}
