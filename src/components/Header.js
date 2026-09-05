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
        <div class="top-header__logo" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/>
          </svg>
        </div>
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
