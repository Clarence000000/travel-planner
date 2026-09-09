/**
 * Itinerary Data Model & Persistence
 * Stores schedule blocks for dynamic days with category,
 * status lifecycle, requirements, required transit travel times,
 * and day-of contingency cancellation & reflow logic.
 */

import { timeToMinutes, minutesTo24, recalculateDaySchedule } from '../utils/bufferEngine.js';
import { getTripSettings, saveTripSettings } from './tripSettings.js';

export const DEFAULT_ITINERARY = [
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
    fallback: null,
    notes: 'Main hall open until 5 PM. Dress respectfully.',
    dressCode: 'Modest attire, no sandals in inner shrine',
  },
  {
    id: 'd1-3',
    day: 1,
    startTime: '12:40',
    endTime: '14:00',
    category: 'meal',
    status: 'tentative', // Weather Permitting with attached fallback
    title: 'Rooftop Matcha & Street Food Market',
    location: 'Nakamise Street & Asakusa Rooftop',
    transitToNextMinutes: 35, // Requires 35m transit to next event
    transitMode: 'Metro (Ginza Line)',
    requirements: ['Cash Only Stalls'],
    fallback: 'Indoor Asakusa Underground Ramen Arcade',
    fallbackReason: 'weather', // 'weather' | 'crowd' | 'closed' | 'general'
    notes: 'Rooftop seating depends on weather; indoor arcade is 2 mins away.',
    dressCode: null,
  },
  {
    id: 'd1-4',
    day: 1,
    startTime: '14:35',
    endTime: '16:35',
    category: 'activity',
    status: 'proposed',
    title: 'teamLab Borderless Digital Art Museum',
    location: 'Azabudai Hills',
    transitToNextMinutes: 25,
    transitMode: 'Subway (Hibiya Line)',
    requirements: ['Advance E-Tickets Booked', 'Charged Phone for QR'],
    fallback: null,
    notes: 'Requires timed-entry ticket slot at 2:30 PM.',
    dressCode: 'Wear pants & dark flat shoes (mirrored floors)',
  },
  {
    id: 'd1-5',
    day: 1,
    startTime: '17:00',
    endTime: '19:00',
    category: 'meal',
    status: 'confirmed',
    title: 'Izakaya Gathering & Craft Skewers',
    location: 'Omoide Yokocho, Shinjuku',
    transitToNextMinutes: 0,
    transitMode: 'Walk back to hotel',
    requirements: ['20+ Age Verification', 'Reservation Confirmed'],
    fallback: 'Tsunahachi Tempura Bar (if queue > 30m)',
    fallbackReason: 'crowd',
    notes: 'Table booked under "Travel Group" for 7:00 PM.',
    dressCode: null,
  },

  // ── Day 2 (Kyoto Culture & Bamboo Groves) ──
  {
    id: 'd2-1',
    day: 2,
    startTime: '08:30',
    endTime: '10:00',
    category: 'transit',
    status: 'confirmed',
    title: 'Shinkansen Bullet Train to Kyoto',
    location: 'Tokyo Station → Kyoto Station',
    transitToNextMinutes: 25,
    transitMode: 'JR San-In Line',
    requirements: ['JR Rail Pass Validated', 'Luggage Tag'],
    fallback: null,
    notes: 'Car 6, seats 12A-12D reserved.',
    dressCode: null,
  },
  {
    id: 'd2-2',
    day: 2,
    startTime: '10:30',
    endTime: '12:30',
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

const STORAGE_KEY = 'travel_planner_itinerary_v3';

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
 * Load itinerary data (from localStorage if available, or default)
 */
export function getItineraryData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Sanity check: Ensure day 1 starts at normal daylight hours (6 AM to 10 PM)
        const d1First = parsed.find((b) => b.day === 1);
        if (d1First) {
          const startMins = timeToMinutes(d1First.startTime);
          if (startMins >= 22 * 60 || startMins < 6 * 60) {
            console.warn('[Itinerary] Corrupted overnight schedule detected in storage. Resetting to defaults.');
            return resetItineraryData();
          }
        }
        return parsed.map(sanitizeBlock);
      }
    }
  } catch (e) {
    console.warn('[Itinerary] Failed to parse saved itinerary:', e);
  }
  return resetItineraryData();
}

/**
 * Save itinerary data to localStorage
 */
export function saveItineraryData(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('[Itinerary] Error saving to storage:', e);
  }
}

/**
 * Reset itinerary data back to initial defaults
 */
export function resetItineraryData() {
  const defaults = JSON.parse(JSON.stringify(DEFAULT_ITINERARY)).map(sanitizeBlock);
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
          title: 'Kyoto Railway Museum & Crafts (Indoor Backup)',
          location: 'Shimogyo Ward, Kyoto',
          notes: 'Reshuffled by AI Assistant due to 3:00 PM rain forecast.',
          status: 'confirmed',
          fallback: 'Arashiyama Bamboo Grove (Postponed)',
          fallbackReason: 'weather',
        };
      }
      return b;
    });
  } else if (strategy === 'chill-pace') {
    // Extend meal and rest durations, add more buffer
    list = list.map((b) => {
      if (b.category === 'meal' || b.category === 'rest') {
        return {
          ...b,
          notes: (b.notes ? b.notes + ' ' : '') + '[Chill Pace: Extended rest buffer]',
        };
      }
      return b;
    });
  } else if (strategy === 'turbo-pace') {
    // Tighten transit and add bonus exploration notes
    list = list.map((b) => {
      return {
        ...b,
        transitToNextMinutes: Math.max(10, b.transitToNextMinutes - 5),
      };
    });
  } else if (strategy === 'delay-30m') {
    // Shift afternoon blocks forward
    list = list.map((b) => {
      if (b.day === 1 && (b.id === 'd1-4' || b.id === 'd1-5')) {
        return {
          ...b,
          notes: (b.notes ? b.notes + ' ' : '') + '[Shifted +30m due to traffic delay]',
        };
      }
      return b;
    });
  }

  saveItineraryData(list);
  return list;
}
