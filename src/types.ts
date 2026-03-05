/**
 * @fileoverview Type definitions for plugin-health
 *
 * Health evaluator aggregates homeostasis state into an overall
 * health/wellbeing appraisal.
 */

/**
 * Health payload published to plugin-appraisal.
 */
export interface HealthPayload {
  /**
   * Overall health status.
   * - 'critical': Multiple systems in crisis
   * - 'poor': Significant issues
   * - 'fair': Some concerns
   * - 'good': Healthy state
   * - 'excellent': Optimal state
   */
  status: 'critical' | 'poor' | 'fair' | 'good' | 'excellent';

  /**
   * Overall health score (0-1).
   */
  score: number;

  /**
   * Energy level (0-1).
   */
  energy: number;

  /**
   * Stress level (0-1, lower is better).
   */
  stress: number;

  /**
   * Balance indicator - how balanced are the systems.
   */
  balance: 'imbalanced' | 'skewed' | 'balanced' | 'optimal';

  /**
   * Trend in health.
   */
  trend: 'declining' | 'stable' | 'improving';

  /**
   * Areas of concern.
   */
  concerns?: string[];

  /**
   * Areas of strength.
   */
  strengths?: string[];
}

/**
 * Service type identifier.
 */
export const HEALTH_SERVICE_TYPE = 'health';

/**
 * Domain identifier for appraisals.
 */
export const HEALTH_DOMAIN_ID = 'health';

