// Navigation functionality
// Constants are imported from common/constants.js

/**
 * Initialize glass dock navigation toggle
 */
function initGlassDockNavigation() {
  const glassDockToggle = document.querySelector(".glass-dock-toggle");
  const glassDockList = document.querySelector(".glass-dock-list");

  if (!glassDockToggle || !glassDockList) return;

  glassDockToggle.addEventListener("click", function () {
    const isExpanded = this.getAttribute("aria-expanded") === "true";
    this.setAttribute("aria-expanded", !isExpanded);
    glassDockList.classList.toggle("mobile-open", !isExpanded);
  });

  // Close menu when clicking on a link (mobile)
  glassDockList.querySelectorAll(".glass-dock-link").forEach((link) => {
    link.addEventListener("click", function () {
      if (window.innerWidth <= MOBILE_BREAKPOINT) {
        glassDockToggle.setAttribute("aria-expanded", "false");
        glassDockList.classList.remove("mobile-open");
      }
    });
  });

  // Close menu when clicking outside (mobile)
  document.addEventListener("click", function (e) {
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
      if (
        !glassDockToggle.contains(e.target) &&
        !glassDockList.contains(e.target)
      ) {
        glassDockToggle.setAttribute("aria-expanded", "false");
        glassDockList.classList.remove("mobile-open");
      }
    }
  });
}

/**
 * Initialize smooth scroll for anchor links
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (href === "#" || href.length <= 1) return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });
}

/**
 * Initialize post card click handlers
 */
function initPostCardClick() {
  document.querySelectorAll(".post-card[data-post-url]").forEach((card) => {
    card.addEventListener("click", function (e) {
      // Don't navigate if clicking on a link or tag
      if (e.target.closest("a")) {
        return;
      }

      const url = this.getAttribute("data-post-url");
      if (url) {
        window.location.href = url;
      }
    });
  });
}

/**
 * Initialize all navigation features
 */
function initNavigation() {
  initGlassDockNavigation();
  initSmoothScroll();
  initPostCardClick();
}

// Initialize on page load
(function () {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNavigation);
  } else {
    initNavigation();
  }
})();

// Hide header on scroll down, show on scroll up
(function () {
  let lastScrollTop = 0;
  const header = document.querySelector(".header-nav");

  if (!header) return;

  window.addEventListener("scroll", () => {
    // Only apply on 'posts' section (articles)
    if (!document.body.classList.contains("section-posts")) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > lastScrollTop && scrollTop > 80) {
      // scrolling down
      header.classList.add("header-hidden");
    } else {
      // scrolling up
      header.classList.remove("header-hidden");
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  });
})();

// Hide header on scroll down, show on scroll up
(function () {
  let lastScroll = 0;
  const header = document.querySelector(".sticky-header");

  if (!header) return;

  window.addEventListener("scroll", () => {
    // Only apply on 'posts' section (articles)
    if (!document.body.classList.contains("section-posts")) return;

    const current = window.scrollY || document.documentElement.scrollTop;

    if (current > lastScroll && current > 100) {
      header.classList.add("is-hidden");
    } else {
      header.classList.remove("is-hidden");
    }

    lastScroll = current <= 0 ? 0 : current;
  });
})();
