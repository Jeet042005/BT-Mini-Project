import { Link } from 'react-router-dom'
import { Heart, Home } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-gray-200 mb-4">404</div>
        <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <Heart className="w-8 h-8 text-primary-400" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-gray-500 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn-primary mx-auto">
          <Home className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    </div>
  )
}
