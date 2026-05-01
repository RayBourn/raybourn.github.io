// Theme Toggle functionality

const THEME_STORAGE_KEY = "theme";
const THEME_LIGHT = "light";
const THEME_DARK = "dark";

/**
 * Get initial theme from localStorage or system preference
 * @returns {string} Theme name
 */
function getInitialTheme() {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme) {
    return storedTheme;
  }

  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  return prefersLight ? THEME_LIGHT : THEME_DARK;
}

/**
 * Set theme on document
 * @param {string} theme - Theme name
 */
function setTheme(theme) {
  const html = document.documentElement;
  html.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  updateThemeToggleIcon(theme);
  if (typeof updateGiscusTheme === 'function') {
    updateGiscusTheme(theme);
  }
}

/**
 * Update theme toggle icon visibility
 * @param {string} theme - Current theme
 */
function updateThemeToggleIcon(theme) {
  const themeToggle = document.getElementById("theme-toggle");
  if (!themeToggle) return;

  const iconSun = themeToggle.querySelector(".icon-sun");
  const iconMoon = themeToggle.querySelector(".icon-moon");

  if (theme === THEME_LIGHT) {
    iconSun?.setAttribute("style", "display: none;");
    iconMoon?.setAttribute("style", "display: block;");
  } else {
    iconSun?.setAttribute("style", "display: block;");
    iconMoon?.setAttribute("style", "display: none;");
  }
}

/**
 * Toggle theme between light and dark
 */
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute("data-theme");
  const newTheme = currentTheme === THEME_LIGHT ? THEME_DARK : THEME_LIGHT;
  setTheme(newTheme);
}

/**
 * Initialize theme toggle
 */
function initThemeToggle() {
  const themeToggle = document.getElementById("theme-toggle");
  if (!themeToggle) return;

  // Set initial theme
  const initialTheme = getInitialTheme();
  setTheme(initialTheme);

  // Listen for system theme changes
  window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", (e) => {
    if (!localStorage.getItem(THEME_STORAGE_KEY)) {
      setTheme(e.matches ? THEME_LIGHT : THEME_DARK);
    }
  });

  // Toggle theme on button click
  themeToggle.addEventListener("click", toggleTheme);
}

// Initialize on page load
initOnReady(initThemeToggle);

/**
 * Update Giscus theme
 */
function updateGiscusTheme(theme) {
  const iframe = document.querySelector('iframe.giscus-frame');
  if (!iframe) return;
  const giscusTheme = theme === THEME_DARK ? 'dark' : 'light';
  iframe.contentWindow.postMessage(
    { giscus: { setConfig: { theme: giscusTheme } } },
    'https://giscus.app'
  );
}

// Sync Giscus theme when it loads
window.addEventListener('message', function(event) {
  if (event.origin !== 'https://giscus.app') return;
  if (!(typeof event.data === 'object' && event.data.giscus)) return;
  
  const currentTheme = document.documentElement.getAttribute("data-theme") || THEME_LIGHT;
  updateGiscusTheme(currentTheme);
});
