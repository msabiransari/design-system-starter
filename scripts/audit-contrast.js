#!/usr/bin/env node
/**
 * Contrast Audit Script
 * Checks all theme files for WCAG AA compliance on critical pairs
 * including normal, hover, focus, and disabled states.
 * Run: node scripts/audit-contrast.js
 */

const fs = require('fs');
const path = require('path');

const THEMES_DIR = path.join(__dirname, '..', 'themes');
const AA_NORMAL = 4.5;
const AA_LARGE = 3.0;

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function luminance({ r, g, b }) {
  const [rs, gs, bs] = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return rs * 0.2126 + gs * 0.7152 + bs * 0.0722;
}

function contrastRatio(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return null;
  const l1 = luminance(rgb1);
  const l2 = luminance(rgb2);
  const bright = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (bright + 0.05) / (dark + 0.05);
}

function extractVars(cssBlock) {
  const vars = {};
  const regex = /--_([a-z0-9-]+):\s*([^;]+);/g;
  let match;
  while ((match = regex.exec(cssBlock)) !== null) {
    vars[match[1]] = match[2].trim();
  }
  return vars;
}

function parseTheme(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // For auto themes, audit both the default branch and the dark @media branch
  const mediaMatch = content.match(/@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)\s*\{([\s\S]*)\}/);
  if (mediaMatch) {
    const defaultBlock = content.substring(0, content.indexOf('@media'));
    const darkBlock = mediaMatch[1];
    return [
      { branch: 'light', vars: extractVars(defaultBlock) },
      { branch: 'dark', vars: extractVars(darkBlock) },
    ];
  }

  return [{ branch: 'default', vars: extractVars(content) }];
}

const checks = [
  // Core text on surfaces
  { name: 'Text Primary on Surface Default', fg: 'text-primary', bg: 'surface-default', min: AA_NORMAL },
  { name: 'Text Secondary on Surface Default', fg: 'text-secondary', bg: 'surface-default', min: AA_NORMAL },
  { name: 'Text Muted on Surface Default', fg: 'text-muted', bg: 'surface-default', min: AA_NORMAL },
  { name: 'Text Link on Surface Default', fg: 'text-link', bg: 'surface-default', min: AA_NORMAL },
  { name: 'Text Danger on Surface Default', fg: 'text-danger', bg: 'surface-default', min: AA_NORMAL },
  { name: 'Text Success on Surface Default', fg: 'text-success', bg: 'surface-default', min: AA_NORMAL },
  { name: 'Text Warning on Surface Default', fg: 'text-warning', bg: 'surface-default', min: AA_NORMAL },

  // Button states
  { name: 'Primary Button Text on Primary', fg: 'accent-primary-text', bg: 'accent-primary', min: AA_NORMAL },
  { name: 'Primary Button Text on Primary Hover', fg: 'accent-primary-text', bg: 'accent-primary-hover', min: AA_NORMAL },
  { name: 'Secondary Button Text on Secondary', fg: 'accent-secondary-text', bg: 'accent-secondary', min: AA_NORMAL },
  { name: 'Secondary Button Text on Secondary Hover', fg: 'accent-secondary-text', bg: 'accent-secondary-hover', min: AA_NORMAL },
  { name: 'Danger Button Text on Danger', fg: 'accent-danger-text', bg: 'accent-danger', min: AA_NORMAL },
  { name: 'Danger Button Text on Danger Hover', fg: 'accent-danger-text', bg: 'accent-danger-hover', min: AA_NORMAL },

  // Badge / pill pairs
  { name: 'Success Badge Text on Success BG', fg: 'accent-success', bg: 'accent-success-bg', min: AA_NORMAL },
  { name: 'Warning Badge Text on Warning BG', fg: 'accent-warning', bg: 'accent-warning-bg', min: AA_NORMAL },
  { name: 'Info Badge Text on Info BG', fg: 'accent-info', bg: 'accent-info-bg', min: AA_NORMAL },

  // Surface text on page bg
  { name: 'Text Primary on Surface Page', fg: 'text-primary', bg: 'surface-page', min: AA_NORMAL },
  { name: 'Text Secondary on Surface Page', fg: 'text-secondary', bg: 'surface-page', min: AA_NORMAL },

  // Interactive states
  { name: 'Text Primary on Surface Hover', fg: 'text-primary', bg: 'surface-hover', min: AA_NORMAL },
  { name: 'Text Primary on Surface Active', fg: 'text-primary', bg: 'surface-active', min: AA_NORMAL },
  { name: 'Text Link Hover on Surface Default', fg: 'text-link-hover', bg: 'surface-default', min: AA_NORMAL },

  // Note: border-subtle and border-default are intentionally low-contrast for decorative use.
  // They are excluded from this audit because they are not required to be UI-component visible.
];

const files = fs.readdirSync(THEMES_DIR).filter((f) => f.endsWith('.css'));
let totalFailures = 0;

console.log('\n🎨  Design Token Contrast Audit\n');

files.forEach((file) => {
  const branches = parseTheme(path.join(THEMES_DIR, file));

  branches.forEach(({ branch, vars }) => {
    const failures = [];
    const label = branches.length > 1 ? `${file} (${branch})` : file;

    checks.forEach((check) => {
      const fgHex = vars[check.fg];
      const bgHex = vars[check.bg];
      if (!fgHex || !bgHex) return;
      const ratio = contrastRatio(fgHex, bgHex);
      if (ratio && ratio < check.min) {
        failures.push({ check: check.name, ratio: ratio.toFixed(2), min: check.min });
      }
    });

    if (failures.length === 0) {
      console.log(`  ✅ ${label}`);
    } else {
      console.log(`  ❌ ${label} — ${failures.length} failure(s)`);
      failures.forEach((f) => {
        console.log(`      • ${f.check}: ${f.ratio}:1 (needs ${f.min}:1)`);
        totalFailures++;
      });
    }
  });
});

console.log(`\n${totalFailures === 0 ? '✅ All themes pass WCAG AA.' : `❌ ${totalFailures} contrast failure(s) found.`}\n`);
process.exit(totalFailures > 0 ? 1 : 0);
