/**
 * Mobile Travel Planner App
 * Features atmospheric sticky cat photo banner, clean slide-out sidebar,
 * dynamic tab views, and 5-tab bottom navigation.
 * Tab Views:
 * 1. Itinerary (Interactive Timeline)
 * 2. Chat (Per-Activity Chat Threads)
 * 3. Assistant (AI Schedule Assistant)
 * 4. Ideas (Trip Idea Wishlist & Whiteboard)
 * 5. Dashboard (Now & Next Live HUD)
 */

import { createSidebar } from './components/Sidebar.js';
import { createBottomNav } from './components/BottomNav.js';
import { createOnboardingModal } from './components/OnboardingModal.js';
import { createItineraryView } from './views/ItineraryView.js';
import { createChatView } from './views/ChatView.js';
import { createAssistantView } from './views/AssistantView.js';
import { createIdeasView } from './views/IdeasView.js';
import { createDashboardView } from './views/DashboardView.js';
import { onTabChange, setActiveTab, getActiveTab, getNavTabs } from './config/navigation.js';

export function initApp() {
  const root = document.getElementById('app');
  if (!root) {
    console.error('[App] Missing #app root container.');
    return;
  }

  root.innerHTML = '';

  // 1. Root Mobile App Shell
  const appShell = document.createElement('div');
  appShell.className = 'app-shell';

  // 2. Onboarding & Data Import Modal Component
  const onboardingModal = createOnboardingModal({
    onComplete: () => {
      const activeTab = getActiveTab();
      renderView(activeTab);
    },
  });
  appShell.appendChild(onboardingModal.element);

  // 3. Clean Side Menu / Sidebar Drawer Component
  const sidebarComponent = createSidebar({
    onOpenOnboarding: () => {
      onboardingModal.open();
    },
    onSelectTab: (tabId) => {
      setActiveTab(tabId);
    },
  });
  appShell.appendChild(sidebarComponent.element);

  // 4. Main Content Container for Tab Views
  const mainContent = document.createElement('main');
  mainContent.className = 'main-content';
  mainContent.id = 'main-content';
  mainContent.setAttribute('role', 'main');

  // Dynamic View Slot Container
  const viewContainer = document.createElement('div');
  viewContainer.id = 'active-view-container';
  mainContent.appendChild(viewContainer);

  // Nav Spacer to guarantee scrollable content never hides behind fixed bottom nav
  const navSpacer = document.createElement('div');
  navSpacer.className = 'nav-spacer';
  mainContent.appendChild(navSpacer);

  appShell.appendChild(mainContent);

  // Viewport Occlusion Guards (prevents scrolled content from exceeding above the cat photo banner or below the floating bottom nav bar)
  const topGuard = document.createElement('div');
  topGuard.className = 'app-shell__top-guard';
  topGuard.setAttribute('aria-hidden', 'true');
  appShell.appendChild(topGuard);

  const bottomGuard = document.createElement('div');
  bottomGuard.className = 'app-shell__bottom-guard';
  bottomGuard.setAttribute('aria-hidden', 'true');
  appShell.appendChild(bottomGuard);

  // 5. Fixed Bottom Tab Bar
  const bottomNavComponent = createBottomNav();
  appShell.appendChild(bottomNavComponent.element);

  root.appendChild(appShell);

  // Helper to ensure all view banners have the menu button to open sidebar
  function ensureBannerMenuButton() {
    const banner = viewContainer.querySelector('.view-banner');
    if (banner && !banner.querySelector('.view-banner__menu-btn')) {
      const menuBtn = document.createElement('button');
      menuBtn.type = 'button';
      menuBtn.className = 'view-banner__menu-btn';
      menuBtn.id = 'btn-open-sidebar';
      menuBtn.setAttribute('aria-label', 'Open Trip Menu');
      menuBtn.setAttribute('title', 'Open Menu');
      menuBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      `;
      banner.appendChild(menuBtn);
    }
  }

  // Delegated click listener for menu button on cat photo banners
  document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-open-sidebar') || e.target.closest('.view-banner__menu-btn')) {
      sidebarComponent.open();
    }
  });

  // 6. View Switcher Logic
  function renderView(activeTab) {
    appShell.setAttribute('data-active-tab', activeTab.id);
    viewContainer.innerHTML = '';
    let view;

    switch (activeTab.id) {
      case 'itinerary':
        view = createItineraryView();
        break;
      case 'chat':
        view = createChatView();
        break;
      case 'assistant':
        view = createAssistantView();
        break;
      case 'ideas':
        view = createIdeasView();
        break;
      case 'dashboard':
        view = createDashboardView();
        break;
      default:
        view = createItineraryView();
    }

    viewContainer.appendChild(view.element);
    ensureBannerMenuButton();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // Subscribe to tab switches
  onTabChange((tabs, activeTab) => {
    renderView(activeTab);
  });

  // Handle URL hash sync (e.g. #itinerary, #chat, #assistant, #dashboard)
  function syncHash() {
    const hash = window.location.hash.replace(/^#/, '') || 'itinerary';
    setActiveTab(hash);
  }

  window.addEventListener('hashchange', syncHash);

  // Initial render
  syncHash();

  // Expose clean helper API for testing
  window.TravelApp = {
    setActiveTab,
    getActiveTab,
    getNavTabs,
    openOnboarding: () => onboardingModal.open(),
    openSidebar: () => sidebarComponent.open(),
    closeSidebar: () => sidebarComponent.close(),
  };

  // Auto-show onboarding modal on first visit
  if (!localStorage.getItem('travel_planner_onboarded_v1')) {
    setTimeout(() => {
      onboardingModal.open();
    }, 450);
  }

  console.log(
    '%c[App] Travel Planner Mobile App Initialized (Cat Photo Header & Clean Sidebar)',
    'color: #E8621A; font-weight: bold; font-size: 14px;'
  );
}

// Auto-run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
