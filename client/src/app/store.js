import { configureStore } from '@reduxjs/toolkit'
import walletReducer from '../features/wallet/walletSlice.js'
import campaignReducer from '../features/campaigns/campaignSlice.js'

export const store = configureStore({
  reducer: {
    wallet: walletReducer,
    campaigns: campaignReducer,
  },
  // Serialize check: BigInt values from ethers need special handling
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable values that come from ethers.js (BigInt)
        ignoredActions: [
          'campaigns/setCampaigns',
          'campaigns/setSelectedCampaign',
          'campaigns/setStats',
        ],
        ignoredPaths: [
          'campaigns.list',
          'campaigns.selected',
          'campaigns.stats',
        ],
      },
    }),
})
