/**
 * @fileoverview HealthEvaluator - Assesses overall health from homeostasis
 *
 * Aggregates homeostasis state (physiological, drives, resources) into
 * an overall health/wellbeing appraisal.
 */

import type { IAgentRuntime } from '@elizaos/core';
import type { AppraisalService } from '@elizaos/plugin-appraisal';
import { APPRAISAL_SERVICE_TYPE, isEvaluatorEnabled } from '@elizaos/plugin-appraisal';

import type { HealthPayload } from '../types.ts';
import { HEALTH_DOMAIN_ID } from '../types.ts';
import { HealthEvents, HomeostasisEvents, Thresholds, Defaults } from '../constants.ts';

/**
 * Homeostasis service interface (minimal).
 */
interface IHomeostasisService {
  getPhysiological(): Record<string, number> | null;
  getDrives(): Record<string, number> | null;
  getResources(): Record<string, number> | null;
}

/**
 * Evaluate health from homeostasis and publish appraisal.
 */
export async function evaluateHealth(runtime: IAgentRuntime): Promise<void> {
  // Check if this evaluator is enabled for the current character
  if (!isEvaluatorEnabled(runtime, HEALTH_DOMAIN_ID)) {
    runtime.logger.debug(
      { src: 'plugin:health' },
      'Health evaluator disabled for this character - skipping'
    );
    return;
  }

  await runtime.initPromise;
  const homeostasisService = runtime.getService('homeostasis') as IHomeostasisService | null;
  const appraisalService = runtime.getService(APPRAISAL_SERVICE_TYPE) as AppraisalService | null;

  if (!homeostasisService) {
    runtime.logger.debug(
      { src: 'plugin:health' },
      'Homeostasis service not available - skipping evaluation'
    );
    return;
  }

  // Get homeostasis data
  const physiological = homeostasisService.getPhysiological();
  const drives = homeostasisService.getDrives();
  const resources = homeostasisService.getResources();

  if (!physiological && !drives && !resources) {
    runtime.logger.debug(
      { src: 'plugin:health' },
      'No homeostasis data available - skipping evaluation'
    );
    return;
  }

  // Evaluate the data
  const payload = analyzeHealth(physiological, drives, resources);
  const confidence = calculateConfidence(physiological, drives, resources);

  // Publish to appraisal service if available
  if (appraisalService) {
    const accepted = appraisalService.publish<HealthPayload>({
      id: HEALTH_DOMAIN_ID,
      ts: Date.now(),
      confidence,
      source: 'plugin-health',
      payload,
    });

    if (accepted) {
      await runtime.emitEvent(HealthEvents.APPRAISAL_PUBLISHED, {
        runtime,
        source: 'health',
        agentId: runtime.agentId,
        payload,
        confidence,
      });
    }
  } else {
    runtime.logger.debug(
      { src: 'plugin:health' },
      'Appraisal service not available - evaluation complete but not published'
    );
  }
}

/**
 * Analyze homeostasis data and determine health status.
 */
function analyzeHealth(
  physiological: Record<string, number> | null,
  drives: Record<string, number> | null,
  resources: Record<string, number> | null
): HealthPayload {
  const scores: number[] = [];
  const concerns: string[] = [];
  const strengths: string[] = [];

  // Analyze physiological state
  // In homeostasis, physiological values are 0-100 where 0 = satisfied, 100 = deprived
  if (physiological) {
    const physValues = Object.values(physiological);
    if (physValues.length > 0) {
      // Convert to 0-1 score where 1 = healthy (low deprivation)
      const avgDeprivation = physValues.reduce((a, b) => a + b, 0) / physValues.length / 100;
      const physScore = 1 - avgDeprivation;
      scores.push(physScore);

      if (avgDeprivation > 0.6) {
        concerns.push('High physiological stress');
      } else if (avgDeprivation < 0.2) {
        strengths.push('Good physical state');
      }
    }
  }

  // Analyze drives
  // Drives are 0-100 where 50 = balanced
  if (drives) {
    const driveValues = Object.values(drives);
    if (driveValues.length > 0) {
      // Score based on how close to balanced (50)
      const avgDeviation = driveValues.reduce((sum, v) => sum + Math.abs(v - 50), 0) / driveValues.length / 50;
      const driveScore = 1 - avgDeviation;
      scores.push(driveScore);

      if (avgDeviation > 0.5) {
        concerns.push('Psychological needs not met');
      } else if (avgDeviation < 0.2) {
        strengths.push('Balanced psychological state');
      }
    }
  }

  // Analyze resources
  if (resources) {
    const resourceValues = Object.values(resources);
    if (resourceValues.length > 0) {
      const avgResource = resourceValues.reduce((a, b) => a + b, 0) / resourceValues.length / 100;
      scores.push(avgResource);

      if (avgResource < 0.3) {
        concerns.push('Low resources');
      } else if (avgResource > 0.7) {
        strengths.push('Good resource levels');
      }
    }
  }

  // Calculate overall score
  const score = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0.5;

  // Determine status
  const status = determineStatus(score);

  // Calculate specific metrics
  const energy = calculateEnergy(physiological, resources);
  const stress = calculateStress(physiological, drives);
  const balance = determineBalance(scores);

  return {
    status,
    score,
    energy,
    stress,
    balance,
    trend: 'stable', // Would need historical data
    concerns: concerns.length > 0 ? concerns : undefined,
    strengths: strengths.length > 0 ? strengths : undefined,
  };
}

/**
 * Determine health status from score.
 */
function determineStatus(score: number): HealthPayload['status'] {
  if (score < Thresholds.CRITICAL_SCORE) return 'critical';
  if (score < Thresholds.POOR_SCORE) return 'poor';
  if (score < Thresholds.FAIR_SCORE) return 'fair';
  if (score < Thresholds.GOOD_SCORE) return 'good';
  return 'excellent';
}

/**
 * Calculate energy level.
 */
function calculateEnergy(
  physiological: Record<string, number> | null,
  resources: Record<string, number> | null
): number {
  let energy = 0.5;

  if (physiological) {
    // Fatigue reduces energy
    const fatigue = physiological.fatigue ?? physiological.exhaustion ?? 0;
    energy = 1 - fatigue / 100;
  }

  if (resources) {
    // Resources can boost energy
    const resourceEnergy = resources.energy ?? 0;
    energy = (energy + resourceEnergy / 100) / 2;
  }

  return Math.max(0, Math.min(1, energy));
}

/**
 * Calculate stress level.
 */
function calculateStress(
  physiological: Record<string, number> | null,
  drives: Record<string, number> | null
): number {
  let stress = 0;
  let factors = 0;

  if (physiological) {
    // High deprivation = stress
    const values = Object.values(physiological);
    if (values.length > 0) {
      stress += values.reduce((a, b) => a + b, 0) / values.length / 100;
      factors++;
    }
  }

  if (drives) {
    // Unmet drives = stress
    const values = Object.values(drives);
    if (values.length > 0) {
      const unmet = values.filter((v) => v < 30).length;
      stress += unmet / values.length;
      factors++;
    }
  }

  return factors > 0 ? Math.min(1, stress / factors) : 0;
}

/**
 * Determine balance from scores.
 */
function determineBalance(scores: number[]): HealthPayload['balance'] {
  if (scores.length < 2) return 'balanced';

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev > 0.3) return 'imbalanced';
  if (stdDev > Thresholds.BALANCE_THRESHOLD) return 'skewed';
  if (avg > 0.7) return 'optimal';
  return 'balanced';
}

/**
 * Calculate confidence based on data availability.
 */
function calculateConfidence(
  physiological: Record<string, number> | null,
  drives: Record<string, number> | null,
  resources: Record<string, number> | null
): number {
  let confidence = Defaults.MIN_CONFIDENCE;

  // Each data source adds confidence
  if (physiological && Object.keys(physiological).length > 0) {
    confidence += 0.2;
  }
  if (drives && Object.keys(drives).length > 0) {
    confidence += 0.2;
  }
  if (resources && Object.keys(resources).length > 0) {
    confidence += 0.15;
  }

  return Math.min(confidence, Defaults.MAX_CONFIDENCE);
}

/**
 * Set up evaluation triggers.
 */
export function setupHealthEvaluation(runtime: IAgentRuntime): void {
  // Evaluate on homeostasis updates
  runtime.registerEvent(HomeostasisEvents.PHYSIOLOGICAL_UPDATED, async () => {
    await evaluateHealth(runtime);
  });

  runtime.registerEvent(HomeostasisEvents.DRIVES_UPDATED, async () => {
    await evaluateHealth(runtime);
  });

  runtime.registerEvent(HomeostasisEvents.RESOURCES_UPDATED, async () => {
    await evaluateHealth(runtime);
  });

  runtime.logger.debug(
    { src: 'plugin:health' },
    'Health evaluation triggers configured'
  );
}

