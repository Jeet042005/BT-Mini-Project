import { createSlice } from '@reduxjs/toolkit'
import { EXPECTED_CHAIN_ID } from '../../utils/contractConfig.js'

const initialState = {
  address: null,          // Connected wallet address string
  balanceEth: null,       // Balance read from the Hardhat Local provider
  isConnected: false,     // Whether a wallet is connected
  chainId: null,          // Current network chain ID (number)
  networkName: null,      // Human-readable network name
  isCorrectNetwork: false,// Whether connected to the expected network
  isLoading: false,       // Loading state for connection
  isSwitchingNetwork: false,
  error: null,            // Error message string or null
}

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setWalletConnected(state, action) {
      const { address, balanceEth, chainId, networkName } = action.payload
      state.address = address
      state.balanceEth = balanceEth
      state.isConnected = true
      state.chainId = chainId
      state.networkName = networkName
      state.isCorrectNetwork =
        chainId === EXPECTED_CHAIN_ID
      state.error = null
      state.isLoading = false
    },
    setWalletDisconnected(state) {
      state.address = null
      state.balanceEth = null
      state.isConnected = false
      state.chainId = null
      state.networkName = null
      state.isCorrectNetwork = false
      state.error = null
      state.isLoading = false
    },
    setWalletLoading(state, action) {
      state.isLoading = action.payload
    },
    setWalletError(state, action) {
      state.error = action.payload
      state.isLoading = false
    },
    setNetwork(state, action) {
      const { chainId, networkName } = action.payload
      state.chainId = chainId
      state.networkName = networkName
      state.isCorrectNetwork =
        chainId === EXPECTED_CHAIN_ID
      if (!state.isCorrectNetwork) state.balanceEth = null
    },
    setNetworkSwitching(state, action) {
      state.isSwitchingNetwork = action.payload
    },
    clearWalletError(state) {
      state.error = null
    },
  },
})

export const {
  setWalletConnected,
  setWalletDisconnected,
  setWalletLoading,
  setWalletError,
  setNetwork,
  setNetworkSwitching,
  clearWalletError,
} = walletSlice.actions

export default walletSlice.reducer
