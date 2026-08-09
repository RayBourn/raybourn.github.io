document.addEventListener('DOMContentLoaded', () => {
  /* ---------- SEARCH MODAL & INSTANT ENGINE ---------- */
  const searchBtn = document.querySelector('.nav-search');
  const searchModal = document.getElementById('search-modal');
  const closeBtn = document.querySelector('.search-close');
  const container = document.getElementById('pagefind-container');
  let searchInitialized = false;
  let articlesData = null;

  async function initSearchEngine() {
    if (searchInitialized || !container) return;
    
    container.innerHTML = `
      <div class="live-search-wrap">
        <input type="search" placeholder="Type to search articles by title or #tag..." class="live-search-input" aria-label="Search articles">
        <div class="live-search-results"></div>
      </div>
    `;

    const input = container.querySelector('.live-search-input');
    const resultsDiv = container.querySelector('.live-search-results');

    try {
      const res = await fetch('/index.json');
      if (res.ok) {
        articlesData = await res.json();
      }
    } catch (e) {
      console.warn('Index fetch error:', e);
    }

    function renderResults(query) {
      if (!resultsDiv) return;
      const q = (query || '').trim().toLowerCase();
      
      if (!q) {
        resultsDiv.innerHTML = `<div class="live-search-empty">Start typing to search through articles...</div>`;
        return;
      }

      if (!articlesData || articlesData.length === 0) {
        resultsDiv.innerHTML = `<div class="live-search-empty">No article index available.</div>`;
        return;
      }

      const matches = articlesData.filter(item => {
        const titleMatch = (item.title || '').toLowerCase().includes(q);
        const tagMatch = (item.tags || []).some(t => String(t).toLowerCase().includes(q));
        return titleMatch || tagMatch;
      });

      if (matches.length === 0) {
        resultsDiv.innerHTML = `<div class="live-search-empty">No matching posts or tags found for "${q}"</div>`;
        return;
      }

      resultsDiv.innerHTML = matches.map(item => `
        <a href="${item.url}" class="live-search-item">
          <div class="live-search-item-header">
            <h4 class="live-search-title">${item.title}</h4>
            <div class="live-search-meta">
              <span class="topic-tag">${item.section || 'article'}</span>
              <span>·</span>
              <time>${item.date || ''}</time>
            </div>
          </div>
          ${item.tags && item.tags.length > 0 ? `
            <div class="live-search-tags" style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px;">
              ${item.tags.map(t => `<span class="post-tag" style="font-size: 11px; padding: 2px 8px; min-height: unset; height: auto;">#${t}</span>`).join('')}
            </div>
          ` : ''}
        </a>
      `).join('');
    }

    if (input) {
      input.addEventListener('input', (e) => renderResults(e.target.value));
      renderResults('');
    }

    searchInitialized = true;
  }

  function openSearch() {
    if (!searchModal) return;
    searchModal.classList.add('open');
    searchModal.setAttribute('aria-hidden', 'false');
    
    initSearchEngine();
    const input = searchModal.querySelector('input');
    if (input) {
      setTimeout(() => input.focus(), 100);
    }
  }

  function closeSearch() {
    if (!searchModal) return;
    searchModal.classList.remove('open');
    searchModal.setAttribute('aria-hidden', 'true');
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openSearch();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeSearch);
  }

  if (searchModal) {
    searchModal.addEventListener('click', (e) => {
      if (e.target === searchModal) {
        closeSearch();
      }
    });
  }

  // Keyboard shortcuts: '/' to open search, 'Escape' to close
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      openSearch();
    } else if (e.key === 'Escape' && searchModal && searchModal.classList.contains('open')) {
      closeSearch();
    }
  });

  /* ---------- THEME TOGGLE ---------- */
  const themeBtn = document.getElementById('theme-toggle');
  
  function updateThemeIcon() {
    if (!themeBtn) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const label = isDark ? 'Switch to Light theme' : 'Switch to Dark theme';
    themeBtn.setAttribute('title', label);
    themeBtn.setAttribute('aria-label', label);
  }

  updateThemeIcon();

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const nextTheme = isDark ? 'light' : 'dark';
      if (nextTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      localStorage.setItem('theme', nextTheme);
      updateThemeIcon();
      themeBtn.blur();
    });
  }

  /* ---------- MOBILE MENU TOGGLE ---------- */
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const navLinks = document.getElementById('nav-links');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.contains('open');
      if (isOpen) {
        navLinks.classList.remove('open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      } else {
        navLinks.classList.add('open');
        mobileToggle.setAttribute('aria-expanded', 'true');
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!mobileToggle.contains(e.target) && !navLinks.contains(e.target) && navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- ARCHIVE TAG FILTERING ---------- */
  const filterBtns = document.querySelectorAll('.tag-filter-btn');
  const archiveItems = document.querySelectorAll('.archive-item');
  const yearGroups = document.querySelectorAll('.archive-year-group');

  if (filterBtns.length > 0 && archiveItems.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedTag = btn.getAttribute('data-tag');

        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        archiveItems.forEach(item => {
          const itemTags = (item.getAttribute('data-tags') || '').trim().split(/\s+/);
          if (selectedTag === 'all' || itemTags.includes(selectedTag)) {
            item.style.display = '';
          } else {
            item.style.display = 'none';
          }
        });

        // Hide year headers if all items under it are hidden
        yearGroups.forEach(group => {
          const visibleItems = Array.from(group.querySelectorAll('.archive-item')).filter(i => i.style.display !== 'none');
          group.style.display = visibleItems.length > 0 ? 'block' : 'none';
        });
      });
    });
  }
});
