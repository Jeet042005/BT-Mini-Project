import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  list: [],              // Array of campaign objects (serialized from contract)
  selected: null,        // Currently viewed campaign object
  isLoading: false,      // Loading campaigns from contract
  isLoadingSelected: false,
  error: null,
  stats: {
    totalCampaigns: 0,
    totalRaised: '0',    // String (ETH value)
    totalDonations: 0,
  },
}

const campaignSlice = createSlice({
  name: 'campaigns',
  initialState,
  reducers: {
    setCampaigns(state, action) {
      state.list = action.payload
      state.isLoading = false
      state.error = null
    },
    setSelectedCampaign(state, action) {
      state.selected = action.payload
      state.isLoadingSelected = false
    },
    setStats(state, action) {
      state.stats = action.payload
    },
    setCampaignsLoading(state, action) {
      state.isLoading = action.payload
    },
    setSelectedLoading(state, action) {
      state.isLoadingSelected = action.payload
    },
    setCampaignsError(state, action) {
      state.error = action.payload
      state.isLoading = false
      state.isLoadingSelected = false
    },
    clearCampaignsError(state) {
      state.error = null
    },
  },
})

export const {
  setCampaigns,
  setSelectedCampaign,
  setStats,
  setCampaignsLoading,
  setSelectedLoading,
  setCampaignsError,
  clearCampaignsError,
} = campaignSlice.actions

export default campaignSlice.reducer
