/**
 * @fileoverview Constants for plugin-health
 */

export const HealthEvents = {
  /** Emitted when health appraisal is published */
  APPRAISAL_PUBLISHED: 'HEALTH_APPRAISAL_PUBLISHED',
} as const;

/**
 * Homeostasis event names (from plugin-homeostasis).
 */
export const HomeostasisEvents = {
  PHYSIOLOGICAL_UPDATED: 'HOMEOSTASIS_PHYSIOLOGICAL_UPDATED',
  DRIVES_UPDATED: 'HOMEOSTASIS_DRIVES_UPDATED',
  RESOURCES_UPDATED: 'HOMEOSTASIS_RESOURCES_UPDATED',
} as const;

/**
 * Evaluation thresholds.
 */
export const Thresholds = {
  /** Score for critical status */
  CRITICAL_SCORE: 0.2,

  /** Score for poor status */
  POOR_SCORE: 0.4,

  /** Score for fair status */
  FAIR_SCORE: 0.6,

  /** Score for good status */
  GOOD_SCORE: 0.8,

  /** Stress level considered high */
  HIGH_STRESS: 0.7,

  /** Energy level considered low */
  LOW_ENERGY: 0.3,

  /** Balance variance threshold */
  BALANCE_THRESHOLD: 0.15,
} as const;

/**
 * Default values.
 */
export const Defaults = {
  /** Minimum confidence without data */
  MIN_CONFIDENCE: 0.4,

  /** Maximum confidence with good data */
  MAX_CONFIDENCE: 0.95,
} as const;

