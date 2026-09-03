/**
 * Mobile Top Header Component
 * Sticky top bar matching .agents/skills/travel-planner-ui mobile layout.
 * Displays trip destination/title and quick status indicators.
 */

export function createHeader() {
  const header = document.createElement('header');
  header.className = 'top-header';
  header.setAttribute('role', 'banner');

  header.innerHTML = `
    <div class="top-header__inner">
      <div class="top-header__brand">
        <div class="top-header__logo">✈</div>
        <div class="top-header__text">
          <span class="top-header__subtitle">Trip Planner</span>
          <h1 class="top-header__title">Summer Tour 2026</h1>
        </div>
      </div>

      <div class="top-header__actions">
        <button type="button" class="top-header__action-btn" aria-label="Trip Status Notifications">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span class="notification-indicator"></span>
        </button>
      </div>
    </div>
  `;

  return {
    element: header,
  };
}
