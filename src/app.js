import { remoteSync } from './utils/remoteSync.js';
import { showDashToast } from './views/ChatView.js';
import { getItineraryData, addItineraryBlock, updateItineraryBlock, resetToGenesisState } from './models/itineraryData.js';
import { resetChatToGenesis, attachPollToThread, addMessageToThread, createChatThread } from './models/chatData.js';
import * as DemoEngine from './config/demoScript.js';
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
      const city = (survey?.destination || 'Penang').split(',')[0].trim();
      const newTrip = createTrip({
        title: `${city} Expedition`,
        destination: survey?.destination || 'Penang, Malaysia',
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
    remoteSync.broadcast('STATUS_ACK', { phase: 'GENESIS_POPULATED', message: 'Day 1 Chew Jetty & Penang Hill anchors locked.' });
  });

  remoteSync.subscribe('INSERT_PROPOSAL', () => {
    const items = getItineraryData();
    if (!items.some(i => i.id === 'd1-chendul')) {
      addItineraryBlock({
        id: 'd1-chendul',
        day: 1,
        startTime: '12:30',
        endTime: '13:30',
        title: 'Penang Road Famous Teochew Chendul & Asam Laksa',
        location: '492, Lebuh Keng Kwee, George Town',
        category: 'food',
        cost: 'RM 12 / pax',
        status: 'proposed',
        notes: 'Iconic shaved ice dessert with pandan jelly, coconut milk, and gula melaka. Michelin Bib Gourmand selected.',
        grabTime: '8 min Grab from Chew Jetty',
        transitToNextMinutes: 25,
        transitMode: 'Transit (25 min) to Penang Hill',
        requirements: [],
      });
    }
    attachPollToThread('day-1-penang', {
      id: 'poll-chendul',
      question: 'Lock Penang Road Famous Teochew Chendul into Day 1 schedule?',
      status: 'active',
      userVote: null,
      options: [
        { id: 'opt-yes', label: 'Yes, lock into schedule', votes: 0 },
        { id: 'opt-no', label: 'Explore other options', votes: 0 },
      ],
    });
    window.dispatchEvent(new CustomEvent('wandersync:proposal_inserted', { detail: { blockId: 'd1-chendul' } }));
    remoteSync.broadcast('STATUS_ACK', { phase: 'PROPOSAL_INSERTED', message: 'Chendul inserted into Day 1 schedule as proposed.' });
    const cur = getActiveTab();
    if (cur === 'itinerary' || cur === 'chat') {
      renderView({ id: cur });
    }
  });

  remoteSync.subscribe('TRIGGER_DAY2_WORKER', () => {
    // Ambient background worker: no presenter-facing toast!
    DemoEngine.startDay2Simulation({ delays: [2000, 5500, 9000] });
    window.dispatchEvent(new CustomEvent('wandersync:day2_activity', { detail: { active: true } }));
    remoteSync.broadcast('STATUS_ACK', { phase: 'DAY2_WORKER_ACTIVE', message: 'Day 2 ambient background simulation running.' });
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
    try {
      createChatThread({
        blockId: 'd2-entopia',
        title: 'Entopia by Penang Butterfly Farm',
        category: 'location',
        day: 2,
        location: 'Jalan Teluk Bahang',
        initialMessage: 'Morning nature walk at Entopia Butterfly Farm booked for 10:00 AM.',
      });
      addMessageToThread('day-2-penang', {
        sender: 'Tony',
        avatar: 'TN',
        isCurrentUser: false,
        text: 'Added Entopia by Penang Butterfly Farm to Day 2 for 10:00 AM! 🦋',
      });
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('wandersync:day2_activity', { detail: { active: true } }));
    remoteSync.broadcast('STATUS_ACK', { phase: 'ENTOPIA_ADDED', message: 'Entopia added to Day 2.' });
  });

  remoteSync.subscribe('DAY2_ACTIVITY', (payload) => {
    window.dispatchEvent(new CustomEvent('wandersync:day2_activity', { detail: payload }));
  });

  remoteSync.subscribe('TRIGGER_CHAT_BANTER', () => {
    setActiveTab('chat');
    remoteSync.broadcast('STATUS_ACK', { phase: 'CHAT_BANTER_STARTED', message: 'Chat banter active in Day 1 thread.' });
  });

  remoteSync.subscribe('VOTE_CONSENSUS', (payload) => {
    setActiveTab('chat');
    window.dispatchEvent(new CustomEvent('wandersync:vote_consensus', { detail: payload }));
    remoteSync.broadcast('STATUS_ACK', { phase: 'VOTING_ACTIVE', message: 'Consensus voting sequence running.' });
  });

  remoteSync.subscribe('START_MINI_POLL', () => {
    setActiveTab('chat');
    remoteSync.broadcast('STATUS_ACK', { phase: 'POLL_ACTIVE', message: 'Consensus poll active.' });
  });

  remoteSync.subscribe('TRIGGER_SIAM_ROAD_ADVISORY', () => {
    window.dispatchEvent(new CustomEvent('wandersync:siam_road_advisory'));
    remoteSync.broadcast('STATUS_ACK', { phase: 'ADVISORY_ACTIVE', message: 'Siam Road Monday closure advisory active.' });
  });

  remoteSync.subscribe('TRIGGER_MONSOON', () => {
    window.dispatchEvent(new CustomEvent('wandersync:monsoon_alert', { detail: { alert: true } }));
    remoteSync.broadcast('STATUS_ACK', { phase: 'MONSOON_ACTIVE', message: 'Tropical monsoon alert active on Penang Hill.' });
  });

  remoteSync.subscribe('CONTINGENCY_1', () => {
    window.dispatchEvent(new CustomEvent('wandersync:contingency_1'));
    remoteSync.broadcast('STATUS_ACK', { phase: 'CONTINGENCY_1_APPLIED', message: 'Swapped to Indoor Fallback (The Top Komtar).' });
  });

  remoteSync.subscribe('CONTINGENCY_2', () => {
    window.dispatchEvent(new CustomEvent('wandersync:contingency_2'));
    remoteSync.broadcast('STATUS_ACK', { phase: 'CONTINGENCY_2_APPLIED', message: 'Free-time pocket inserted at ChinaHouse Cafe.' });
  });

  remoteSync.subscribe('CONTINGENCY_3', () => {
    window.dispatchEvent(new CustomEvent('wandersync:contingency_3'));
    remoteSync.broadcast('STATUS_ACK', { phase: 'CONTINGENCY_3_APPLIED', message: 'Chronological reflow applied.' });
  });

  remoteSync.subscribe('RESET_ALL', () => {
    DemoEngine.resetSimulation();
    resetToGenesisState();
    resetChatToGenesis();
    window.dispatchEvent(new CustomEvent('wandersync:reset_all'));
    remoteSync.broadcast('RESET_COMPLETE', { success: true, message: 'All demo state restored to Genesis zero-state.' });
    const cur = getActiveTab();
    if (cur === 'itinerary' || cur === 'chat') {
      renderView({ id: cur });
    }
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
