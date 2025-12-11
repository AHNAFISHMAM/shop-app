/**
 * useProductVariants Hook
 * 
 * Custom hook for fetching and managing product variants.
 * 
 * @returns {Object} Variants, combinations, loading state, and error
 * 
 * @example
 * const { variants, combinations, loading, error } = useProductVariants(productId, isMenuItem);
 */

import { useState, useEffect, useCallback } from 'react';
import { getGroupedVariants } from '../../../lib/variantUtils';
import { getProductCombinations, findCombinationByValues } from '../../../lib/variantCombinationsUtils';
import { logger } from '../../../utils/logger';

/**
 * useProductVariants Hook
 * 
 * Fetches and manages product variants with automatic combination selection.
 * 
 * @param {string} productId - Product ID
 * @param {boolean} isMenuItem - Whether the product is a menu item
 * @param {Object} options - Hook options
 * @param {boolean} options.enabled - Whether to enable the hook
 * @returns {Object} Variants, combinations, loading state, and handlers
 */
export function useProductVariants(productId, isMenuItem = false, options = {}) {
  const { enabled = true } = options;

  const [variants, setVariants] = useState({});
  const [combinations, setCombinations] = useState([]);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [selectedCombination, setSelectedCombination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch variants and combinations
  useEffect(() => {
    if (!enabled || !productId || isMenuItem) {
      setVariants({});
      setCombinations([]);
      setSelectedVariants({});
      setSelectedCombination(null);
      setLoading(false);
      return;
    }

    const fetchVariants = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await getGroupedVariants(productId);

        if (!result.success || !result.data) {
          setVariants({});
          setLoading(false);
          return;
        }

        setVariants(result.data);

        const variantTypes = Object.keys(result.data);

        // For multi-variant products: fetch combinations
        if (variantTypes.length > 1) {
          const combosResult = await getProductCombinations(productId);
          if (combosResult.success) {
            const allCombinations = combosResult.data || [];
            setCombinations(allCombinations);

            // Find FIRST IN-STOCK combination
            const inStockCombo = allCombinations.find(combo => combo.stock_quantity > 0);

            if (inStockCombo) {
              // Auto-select variants from the in-stock combination
              const initialSelection = {};
              const variantValues = inStockCombo.variant_values || {};

              Object.keys(result.data).forEach(type => {
                const valueForType = variantValues[type];
                if (valueForType) {
                  const variant = result.data[type].find(v => v.variant_value === valueForType);
                  if (variant) {
                    initialSelection[type] = variant;
                  }
                }
              });

              setSelectedVariants(initialSelection);
              setSelectedCombination(inStockCombo);
            } else {
              setSelectedVariants({});
              setSelectedCombination(null);
            }
          }
        } else if (variantTypes.length === 1) {
          // Single variant type - auto-select first variant
          const variantType = variantTypes[0];
          const variantsOfType = result.data[variantType];
          if (variantsOfType && variantsOfType.length > 0) {
            setSelectedVariants({ [variantType]: variantsOfType[0] });
          }
        }
      } catch (err) {
        logger.error('Error fetching variants:', err);
        setError(err.message || 'Failed to load variants');
      } finally {
        setLoading(false);
      }
    };

    fetchVariants();
  }, [productId, isMenuItem, enabled]);

  // Handle variant selection
  const handleVariantSelect = useCallback((variantType, variant) => {
    setSelectedVariants(prev => {
      const newSelection = { ...prev, [variantType]: variant };

      // If multiple variant types, find matching combination
      if (combinations.length > 0) {
        const variantValues = {};
        Object.keys(newSelection).forEach(type => {
          variantValues[type] = newSelection[type].variant_value;
        });

        const matchingCombo = findCombinationByValues(combinations, variantValues);
        setSelectedCombination(matchingCombo || null);
      }

      return newSelection;
    });
  }, [combinations]);

  return {
    variants,
    combinations,
    selectedVariants,
    selectedCombination,
    loading,
    error,
    handleVariantSelect,
    setSelectedVariants,
    setSelectedCombination
  };
}

