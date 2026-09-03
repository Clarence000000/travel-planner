/**
 * Mobile Bottom Navigation Component
 * Fixed 4-tab bar adhering to .agents/skills/travel-planner-ui design system.
 * Tabs: Itinerary, Chat, Assistant, Dashboard
 */

import { getNavTabs, onTabChange, setActiveTab } from '../config/navigation.js';

export function createBottomNav() {
  const nav = document.createElement('nav');
  nav.className = 'bottom-nav';
  nav.setAttribute('aria-label', 'Main mobile navigation');

  function renderTabs(tabs) {
    nav.innerHTML = tabs
      .map(
        (tab) => `
        <a 
          href="${tab.href}" 
          class="bottom-nav__tab ${tab.active ? 'bottom-nav__tab--active' : ''}" 
          data-tab-id="${tab.id}"
          aria-label="${tab.title}"
        >
          <span class="bottom-nav__icon">${tab.icon}</span>
          <span class="bottom-nav__label">${tab.label}</span>
        </a>
      `
      )
      .join('');
  }

  // Initial render
  renderTabs(getNavTabs());

  // Listen for navigation state updates
  onTabChange((tabs) => renderTabs(tabs));

  // Handle click delegation
  nav.addEventListener('click', (e) => {
    const tabLink = e.target.closest('.bottom-nav__tab');
    if (tabLink) {
      const tabId = tabLink.getAttribute('data-tab-id');
      if (tabId) {
        setActiveTab(tabId);
      }
    }
  });

  return {
    element: nav,
  };
}
