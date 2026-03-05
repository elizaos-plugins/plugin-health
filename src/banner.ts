/**
 * Beautiful plugin settings banner with custom ASCII art
 * Health Plugin - Wellness domain evaluator from homeostasis
 */

import type { IAgentRuntime } from '@elizaos/core';

// Health: Medical Red/White theme - wellness and vitality
const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[32m',
  redBright: '\x1b[95m',
  pink: '\x1b[95m',
  white: '\x1b[97m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightWhite: '\x1b[97m',
  brightRed: '\x1b[91m',
  brightBlue: '\x1b[94m',
};

export interface PluginSetting {
  name: string;
  value: unknown;
  defaultValue?: unknown;
  sensitive?: boolean;
  required?: boolean;
}

export interface BannerOptions {
  runtime: IAgentRuntime;
  settings?: PluginSetting[];
}

function mask(v: string): string {
  if (!v || v.length < 8) return '••••••••';
  return `${v.slice(0, 4)}${'•'.repeat(Math.min(12, v.length - 8))}${v.slice(-4)}`;
}

function fmtVal(value: unknown, sensitive: boolean, maxLen: number): string {
  let s: string;
  if (value === undefined || value === null || value === '') {
    s = '(not set)';
  } else if (sensitive) {
    s = mask(String(value));
  } else {
    s = String(value);
  }
  if (s.length > maxLen) s = s.slice(0, maxLen - 3) + '...';
  return s;
}

function isDef(v: unknown, d: unknown): boolean {
  if (v === undefined || v === null || v === '') return true;
  return d !== undefined && String(v) === String(d);
}

function pad(s: string, n: number): string {
  const len = s.replace(/\x1b\[[0-9;]*m/g, '').length;
  if (len >= n) return s;
  return s + ' '.repeat(n - len);
}

function line(content: string): string {
  const stripped = content.replace(/\x1b\[[0-9;]*m/g, '');
  const len = stripped.length;
  if (len > 78) return content.slice(0, 78);
  return content + ' '.repeat(78 - len);
}

export function printBanner(options: BannerOptions): void {
  const { settings = [], runtime } = options;
  const R = ANSI.reset, D = ANSI.dim, B = ANSI.bold;
  const c1 = ANSI.red, c2 = ANSI.redBright, c3 = ANSI.pink, c4 = ANSI.white;
  const G = ANSI.brightGreen;

  const top = `${c1}╔${'═'.repeat(78)}╗${R}`;
  const mid = `${c1}╠${'═'.repeat(78)}╣${R}`;
  const bot = `${c1}╚${'═'.repeat(78)}╝${R}`;
  const row = (s: string) => `${c1}║${R}${line(s)}${c1}║${R}`;

  const lines: string[] = [''];
  lines.push(top);
  lines.push(row(` ${B}Character: ${runtime.character.name}${R}`));
  lines.push(mid);

  // Health - Heart with pulse line
  lines.push(row(`${c2}    __  __           __ __  __       ${c3}     .---.${R}`));
  lines.push(row(`${c2}   / / / /___  ____ / // /_/ /_      ${c3}    /     \\${R}`));
  lines.push(row(`${c2}  / /_/ / _ \\/ __ '/ // __/ __ \\     ${c3}   | ${c1}♥   ♥${c3} |${R}`));
  lines.push(row(`${c2} / __  /  __/ /_/ / // /_/ / / /     ${c3}    \\  ${c1}♥${c3}  /${R}`));
  lines.push(row(`${c2}/_/ /_/\\___/\\__,_/_/ \\__/_/ /_/      ${c3}     \\   /${R}`));
  lines.push(row(`${D}                                      ${c3}      \\_/${R}`));
  lines.push(row(``));
  lines.push(row(`${c3}   ~~~${c1}/\\${c3}~~~${c1}/\\${c3}~~~  ${D}Wellness Evaluation from Homeostasis${R}  ${c3}~~~${c1}/\\${c3}~~~${c1}/\\${c3}~~~${R}`));
  lines.push(mid);

  if (settings.length > 0) {
    const NW = 34, VW = 26, SW = 8;
    lines.push(row(` ${B}${pad('ENV VARIABLE', NW)} ${pad('VALUE', VW)} ${pad('STATUS', SW)}${R}`));
    lines.push(row(` ${D}${'-'.repeat(NW)} ${'-'.repeat(VW)} ${'-'.repeat(SW)}${R}`));

    for (const s of settings) {
      const def = isDef(s.value, s.defaultValue);
      const set = s.value !== undefined && s.value !== null && s.value !== '';

      let ico: string, st: string;
      if (!set && s.required) {
        ico = `${ANSI.brightRed}◆${R}`;
        st = `${ANSI.brightRed}REQUIRED${R}`;
      } else if (!set) {
        ico = `${D}○${R}`;
        st = `${D}default${R}`;
      } else if (def) {
        ico = `${ANSI.brightBlue}●${R}`;
        st = `${ANSI.brightBlue}default${R}`;
      } else {
        ico = `${G}✓${R}`;
        st = `${G}custom${R}`;
      }

      const name = pad(s.name, NW - 2);
      const val = pad(fmtVal(s.value ?? s.defaultValue, s.sensitive ?? false, VW), VW);
      const status = pad(st, SW);
      lines.push(row(` ${ico} ${c2}${name}${R} ${val} ${status}`));
    }

    lines.push(mid);
    lines.push(row(` ${D}${G}✓${D} custom  ${ANSI.brightBlue}●${D} default  ○ unset  ${ANSI.brightRed}◆${D} required      → Set in .env${R}`));
  }

  lines.push(bot);
  lines.push('');

  runtime.logger.info(lines.join('\n'));
}
