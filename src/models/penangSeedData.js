/**
 * Authentic Penang Seed Catalog & Itinerary Blocks
 * Provides authentic Penang venue data, schedule blocks, fallbacks,
 * requirements, and transit parameters for the WanderSync Penang Demo.
 */

export const PENANG_CHEW_JETTY = {
  id: 'penang-chew-jetty',
  day: 1,
  startTime: '09:30',
  endTime: '11:00',
  category: 'activity',
  status: 'confirmed',
  title: 'Clan Jetties (Chew Jetty) Morning Heritage Walk',
  location: 'Weld Quay, George Town, Penang',
  transitToNextMinutes: 12,
  transitMode: 'GrabCar (12 mins)',
  requirements: ['Morning Sunscreen', 'Cash for Stalls'],
  fallback: null,
  fallbackReason: null,
  dressCode: 'Light cotton shirt, walking sandals',
  notes: 'Historic waterfront wooden stilt houses built by Chinese clans in the 19th century.',
  source: 'reel',
  reelUrl: 'https://www.instagram.com/reel/C8x9_penang_heritage',
  rating: 4.7,
};

export const PENANG_HILL_CANOPY = {
  id: 'penang-hill-canopy',
  day: 1,
  startTime: '16:30',
  endTime: '19:00',
  category: 'activity',
  status: 'confirmed',
  title: 'Penang Hill Funicular & The Habitat Sunset Canopy Walk',
  location: 'Penang Hill, Bukit Bendera',
  transitToNextMinutes: 20,
  transitMode: 'GrabCar (20 mins)',
  requirements: ['Funicular Fast Lane Ticket', 'Light Jacket'],
  fallback: 'The Top Komtar Indoor Theme Park & Glass Rainbow Skywalk',
  fallbackReason: 'weather',
  dressCode: 'Comfortable walking shoes, light jacket for evening breeze',
  notes: 'Iconic funicular railway to 833m summit and Curtis Crest treetop canopy walk.',
  source: 'reel',
  reelUrl: 'https://www.instagram.com/reel/C8x9_penang_heritage',
  rating: 4.8,
};

export const PENANG_CHENDUL_GAP = {
  id: 'penang-chendul-gap',
  day: 1,
  startTime: '12:30',
  endTime: '13:45',
  category: 'meal',
  status: 'proposed',
  title: 'Penang Road Famous Teochew Chendul & Asam Laksa',
  location: 'Lebuh Keng Kwee, George Town',
  transitToNextMinutes: 25,
  transitMode: 'GrabCar (25 mins)',
  requirements: ['Cash Only (RM5 notes)', 'Tissues'],
  fallback: 'ChinaHouse Heritage Cafe & Bakery',
  fallbackReason: 'crowd',
  dressCode: null,
  notes: 'Legendary shaved ice with pandan jelly, gula melaka, and spicy sour mackerel asam laksa.',
  rating: 4.9,
};

export const PENANG_SIAM_ROAD_CKT = {
  id: 'penang-siam-road-ckt',
  day: 1,
  startTime: '19:30',
  endTime: '21:00',
  category: 'meal',
  status: 'confirmed',
  title: 'Siam Road Char Koay Teow',
  location: 'Jalan Siam, George Town',
  transitToNextMinutes: 15,
  transitMode: 'GrabCar (15 mins)',
  requirements: ['Cash Only', 'Patience for Queue'],
  fallback: 'Gurney Drive Hawker Centre',
  fallbackReason: 'closed',
  dressCode: null,
  notes: 'Charcoal-fired wok hei flat rice noodles with duck egg and Chinese sausage.',
  advisory: {
    text: 'Siam Road Char Koay Teow is closed on Mondays. Consider swapping with Day 3.',
    targetDay: 3,
  },
  rating: 4.9,
};

export const PENANG_FALLBACKS = {
  komtar: {
    id: 'penang-fallback-komtar',
    title: 'The Top Komtar Indoor Theme Park & Glass Rainbow Skywalk',
    location: '1, Jalan Penang, George Town',
    category: 'activity',
    status: 'confirmed',
    notes: 'Indoor air-conditioned observatory, 68F glass rainbow skywalk, and boutique cafes unaffected by tropical downpours.',
    requirements: ['Top Komtar Pass', 'Indoor Footwear'],
    rating: 4.6,
  },
  chinahouse: {
    id: 'penang-fallback-chinahouse',
    title: 'ChinaHouse Heritage Cafe & Bakery',
    location: '183B Beach St, George Town',
    category: 'meal',
    status: 'confirmed',
    notes: 'Longest compound cafe in Penang featuring 30+ artisan cakes, specialty cold brew, and shaded courtyards.',
    requirements: ['No reservation needed for afternoon tea'],
    rating: 4.7,
  },
};

export const PENANG_DAY2_ENTHOPIA = {
  id: 'penang-d2-entopia',
  day: 2,
  startTime: '09:30',
  endTime: '12:00',
  category: 'activity',
  status: 'confirmed',
  title: 'Entopia by Penang Butterfly Farm',
  location: 'Teluk Bahang, Penang',
  transitToNextMinutes: 10,
  transitMode: 'GrabCar (10 mins)',
  requirements: ['Mobile E-Ticket', 'Insect Repellent'],
  fallback: null,
  fallbackReason: null,
  dressCode: 'Light breathable clothes',
  notes: 'Massive tropical sanctuary with 15,000 free-flying butterflies and living nature exhibits.',
  rating: 4.7,
};

export const PENANG_DAY2_ESCAPE = {
  id: 'penang-d2-escape',
  day: 2,
  startTime: '13:00',
  endTime: '17:30',
  category: 'activity',
  status: 'confirmed',
  title: 'Escape Adventure Park & Gravityplay',
  location: 'Teluk Bahang, Penang',
  transitToNextMinutes: 20,
  transitMode: 'GrabCar (20 mins)',
  requirements: ['Sports Attire', 'Change of Clothes', 'Locker Fee RM10'],
  fallback: 'Batu Ferringhi Craft Complex',
  fallbackReason: 'weather',
  dressCode: 'Athletic wear, water shoes or trainers',
  notes: 'Guinness World Record holder for longest tube water slide and outdoor zipline obstacle courses.',
  rating: 4.8,
};

export const PENANG_DAY2_BORABORA = {
  id: 'penang-d2-borabora',
  day: 2,
  startTime: '18:30',
  endTime: '21:00',
  category: 'meal',
  status: 'proposed',
  title: 'Sunset Drinks at Bora Bora Batu Ferringhi',
  location: 'Batu Ferringhi Beach',
  transitToNextMinutes: 25,
  transitMode: 'GrabCar (25 mins)',
  requirements: ['Sunset Table Booking', 'Casual Beachwear'],
  fallback: 'Ferringhi Garden Restaurant',
  fallbackReason: null,
  dressCode: 'Casual beachwear, sandals',
  notes: 'Beachfront alfresco dining with live acoustic vibes, sunset cocktails, and sea breeze.',
  rating: 4.6,
};

export const PENANG_DAY3_ARMENIAN = {
  id: 'penang-d3-armenian',
  day: 3,
  startTime: '09:30',
  endTime: '12:00',
  category: 'activity',
  status: 'confirmed',
  title: 'Armenian Street & Street Art Bicycle Tour',
  location: 'Lebuh Armenian, George Town',
  transitToNextMinutes: 15,
  transitMode: 'Bicycle / Walk (15 mins)',
  requirements: ['Rental Bike Pass', 'Sun Hat'],
  fallback: 'Penang Peranakan Mansion',
  fallbackReason: null,
  dressCode: 'Casual walking shoes, sunglasses',
  notes: 'Ernest Zacharevic murals (Kids on Bicycle), vintage shophouses, and artisan coffee stops.',
  rating: 4.8,
};

export const PENANG_DAY3_SIAM_ROAD = {
  id: 'penang-d3-siam-road',
  day: 3,
  startTime: '12:30',
  endTime: '14:00',
  category: 'meal',
  status: 'confirmed',
  title: 'Siam Road Char Koay Teow (Rescheduled)',
  location: 'Jalan Siam, George Town',
  transitToNextMinutes: 20,
  transitMode: 'GrabCar (20 mins)',
  requirements: ['Cash Only', 'Patience for Queue'],
  fallback: null,
  fallbackReason: null,
  dressCode: null,
  notes: 'Charcoal-fired wok hei flat rice noodles with duck egg and Chinese sausage (open Wed-Sun).',
  rating: 4.9,
};

export const PENANG_DAY3_GURNEY = {
  id: 'penang-d3-gurney',
  day: 3,
  startTime: '18:00',
  endTime: '20:30',
  category: 'meal',
  status: 'confirmed',
  title: 'Gurney Drive Hawker Night Feast',
  location: 'Gurney Drive, George Town',
  transitToNextMinutes: 30,
  transitMode: 'GrabCar (30 mins)',
  requirements: ['Cash for Stalls', 'Hand Sanitizer'],
  fallback: 'Gurney Plaza Food Hall',
  fallbackReason: 'weather',
  dressCode: null,
  notes: 'Penang laksa, rojak, oyster omelette, and pasembur along the seafront promenade.',
  rating: 4.7,
};

// Convenient collections
export const PENANG_DAY1_ANCHORS = [
  PENANG_CHEW_JETTY,
  PENANG_HILL_CANOPY,
];

export const PENANG_DAY2_BLOCKS = [
  PENANG_DAY2_ENTHOPIA,
  PENANG_DAY2_ESCAPE,
  PENANG_DAY2_BORABORA,
];

export const PENANG_DAY3_BLOCKS = [
  PENANG_DAY3_ARMENIAN,
  PENANG_DAY3_SIAM_ROAD,
  PENANG_DAY3_GURNEY,
];

export const PENANG_FULL_SAMPLE_ITINERARY = [
  PENANG_CHEW_JETTY,
  PENANG_CHENDUL_GAP,
  PENANG_HILL_CANOPY,
  PENANG_SIAM_ROAD_CKT,
  PENANG_DAY2_ENTHOPIA,
  PENANG_DAY2_ESCAPE,
  PENANG_DAY2_BORABORA,
  PENANG_DAY3_ARMENIAN,
  PENANG_DAY3_SIAM_ROAD,
  PENANG_DAY3_GURNEY,
];

// Immutable helper clones
export function getPenangDay1Sparse() {
  return JSON.parse(JSON.stringify(PENANG_DAY1_ANCHORS));
}

export function getPenangProposalBlock() {
  return JSON.parse(JSON.stringify(PENANG_CHENDUL_GAP));
}

export function getPenangDay2Blocks() {
  return JSON.parse(JSON.stringify(PENANG_DAY2_BLOCKS));
}

export function getPenangDay3Blocks() {
  return JSON.parse(JSON.stringify(PENANG_DAY3_BLOCKS));
}

export function getPenangFallback(key = 'komtar') {
  const item = PENANG_FALLBACKS[key] || PENANG_FALLBACKS.komtar;
  return JSON.parse(JSON.stringify(item));
}

export function getPenangSeedData() {
  return JSON.parse(JSON.stringify(PENANG_FULL_SAMPLE_ITINERARY));
}
