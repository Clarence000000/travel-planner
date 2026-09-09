/**
 * Trip Settings & Appearance Data Model
 * Manages destination, custom date range, total days, trip cover image,
 * and user travel preferences (pace, vibe) persisted in localStorage.
 */

import { getActiveTrip, updateTrip } from './tripsModel.js';

const STORAGE_KEY = 'travel_planner_trip_settings_v1';

export const PRESET_COVERS = [
  {
    id: 'original-cats',
    name: 'Original Cats',
    url: './src/assets/bg-itinerary.png',
    thumb: './src/assets/bg-itinerary.png',
  },
  {
    id: 'tokyo-neon',
    name: 'Tokyo Neon Night',
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'kyoto-bamboo',
    name: 'Kyoto Bamboo Grove',
    url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'fuji-sunrise',
    name: 'Mount Fuji Sunrise',
    url: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=300&q=80',
  },
];

const DEFAULT_SETTINGS = {
  title: 'Tokyo Expedition',
  destination: 'Tokyo & Kyoto, Japan',
  startDate: '2026-10-12',
  endDate: '2026-10-14',
  totalDays: 3,
  coverImage: './src/assets/bg-itinerary.png',
  pace: 'balanced', // 'chill' | 'balanced' | 'turbo'
  vibe: 'food', // 'food' | 'culture' | 'modern' | 'scenic'
};

const listeners = new Set();

/**
 * Calculate the number of days between two YYYY-MM-DD dates inclusive.
 */
export function calculateDaysBetween(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return 3;
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, isNaN(diffDays) ? 3 : diffDays);
}

/**
 * Format date range nicely (e.g. "Oct 12 – 14, 2026 • 3 Days")
 */
export function formatDateRange(startDateStr, endDateStr, totalDays) {
  try {
    const s = new Date(startDateStr);
    const e = new Date(endDateStr);
    const sMonth = s.toLocaleString('default', { month: 'short' });
    const eMonth = e.toLocaleString('default', { month: 'short' });
    const sDay = s.getDate();
    const eDay = e.getDate();
    const year = s.getFullYear();

    const range = sMonth === eMonth
      ? `${sMonth} ${sDay} – ${eDay}, ${year}`
      : `${sMonth} ${sDay} – ${eMonth} ${eDay}, ${year}`;
    return `${range} • ${totalDays} ${totalDays === 1 ? 'Day' : 'Days'}`;
  } catch (err) {
    return `3 Days`;
  }
}

export function getTripSettings() {
  const activeTrip = getActiveTrip();
  if (activeTrip) {
    return {
      ...DEFAULT_SETTINGS,
      title: activeTrip.title || DEFAULT_SETTINGS.title,
      destination: activeTrip.destination || DEFAULT_SETTINGS.destination,
      startDate: activeTrip.startDate || DEFAULT_SETTINGS.startDate,
      endDate: activeTrip.endDate || DEFAULT_SETTINGS.endDate,
      totalDays: activeTrip.totalDays || DEFAULT_SETTINGS.totalDays,
      coverImage: activeTrip.coverImage || DEFAULT_SETTINGS.coverImage,
    };
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      if (!parsed.coverImage || parsed.coverImage === './src/assets/hero-banner.jpg') {
        parsed.coverImage = './src/assets/bg-itinerary.png';
      }
      return parsed;
    }
  } catch (e) {
    console.warn('[TripSettings] Failed to read trip settings:', e);
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveTripSettings(updates) {
  const current = getTripSettings();
  const next = { ...current, ...updates };

  // Recompute totalDays if dates were updated
  if (updates.startDate || updates.endDate) {
    next.totalDays = calculateDaysBetween(next.startDate, next.endDate);
  }

  const activeTrip = getActiveTrip();
  if (activeTrip) {
    updateTrip(activeTrip.id, {
      title: next.title,
      destination: next.destination,
      startDate: next.startDate,
      endDate: next.endDate,
      totalDays: next.totalDays,
      coverImage: next.coverImage,
    });
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (e) {
    console.error('[TripSettings] Error saving settings:', e);
  }

  notifyListeners(next);
  applyCoverToDom(next.coverImage);
  return next;
}

export function updateTripCover(coverUrl) {
  return saveTripSettings({ coverImage: coverUrl });
}

export function onTripSettingsChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifyListeners(settings) {
  listeners.forEach((fn) => {
    try {
      fn(settings);
    } catch (e) {
      console.error('[TripSettings] Listener error:', e);
    }
  });
}

/**
 * Sync cover image across all banner elements currently in the DOM
 */
export function applyCoverToDom(coverUrl) {
  if (!coverUrl) return;
  const banners = document.querySelectorAll('.view-banner, .cat-header__banner');
  banners.forEach((b) => {
    b.style.backgroundImage = `url('${coverUrl}')`;
  });
}
