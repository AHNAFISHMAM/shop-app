import { useStoreSettings } from '../contexts/StoreSettingsContext'

/**
 * Hook to check if a feature is enabled
 * @param {string} featureName - Name of the feature flag (without 'enable_' prefix)
 * @returns {boolean} - Whether the feature is enabled
 *
 * @example
 * const enableLoyalty = useFeatureFlag('loyalty_program')
 */
export const useFeatureFlag = featureName => {
  const { settings } = useStoreSettings()

  if (!settings) return false

  const flagName = `enable_${featureName}`
  return settings[flagName] ?? false
}

/**
 * Get feature flag value directly from settings object
 * @param {object} settings - Store settings object
 * @param {string} featureName - Name of the feature flag (without 'enable_' prefix)
 * @returns {boolean} - Whether the feature is enabled
 *
 * @example
 * const enableLoyalty = getFeatureFlag(settings, 'loyalty_program')
 */
export const getFeatureFlag = (settings, featureName) => {
  if (!settings) return false

  const flagName = `enable_${featureName}`
  return settings[flagName] ?? false
}
