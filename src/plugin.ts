/**
 * @fileoverview Plugin Health - Main plugin definition
 *
 * Aggregates homeostasis state into an overall health/wellbeing appraisal.
 */

import { type IAgentRuntime, type Plugin, logger } from '@elizaos/core';
import { evaluateHealth, setupHealthEvaluation } from './evaluators/health-evaluator.ts';
import { printBanner, type PluginSetting } from './banner.ts';

export const healthPlugin: Plugin = {
  name: 'health',
  description: 'Health situation evaluator - assesses overall wellbeing from homeostasis',

  /**
   * Dependencies.
   * We depend on appraisal to publish and implicitly on homeostasis for data.
   */
  dependencies: ['appraisal'],

  init: async (_config: Record<string, string>, runtime: IAgentRuntime): Promise<void> => {
    const settings: PluginSetting[] = [
      {
        name: 'HEALTH_CRITICAL_THRESHOLD',
        value: runtime.getSetting('HEALTH_CRITICAL_THRESHOLD'),
        defaultValue: 75,
      },
      {
        name: 'HEALTH_POOR_THRESHOLD',
        value: runtime.getSetting('HEALTH_POOR_THRESHOLD'),
        defaultValue: 50,
      },
      {
        name: 'HEALTH_EVALUATION_DELAY',
        value: runtime.getSetting('HEALTH_EVALUATION_DELAY'),
        defaultValue: 2000,
      },
    ];
    printBanner({ runtime, settings });

    setupHealthEvaluation(runtime);

    // Wait for init and for required/optional services (homeostasis may not be loaded).
    runtime.initPromise.then(async () => {
      try {
        await runtime.getServiceLoadPromise('appraisal' as any);
        await Promise.race([
          runtime.getServiceLoadPromise('homeostasis' as any),
          new Promise<void>((r) => setTimeout(r, 3000)),
        ]).catch(() => {});
      } catch {
        return;
      }
      await evaluateHealth(runtime);
    }).catch(() => {});
  },

  // No services - we just evaluate from homeostasis data
  services: [],
};

export default healthPlugin;

