/**
 * useWallet.js
 *
 * Custom hook that encapsulates MetaMask wallet connection logic.
 * Listens for account and network changes from MetaMask.
 * Reads / writes Redux wallet state.
 */
import { useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import {
  setWalletConnected,
  setWalletDisconnected,
  setWalletLoading,
  setWalletError,
  setNetwork,
  setNetworkSwitching,
} from '../features/wallet/walletSlice.js'
import {
  connectWallet,
  getConnectedAccount,
  getWalletInfo,
  switchToHardhatLocal,
} from '../services/blockchain.js'
import { parseContractError } from '../utils/helpers.js'
import { EXPECTED_CHAIN_ID, NETWORK_NAME } from '../utils/contractConfig.js'

const DISCONNECTED_SESSION_KEY = 'charitychain.walletDisconnected'

function isDisconnectedForSession() {
  return window.sessionStorage.getItem(DISCONNECTED_SESSION_KEY) === 'true'
}

export function useWallet() {
  const dispatch = useDispatch()
  const wallet = useSelector((state) => state.wallet)

  /**
   * Attempts to connect the wallet by calling MetaMask.
   */
  const connect = useCallback(async (chooseAccount = false) => {
    dispatch(setWalletLoading(true))
    try {
      const info = await connectWallet(chooseAccount)
      window.sessionStorage.removeItem(DISCONNECTED_SESSION_KEY)
      dispatch(setWalletConnected(info))
      if (info.chainId === EXPECTED_CHAIN_ID) {
        toast.success('Wallet connected to Hardhat Local.')
      } else {
        toast(`Switch to ${NETWORK_NAME} to use this demo.`, { icon: '⚠️' })
      }
    } catch (err) {
      const msg = parseContractError(err)
      dispatch(setWalletError(msg))
      toast.error(msg)
    }
  }, [dispatch])

  /**
   * Disconnects the wallet from the app until the user explicitly reconnects.
   */
  const disconnect = useCallback(() => {
    window.sessionStorage.setItem(DISCONNECTED_SESSION_KEY, 'true')
    dispatch(setWalletDisconnected())
    toast.success('Wallet disconnected from app.')
  }, [dispatch])

  const refreshWallet = useCallback(async (selectedAddress) => {
    if (isDisconnectedForSession()) return null

    try {
      const info = selectedAddress
        ? await getWalletInfo(selectedAddress)
        : await getConnectedAccount()
      if (isDisconnectedForSession()) return null
      if (info) dispatch(setWalletConnected(info))
      else dispatch(setWalletDisconnected())
      return info
    } catch (err) {
      const msg = parseContractError(err)
      dispatch(setWalletError(msg))
      toast.error(`Wallet balance could not be refreshed: ${msg}`)
      return null
    }
  }, [dispatch])

  const switchNetwork = useCallback(async () => {
    dispatch(setNetworkSwitching(true))
    try {
      await switchToHardhatLocal()
      await refreshWallet()
    } catch (err) {
      const msg = parseContractError(err)
      dispatch(setWalletError(msg))
      toast.error(msg)
    } finally {
      dispatch(setNetworkSwitching(false))
    }
  }, [dispatch, refreshWallet])

  /**
   * On mount, check if the wallet is already connected (no user prompt).
   */
  useEffect(() => {
    async function checkConnection() {
      if (isDisconnectedForSession()) return

      try {
        const info = await getConnectedAccount()
        if (info && !isDisconnectedForSession()) {
          dispatch(setWalletConnected(info))
        }
      } catch (err) {
        dispatch(setWalletError(parseContractError(err)))
      }
    }
    checkConnection()
  }, [dispatch])

  /**
   * Listen for MetaMask account changes.
   */
  useEffect(() => {
    if (!window.ethereum) return

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        window.sessionStorage.removeItem(DISCONNECTED_SESSION_KEY)
        dispatch(setWalletDisconnected())
        toast('Wallet disconnected', { icon: '🔌' })
      } else if (!isDisconnectedForSession()) {
        refreshWallet(accounts[0])
      }
    }

    const handleChainChanged = (chainIdHex) => {
      const chainId = parseInt(chainIdHex, 16)
      dispatch(setNetwork({
        chainId,
        networkName: chainId === EXPECTED_CHAIN_ID ? NETWORK_NAME : `Chain ${chainId}`,
      }))
      if (!isDisconnectedForSession()) refreshWallet()
    }

    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
      window.ethereum.removeListener('chainChanged', handleChainChanged)
    }
  }, [dispatch, refreshWallet])

  return { wallet, connect, disconnect, refreshWallet, switchNetwork }
}
