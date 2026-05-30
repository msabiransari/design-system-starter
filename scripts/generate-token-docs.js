#!/usr/bin/env node
/**
 * Token Documentation Generator
 * Parses tokens.css and themes to produce a searchable, copy-friendly
 * static HTML reference page at docs/tokens.html.
 *
 * Run: node scripts/generate-token-docs.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TOKENS_CSS = path.join(ROOT, 'tokens.css');
const THEMES_DIR = path.join(ROOT, 'themes');
const OUTPUT = path.join(ROOT, 'docs', 'tokens.html');

function parseTokens(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Extract category blocks: /* ... Category Name ... */ followed by token lines
  const categories = [];
  let currentCategory = null;

  // Split into comment blocks and token blocks
  const parts = content.split(/(\/\*[\s\S]*?\*\/)/);

  for (const part of parts) {
    if (part.startsWith('/*')) {
      // Try to extract a category name from the comment
      const lines = part.split('\n').map((l) => l.trim().replace(/^[*\s]+/, '').replace(/[*\s]+$/, ''));
      const nameLine = lines.find((l) => /^[A-Z][A-Za-z\s()/-]+$/.test(l));
      if (nameLine) {
        currentCategory = { name: nameLine.trim(), tokens: [] };
        categories.push(currentCategory);
      }
    } else if (currentCategory) {
      // Extract tokens from this block
      const tokenRegex = /^\s*(--[a-z0-9-]+):\s*([^;]+);/gm;
      let match;
      while ((match = tokenRegex.exec(part)) !== null) {
        const name = match[1];
        if (name.startsWith('--_')) continue;
        currentCategory.tokens.push({
          name,
          value: match[2].trim(),
        });
      }
    }
  }

  return categories.filter((c) => c.tokens.length > 0);
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

function parseThemeValues(themePath) {
  const content = fs.readFileSync(themePath, 'utf8');

  // For auto themes, parse both the default branch and the dark @media branch
  const mediaMatch = content.match(/@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)\s*\{([\s\S]*)\}/);
  if (mediaMatch) {
    const defaultBlock = content.substring(0, content.indexOf('@media'));
    const darkBlock = mediaMatch[1];
    return {
      ...extractVars(defaultBlock),
      __dark: extractVars(darkBlock),
    };
  }

  return extractVars(content);
}

function buildTokenMap(categories) {
  const map = {};
  for (const cat of categories) {
    for (const token of cat.tokens) {
      // Extract the private var reference, e.g. var(--_surface-page)
      const refMatch = token.value.match(/var\(--_([a-z0-9-]+)\)/);
      map[token.name] = refMatch ? refMatch[1] : null;
    }
  }
  return map;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function generate() {
  const categories = parseTokens(TOKENS_CSS);
  const tokenMap = buildTokenMap(categories);

  const themeFiles = fs
    .readdirSync(THEMES_DIR)
    .filter((f) => f.endsWith('.css'))
    .sort();

  const rawThemes = themeFiles.map((f) => ({
    id: f.replace('.css', ''),
    name: f.replace('.css', '').replace(/^./, (c) => c.toUpperCase()),
    values: parseThemeValues(path.join(THEMES_DIR, f)),
  }));

  // Flatten auto theme into light and dark columns
  const themes = [];
  for (const t of rawThemes) {
    if (t.values.__dark) {
      const darkValues = t.values.__dark;
      const lightValues = {};
      for (const key of Object.keys(t.values)) {
        if (key !== '__dark') lightValues[key] = t.values[key];
      }
      themes.push({ id: t.id, name: t.name + ' (light)', values: lightValues });
      themes.push({ id: t.id + '-dark', name: t.name + ' (dark)', values: darkValues });
    } else {
      themes.push(t);
    }
  }

  const themeOptions = rawThemes
    .map((t) => `<option value="${t.id}">${t.name}</option>`)
    .join('\n');

  const categoryHtml = categories
    .map((cat) => {
      const rows = cat.tokens
        .map((token) => {
          const privateRef = tokenMap[token.name];
          const themeValues = themes
            .map((t) => {
              const concrete = privateRef ? t.values[privateRef] : '';
              return `<td data-theme="${t.id}"><code class="token-concrete">${
                concrete ? escapeHtml(concrete) : '—'
              }</code></td>`;
            })
            .join('');

          return `<tr data-token="${token.name}">
            <td><code class="token-name">${token.name}</code></td>
            <td><span class="token-swatch" data-token="${token.name}"></span></td>
            <td><code class="token-value">${escapeHtml(token.value)}</code></td>
            ${themeValues}
            <td><button class="token-copy" onclick="copyToken('${token.name}')">Copy</button></td>
          </tr>`;
        })
        .join('\n');

      return `
      <section class="token-category" data-category="${cat.name.toLowerCase().replace(/[^a-z]+/g, '-')}">
        <div class="category-header">
          <h2 class="category-title">${escapeHtml(cat.name)}</h2>
          <span class="category-count">${cat.tokens.length} tokens</span>
        </div>
        <div class="table-wrap">
          <table class="token-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Swatch</th>
                <th>Reference</th>
                ${themes.map((t) => `<th data-theme="${t.id}">${t.name}</th>`).join('')}
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </section>`;
    })
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Design Tokens Reference</title>
  <link rel="stylesheet" href="../tokens.css" />
  <link rel="stylesheet" href="../themes/professional.css" id="theme-link" />
  <link rel="stylesheet" href="../base.css" />
  <link rel="stylesheet" href="../primitives.css" />
  <style>
    :root {
      --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: var(--font-sans);
      background: var(--surface-page);
      color: var(--text-primary);
      line-height: 1.5;
    }

    .page {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--space-8) var(--gap-md);
    }

    .page-header {
      margin-bottom: var(--space-8);
    }

    .page-title {
      font-size: var(--text-3xl);
      font-weight: var(--weight-bold);
      letter-spacing: var(--tracking-tight);
      margin-bottom: var(--space-2);
    }

    .page-desc {
      font-size: var(--text-base);
      color: var(--text-secondary);
      max-width: 640px;
      line-height: var(--leading-relaxed);
    }

    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: var(--gap-md);
      align-items: center;
      margin-bottom: var(--space-8);
      padding: var(--space-4);
      background: var(--surface-raised);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
    }

    .search {
      flex: 1;
      min-width: 240px;
      padding: var(--space-2) var(--space-3);
      font-size: var(--text-sm);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-base);
      background: var(--surface-default);
      color: var(--text-primary);
    }

    .search:focus {
      outline: none;
      border-color: var(--focus-ring);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--focus-ring) 15%, transparent);
    }

    .theme-select {
      padding: var(--space-2) var(--space-3);
      font-size: var(--text-sm);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-base);
      background: var(--surface-default);
      color: var(--text-primary);
      cursor: pointer;
    }

    .token-category {
      margin-bottom: var(--space-10);
    }

    .category-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-bottom: var(--space-3);
      padding-bottom: var(--space-2);
      border-bottom: 1px solid var(--border-subtle);
    }

    .category-title {
      font-size: var(--text-xl);
      font-weight: var(--weight-semibold);
      margin: 0;
    }

    .category-count {
      font-size: var(--text-xs);
      font-weight: var(--weight-semibold);
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wide);
    }

    .table-wrap {
      overflow-x: auto;
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
    }

    .token-table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--text-sm);
      min-width: 640px;
    }

    .token-table th {
      text-align: left;
      padding: var(--space-2) var(--space-3);
      font-weight: var(--weight-semibold);
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-default);
      font-size: var(--text-xs);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wide);
      background: var(--surface-raised);
      white-space: nowrap;
    }

    .token-table td {
      padding: var(--space-2) var(--space-3);
      border-bottom: 1px solid var(--border-subtle);
      color: var(--text-primary);
      vertical-align: middle;
      white-space: nowrap;
    }

    .token-table tr:hover td {
      background: var(--surface-hover);
    }

    .token-name {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--text-link);
    }

    .token-value {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--text-secondary);
    }

    .token-concrete {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--text-muted);
    }

    .token-swatch {
      display: inline-block;
      width: 20px;
      height: 20px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-default);
      vertical-align: middle;
    }

    .token-copy {
      padding: var(--space-1) var(--space-2);
      font-size: var(--text-xs);
      font-weight: var(--weight-medium);
      color: var(--text-muted);
      background: var(--surface-default);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all var(--duration-fast) var(--ease-out);
    }

    .token-copy:hover {
      border-color: var(--border-hover);
      color: var(--text-primary);
    }

    .token-copy.copied {
      color: var(--accent-success);
      border-color: var(--accent-success);
    }

    .empty-state {
      text-align: center;
      padding: var(--space-12) var(--gap-md);
      color: var(--text-muted);
    }

    @media (max-width: 768px) {
      .page { padding: var(--gap-md); }
      .page-title { font-size: var(--text-2xl); }
    }
  </style>
</head>
<body>
  <div class="page">
    <header class="page-header">
      <h1 class="page-title">Design Tokens Reference</h1>
      <p class="page-desc">Searchable catalog of every semantic token in the system. Values update when you switch themes. Click Copy to grab <code>var(--token)</code> for your stylesheet.</p>
    </header>

    <div class="controls">
      <input type="search" id="token-search" class="search" placeholder="Search tokens (e.g. surface, primary, duration)..." />
      <select id="theme-select" class="theme-select" aria-label="Select theme">
        ${themeOptions}
      </select>
    </div>

    <main id="token-content">
      ${categoryHtml}
    </main>

    <footer style="text-align: center; padding: var(--space-8) 0; color: var(--text-muted); border-top: 1px solid var(--border-subtle); margin-top: var(--space-8);">
      <p class="token-value">Generated from tokens.css · ${categories.reduce((s, c) => s + c.tokens.length, 0)} tokens across ${categories.length} categories</p>
    </footer>
  </div>

  <script>
    const themeLink = document.getElementById('theme-link');
    const themeSelect = document.getElementById('theme-select');

    themeSelect.addEventListener('change', (e) => {
      themeLink.href = '../themes/' + e.target.value + '.css';
      setTimeout(updateSwatches, 100);
    });

    function copyToken(name) {
      const text = 'var(' + name + ')';
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      const btn = document.querySelector('button[onclick="copyToken(\\'' + name + '\\')"]');
      if (btn) {
        btn.textContent = 'Copied';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1500);
      }
    }

    function updateSwatches() {
      const computed = getComputedStyle(document.documentElement);
      document.querySelectorAll('.token-swatch').forEach(swatch => {
        const token = swatch.dataset.token;
        const value = computed.getPropertyValue(token).trim();
        if (value && (/^#/.test(value) || /^rgb/.test(value) || /^hsl/.test(value))) {
          swatch.style.backgroundColor = value;
        } else {
          swatch.style.backgroundColor = 'transparent';
        }
      });
    }

    document.getElementById('token-search').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.token-table tbody tr').forEach(row => {
        const token = row.dataset.token.toLowerCase();
        row.style.display = token.includes(q) ? '' : 'none';
      });
      document.querySelectorAll('.token-category').forEach(cat => {
        const visible = cat.querySelectorAll('.token-table tbody tr:not([style*="none"])').length;
        cat.style.display = visible > 0 ? '' : 'none';
      });
      const anyVisible = document.querySelectorAll('.token-category:not([style*="none"])').length;
      const empty = document.getElementById('empty-state');
      if (empty) empty.style.display = anyVisible ? 'none' : '';
    });

    updateSwatches();
  </script>
</body>
</html>`;

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, html, 'utf8');
  console.log(`✅ Generated ${OUTPUT}`);
  console.log(`   ${categories.length} categories, ${categories.reduce((s, c) => s + c.tokens.length, 0)} tokens, ${themes.length} themes`);
}

generate();
