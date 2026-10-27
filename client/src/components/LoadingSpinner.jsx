import { Loader2 } from 'lucide-react'

export default function LoadingSpinner({ message = 'Loading from blockchain...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="relative">
        <div className="w-14 h-14 rounded-full border-4 border-primary-100" />
        <div className="absolute inset-0 w-14 h-14 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
      </div>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  )
}
