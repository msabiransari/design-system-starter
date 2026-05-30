/* ============================================================
   SHARED NAVIGATION + THEME SWITCHER
   Injects a sticky nav into every example page and handles
   theme persistence via localStorage.
   ============================================================ */

(function () {
  const path = window.location.pathname;
  const currentPage = path.split('/').pop() || 'index.html';

  const examples = [
    { file: 'index.html', label: 'Overview' },
    { file: 'dashboard.html', label: 'Dashboard' },
    { file: 'crm.html', label: 'CRM' },
    { file: 'marketing.html', label: 'Marketing' },
    { file: 'data.html', label: 'Data' },
    { file: 'auth.html', label: 'Auth' },
    { file: 'components.html', label: 'Components' },
    { file: 'guide.html', label: 'Guide' },
    { file: 'studio.html', label: 'Studio' },
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

  function init() {
    injectNav();
    restoreTheme();
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
          <a href="${ex.file}" class="ex-nav-link ${currentPage === ex.file ? 'active' : ''}">${ex.label}</a>
        `).join('')}
      </nav>
      <div class="ex-nav-theme">
        <label for="theme-select" class="ex-nav-theme-label">Theme</label>
        <select id="theme-select" class="ex-nav-select" aria-label="Select theme">
          ${themes.map(t => `<option value="${t.id}">${t.label}</option>`).join('')}
        </select>
      </div>
    `;
    document.body.insertBefore(header, document.body.firstChild);

    document.getElementById('theme-select').addEventListener('change', (e) => {
      setTheme(e.target.value);
    });
  }

  function setTheme(name) {
    const link = document.getElementById('theme-link');
    const html = document.documentElement;
    if (!link) return;

    link.href = `../themes/${name}.css`;
    localStorage.setItem('ds-theme', name);

    if (name === 'dark') {
      html.classList.add('dark');
      html.setAttribute('data-theme', 'dark');
    } else if (name === 'auto') {
      html.classList.remove('dark');
      html.removeAttribute('data-theme');
    } else {
      html.classList.remove('dark');
      html.removeAttribute('data-theme');
    }

    const select = document.getElementById('theme-select');
    if (select) select.value = name;
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
