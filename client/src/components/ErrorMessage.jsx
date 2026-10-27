import { AlertTriangle } from 'lucide-react'

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 max-w-md mx-auto text-center">
      <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
        <AlertTriangle className="w-7 h-7 text-red-500" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-800 mb-1">Something went wrong</h3>
        <p className="text-sm text-gray-500">{message || 'Failed to load data from the blockchain.'}</p>
        {!message?.includes('MetaMask') && (
          <p className="text-xs text-gray-400 mt-2">
            Make sure the Hardhat node is running and the contract is deployed.
          </p>
        )}
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary">
          Try Again
        </button>
      )}
    </div>
  )
}
