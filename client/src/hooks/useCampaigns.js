/**
 * useCampaigns.js
 *
 * Custom hook for fetching and managing campaign data from the blockchain.
 */
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  setCampaigns,
  setSelectedCampaign,
  setStats,
  setCampaignsLoading,
  setSelectedLoading,
  setCampaignsError,
} from '../features/campaigns/campaignSlice.js'
import {
  fetchAllCampaigns,
  fetchCampaign,
  fetchStats,
} from '../services/blockchain.js'

export function useCampaigns() {
  const dispatch = useDispatch()
  const { list, selected, isLoading, isLoadingSelected, error, stats } =
    useSelector((state) => state.campaigns)

  /**
   * Loads all campaigns and global stats from the contract.
   */
  const loadCampaigns = useCallback(async () => {
    dispatch(setCampaignsLoading(true))
    try {
      const [campaigns, statsData] = await Promise.all([
        fetchAllCampaigns(),
        fetchStats(),
      ])
      dispatch(setCampaigns(campaigns))
      dispatch(setStats(statsData))
    } catch (err) {
      const msg = err.message || 'Failed to load campaigns'
      dispatch(setCampaignsError(msg))
    }
  }, [dispatch])

  /**
   * Loads a single campaign by ID.
   */
  const loadCampaign = useCallback(
    async (id) => {
      dispatch(setSelectedLoading(true))
      try {
        const campaign = await fetchCampaign(id)
        dispatch(setSelectedCampaign(campaign))
      } catch (err) {
        const msg = err.message || 'Failed to load campaign'
        dispatch(setCampaignsError(msg))
      }
    },
    [dispatch]
  )

  /**
   * Refreshes the selected campaign after a donation or admin action.
   */
  const refreshCampaign = useCallback(
    async (id) => {
      try {
        const campaign = await fetchCampaign(id)
        dispatch(setSelectedCampaign(campaign))
        // Also refresh stats
        const statsData = await fetchStats()
        dispatch(setStats(statsData))
      } catch (err) {
        dispatch(
          setCampaignsError(err.message || 'Unable to refresh campaign data from the blockchain.')
        )
      }
    },
    [dispatch]
  )

  return {
    campaigns: list,
    selected,
    isLoading,
    isLoadingSelected,
    error,
    stats,
    loadCampaigns,
    loadCampaign,
    refreshCampaign,
  }
}
