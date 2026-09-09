/**
 * Mobile Tab Navigation Configuration
 * Clean consolidated navigation with 2 primary tabs:
 * 1. Itinerary (Interactive Schedule & Timeline)
 * 2. Ideas (Trip Wishlist, Whiteboard & Social Reels)
 * Secondary destinations (Live Day HUD, Chat Threads, Assistant Copilot)
 * are accessible via the Sidebar, Header launchers, and contextual drawers.
 */

export const navTabs = [
  {
    id: 'itinerary',
    label: 'Itinerary',
    title: 'Trip Itinerary',
    subtitle: 'Interactive schedule & timeline',
    href: '#itinerary',
    isPrimary: true,
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
    id: 'ideas',
    label: 'Ideas & Wishlist',
    title: 'Trip Ideas & Wishlist',
    subtitle: 'Collaborative wishlist & reels',
    href: '#ideas',
    isPrimary: true,
    icon: `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 18h6"></path>
        <path d="M10 22h4"></path>
        <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path>
      </svg>
    `,
    active: false,
  },
  {
    id: 'dashboard',
    label: 'Live Day HUD',
    title: 'Day-of-Trip HUD',
    subtitle: 'Live execution mode & QR pass',
    href: '#dashboard',
    isPrimary: false,
    icon: `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
      </svg>
    `,
    active: false,
  },
  {
    id: 'chat',
    label: 'Discussions',
    title: 'Activity Threads',
    subtitle: 'Contextual group chats & mini-polls',
    href: '#chat',
    isPrimary: false,
    icon: `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    `,
    active: false,
  },
  {
    id: 'assistant',
    label: 'AI Copilot',
    title: 'Trip Preferences & AI Copilot',
    subtitle: 'Pacing tuning & weather reshuffle',
    href: '#assistant',
    isPrimary: false,
    icon: `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
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

export function getBottomNavTabs() {
  return currentTabs.filter((t) => t.isPrimary);
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

  const activeTab = currentTabs.find((tab) => tab.active) || currentTabs[0];

  // Sync hash in browser without jump
  if (window.location.hash !== `#${activeTab.id}`) {
    history.replaceState(null, '', `#${activeTab.id}`);
  }

  notifyListeners(currentTabs, activeTab);
}

export function getActiveTab() {
  return currentTabs.find((tab) => tab.active) || currentTabs[0];
}

export function onTabChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifyListeners(tabs, activeTab) {
  listeners.forEach((fn) => {
    try {
      fn(tabs, activeTab);
    } catch (e) {
      console.error('[Navigation] Tab listener callback error:', e);
    }
  });
}
