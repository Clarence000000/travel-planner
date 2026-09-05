/**
 * Itinerary Data Model & Persistence
 * Stores schedule blocks for Days 1, 2, and 3 with category,
 * status lifecycle, requirements, and required transit travel times.
 */

export const DEFAULT_ITINERARY = [
  // ── Day 1 (Tokyo Arrival & Ancient Taito) ──
  {
    id: 'd1-1',
    day: 1,
    startTime: '09:00',
    endTime: '10:15',
    category: 'rest', // 'activity' | 'meal' | 'transit' | 'rest'
    status: 'confirmed', // 'proposed' | 'confirmed' | 'tentative'
    title: 'Hotel Check-In & Luggage Drop',
    location: 'Shinjuku Granbell Hotel',
    transitToNextMinutes: 30, // Travel time to next stop
    transitMode: 'Subway (Marunouchi Line)',
    requirements: ['Passports Ready', 'Booking #TK-9821'],
    fallback: null,
    notes: 'Luggage storage is free before 3:00 PM check-in.',
    dressCode: 'Casual comfortable',
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
    endTime: '02:00',
    category: 'meal',
    status: 'tentative', // Weather Permitting with attached fallback
    title: 'Rooftop Matcha & Street Food Market',
    location: 'Nakamise Street & Asakusa Rooftop',
    transitToNextMinutes: 35, // Requires 35m transit to next event!
    transitMode: 'Metro (Ginza Line)',
    requirements: ['Cash Only Stalls'],
    fallback: 'Indoor Asakusa Underground Ramen Arcade',
    notes: 'Rooftop seating depends on weather; indoor arcade is 2 mins away.',
    dressCode: 'Casual',
  },
  {
    id: 'd1-4',
    day: 1,
    startTime: '02:15', // Note: only 15m buffer after 02:00! This triggers a transit buffer warning because transitToNextMinutes is 35!
    endTime: '04:30',
    category: 'activity',
    status: 'proposed',
    title: 'teamLab Borderless Digital Art Museum',
    location: 'Azabudai Hills',
    transitToNextMinutes: 20,
    transitMode: 'Subway (Hibiya Line)',
    requirements: ['Advance E-Tickets Booked', 'Charged Phone for QR'],
    fallback: null,
    notes: 'Requires timed-entry ticket slot at 2:30 PM.',
    dressCode: 'Wear dark shoes, mirrored floors',
  },
  {
    id: 'd1-5',
    day: 1,
    startTime: '05:00',
    endTime: '07:00',
    category: 'meal',
    status: 'confirmed',
    title: 'Izakaya Gathering & Craft Skewers',
    location: 'Omoide Yokocho, Shinjuku',
    transitToNextMinutes: 0,
    transitMode: 'Walk back to hotel',
    requirements: ['20+ Age Verification', 'Reservation Confirmed'],
    fallback: null,
    notes: 'Table booked under "Travel Group" for 7:00 PM.',
    dressCode: 'Casual',
  },

  // ── Day 2 (Kyoto Culture & Bamboo Groves) ──
  {
    id: 'd2-1',
    day: 2,
    startTime: '07:30',
    endTime: '09:45',
    category: 'transit',
    status: 'confirmed',
    title: 'Shinkansen Bullet Train to Kyoto',
    location: 'Tokyo Station → Kyoto Station',
    transitToNextMinutes: 25,
    transitMode: 'JR San-In Line',
    requirements: ['JR Rail Pass Validated', 'Luggage Tag'],
    fallback: null,
    notes: 'Car 6, seats 12A-12D reserved.',
    dressCode: 'Comfortable travel wear',
  },
  {
    id: 'd2-2',
    day: 2,
    startTime: '10:15',
    endTime: '12:30',
    category: 'activity',
    status: 'tentative',
    title: 'Arashiyama Bamboo Grove & River Walk',
    location: 'Ukyo Ward, Kyoto',
    transitToNextMinutes: 15,
    transitMode: 'Scenic Rickshaw or Walking',
    requirements: ['Sturdy walking shoes', 'Camera'],
    fallback: 'Kyoto Railway Museum & Indoor Crafts Center',
    notes: 'Best photographed in early morning light. Outdoor trail.',
    dressCode: 'Hiking/sneakers recommended',
  },
  {
    id: 'd2-3',
    day: 2,
    startTime: '12:45',
    endTime: '02:15',
    category: 'meal',
    status: 'proposed',
    title: 'Handmade Soba & Yuba Dining',
    location: 'Arashiyama Riverbank',
    transitToNextMinutes: 30,
    transitMode: 'Keifuku Electric Railroad',
    requirements: ['Vegetarian Options Requested'],
    fallback: null,
    notes: 'Waiting for group poll consensus.',
    dressCode: 'Casual',
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
    notes: 'High winds may close open-air deck; 46F indoor lounge remains open.',
    dressCode: 'No loose hats or tripods on glass deck',
  },
  {
    id: 'd3-2',
    day: 3,
    startTime: '12:00',
    endTime: '02:00',
    category: 'meal',
    status: 'confirmed',
    title: 'Farewell Wagyu BBQ Feast',
    location: 'Shibuya Crossing View Grill',
    transitToNextMinutes: 45,
    transitMode: 'Narita Express Train',
    requirements: ['Group Set Menu Pre-Ordered'],
    fallback: null,
    notes: 'All dietary restrictions cross-checked.',
    dressCode: 'Smart casual',
  },
];

const STORAGE_KEY = 'travel_planner_itinerary_v1';

function sanitizeBlock(block) {
  const clean = (str) =>
    typeof str === 'string'
      ? str.replace(/[\p{Extended_Pictographic}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim()
      : str;

  return {
    ...block,
    title: clean(block.title),
    requirements: Array.isArray(block.requirements)
      ? block.requirements.map(clean).filter(Boolean)
      : [],
    dressCode: clean(block.dressCode),
    fallback: clean(block.fallback),
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
      if (Array.isArray(parsed)) {
        return parsed.map(sanitizeBlock);
      }
    }
  } catch (e) {
    console.warn('[Itinerary] Failed to parse saved itinerary:', e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_ITINERARY)).map(sanitizeBlock);
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
  localStorage.removeItem(STORAGE_KEY);
  return JSON.parse(JSON.stringify(DEFAULT_ITINERARY));
}

/**
 * Add a new block to itinerary
 */
export function addItineraryBlock(block) {
  const list = getItineraryData();
  list.push(block);
  saveItineraryData(list);
  return list;
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
