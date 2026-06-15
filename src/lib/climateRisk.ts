/**
 * @module climateRisk
 * @description Pure climate risk assessment functions for carbon sequestration reversal.
 *
 * Carbon reversal risk occurs when accumulated soil organic carbon oxidises back to CO₂
 * due to sustained heat and drought stress. This is a real agronomic phenomenon documented
 * in IPCC AR6 Chapter 5 and FAO Soil Carbon sequestration guidelines.
 *
 * Thresholds used:
 *  - T2M_MAX > 38°C: High thermal stress threshold for Indian agricultural soils
 *  - GWETTOP < 0.25: Soil moisture below 25% of saturation = severe drought
 *  - 3+ consecutive days: Sustained stress required to trigger microbial SOC loss
 */

import type { NasaDataPoint } from '@/context/FarmContext';

/** Temperature threshold above which thermal SOC oxidation risk activates (°C) */
export const HEAT_THRESHOLD_C = 38;

/** Topsoil wetness fraction below which drought SOC risk activates (0–1 scale) */
export const DROUGHT_THRESHOLD_GWET = 0.25;

/** Minimum consecutive stress days to declare reversal risk */
export const CONSECUTIVE_DAYS_THRESHOLD = 3;

/**
 * Determine whether conditions indicate a carbon sequestration reversal risk.
 *
 * A risk is declared when T2M_MAX > 38°C AND GWETTOP < 0.25 persist for
 * 3 or more consecutive days in the supplied data window.
 *
 * @param data - Array of NASA POWER daily data points (chronological order)
 * @returns true if reversal risk is detected, false otherwise
 */
export function checkReversalRisk(data: NasaDataPoint[]): boolean {
  if (data.length < CONSECUTIVE_DAYS_THRESHOLD) return false;
  let consecutive = 0;
  for (const point of data) {
    // Skip NASA sentinel values (-999 = missing data)
    if (point.t2m_max === -999 || point.gwettop === -999) {
      consecutive = 0;
      continue;
    }
    if (point.t2m_max > HEAT_THRESHOLD_C && point.gwettop < DROUGHT_THRESHOLD_GWET) {
      consecutive++;
      if (consecutive >= CONSECUTIVE_DAYS_THRESHOLD) return true;
    } else {
      consecutive = 0;
    }
  }
  return false;
}

/**
 * Calculate the maximum consecutive stress days in a data window.
 * Useful for reporting "X days of heat+drought stress" in the UI.
 *
 * @param data - Array of NASA POWER daily data points
 * @returns Maximum number of consecutive stress days observed
 */
export function maxConsecutiveStressDays(data: NasaDataPoint[]): number {
  let max = 0;
  let current = 0;
  for (const point of data) {
    if (point.t2m_max === -999 || point.gwettop === -999) {
      current = 0;
      continue;
    }
    if (point.t2m_max > HEAT_THRESHOLD_C && point.gwettop < DROUGHT_THRESHOLD_GWET) {
      current++;
      if (current > max) max = current;
    } else {
      current = 0;
    }
  }
  return max;
}
