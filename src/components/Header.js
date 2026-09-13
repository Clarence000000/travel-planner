/**
 * Mobile Sticky Cat Photo Header Component
 * Replaces the static status bar with an atmospheric sticky cat photo banner.
 * Stays pinned at the top when scrolling down.
 * Features a clean frosted-glass hamburger button that opens the sidebar menu.
 */

export function createHeader(options = {}) {
  const { onOpenSidebar } = options;
  const header = document.createElement('header');
  header.className = 'cat-header';
  header.setAttribute('role', 'banner');

  header.innerHTML = `
    <div class="cat-header__banner" id="cat-header-banner" style="background-image: url('./src/assets/bg-itinerary.png');">
      <div class="cat-header__scrim">
        <div class="cat-header__top-row">
          <!-- Clean Sidebar Menu Toggle Button -->
          <button type="button" class="cat-header__menu-btn" id="btn-open-sidebar" aria-label="Open Trip Menu" title="Open Menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          <!-- Centered Trip Identification -->
          <div class="cat-header__center">
            <span class="cat-header__tag">Summer Tour 2026</span>
          </div>

          <!-- Right Balance Spacer -->
          <div class="cat-header__spacer" aria-hidden="true"></div>
        </div>

        <div class="cat-header__bottom-row">
          <h1 class="cat-header__title">Tokyo Expedition</h1>
          <span class="cat-header__subtitle">July 14 – 16 • 3-Day Journey</span>
        </div>
      </div>
    </div>
  `;

  const menuBtn = header.querySelector('#btn-open-sidebar');
  if (menuBtn && typeof onOpenSidebar === 'function') {
    menuBtn.addEventListener('click', onOpenSidebar);
  }

  // Helper method to dynamically switch the cat photo per active tab if needed
  function setBackground(imagePath) {
    const banner = header.querySelector('#cat-header-banner');
    if (banner && imagePath) {
      banner.style.backgroundImage = `url('${imagePath}')`;
    }
  }

  return {
    element: header,
    setBackground,
  };
}
