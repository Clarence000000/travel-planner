/**
 * Mobile Travel Planner App
 * Orchestrates sticky header, dynamic tab views, and 5-tab bottom navigation.
 * Tab Views:
 * 1. Itinerary (Interactive Timeline)
 * 2. Chat (Per-Activity Chat Threads)
 * 3. Assistant (AI Schedule Assistant)
 * 4. Ideas (Trip Idea Wishlist & Whiteboard)
 * 5. Dashboard (Now & Next Live HUD)
 */

import { createHeader } from './components/Header.js';
import { createBottomNav } from './components/BottomNav.js';
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

  // 2. Sticky Top Header
  const headerComponent = createHeader();
  appShell.appendChild(headerComponent.element);

  // 3. Main Content Container for Tab Views
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

  // 4. Fixed Bottom Tab Bar
  const bottomNavComponent = createBottomNav();
  appShell.appendChild(bottomNavComponent.element);

  root.appendChild(appShell);

  // 5. View Switcher Logic
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
  };

  console.log(
    '%c[App] Travel Planner Mobile App Initialized',
    'color: #E8621A; font-weight: bold; font-size: 14px;'
  );
}

// Auto-run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
