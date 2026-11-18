/* ============================================================
   SHARED NAVIGATION + THEME SWITCHER
   Depth-aware: works from examples/index.html (depth 0) and
   examples/<name>/index.html (depth 1). Theme path is derived
   from the existing #theme-link href so it is depth-independent.
   ============================================================ */

(function () {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const exIdx = segments.lastIndexOf('examples');
  let afterEx = exIdx >= 0 ? segments.slice(exIdx + 1) : [];
  if (afterEx.length && afterEx[afterEx.length - 1].endsWith('.html')) {
    afterEx = afterEx.slice(0, -1);
  }
  const depth = afterEx.length; // 0 = overview, 1 = a sub-page
  const toExamples = depth === 0 ? './' : '../'.repeat(depth);
  const currentDir = depth === 0 ? 'index' : afterEx[afterEx.length - 1];

  const examples = [
    { dir: 'index', label: 'Overview' },
    { dir: 'dashboard', label: 'Dashboard' },
    { dir: 'crm', label: 'CRM' },
    { dir: 'marketing', label: 'Marketing' },
    { dir: 'data', label: 'Data' },
    { dir: 'auth', label: 'Auth' },
    { dir: 'components', label: 'Components' },
    { dir: 'guide', label: 'Guide' },
    { dir: 'aggrid', label: 'ag-Grid 14' },
    { dir: 'bootstrap', label: 'Bootstrap' },
    { dir: 'studio', label: 'Studio' },
  ];

  const themes = [
    { id: 'professional', label: 'Professional' },
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
    { id: 'auto', label: 'Auto (OS)' },
    { id: 'healthcare', label: 'Healthcare' },
    { id: 'saas', label: 'SaaS' },
    { id: 'minimal', label: 'Minimal' },
    { id: 'forest', label: 'Forest' },
    { id: 'ocean', label: 'Ocean' },
  ];

  function hrefFor(dir) {
    return dir === 'index' ? `${toExamples}index.html` : `${toExamples}${dir}/index.html`;
  }

  function init() {
    injectNav();
    restoreTheme();
    setMode(localStorage.getItem('ds-mode') || 'light');
  }

  function injectNav() {
    const header = document.createElement('header');
    header.className = 'ex-nav';
    header.innerHTML = `
      <div class="ex-nav-brand">
        <span class="ex-nav-logo">DS</span>
        <span class="ex-nav-title">Design System</span>
      </div>
      <nav class="ex-nav-links" aria-label="Examples">
        ${examples.map(ex => `
          <a href="${hrefFor(ex.dir)}" class="ex-nav-link ${currentDir === ex.dir ? 'active' : ''}">${ex.label}</a>
        `).join('')}
      </nav>
      <div class="ex-nav-theme">
        <div class="ex-nav-control">
          <label for="theme-select" class="ex-nav-theme-label">Theme</label>
          <select id="theme-select" class="ex-nav-select" aria-label="Select theme">
            ${themes.map(t => `<option value="${t.id}">${t.label}</option>`).join('')}
          </select>
        </div>
        <div class="ex-nav-control">
          <label for="mode-select" class="ex-nav-theme-label">Mode</label>
          <select id="mode-select" class="ex-nav-select" aria-label="Select mode">
            <option value="light">Day</option>
            <option value="dark">Night</option>
            <option value="auto">Device</option>
          </select>
        </div>
      </div>
    `;
    document.body.insertBefore(header, document.body.firstChild);

    document.getElementById('theme-select').addEventListener('change', (e) => {
      setTheme(e.target.value);
    });
    document.getElementById('mode-select').addEventListener('change', (e) => {
      setMode(e.target.value);
    });
  }

  function setMode(mode) {
    const value = ['light', 'dark', 'auto'].includes(mode) ? mode : 'light';
    document.documentElement.setAttribute('data-mode', value);
    document.getElementById('mode-select').value = value;
    localStorage.setItem('ds-mode', value);
  }

  function setTheme(name) {
    const link = document.getElementById('theme-link');
    const html = document.documentElement;
    if (!link) return;

    // Derive base path from the existing href so depth does not matter.
    link.href = link.href.replace(/themes\/[^/]+\.css/, `themes/${name}.css`);
    localStorage.setItem('ds-theme', name);

    if (name === 'dark') {
      html.classList.add('dark');
      html.setAttribute('data-theme', 'dark');
    } else {
      html.classList.remove('dark');
      html.removeAttribute('data-theme');
    }

    const select = document.getElementById('theme-select');
    if (select) select.value = name;
    const modeSelect = document.getElementById('mode-select');
    modeSelect.disabled = ['light', 'dark', 'auto'].includes(name);
    modeSelect.title = modeSelect.disabled ? 'This neutral theme controls its own mode' : 'Choose the brand theme mode';
  }

  function restoreTheme() {
    const saved = localStorage.getItem('ds-theme') || 'professional';
    setTheme(saved);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
