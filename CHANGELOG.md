# Changelog

All notable changes to `@elizaos/plugin-health` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-03-05

### Added

- **Health evaluator**: Aggregates homeostasis state (physiological, drives, resources) into an overall health/wellbeing appraisal.
- **Appraisal integration**: Publishes `HealthPayload` to plugin-appraisal under domain ID `health` for use by motivation and other plugins.
- **Event-driven evaluation**: Registers for `HOMEOSTASIS_PHYSIOLOGICAL_UPDATED`, `HOMEOSTASIS_DRIVES_UPDATED`, and `HOMEOSTASIS_RESOURCES_UPDATED`; re-evaluates and publishes when homeostasis data changes.
- **Initial evaluation**: Runs one evaluation after init once appraisal (and optionally homeostasis) services are ready, with configurable delay (`HEALTH_EVALUATION_DELAY`).
- **Configurable thresholds**: `HEALTH_CRITICAL_THRESHOLD` and `HEALTH_POOR_THRESHOLD` for status boundaries (exposed in banner; internal logic uses 0–1 score thresholds).
- **Character-level enable/disable**: Respects `APPRAISAL_DISABLED_EVALUATORS` so health evaluator can be disabled per character.
- **Exports**: `healthPlugin`, `evaluateHealth`, `setupHealthEvaluation`, `HealthPayload`, `HEALTH_DOMAIN_ID`, `HealthEvents`, `HomeostasisEvents`, `Thresholds`, `Defaults`.
- **Event**: `HEALTH_APPRAISAL_PUBLISHED` emitted when an appraisal is successfully published.
- **Banner**: Startup banner showing character name and health-related settings (default/custom/required).

### Dependencies

- Requires `@elizaos/plugin-appraisal`. Optional: `@elizaos/plugin-homeostasis` (evaluation skipped if not present).
