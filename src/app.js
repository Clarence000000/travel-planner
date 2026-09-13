/**
 * Mobile Travel Planner App
 * Features atmospheric sticky cat photo banner, clean slide-out sidebar,
 * dynamic tab views, multi-trip management portfolio, and bottom navigation.
 */

import { createSidebar } from './components/Sidebar.js';
import { createBottomNav } from './components/BottomNav.js';
import { createOnboardingModal } from './components/OnboardingModal.js';
import { createImportReelModal } from './components/itinerary/ImportReelModal.js';
import { createItineraryView } from './views/ItineraryView.js';
import { createChatView, showDashToast } from './views/ChatView.js';
import { createAssistantView } from './views/AssistantView.js';
import { createIdeasView } from './views/IdeasView.js';
import { createTripsView } from './views/TripsView.js';
import { getActiveTrip, setActiveTripId, createTrip } from './models/tripsModel.js';
import { saveTripSettings } from './models/tripSettings.js';
import { onTabChange, setActiveTab, getActiveTab, getNavTabs } from './config/navigation.js';
import { initSimulationBridge } from './core/SimulationBridge.js';

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
    onComplete: (type, survey, activeTrip) => {
      if (!activeTrip) {
        const city = (survey?.destination || 'Penang').split(',')[0].trim();
        const newTrip = createTrip({
          title: `${city} Expedition`,
          destination: survey?.destination || 'Penang, Malaysia',
          startDate: survey?.startDate || '2026-10-12',
          endDate: survey?.endDate || '2026-10-14',
          totalDays: survey?.duration || 3,
          coverImage: 'https://image-tc.galaxy.tf/wijpeg-9j3ux7drhby0iny1evej1e38j/sunset-at-penang-bridge.jpg?width=1920',
          members: ['Clarence', 'Tony', 'Wei Gang'],
        });
        setActiveTripId(newTrip.id);
        saveTripSettings({
          title: newTrip.title,
          destination: newTrip.destination,
          startDate: newTrip.startDate,
          endDate: newTrip.endDate,
          totalDays: newTrip.totalDays,
          coverImage: newTrip.coverImage,
        });
      }
      window.location.hash = '#itinerary';
      setActiveTab('itinerary');
      renderView({ id: 'itinerary' });
    },
  });
  appShell.appendChild(onboardingModal.element);

  // 2b. Social Reel Importer Modal (Proposes activity to current trip without creating another trip)
  const importReelModal = createImportReelModal();
  appShell.appendChild(importReelModal.element);

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

  const viewContainer = document.createElement('div');
  viewContainer.id = 'active-view-container';
  mainContent.appendChild(viewContainer);

  const navSpacer = document.createElement('div');
  navSpacer.className = 'nav-spacer';
  mainContent.appendChild(navSpacer);

  appShell.appendChild(mainContent);

  // Viewport Occlusion Guards
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
  let currentViewInstance = null;

  function renderView(activeTab) {
    if (currentViewInstance && typeof currentViewInstance.destroy === 'function') {
      try {
        currentViewInstance.destroy();
      } catch (e) {
        console.error('[App] Error destroying previous view:', e);
      }
      currentViewInstance = null;
    }
    const activeTrip = getActiveTrip();
    const currentHash = window.location.hash.replace(/^#/, '');

    if (currentHash === 'trips' || !activeTrip) {
      appShell.classList.add('app-shell--in-trips-view');
      appShell.setAttribute('data-active-tab', 'trips');
      viewContainer.innerHTML = '';
      const tripsView = createTripsView({
        onSelectTrip: (trip) => {
          setActiveTripId(trip.id);
          appShell.classList.remove('app-shell--in-trips-view');
          window.location.hash = '#itinerary';
          setActiveTab('itinerary');
        },
        onOpenOnboarding: () => {
          onboardingModal.open();
        },
      });
      viewContainer.appendChild(tripsView.element);
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }

    appShell.classList.remove('app-shell--in-trips-view');
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
        view = createItineraryView();
        break;
      default:
        view = createItineraryView();
    }

    currentViewInstance = view;
    viewContainer.appendChild(view.element);
    ensureBannerMenuButton();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // Subscribe to tab switches
  onTabChange((tabs, activeTab) => {
    renderView(activeTab);
  });

  // Handle URL hash sync
  function syncHash() {
    const hash = window.location.hash.replace(/^#/, '');
    if (hash === 'trips' || !getActiveTrip()) {
      renderView({ id: 'trips' });
    } else {
      setActiveTab(hash || 'itinerary');
    }
  }

  window.addEventListener('hashchange', syncHash);

  // Initial render
  syncHash();

  // 7. Remote Simulation BroadcastChannel Integrations (Decoupled Bridge)
  initSimulationBridge({
    onRefreshActiveView: (curTab) => {
      if (curTab === 'itinerary' || curTab === 'chat') {
        renderView({ id: curTab });
      }
    },
    showToast: showDashToast,
  });

  // Expose clean helper API for testing and remote simulation
  window.TravelApp = {
    setActiveTab,
    getActiveTab,
    getNavTabs,
    openTrips: () => {
      window.location.hash = '#trips';
      renderView({ id: 'trips' });
    },
    openTrip: (tripId) => {
      setActiveTripId(tripId);
      window.location.hash = '#itinerary';
      setActiveTab('itinerary');
    },
    openOnboarding: () => onboardingModal.open(),
    openReelImporter: () => importReelModal.open(),
    openSidebar: () => sidebarComponent.open(),
    closeSidebar: () => sidebarComponent.close(),
    sidebar: sidebarComponent,
  };

  console.log(
    '%c[App] Travel Planner Initialized (Clean Slate 0-State Architecture)',
    'color: #E8621A; font-weight: bold; font-size: 14px;'
  );
}

// Auto-run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
