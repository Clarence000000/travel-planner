/**
 * Itinerary Data Model & Persistence
 * Stores schedule blocks for dynamic days with category,
 * status lifecycle, requirements, required transit travel times,
 * and day-of contingency cancellation & reflow logic.
 */

import { timeToMinutes, minutesTo24, recalculateDaySchedule } from '../utils/bufferEngine.js';
import { getTripSettings, saveTripSettings } from './tripSettings.js';
import { getActiveTripId } from './tripsModel.js';

export const SAMPLE_ITINERARY = [
  // ── Day 1 (Tokyo Arrival & Ancient Taito) ──
  {
    id: 'd1-1',
    day: 1,
    startTime: '09:00',
    endTime: '10:15',
    category: 'rest', // 'activity' | 'meal' | 'transit' | 'rest'
    status: 'confirmed', // 'proposed' | 'confirmed' | 'tentative' | 'cancelled'
    title: 'Hotel Check-In & Luggage Drop',
    location: 'Shinjuku Granbell Hotel',
    transitToNextMinutes: 30, // Travel time to next stop
    transitMode: 'Subway (Marunouchi Line)',
    requirements: ['Passports Ready', 'Booking #TK-9821'],
    fallback: null,
    notes: 'Luggage storage is free before 3:00 PM check-in.',
    dressCode: null,
  },
  {
    id: 'd1-2',
    day: 1,
    startTime: '10:45',
    endTime: '12:30',
    category: 'activity',
    status: 'confirmed',
    title: 'Senso-ji Temple & Traditional Street Walk',
    location: 'Asakusa, Taito City',
    transitToNextMinutes: 10,
    transitMode: 'Walking (5 mins)',
    requirements: ['Temple Walking Shoes', 'Coins for Incense'],
    fallback: 'Edo-Tokyo Museum & Asakusa Underground Arcade',
    fallbackReason: 'weather',
    notes: 'Incense smoke cleansing at Jokoro burner is customary.',
    dressCode: 'Shoulders covered inside main hall',
    source: 'reel',
    reelUrl: 'https://www.instagram.com/reel/C8x9Y2zK_tokyo_eats',
    rating: 4.8,
  },
  {
    id: 'd1-3',
    day: 1,
    startTime: '12:40',
    endTime: '14:00',
    category: 'meal',
    status: 'confirmed',
    title: 'Asakusa Kagetsudo Melonpan & Street Bento',
    location: 'Nakamise Shopping Street',
    transitToNextMinutes: 45,
    transitMode: 'Ginza Line + Chuo-Sobu Line',
    requirements: ['Cash Only (\u00a51,000 notes)', 'Napkins'],
    fallback: 'Asakusa Underground Food Court',
    fallbackReason: 'crowd',
    notes: 'Famous fluffy jumbo melonpan. Eat in designated courtyard.',
    dressCode: null,
  },
  {
    id: 'd1-4',
    day: 1,
    startTime: '14:45',
    endTime: '16:45',
    category: 'activity',
    status: 'confirmed',
    title: 'Akihabara Electric Town Retro Tech Crawl',
    location: 'Soto-Kanda, Chiyoda City',
    transitToNextMinutes: 30,
    transitMode: 'JR Yamanote Line to Shinjuku',
    requirements: ['Duty-Free Passport', 'Comfortable sneakers'],
    fallback: 'Radio Kaikan Multi-Floor Arcade',
    fallbackReason: 'weather',
    notes: 'Mandai & Super Potato for vintage gaming finds.',
    dressCode: null,
  },
  {
    id: 'd1-5',
    day: 1,
    startTime: '17:15',
    endTime: '18:45',
    category: 'meal',
    status: 'proposed',
    title: 'Omoide Yokocho Yakitori Alley',
    location: 'Memory Lane, Shinjuku',
    transitToNextMinutes: 20,
    transitMode: 'Walk through Kabukicho',
    requirements: ['Small Group Table (max 4)', 'Cash Ready'],
    fallback: 'Shinjuku Lumine 1 Food Hall',
    fallbackReason: 'crowd',
    notes: 'Charcoal grilled skewers in narrow atmospheric alleyways.',
    dressCode: null,
  },
  {
    id: 'd1-6',
    day: 1,
    startTime: '19:05',
    endTime: '20:30',
    category: 'activity',
    status: 'proposed',
    title: 'Tokyo Metropolitan Govt Building Observatory',
    location: 'Nishi-Shinjuku',
    transitToNextMinutes: 15,
    transitMode: 'Walking back to hotel',
    requirements: ['Security Bag Check'],
    fallback: null,
    notes: 'Free 202-meter high night panorama over Shinjuku lights.',
    dressCode: null,
  },

  // ── Day 2 (Ancient Kyoto Day Trip) ──
  {
    id: 'd2-1',
    day: 2,
    startTime: '07:30',
    endTime: '09:45',
    category: 'transit',
    status: 'confirmed',
    title: 'Nozomi Shinkansen Bullet Train to Kyoto',
    location: 'Tokyo Station Platform 14 to Kyoto',
    transitToNextMinutes: 20,
    transitMode: 'JR San-in Line to Saga-Arashiyama',
    requirements: ['SmartEX QR Tickets', 'Bento Breakfast Box'],
    fallback: null,
    notes: 'Seat 8E booked for Mt. Fuji view on the right side.',
    dressCode: null,
  },
  {
    id: 'd2-2',
    day: 2,
    startTime: '10:05',
    endTime: '12:15',
    category: 'activity',
    status: 'tentative',
    title: 'Arashiyama Bamboo Grove & River Walk',
    location: 'Ukyo Ward, Kyoto',
    transitToNextMinutes: 15,
    transitMode: 'Scenic Rickshaw or Walking',
    requirements: ['Comfortable walking shoes', 'Camera'],
    fallback: 'Kyoto Railway Museum & Indoor Crafts Center',
    fallbackReason: 'weather',
    notes: 'Best photographed in morning light. Outdoor trail.',
    dressCode: null,
  },
  {
    id: 'd2-3',
    day: 2,
    startTime: '12:45',
    endTime: '14:15',
    category: 'meal',
    status: 'proposed',
    title: 'Handmade Soba & Yuba Dining',
    location: 'Arashiyama Riverbank',
    transitToNextMinutes: 30,
    transitMode: 'Keifuku Electric Railroad',
    requirements: ['Vegetarian Options Requested'],
    fallback: null,
    notes: 'Waiting for group poll consensus.',
    dressCode: null,
  },

  // ── Day 3 (Modern Vibes & Departure) ──
  {
    id: 'd3-1',
    day: 3,
    startTime: '09:30',
    endTime: '11:30',
    category: 'activity',
    status: 'confirmed',
    title: 'Shibuya Sky Observatory Deck',
    location: 'Shibuya Scramble Square',
    transitToNextMinutes: 20,
    transitMode: 'Walk across crossing',
    requirements: ['Morning Pass 10:00 AM', 'Hat Clips on Rooftop'],
    fallback: 'Shibuya Parco Indoor Shopping & Nintendo Center',
    fallbackReason: 'weather',
    notes: 'High winds may close open-air deck; 46F indoor lounge remains open.',
    dressCode: 'No loose hats, scarves, or tripods on glass deck',
  },
  {
    id: 'd3-2',
    day: 3,
    startTime: '12:00',
    endTime: '14:00',
    category: 'meal',
    status: 'confirmed',
    title: 'Farewell Wagyu BBQ Feast',
    location: 'Shibuya Crossing View Grill',
    transitToNextMinutes: 45,
    transitMode: 'Narita Express Train',
    requirements: ['Group Set Menu Pre-Ordered'],
    fallback: null,
    notes: 'All dietary restrictions cross-checked.',
    dressCode: null,
  },
];

export const DEFAULT_ITINERARY = SAMPLE_ITINERARY;

const STORAGE_KEY = 'travel_planner_itinerary_v3';

function getStorageKey() {
  const tripId = getActiveTripId();
  return tripId ? `travel_planner_itinerary_${tripId}` : STORAGE_KEY;
}

const itineraryListeners = new Set();

export function onItineraryChange(callback) {
  itineraryListeners.add(callback);
  return () => itineraryListeners.delete(callback);
}

function notifyItineraryListeners(items) {
  itineraryListeners.forEach((fn) => {
    try {
      fn(items);
    } catch (e) {
      console.error('[Itinerary] listener error:', e);
    }
  });
}

function sanitizeBlock(block) {
  const clean = (str) =>
    typeof str === 'string'
      ? str.replace(/[\p{Extended_Pictographic}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim()
      : str;

  // Deduplicate and clean requirements
  const rawReqs = Array.isArray(block.requirements)
    ? block.requirements.map(clean).filter(Boolean)
    : [];
  const uniqueReqs = Array.from(new Set(rawReqs));

  // Normalize times to consistent 24h "HH:MM" format
  const startMins = timeToMinutes(block.startTime);
  const endMins = timeToMinutes(block.endTime);

  return {
    ...block,
    startTime: minutesTo24(startMins),
    endTime: minutesTo24(endMins),
    title: clean(block.title),
    requirements: uniqueReqs,
    dressCode: block.dressCode ? clean(block.dressCode) : null,
    fallback: block.fallback ? clean(block.fallback) : null,
    fallbackReason: block.fallbackReason || 'general',
    notes: clean(block.notes),
  };
}

/**
 * Load itinerary data (clean slate default: returns [] unless saved)
 */
export function getItineraryData() {
  try {
    const key = getStorageKey();
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map(sanitizeBlock);
      }
    }
  } catch (e) {
    console.warn('[Itinerary] Failed to parse saved itinerary:', e);
  }
  return [];
}

/**
 * Save itinerary data to localStorage
 */
export function saveItineraryData(items) {
  try {
    const key = getStorageKey();
    localStorage.setItem(key, JSON.stringify(items));
  } catch (e) {
    console.error('[Itinerary] Error saving to storage:', e);
  }
  notifyItineraryListeners(items);
}

/**
 * Reset itinerary data back to clean empty slate
 */
export function clearItineraryData() {
  saveItineraryData([]);
  return [];
}

/**
 * Load sample itinerary data (for explicit demo / reference)
 */
export function resetItineraryData() {
  const defaults = JSON.parse(JSON.stringify(SAMPLE_ITINERARY)).map(sanitizeBlock);
  saveItineraryData(defaults);
  return defaults;
}

/**
 * Add a new block to itinerary
 */
export function addItineraryBlock(block) {
  const list = getItineraryData();
  list.push(sanitizeBlock(block));
  saveItineraryData(list);
  return list;
}

/**
 * Update an existing block in itinerary
 */
export function updateItineraryBlock(updatedBlock) {
  let list = getItineraryData();
  const sanitized = sanitizeBlock(updatedBlock);
  list = list.map((b) => (b.id === sanitized.id ? { ...b, ...sanitized } : b));
  saveItineraryData(list);
  return list;
}

/**
 * Delete a block directly (Planning phase action)
 */
export function deleteItineraryBlock(blockId) {
  let list = getItineraryData();
  list = list.filter((b) => b.id !== blockId);
  saveItineraryData(list);
  return list;
}

/**
 * Day-of Event Cancellation with dual resolution:
 * 1. 'free-time': Keep block on timeline with strikethrough styling as free time / relax pocket.
 * 2. 'reflow': Remove block and recalculate schedule chronologically for subsequent events.
 */
export function cancelItineraryBlock(blockId, mode = 'free-time') {
  let list = getItineraryData();
  const target = list.find((b) => b.id === blockId);
  if (!target) return list;

  if (mode === 'free-time') {
    list = list.map((b) => {
      if (b.id === blockId) {
        return {
          ...b,
          status: 'cancelled',
          title: `Free Time / Relax Pocket`,
          notes: `Slot held open after cancellation of: ${b.title}. Keeping future reservations intact.`,
          fallback: null,
          requirements: [],
        };
      }
      return b;
    });
    saveItineraryData(list);
    return list;
  } else if (mode === 'reflow') {
    const dayNumber = target.day;
    // Remove the target block
    list = list.filter((b) => b.id !== blockId);
    // Recalculate schedule for remaining blocks on that day
    const dayBlocks = list.filter((b) => b.day === dayNumber);
    const otherDays = list.filter((b) => b.day !== dayNumber);
    const recomputed = recalculateDaySchedule(dayBlocks);
    list = [...otherDays, ...recomputed];
    saveItineraryData(list);
    return list;
  }
  return list;
}

/**
 * Get all available trip day numbers dynamically.
 */
export function getItineraryDayList() {
  const items = getItineraryData();
  const settings = getTripSettings();
  const maxDayFromItems = items.reduce((max, b) => Math.max(max, b.day || 1), 1);
  const targetDays = Math.max(settings.totalDays || 3, maxDayFromItems);

  const days = [];
  for (let d = 1; d <= targetDays; d++) {
    days.push(d);
  }
  return days;
}

/**
 * Add a new day to the trip
 */
export function addItineraryDay() {
  const settings = getTripSettings();
  const nextTotal = (settings.totalDays || 3) + 1;
  saveTripSettings({ totalDays: nextTotal });
  return nextTotal;
}

/**
 * Remove an empty day from the trip
 */
export function removeItineraryDay(dayNumber) {
  let list = getItineraryData();
  // Remove any blocks on this day
  list = list.filter((b) => b.day !== dayNumber);
  // Re-index remaining days higher than dayNumber
  list = list.map((b) => {
    if (b.day > dayNumber) {
      return { ...b, day: b.day - 1 };
    }
    return b;
  });
  saveItineraryData(list);

  const settings = getTripSettings();
  const nextTotal = Math.max(1, (settings.totalDays || 3) - 1);
  saveTripSettings({ totalDays: nextTotal });
  return nextTotal;
}

/**
 * Apply automated AI schedule reshuffle
 */
export function applyReshuffle(strategy = 'rain-delay') {
  let list = getItineraryData();

  if (strategy === 'rain-delay') {
    // Swap outdoor bamboo grove on Day 2 with indoor museum fallback
    list = list.map((b) => {
      if (b.id === 'd2-2') {
        return {
          ...b,
          title: b.fallback || 'Kyoto Railway Museum & Crafts',
          category: 'activity',
          status: 'confirmed',
          notes: 'Swapped to indoor venue due to forecasted rain.',
          fallback: null,
        };
      }
      return b;
    });
    saveItineraryData(list);
  }
  return list;
}
