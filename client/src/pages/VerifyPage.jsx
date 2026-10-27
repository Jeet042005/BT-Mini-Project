import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'
import { Search, CheckCircle, XCircle, Loader2, AlertCircle, Hash } from 'lucide-react'
import { verifyTransaction } from '../services/blockchain.js'
import { formatDateTime, parseContractError } from '../utils/helpers.js'
import { CONTRACT_ADDRESS } from '../utils/contractConfig.js'

export default function VerifyPage() {
  const [searchParams] = useSearchParams()
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [errorTitle, setErrorTitle] = useState('Unable to Verify')

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: { txHash: searchParams.get('txHash') || '' },
  })

  useEffect(() => {
    setValue('txHash', searchParams.get('txHash') || '')
  }, [searchParams, setValue])

  async function onSubmit({ txHash }) {
    setIsLoading(true)
    setResult(null)
    setError(null)
    try {
      const data = await verifyTransaction(txHash.trim())
      if (!data) {
        setErrorTitle('Transaction Not Found')
        setError('Transaction was not found on the selected network.')
      } else {
        setResult(data)
      }
    } catch (e) {
      setErrorTitle('Verification Error')
      setError(parseContractError(e))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <Search className="w-5 h-5 text-primary-600" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">Verify Transaction</h1>
          </div>
          <p className="text-gray-500 text-sm">
            Enter a transaction hash to check it against the configured contract and blockchain records.
            You can find transaction hashes in campaign donation history.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search form */}
        <div className="card p-6 mb-6">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                id="txHashInput"
                type="text"
                placeholder="Enter transaction hash (0x...)"
                className="form-input font-mono text-sm"
                {...register('txHash', {
                  required: 'Transaction hash is required.',
                  pattern: {
                    value: /^0x[a-fA-F0-9]{64}$/,
                    message: 'Enter a valid 66-character hex transaction hash.',
                  },
                })}
              />
              {errors.txHash && (
                <p className="form-error mt-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.txHash.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              id="verifyBtn"
              disabled={isLoading}
              className="btn-primary py-2.5 whitespace-nowrap"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {isLoading ? 'Searching...' : 'Verify'}
            </button>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex gap-3 text-red-700 mb-6">
            <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{errorTitle}</p>
              <p className="text-sm mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="card overflow-hidden animate-slide-up">
            {/* Status header */}
            <div className={`px-6 py-4 flex items-center gap-3 ${
              result.isVerified ? 'bg-primary-50 border-b border-primary-100' : 'bg-red-50 border-b border-red-100'
            }`}>
              {result.isVerified
                ? <CheckCircle className="w-6 h-6 text-primary-500" />
                : <XCircle className="w-6 h-6 text-red-500" />}
              <div>
                <p className="font-bold text-gray-900">
                  {result.isVerified ? 'Donation Verified' : 'Donation Not Verified'}
                </p>
                <p className="text-sm text-gray-600">{result.verificationMessage}</p>
              </div>
            </div>

            {/* Details */}
            <div className="p-6">
              <div className="space-y-3 text-sm">
                {[
                  { label: 'Transaction Hash', value: result.hash, mono: true },
                  { label: 'From (Sender)', value: result.from, mono: true },
                  { label: 'To (Contract)', value: result.to, mono: true },
                  { label: 'Value', value: `${result.valueEth} ETH` },
                  ...(result.donation
                    ? [
                        { label: 'Campaign', value: `#${result.donation.campaignId}` },
                        { label: 'Recorded Donor', value: result.donation.donor, mono: true },
                        { label: 'Recorded Donation', value: `${result.donation.amountEth} ETH` },
                      ]
                    : []),
                  { label: 'Block Number', value: result.blockNumber ?? 'Pending' },
                  { label: 'Blockchain Status', value: result.status },
                  { label: 'Donation Verification', value: result.isVerified ? 'Verified' : 'Not verified' },
                  {
                    label: 'Timestamp',
                    value: result.timestamp ? formatDateTime(result.timestamp) : 'N/A',
                  },
                  { label: 'Gas Used', value: result.gasUsed ?? 'N/A' },
                  { label: 'Contract Address', value: CONTRACT_ADDRESS, mono: true },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 py-2 border-b border-gray-50 last:border-0">
                    <span className="text-gray-400 text-xs uppercase tracking-wide w-40 flex-shrink-0">{label}</span>
                    <span className={`text-gray-800 break-all ${mono ? 'font-mono text-xs' : 'font-medium'}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Disclaimer */}
              {result.isVerified && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Blockchain verifies the recorded donation transaction. It does <strong>not</strong>
                    {' '}verify whether the receiving charity is genuine or how funds are used.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Help */}
        <div className="mt-8 bg-gray-100 rounded-xl p-5 text-sm text-gray-500">
          <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Hash className="w-4 h-4" /> How to find a transaction hash
          </h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Open a campaign on the Campaigns page.</li>
            <li>Scroll to the Donations section.</li>
            <li>Copy a transaction hash from the campaign donation history.</li>
            <li>Or check your MetaMask activity for recent transactions.</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
