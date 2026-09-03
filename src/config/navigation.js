/**
 * Mobile Tab Navigation Configuration
 * Dedicated 4-feature navigation tabs for the Travel Planner mobile app:
 * 1. Itinerary (Drag-and-Drop Itinerary)
 * 2. Chat (Per-Activity Chat Threads)
 * 3. Assistant (AI Schedule Assistant)
 * 4. Dashboard ("Now & Next" Live Dashboard)
 */

export const navTabs = [
  {
    id: 'itinerary',
    label: 'Itinerary',
    title: 'Drag-and-Drop Itinerary',
    subtitle: 'Interactive schedule & time blocks',
    href: '#itinerary',
    icon: `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
    `,
    active: true,
  },
  {
    id: 'chat',
    label: 'Chat',
    title: 'Per-Activity Chat Threads',
    subtitle: 'Contextual event discussions & wishlist',
    href: '#chat',
    icon: `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    `,
    active: false,
  },
  {
    id: 'assistant',
    label: 'Assistant',
    title: 'AI Schedule Assistant',
    subtitle: 'Dynamic itinerary adjustment & pace tuning',
    href: '#assistant',
    icon: `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
    `,
    active: false,
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    title: '"Now & Next" Live Dashboard',
    subtitle: 'Day-of-trip real-time HUD & 1-tap shifts',
    href: '#dashboard',
    icon: `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
      </svg>
    `,
    active: false,
  },
];

let currentTabs = [...navTabs];
const listeners = new Set();

export function getNavTabs() {
  return [...currentTabs];
}

export function setActiveTab(idOrHref) {
  const normalized = idOrHref ? idOrHref.replace(/^#/, '') : 'itinerary';
  let matched = false;

  currentTabs = currentTabs.map((tab) => {
    const isActive = tab.id === normalized || tab.href === `#${normalized}`;
    if (isActive) matched = true;
    return { ...tab, active: isActive };
  });

  if (!matched && currentTabs.length > 0) {
    currentTabs[0].active = true;
  }

  notifyListeners();
  return getActiveTab();
}

export function getActiveTab() {
  return currentTabs.find((tab) => tab.active) || currentTabs[0];
}

export function onTabChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifyListeners() {
  const tabs = getNavTabs();
  const active = getActiveTab();
  listeners.forEach((fn) => {
    try {
      fn(tabs, active);
    } catch (e) {
      console.error('[Navigation] Error in tab change listener:', e);
    }
  });
}
