/**
 * @elizaos/plugin-health
 *
 * Health situation evaluator for ElizaOS agents.
 * Aggregates homeostasis state into an overall health/wellbeing appraisal.
 */

export * from './types.ts';
export * from './constants.ts';
export { evaluateHealth, setupHealthEvaluation } from './evaluators/health-evaluator.ts';
export { healthPlugin, default } from './plugin.ts';

