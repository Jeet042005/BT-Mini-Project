import { Link } from 'react-router-dom'
import { ArrowRight, Heart } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-[70vh] flex items-center bg-gray-50">
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-primary-100 flex items-center justify-center">
          <Heart className="w-7 h-7 text-primary-600" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-700 mb-3">
          Blockchain-Based Transparent Charity Donations
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5">
          CharityChain
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-gray-600 leading-relaxed mb-8">
          Browse campaigns, donate ETH through MetaMask, and inspect donation records
          written to a Solidity smart contract on the local Hardhat blockchain.
        </p>
        <Link to="/campaigns" className="btn-primary mx-auto py-3 px-6">
          View Campaigns <ArrowRight className="w-5 h-5" />
        </Link>
        <p className="mt-8 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-4">
          This demonstration records transactions on-chain. It does not verify charity
          organizations or prove how donated funds are used.
        </p>
      </section>
    </main>
  )
}
