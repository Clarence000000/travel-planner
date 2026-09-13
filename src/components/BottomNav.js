/**
 * Mobile Bottom Navigation Component
 * 2-Tab Liquid Glass Navigation with Central Action [+] Button
 * Conforms to .agents/skills/travel-planner-ui Apple iOS 26 liquid glass aesthetic.
 * Left: Itinerary
 * Center: [+] Quick Action (Propose Activity, Import Reel, Add Wishlist Idea)
 * Right: Ideas & Wishlist
 */

import { getBottomNavTabs, onTabChange, setActiveTab, getActiveTab } from '../config/navigation.js';

export function createBottomNav() {
  const navWrapper = document.createElement('div');
  navWrapper.className = 'bottom-nav-container';

  // Quick Action Menu Drawer
  const actionMenu = document.createElement('div');
  actionMenu.className = 'bottom-nav-action-menu';
  actionMenu.id = 'bottom-nav-action-menu';
  actionMenu.innerHTML = `
    <div class="action-menu-scrim" id="action-menu-scrim"></div>
    <div class="action-menu-sheet">
      <div class="action-menu-header">
        <span class="action-menu-title">Create & Import</span>
        <button type="button" class="action-menu-close" id="btn-close-action-menu" aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="action-menu-options">
        <button type="button" class="action-menu-item" id="action-propose-activity">
          <div class="action-menu-icon" style="background: rgba(234, 88, 12, 0.12); color: #EA580C;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div class="action-menu-text">
            <strong>Propose Schedule Activity</strong>
            <span>Jump to itinerary schedule timeline</span>
          </div>
        </button>

        <button type="button" class="action-menu-item" id="action-import-reel">
          <div class="action-menu-icon" style="background: linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(168, 85, 247, 0.15)); color: #D946EF;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </div>
          <div class="action-menu-text">
            <strong>Import from Social Reel</strong>
            <span>Propose Instagram / TikTok recommendation</span>
          </div>
        </button>

        <button type="button" class="action-menu-item" id="action-add-wishlist">
          <div class="action-menu-icon" style="background: rgba(37, 99, 235, 0.12); color: #2563EB;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18h6"></path>
              <path d="M10 22h4"></path>
              <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path>
            </svg>
          </div>
          <div class="action-menu-text">
            <strong>Add to Group Wishlist</strong>
            <span>Candidate spot for group voting & consensus</span>
          </div>
        </button>
      </div>
    </div>
  `;
  navWrapper.appendChild(actionMenu);

  // Main 2-tab Nav element
  const nav = document.createElement('nav');
  nav.className = 'bottom-nav';
  nav.setAttribute('aria-label', 'Main mobile navigation');

  function renderNav() {
    const tabs = getBottomNavTabs();
    const activeTab = getActiveTab();
    const isLiveHud = activeTab && activeTab.id === 'dashboard';

    const itineraryTab = tabs.find((t) => t.id === 'itinerary') || tabs[0];
    const ideasTab = tabs.find((t) => t.id === 'ideas') || tabs[1];

    nav.innerHTML = `
      <!-- Left: Itinerary Tab -->
      <a 
        href="${itineraryTab.href}" 
        class="bottom-nav__tab ${itineraryTab.active ? 'bottom-nav__tab--active' : ''}" 
        data-tab-id="${itineraryTab.id}"
        aria-label="${itineraryTab.title}"
      >
        <span class="bottom-nav__icon">${itineraryTab.icon}</span>
        <span class="bottom-nav__label">${itineraryTab.label}</span>
      </a>

      <!-- Center: Action FAB -->
      <div class="bottom-nav__fab-wrap">
        <button 
          type="button" 
          class="bottom-nav__fab ${isLiveHud ? 'bottom-nav__fab--live-hud' : ''}" 
          id="btn-nav-fab" 
          aria-label="Quick Actions"
          title="Quick Action Menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>

      <!-- Right: Ideas & Wishlist Tab -->
      <a 
        href="${ideasTab.href}" 
        class="bottom-nav__tab ${ideasTab.active ? 'bottom-nav__tab--active' : ''}" 
        data-tab-id="${ideasTab.id}"
        aria-label="${ideasTab.title}"
      >
        <span class="bottom-nav__icon">${ideasTab.icon}</span>
        <span class="bottom-nav__label">${ideasTab.label}</span>
      </a>
    `;
  }

  // Initial render
  renderNav();

  // Listen for navigation state updates
  onTabChange(() => renderNav());

  function toggleActionMenu(show) {
    if (show) {
      actionMenu.classList.add('is-open');
    } else {
      actionMenu.classList.remove('is-open');
    }
  }

  // Delegated click handler
  navWrapper.addEventListener('click', (e) => {
    // Open action menu
    if (e.target.closest('#btn-nav-fab')) {
      toggleActionMenu(!actionMenu.classList.contains('is-open'));
      return;
    }

    // Close action menu
    if (e.target.closest('#btn-close-action-menu') || e.target.closest('#action-menu-scrim')) {
      toggleActionMenu(false);
      return;
    }

    // Tab switches
    const tabLink = e.target.closest('.bottom-nav__tab');
    if (tabLink) {
      const tabId = tabLink.getAttribute('data-tab-id');
      if (tabId) {
        setActiveTab(tabId);
        toggleActionMenu(false);
      }
      return;
    }

    // Action menu items:
    // 1. Propose schedule activity: just take us to itinerary page without popping up modal
    if (e.target.closest('#action-propose-activity')) {
      toggleActionMenu(false);
      const active = getActiveTab();
      if (!active || active.id !== 'itinerary') {
        setActiveTab('itinerary');
      }
      return;
    }

    // 2. Import from Social Reel: opens reel importer to propose an activity (does NOT create another trip!)
    if (e.target.closest('#action-import-reel')) {
      toggleActionMenu(false);
      if (window.TravelApp && typeof window.TravelApp.openReelImporter === 'function') {
        window.TravelApp.openReelImporter();
      }
      return;
    }

    // 3. Add to Wishlist: navigate to Ideas tab and open add idea modal
    if (e.target.closest('#action-add-wishlist')) {
      toggleActionMenu(false);
      const active = getActiveTab();
      if (!active || active.id !== 'ideas') {
        setActiveTab('ideas');
      }
      setTimeout(() => {
        const addIdeaBtn = document.getElementById('btn-open-add-wishlist');
        if (addIdeaBtn) addIdeaBtn.click();
      }, 80);
      return;
    }
  });

  navWrapper.appendChild(nav);
  return {
    element: navWrapper,
  };
}
