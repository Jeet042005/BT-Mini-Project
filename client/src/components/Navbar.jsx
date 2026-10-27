import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Heart, Menu, Wallet, X } from 'lucide-react'
import { useWallet } from '../hooks/useWallet.js'
import { shortenAddress } from '../utils/helpers.js'
import { NETWORK_NAME } from '../utils/contractConfig.js'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/campaigns', label: 'Campaigns' },
  { to: '/donations', label: 'Donation History' },
  { to: '/verify', label: 'Verify Transaction' },
]

export default function Navbar() {
  const { wallet, connect, disconnect, switchNetwork } = useWallet()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-gray-900">
            <span className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </span>
            <span>Charity<span className="text-primary-600">Chain</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
              Hardhat Local · TEST ETH
            </span>
            {wallet.error && (
              <span role="alert" className="max-w-48 text-xs text-red-600">{wallet.error}</span>
            )}
            {wallet.isConnected ? (
              <>
                <span className="text-right text-xs text-gray-600">
                  <span className={`block ${wallet.isCorrectNetwork ? '' : 'text-red-600'}`}>
                    {wallet.isCorrectNetwork ? NETWORK_NAME : `Switch to ${NETWORK_NAME}`}
                  </span>
                  <span className="block">
                    {wallet.balanceEth === null ? 'Balance unavailable' : `${wallet.balanceEth} ETH`}
                  </span>
                </span>
                <button onClick={disconnect} className="btn-secondary py-2 text-sm">
                  Disconnect
                </button>
                <button
                  onClick={() => connect(true)}
                  disabled={wallet.isLoading}
                  className="btn-primary py-2 text-sm"
                  title="Choose which MetaMask account this app can access."
                >
                  {wallet.isLoading ? 'Connecting...' : 'Change account'}
                </button>
                {!wallet.isCorrectNetwork && (
                  <button
                    onClick={switchNetwork}
                    disabled={wallet.isSwitchingNetwork}
                    className="btn-primary py-2 text-sm"
                  >
                    {wallet.isSwitchingNetwork ? 'Switching...' : 'Switch network'}
                  </button>
                )}
              </>
            ) : (
              <button onClick={connect} disabled={wallet.isLoading} className="btn-primary py-2">
                <Wallet className="w-4 h-4" />
                {wallet.isLoading ? 'Connecting...' : 'Connect MetaMask'}
              </button>
            )}
          </div>

          <button
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          {wallet.isConnected ? (
            <div className="space-y-1">
              <p className="px-3 py-2 text-xs text-gray-600">
                {shortenAddress(wallet.address)} ·{' '}
                {wallet.balanceEth === null ? 'Balance unavailable' : `${wallet.balanceEth} ETH`}
              </p>
              <button
                onClick={() => connect(true)}
                disabled={wallet.isLoading}
                className="btn-primary w-full justify-center"
              >
                {wallet.isLoading ? 'Connecting...' : 'Change MetaMask account'}
              </button>
              {!wallet.isCorrectNetwork && (
                <button
                  onClick={switchNetwork}
                  disabled={wallet.isSwitchingNetwork}
                  className="btn-primary w-full justify-center"
                >
                  {wallet.isSwitchingNetwork ? 'Switching...' : `Switch to ${NETWORK_NAME}`}
                </button>
              )}
              <button
                onClick={disconnect}
                className="w-full text-left px-3 py-2 text-sm text-gray-600"
              >
                Disconnect {shortenAddress(wallet.address)}
              </button>
            </div>
          ) : (
            <button onClick={connect} disabled={wallet.isLoading} className="btn-primary w-full justify-center">
              <Wallet className="w-4 h-4" />
              {wallet.isLoading ? 'Connecting...' : 'Connect MetaMask'}
            </button>
          )}
          {wallet.error && (
            <p role="alert" className="px-3 py-2 text-xs text-red-600">{wallet.error}</p>
          )}
          {wallet.isConnected && !wallet.isCorrectNetwork && (
            <p className="px-3 py-2 text-xs text-red-600">Switch MetaMask to {NETWORK_NAME} to donate.</p>
          )}
        </div>
      )}
    </nav>
  )
}
