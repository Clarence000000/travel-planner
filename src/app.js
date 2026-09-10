import { remoteSync } from './utils/remoteSync.js';
import { showDashToast } from './views/ChatView.js';
import { getItineraryData, addItineraryBlock, updateItineraryBlock } from './models/itineraryData.js';
/**
 * Mobile Travel Planner App
 * Features atmospheric sticky cat photo banner, clean slide-out sidebar,
 * dynamic tab views, multi-trip management portfolio, and 2-tab bottom navigation.
 * Views:
 * - Trips (Portfolio / 0-state landing)
 * - Itinerary (Interactive Timeline with dashed empty rail & ghost slots)
 * - Ideas (Wishlist, Whiteboard & Social Reels)
 * - Dashboard (Now & Next Live HUD)
 * - Chat (Per-Activity Chat Threads)
 * - Assistant (AI Schedule Assistant)
 */

import { createSidebar } from './components/Sidebar.js';
import { createBottomNav } from './components/BottomNav.js';
import { createOnboardingModal } from './components/OnboardingModal.js';
import { createItineraryView } from './views/ItineraryView.js';
import { createChatView } from './views/ChatView.js';
import { createAssistantView } from './views/AssistantView.js';
import { createIdeasView } from './views/IdeasView.js';
import { createDashboardView } from './views/DashboardView.js';
import { createTripsView } from './views/TripsView.js';
import { getActiveTrip, setActiveTripId, getTrips, createTrip } from './models/tripsModel.js';
import { saveTripSettings } from './models/tripSettings.js';
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
    onComplete: (type, survey) => {
      const city = (survey?.destination || 'Tokyo').split(',')[0].trim();
      const newTrip = createTrip({
        title: `${city} Expedition`,
        destination: survey?.destination || 'Tokyo, Japan',
        startDate: survey?.startDate || '2026-10-12',
        endDate: survey?.endDate || '2026-10-14',
        totalDays: survey?.duration || 3,
        coverImage: './src/assets/bg-itinerary.png',
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
      window.location.hash = '#itinerary';
      setActiveTab('itinerary');
      renderView({ id: 'itinerary' });
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
  function renderView(activeTab) {
    const activeTrip = getActiveTrip();
    const currentHash = window.location.hash.replace(/^#/, '');

    // If on #trips view or if there are no active trips at all
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


  // ── Remote Simulation BroadcastChannel Integrations ──
  remoteSync.subscribe('SWITCH_TAB', (payload) => {
    if (payload && payload.tab) {
      setActiveTab(payload.tab);
    }
  });

  remoteSync.subscribe('START_REEL_GENESIS', () => {
    setActiveTab('ideas');
    showDashToast('Act 1: Dynamic Genesis initiated', 'info');
  });

  remoteSync.subscribe('POPULATE_DAY1_ANCHORS', () => {
    setActiveTab('itinerary');
    const items = getItineraryData();
    if (!items.some(i => i.id === 'd1-chew-jetty')) {
      addItineraryBlock({
        id: 'd1-chew-jetty',
        day: 1,
        startTime: '09:00',
        endTime: '11:30',
        title: 'Chew Jetty Clan Waterfront Walk',
        location: 'Weld Quay, George Town',
        category: 'location',
        cost: 'Free',
        status: 'confirmed',
        notes: 'Historic stilt village founded by Chinese immigrants in the 19th century.',
      });
    }
    if (!items.some(i => i.id === 'd1-penang-hill')) {
      addItineraryBlock({
        id: 'd1-penang-hill',
        day: 1,
        startTime: '15:00',
        endTime: '18:00',
        title: 'Penang Hill Funicular & The Habitat',
        location: 'Bukit Bendera, Air Itam',
        category: 'location',
        cost: 'RM 30 / pax',
        status: 'confirmed',
        notes: 'Panoramic views across Penang island and canopy rainforest walk.',
      });
    }
    showDashToast('Day 1 Anchors populated: Chew Jetty & Penang Hill', 'success');
  });

  remoteSync.subscribe('TRIGGER_DAY2_WORKER', () => {
    showDashToast('Act 2: Ambient Background Worker active on Day 2', 'info');
    window.dispatchEvent(new CustomEvent('wandersync:day2_worker', { detail: { active: true } }));
  });

  remoteSync.subscribe('ADD_ENTOPIA_DAY2', () => {
    const items = getItineraryData();
    if (!items.some(i => i.id === 'd2-entopia')) {
      addItineraryBlock({
        id: 'd2-entopia',
        day: 2,
        startTime: '10:00',
        endTime: '12:30',
        title: 'Entopia by Penang Butterfly Farm',
        location: 'Jalan Teluk Bahang',
        category: 'location',
        cost: 'RM 65 / pax',
        status: 'confirmed',
        notes: 'Living sanctuary with over 15,000 free-flying butterflies.',
      });
    }
    showDashToast('Day 2: Entopia Butterfly Sanctuary added in background', 'success');
  });

  remoteSync.subscribe('TRIGGER_CHAT_BANTER', () => {
    setActiveTab('chat');
    showDashToast('Act 3: Incoming banter from Tony & Wei Gang...', 'info');
  });

  remoteSync.subscribe('START_MINI_POLL', () => {
    setActiveTab('chat');
    showDashToast('Act 4: Group Consensus Poll launched', 'info');
  });

  remoteSync.subscribe('TRIGGER_SIAM_ROAD_ADVISORY', () => {
    showDashToast('⚠️ Schedule Conflict Advisory: Siam Road CKT is closed on Mondays!', 'warning');
    window.dispatchEvent(new CustomEvent('wandersync:siam_road_advisory'));
  });

  remoteSync.subscribe('TRIGGER_MONSOON', () => {
    showDashToast('⛈️ Tropical Monsoon Alert: Heavy rain over Penang Island!', 'warning');
    window.dispatchEvent(new CustomEvent('wandersync:monsoon_alert', { detail: { alert: true } }));
  });

  remoteSync.subscribe('CONTINGENCY_1', () => {
    showDashToast('Contingency 1: Switched to Indoor Fallback (The Top Komtar)', 'success');
    window.dispatchEvent(new CustomEvent('wandersync:contingency_1'));
  });

  remoteSync.subscribe('CONTINGENCY_2', () => {
    showDashToast('Contingency 2: Free-Time Pocket inserted at ChinaHouse Cafe', 'success');
    window.dispatchEvent(new CustomEvent('wandersync:contingency_2'));
  });

  remoteSync.subscribe('CONTINGENCY_3', () => {
    showDashToast('Contingency 3: Chronological Reflow applied across Day 1 & Day 2', 'success');
    window.dispatchEvent(new CustomEvent('wandersync:contingency_3'));
  });

  remoteSync.subscribe('RESET_ALL', () => {
    showDashToast('Demo Reset: Slate restored', 'info');
    window.dispatchEvent(new CustomEvent('wandersync:reset_all'));
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
