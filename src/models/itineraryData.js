/**
 * Itinerary Data Model & Persistence
 * Stores schedule blocks for dynamic days with category,
 * status lifecycle, requirements, required transit travel times,
 * and day-of contingency cancellation & reflow logic.
 *
 * Supports Tokyo default data and Penang Malaysia interactive demo dataset.
 */

import { timeToMinutes, minutesTo24, recalculateDaySchedule } from '../utils/bufferEngine.js';
import { getTripSettings, saveTripSettings } from './tripSettings.js';
import { getActiveTripId } from './tripsModel.js';
import {
  PENANG_CHEW_JETTY,
  PENANG_HILL_CANOPY,
  PENANG_CHENDUL_GAP,
  PENANG_SIAM_ROAD_CKT,
  PENANG_FALLBACKS,
  PENANG_DAY2_BLOCKS,
  PENANG_DAY3_BLOCKS,
  PENANG_FULL_SAMPLE_ITINERARY,
  getPenangDay1Sparse,
  getPenangProposalBlock,
  getPenangDay2Blocks,
  getPenangDay3Blocks,
  getPenangFallback,
  getPenangSeedData,
} from './penangSeedData.js';

export {
  PENANG_CHEW_JETTY,
  PENANG_HILL_CANOPY,
  PENANG_CHENDUL_GAP,
  PENANG_SIAM_ROAD_CKT,
  PENANG_FALLBACKS,
  PENANG_DAY2_BLOCKS,
  PENANG_DAY3_BLOCKS,
  PENANG_FULL_SAMPLE_ITINERARY,
  getPenangDay1Sparse,
  getPenangProposalBlock,
  getPenangDay2Blocks,
  getPenangDay3Blocks,
  getPenangFallback,
  getPenangSeedData,
};

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
    requirements: ['Cash Only (¥1,000 notes)', 'Napkins'],
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

export function sanitizeBlock(block) {
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
    advisory: block.advisory ? { ...block.advisory } : null,
  };
}

/**
 * Check whether the active trip is configured for Penang, Malaysia
 */
export function isPenangTrip() {
  try {
    const settings = getTripSettings();
    return Boolean(
      settings &&
      typeof settings.destination === 'string' &&
      /penang/i.test(settings.destination)
    );
  } catch (e) {
    return false;
  }
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
 * Load sample itinerary data (switches between Penang and Tokyo depending on destination)
 */
export function resetItineraryData() {
  const isPenang = isPenangTrip();
  const source = isPenang ? PENANG_FULL_SAMPLE_ITINERARY : SAMPLE_ITINERARY;
  const defaults = JSON.parse(JSON.stringify(source)).map(sanitizeBlock);
  saveItineraryData(defaults);
  return defaults;
}

/**
 * Explicitly reset itinerary to Penang full 3-day reference
 */
export function resetPenangItineraryData() {
  const defaults = JSON.parse(JSON.stringify(PENANG_FULL_SAMPLE_ITINERARY)).map(sanitizeBlock);
  saveItineraryData(defaults);
  return defaults;
}

/**
 * Initialize Penang Sparse Day 1:
 * Clears current blocks and seeds Day 1 with strictly Chew Jetty and Penang Hill,
 * leaving Day 2 and Day 3 empty and ready for background simulation.
 * Configures 3-day date range (Oct 12 – Oct 14, 2026).
 */
export function initPenangSparseDay1(options = {}) {
  saveTripSettings({
    title: 'Penang Heritage & Nature Expedition',
    destination: 'Penang, Malaysia',
    startDate: '2026-10-12',
    endDate: '2026-10-14',
    totalDays: 3,
  });

  const blocks = [
    { ...PENANG_CHEW_JETTY },
    { ...PENANG_HILL_CANOPY },
  ];

  if (options.includeAdvisory) {
    blocks.push({ ...PENANG_SIAM_ROAD_CKT });
  }

  const sanitized = blocks.map(sanitizeBlock);
  sanitized.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  saveItineraryData(sanitized);
  return sanitized;
}

/**
 * Helper to add Siam Road Char Koay Teow with its closure advisory to Day 1
 */
export function resetToGenesisState() {
  const tripId = getActiveTripId();
  if (tripId) {
    try {
      localStorage.removeItem(`travel_planner_itinerary_${tripId}`);
    } catch (e) {}
  }
  return initPenangSparseDay1();
}

export function addSiamRoadAdvisoryBlock() {
  return addOrUpdateBlock({ ...PENANG_SIAM_ROAD_CKT, day: 1 });
}

/**
 * Add or update a block in the itinerary.
 * If a block with the same id exists, updates it. Otherwise appends it.
 * Re-sorts the affected day chronologically.
 */
export function addOrUpdateBlock(block) {
  if (!block || !block.id) return getItineraryData();
  const sanitized = sanitizeBlock(block);
  let list = getItineraryData();
  const index = list.findIndex((b) => b.id === sanitized.id);

  if (index >= 0) {
    list[index] = { ...list[index], ...sanitized };
  } else {
    list.push(sanitized);
  }

  list.sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });

  saveItineraryData(list);
  return list;
}

/**
 * Add a new block to itinerary
 */
export function addItineraryBlock(block) {
  return addOrUpdateBlock(block);
}

/**
 * Update an existing block in itinerary
 */
export function updateItineraryBlock(updatedBlock) {
  return addOrUpdateBlock(updatedBlock);
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
 * Shift a block from its current day to targetDay and recalculate schedules.
 * Clears/resolves schedule conflict advisories when relocated to appropriate day.
 */
export function shiftBlockToDay(blockId, targetDay) {
  let list = getItineraryData();
  const targetDayNum = Number(targetDay) || 1;
  const index = list.findIndex(
    (b) => b.id === blockId || (blockId.includes('siam') && b.id.includes('siam'))
  );
  if (index === -1) return list;

  const originalBlock = list[index];
  const origDay = originalBlock.day;

  const shiftedBlock = {
    ...originalBlock,
    day: targetDayNum,
    advisory: null, // Clear Monday advisory since moved to Day 3 (Wednesday)
  };

  // Adjust timing or title if shifting Siam Road CKT to Day 3 lunch
  if (shiftedBlock.id.includes('siam') || shiftedBlock.title.includes('Siam Road')) {
    shiftedBlock.title = 'Siam Road Char Koay Teow (Rescheduled)';
    if (targetDayNum === 3) {
      shiftedBlock.startTime = '12:30';
      shiftedBlock.endTime = '14:00';
    }
  }

  list[index] = sanitizeBlock(shiftedBlock);

  // Re-sort affected days
  const sourceBlocks = list.filter((b) => b.day === origDay);
  sourceBlocks.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const targetBlocks = list.filter((b) => b.day === targetDayNum);
  targetBlocks.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const otherBlocks = list.filter((b) => b.day !== origDay && b.day !== targetDayNum);
  list = [...otherBlocks, ...sourceBlocks, ...targetBlocks];

  saveItineraryData(list);
  return list;
}

/**
 * Confirm a proposed block:
 * Flips status from 'proposed' to 'confirmed' and recalculates buffers.
 */
export function confirmProposedBlock(blockId) {
  let list = getItineraryData();
  const index = list.findIndex(
    (b) =>
      b.id === blockId ||
      (blockId.includes('chendul') && b.id.includes('chendul')) ||
      (blockId === 'd1-gap-meal' && b.id.includes('chendul'))
  );
  if (index === -1) return list;

  const target = list[index];
  list[index] = {
    ...target,
    status: 'confirmed',
  };

  saveItineraryData(list);
  return list;
}

/**
 * Resolve contingency disruption for a block (Penang 3-way contingency support)
 * Modes:
 * - 'fallback': Swaps block to designated indoor fallback (e.g. The Top Komtar)
 * - 'freetime': Converts slot to relaxed cafe window (ChinaHouse Heritage Cafe)
 * - 'reflow': Cancels block and pulls downstream events forward
 */
export function resolveContingencyBlock(blockId, mode = 'fallback') {
  let list = getItineraryData();
  const targetIndex = list.findIndex(
    (b) => b.id === blockId || (blockId.includes('hill') && b.id.includes('hill'))
  );
  if (targetIndex === -1) return list;

  const target = list[targetIndex];

  if (mode === 'fallback') {
    const fallbackData = PENANG_FALLBACKS.komtar;
    list[targetIndex] = sanitizeBlock({
      ...target,
      id: fallbackData.id,
      title: fallbackData.title,
      location: fallbackData.location,
      notes: fallbackData.notes,
      requirements: fallbackData.requirements,
      fallback: null,
      fallbackReason: null,
      contingencyResolved: true,
      contingencyMode: 'fallback',
    });
  } else if (mode === 'freetime') {
    const chinaHouse = PENANG_FALLBACKS.chinahouse;
    list[targetIndex] = sanitizeBlock({
      ...target,
      status: 'confirmed',
      title: `Free-Time Pocket: ${chinaHouse.title}`,
      location: chinaHouse.location,
      notes: `Held as relaxed indoor cafe window at ChinaHouse. ${chinaHouse.notes}`,
      requirements: chinaHouse.requirements,
      fallback: null,
      contingencyResolved: true,
      contingencyMode: 'freetime',
    });
  } else if (mode === 'reflow') {
    return cancelItineraryBlock(target.id, 'reflow');
  }

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
    list = list.filter((b) => b.id !== blockId);
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
  list = list.filter((b) => b.day !== dayNumber);
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
    list = list.map((b) => {
      if (b.id === 'd2-2' || b.id === 'penang-hill-canopy') {
        const fb = b.fallback || 'The Top Komtar Indoor Theme Park & Glass Rainbow Skywalk';
        return {
          ...b,
          title: fb,
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
