# @elizaos/plugin-health

Health situation evaluator for elizaOS agents - assesses overall wellbeing from homeostasis state.

## Overview

This plugin aggregates internal state from [plugin-homeostasis](../plugin-homeostasis) (physiological needs, psychological drives, resources) into a single **health/wellbeing appraisal**. It publishes that appraisal to the [plugin-appraisal](../plugin-appraisal) registry so motivation systems and other plugins can react to the agent's wellness.

### Architecture

```
homeostasis (physiological, drives, resources) → health evaluator → appraisal registry
```

- **Input**: Homeostasis service data (optional; evaluation is skipped if homeostasis is not loaded)
- **Output**: `HealthPayload` published under domain ID `health` in the appraisal registry
- **Triggers**: Evaluation runs on homeostasis updates (physiological, drives, resources) and once after init when dependencies are ready

## Installation

```bash
bun add @elizaos/plugin-health
```

## Dependencies

This plugin requires **plugin-appraisal** to be installed and registered. **Plugin-homeostasis** is optional but recommended; without it, no health data is available and evaluation is skipped.

```typescript
import { appraisalPlugin } from '@elizaos/plugin-appraisal';
import { healthPlugin } from '@elizaos/plugin-health';
// Optional: provides physiological, drives, resources for health calculation
import { homeostasisPlugin } from '@elizaos/plugin-homeostasis';

const character = {
  name: 'MyAgent',
  plugins: [appraisalPlugin, homeostasisPlugin, healthPlugin],
};
```

## Usage

### Adding to Your Agent

```typescript
import { healthPlugin } from '@elizaos/plugin-health';

const character = {
  name: 'MyAgent',
  plugins: [healthPlugin],
};
```

Registration order should place `healthPlugin` after `appraisalPlugin` (and optionally after `homeostasisPlugin`). The plugin declares `dependencies: ['appraisal']`.

### Manual Evaluation

You can trigger a health evaluation manually (e.g. from tests or another plugin):

```typescript
import { evaluateHealth } from '@elizaos/plugin-health';

await evaluateHealth(runtime);
```

Evaluation is a no-op if the health evaluator is disabled for the character, or if the homeostasis or appraisal service is unavailable.

## Configuration

Configure via environment variables or character settings:

| Setting | Default | Description |
|---------|---------|-------------|
| `HEALTH_CRITICAL_THRESHOLD` | `75` | Score threshold (0–100 scale in config) below which status is `critical` |
| `HEALTH_POOR_THRESHOLD` | `50` | Score threshold below which status is `poor` |
| `HEALTH_EVALUATION_DELAY` | `2000` | Initial evaluation delay after init (ms) |

Internal score is 0–1; thresholds in constants are 0.2 (critical), 0.4 (poor), 0.6 (fair), 0.8 (good). Character settings can override defaults.

### Character-Level Control

Use the appraisal plugin's evaluator configuration to enable or disable the health evaluator:

```typescript
settings: {
  // Disable health evaluator for this character
  APPRAISAL_DISABLED_EVALUATORS: 'health',
}
```

## API Reference

### HealthPayload (Appraisal Output)

Published to the appraisal registry under domain ID `health`:

```typescript
interface HealthPayload {
  /** Overall health status */
  status: 'critical' | 'poor' | 'fair' | 'good' | 'excellent';

  /** Overall health score (0–1) */
  score: number;

  /** Energy level (0–1) */
  energy: number;

  /** Stress level (0–1, lower is better) */
  stress: number;

  /** Balance across physiological, drives, resources */
  balance: 'imbalanced' | 'skewed' | 'balanced' | 'optimal';

  /** Trend in health (currently 'stable'; trend needs historical data) */
  trend: 'declining' | 'stable' | 'improving';

  /** Optional areas of concern */
  concerns?: string[];

  /** Optional areas of strength */
  strengths?: string[];
}
```

### Status Thresholds

Status is derived from the aggregate score (0–1):

| Status     | Score range   |
|-----------|---------------|
| `critical` | score < 0.2   |
| `poor`     | score < 0.4   |
| `fair`     | score < 0.6   |
| `good`     | score < 0.8   |
| `excellent`| score ≥ 0.8   |

### Exports

| Export | Description |
|--------|-------------|
| `healthPlugin` | Plugin definition (default export) |
| `evaluateHealth(runtime)` | Run health evaluation once |
| `setupHealthEvaluation(runtime)` | Register homeostasis event handlers (called by plugin init) |
| `HealthPayload`, `HEALTH_DOMAIN_ID`, `HEALTH_SERVICE_TYPE` | Types and constants |
| `HealthEvents`, `HomeostasisEvents`, `Thresholds`, `Defaults` | Events and constants from `constants.ts` |

### Events

| Event | Payload | When |
|-------|---------|------|
| `HEALTH_APPRAISAL_PUBLISHED` | `{ runtime, source, agentId, payload, confidence }` | Health appraisal was successfully published to the appraisal service |

### Listening to Events

```typescript
runtime.registerEvent('HEALTH_APPRAISAL_PUBLISHED', async (event) => {
  const { payload, confidence } = event;
  if (payload.status === 'critical') {
    // Trigger recovery or alerting
  }
});
```

## How Health Is Calculated

- **Physiological** (from homeostasis): 0–100 scale where 0 = satisfied, 100 = deprived. Converted to a 0–1 “health” score (low deprivation = high score). High average deprivation adds concerns (e.g. “High physiological stress”).
- **Drives** (from homeostasis): 0–100 with 50 = balanced. Score is based on deviation from 50; balanced drives improve the score. Large deviation adds concerns (e.g. “Psychological needs not met”).
- **Resources** (from homeostasis): 0–100. Averaged and included in the aggregate. Low resources add concerns; high resources can be listed as strengths.
- **Energy**: Derived from physiological (e.g. fatigue) and resource energy; clamped 0–1.
- **Stress**: Derived from physiological deprivation and unmet drives; 0–1 (lower is better).
- **Balance**: Variance across the component scores; can be `imbalanced`, `skewed`, `balanced`, or `optimal`.

Confidence in the appraisal increases with the amount of available homeostasis data (physiological, drives, resources).

## Integration with Motivation

The health appraisal is consumed by motivation (and other plugins) via the appraisal provider:

```typescript
const state = await runtime.composeState(message, ['APPRAISALS']);
const healthAppraisal = state.data.providers?.APPRAISALS?.appraisals?.health;

if (healthAppraisal?.payload.status === 'critical') {
  // Prioritize recovery or reduce load
}

if (healthAppraisal?.payload.stress > 0.7) {
  // Adjust behavior to reduce stress
}
```

## Testing

```bash
cd packages/plugin-health
bun test
```

## License

MIT
