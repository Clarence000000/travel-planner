/**
 * Chat Data Model & State Store
 * Manages Categorised Activity Chat Threads and Native Mini-Polls
 * anchored to specific Itinerary Blocks and trip categories (Food, Location, Hotel, Transit, General).
 */

import { getItineraryData } from './itineraryData.js';

const STORAGE_KEY = 'travel_planner_chat_v4';
const PREV_STORAGE_KEY = 'travel_planner_chat_v3';

export const THREAD_CATEGORIES = [
  {
    id: 'food',
    label: 'Food',
    name: 'Food & Dining',
    description: 'Eateries, street markets, izakayas, and food consensus',
    color: '#D97706',
    bg: '#FEF3C7',
    border: '#FDE68A',
    iconSvg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>`,
  },
  {
    id: 'location',
    label: 'Location',
    name: 'Locations & Sights',
    description: 'Temples, viewpoints, walking tours, and cultural attractions',
    color: '#2D6A2E',
    bg: '#DCFCE7',
    border: '#BBF7D0',
    iconSvg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
  },
  {
    id: 'hotel',
    label: 'Hotel',
    name: 'Hotel & Stay',
    description: 'Accommodations, check-in, keycards, and luggage drop-off',
    color: '#4F46E5',
    bg: '#EEF2FF',
    border: '#C7D2FE',
    iconSvg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
  },
  {
    id: 'transit',
    label: 'Transit',
    name: 'Transit & Travel',
    description: 'Bullet trains, subway lines, connections, and airport transfers',
    color: '#0284C7',
    bg: '#E0F2FE',
    border: '#BAE6FD',
    iconSvg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="16" rx="2"></rect><path d="M4 11h16"></path><path d="M12 3v8"></path><path d="m8 19-2 3"></path><path d="m16 19 2 3"></path></svg>`,
  },
  {
    id: 'general',
    label: 'General',
    name: 'General & Planning',
    description: 'Trip-wide discussions, packing lists, and group coordination',
    color: '#E8621A',
    bg: '#FFF3EB',
    border: '#FFD8C2',
    iconSvg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
  },
];

export function normalizeCategory(cat) {
  if (!cat) return 'general';
  const c = String(cat).toLowerCase().trim();
  if (c === 'meal' || c === 'food' || c === 'dining' || c === 'restaurant' || c === 'eat') return 'food';
  if (c === 'activity' || c === 'location' || c === 'sightseeing' || c === 'sight' || c === 'attraction' || c === 'place') return 'location';
  if (c === 'rest' || c === 'hotel' || c === 'stay' || c === 'accommodation' || c === 'lodging') return 'hotel';
  if (c === 'transit' || c === 'travel' || c === 'transport' || c === 'train' || c === 'flight') return 'transit';
  if (c === 'general' || c === 'planning' || c === 'misc') return 'general';
  return 'general';
}

export function getCategoryConfig(categoryId) {
  const norm = normalizeCategory(categoryId);
  return THREAD_CATEGORIES.find((c) => c.id === norm) || THREAD_CATEGORIES[4];
}

const INITIAL_THREADS = [
  // ── 1. Food & Dining ──
  {
    blockId: 'd1-3',
    title: 'Rooftop Matcha & Food Market',
    eventTitle: 'Rooftop Matcha & Street Food Market',
    category: 'food',
    location: 'Nakamise Street & Asakusa Rooftop',
    participantCount: 4,
    poll: {
      id: 'poll-d1-3',
      question: 'Which lunch spot should we lock in for the group?',
      options: [
        { id: 'opt-soba', label: 'Traditional Soba Noodles', votes: 4 },
        { id: 'opt-seafood', label: 'Tsukiji Fresh Seafood Bowl', votes: 2 },
      ],
      userVote: 'opt-soba',
    },
    messages: [
      {
        id: 'm1',
        sender: 'Wei Gang',
        avatar: 'WG',
        text: 'The handmade soba place has vegan and gluten-friendly options which fits everyone!',
        time: '10:14 AM',
        isCurrentUser: false,
      },
      {
        id: 'm2',
        sender: 'Clarence (You)',
        avatar: 'CL',
        text: "Agreed! Let's vote Option A so the schedule auto-updates the reservation time.",
        time: '10:16 AM',
        isCurrentUser: true,
      },
      {
        id: 'm3',
        sender: 'Kenji M.',
        avatar: 'KM',
        text: 'Rooftop seats have a stunning view of the temple pagoda too. Perfect for sunny weather.',
        time: '10:20 AM',
        isCurrentUser: false,
      },
    ],
  },
  {
    blockId: 'd1-5',
    title: 'Izakaya Gathering & Craft Skewers',
    eventTitle: 'Izakaya Gathering & Craft Skewers',
    category: 'food',
    location: 'Omoide Yokocho, Shinjuku',
    participantCount: 4,
    poll: null,
    messages: [
      {
        id: 'm-iz1',
        sender: 'Wei Gang',
        avatar: 'WG',
        text: 'Reservation is confirmed for 7:00 PM under Clarence! They have a 2-hour dining limit.',
        time: '04:15 PM',
        isCurrentUser: false,
      },
      {
        id: 'm-iz2',
        sender: 'Clarence (You)',
        avatar: 'CL',
        text: 'Perfect. We should definitely order the charcoal-grilled tsukune with raw egg yolk dip.',
        time: '04:20 PM',
        isCurrentUser: true,
      },
      {
        id: 'm-iz3',
        sender: 'Sakura K.',
        avatar: 'SK',
        text: 'Do they have vegetarian yakitori skewers like shiitake and shishito peppers?',
        time: '04:25 PM',
        isCurrentUser: false,
      },
      {
        id: 'm-iz4',
        sender: 'Wei Gang',
        avatar: 'WG',
        text: 'Yes, full vegetable kushiyaki menu available!',
        time: '04:28 PM',
        isCurrentUser: false,
      },
    ],
  },

  // ── 2. Locations & Sights ──
  {
    blockId: 'd1-2',
    title: 'Senso-ji Temple Walk',
    eventTitle: 'Senso-ji Temple & Traditional Street Walk',
    category: 'location',
    location: 'Asakusa, Taito City',
    participantCount: 4,
    poll: null,
    messages: [
      {
        id: 'm201',
        sender: 'Wei Gang',
        avatar: 'WG',
        text: 'Remember to carry 100-yen coins for fortune omikuji sticks!',
        time: '09:40 AM',
        isCurrentUser: false,
      },
      {
        id: 'm202',
        sender: 'Clarence (You)',
        avatar: 'CL',
        text: 'Got cash ready! Meet at the Kaminarimon Thunder Gate entrance at 10:40 AM.',
        time: '09:45 AM',
        isCurrentUser: true,
      },
    ],
  },
  {
    blockId: 'd1-4',
    title: 'teamLab Borderless',
    eventTitle: 'teamLab Borderless Digital Art Museum',
    category: 'location',
    location: 'Azabudai Hills',
    participantCount: 4,
    poll: {
      id: 'poll-d1-4',
      question: 'Which gallery section should we explore first?',
      options: [
        { id: 'opt-crystal', label: 'Infinite Crystal World', votes: 3 },
        { id: 'opt-forest', label: 'Forest of Resonating Lamps', votes: 1 },
      ],
      userVote: 'opt-crystal',
    },
    messages: [
      {
        id: 'm301',
        sender: 'Wei Gang',
        avatar: 'WG',
        text: 'Heads up: floors are mirrored in the crystal room, avoid skirts or wear shorts underneath!',
        time: '11:05 AM',
        isCurrentUser: false,
      },
      {
        id: 'm302',
        sender: 'Clarence (You)',
        avatar: 'CL',
        text: 'Good catch! Added to the slot requirements list.',
        time: '11:12 AM',
        isCurrentUser: true,
      },
    ],
  },
  {
    blockId: 'd2-2',
    title: 'Arashiyama Bamboo Grove',
    eventTitle: 'Arashiyama Bamboo Grove & River Walk',
    category: 'location',
    location: 'Ukyo Ward, Kyoto',
    participantCount: 4,
    poll: null,
    messages: [
      {
        id: 'm401',
        sender: 'Kenji M.',
        avatar: 'KM',
        text: 'Weather radar shows possible light rain in the afternoon. Let the schedule optimizer prep the indoor backup.',
        time: '08:15 AM',
        isCurrentUser: false,
      },
    ],
  },

  // ── 3. Hotel & Stay ──
  {
    blockId: 'd1-1',
    title: 'Shinjuku Granbell Hotel Check-In',
    eventTitle: 'Hotel Check-In & Luggage Drop',
    category: 'hotel',
    location: 'Shinjuku Granbell Hotel',
    participantCount: 4,
    poll: null,
    messages: [
      {
        id: 'm-h1',
        sender: 'Wei Gang',
        avatar: 'WG',
        text: 'Front desk confirmed we can store our large suitcases free of charge before the 3:00 PM check-in.',
        time: '08:15 AM',
        isCurrentUser: false,
      },
      {
        id: 'm-h2',
        sender: 'Clarence (You)',
        avatar: 'CL',
        text: 'Booking ref is TK-9821. Have your passports ready for quick scanning at the front kiosk.',
        time: '08:20 AM',
        isCurrentUser: true,
      },
      {
        id: 'm-h3',
        sender: 'Ren T.',
        avatar: 'RT',
        text: 'Got it! Did we request twin beds or double for room 402?',
        time: '08:22 AM',
        isCurrentUser: false,
      },
      {
        id: 'm-h4',
        sender: 'Clarence (You)',
        avatar: 'CL',
        text: 'Twin beds confirmed for both rooms. Keycards will be ready by afternoon!',
        time: '08:25 AM',
        isCurrentUser: true,
      },
    ],
  },

  // ── 4. Transit & Travel ──
  {
    blockId: 'd2-1',
    title: 'Shinkansen Bullet Train to Kyoto',
    eventTitle: 'Shinkansen Bullet Train to Kyoto',
    category: 'transit',
    location: 'Tokyo Station → Kyoto Station',
    participantCount: 4,
    poll: {
      id: 'poll-d2-1',
      question: 'Which Shinkansen bento box should we grab at Tokyo Station?',
      options: [
        { id: 'opt-ekiben-beef', label: 'Yonezawa Wagyu Bento', votes: 3 },
        { id: 'opt-ekiben-sushi', label: 'Edo-style Nigiri Bento', votes: 2 },
      ],
      userVote: 'opt-ekiben-beef',
    },
    messages: [
      {
        id: 'm-t1',
        sender: 'Wei Gang',
        avatar: 'WG',
        text: 'JR Rail Passes are all validated! We are in Car 6, reserved seats 12A through 12D.',
        time: '07:05 AM',
        isCurrentUser: false,
      },
      {
        id: 'm-t2',
        sender: 'Clarence (You)',
        avatar: 'CL',
        text: 'Seats D & E get the Mt. Fuji view on the right side ~45 minutes after leaving Tokyo!',
        time: '07:10 AM',
        isCurrentUser: true,
      },
      {
        id: 'm-t3',
        sender: 'Kenji M.',
        avatar: 'KM',
        text: 'Huge ekiben shop right outside the Shinkansen gates. Grabbing lunch boxes now.',
        time: '07:14 AM',
        isCurrentUser: false,
      },
    ],
  },

  // ── 5. General & Planning ──
  {
    blockId: 'general',
    title: 'General Trip Discussion',
    eventTitle: 'Group Discussion & Logistics',
    category: 'general',
    location: 'Tokyo & Kyoto 2026',
    participantCount: 4,
    poll: null,
    messages: [
      {
        id: 'm501',
        sender: 'Wei Gang',
        avatar: 'WG',
        text: 'Welcome everyone to Tokyo! Check the Itinerary tab for Day 1 blocks.',
        time: '08:30 AM',
        isCurrentUser: false,
      },
      {
        id: 'm502',
        sender: 'Clarence (You)',
        avatar: 'CL',
        text: 'Make sure your mobile Suica/Pasmo cards are topped up on Apple Wallet or Google Pay.',
        time: '08:35 AM',
        isCurrentUser: true,
      },
      {
        id: 'm503',
        sender: 'Sakura K.',
        avatar: 'SK',
        text: 'Pocket Wi-Fi picked up from Haneda Terminal 3. Connection is super fast!',
        time: '08:40 AM',
        isCurrentUser: false,
      },
    ],
  },
];

export function getChatThreads() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(PREV_STORAGE_KEY);
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const normalized = parsed.map((t) => ({
          ...t,
          category: normalizeCategory(t.category),
        }));

        // Ensure key starter threads exist for each category
        INITIAL_THREADS.forEach((init) => {
          if (!normalized.some((t) => t.blockId === init.blockId)) {
            normalized.push(init);
          }
        });

        return normalized;
      }
    }
  } catch (e) {
    console.warn('[Chat] Failed to load chat data:', e);
  }
  return JSON.parse(JSON.stringify(INITIAL_THREADS));
}

export function saveChatThreads(threads) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  } catch (e) {
    console.error('[Chat] Failed to save chat threads:', e);
  }
}

export function getThreadById(blockId) {
  const threads = getChatThreads();
  const thread = threads.find((t) => t.blockId === blockId);
  if (thread) return thread;

  // Resolve metadata directly from itinerary schedule blocks if available
  try {
    const allBlocks = getItineraryData();
    const itineraryBlock = allBlocks.find((b) => b.id === blockId);
    if (itineraryBlock) {
      return {
        blockId,
        title: itineraryBlock.title,
        eventTitle: itineraryBlock.title,
        category: normalizeCategory(itineraryBlock.category),
        location: itineraryBlock.location || 'Tokyo & Kyoto',
        participantCount: 4,
        poll: null,
        messages: [],
      };
    }
  } catch (e) {
    // Non-blocking fallback
  }

  return null;
}

export function addMessageToThread(blockId, text, metadata = {}) {
  const threads = getChatThreads();
  let thread = threads.find((t) => t.blockId === blockId);

  if (!thread) {
    // Dynamically populate metadata from itinerary block or passed metadata
    let itineraryBlock = null;
    try {
      const allBlocks = getItineraryData();
      itineraryBlock = allBlocks.find((b) => b.id === blockId);
    } catch (e) {}

    const title = metadata.title || (itineraryBlock ? itineraryBlock.title : `Discussion (${blockId})`);
    const location = metadata.location || (itineraryBlock ? itineraryBlock.location : 'Tokyo & Kyoto');
    const rawCategory = metadata.category || (itineraryBlock ? itineraryBlock.category : 'general');

    thread = {
      blockId,
      title,
      eventTitle: title,
      category: normalizeCategory(rawCategory),
      location,
      participantCount: metadata.participantCount || 4,
      poll: metadata.poll || null,
      messages: [],
    };
    threads.push(thread);
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newMessage = {
    id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    sender: 'Clarence (You)',
    avatar: 'CL',
    text: text.trim(),
    time: timeStr,
    isCurrentUser: true,
  };

  thread.messages.push(newMessage);
  saveChatThreads(threads);
  return { thread, newMessage };
}

export function createChatThread({ title, category, location, initialMessage, poll = null }) {
  const threads = getChatThreads();
  const blockId = 'custom-' + Date.now();
  const normalizedCategory = normalizeCategory(category || 'general');
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const messages = [];
  if (initialMessage && initialMessage.trim()) {
    messages.push({
      id: 'msg-' + Date.now(),
      sender: 'Clarence (You)',
      avatar: 'CL',
      text: initialMessage.trim(),
      time: timeStr,
      isCurrentUser: true,
    });
  }

  const newThread = {
    blockId,
    title: title.trim(),
    eventTitle: title.trim(),
    category: normalizedCategory,
    location: location?.trim() || 'Tokyo & Kyoto',
    participantCount: 4,
    poll,
    messages,
  };

  threads.unshift(newThread);
  saveChatThreads(threads);
  return newThread;
}

export function voteInPoll(blockId, optionId) {
  const threads = getChatThreads();
  const thread = threads.find((t) => t.blockId === blockId);
  if (!thread || !thread.poll) return null;

  const prevVote = thread.poll.userVote;
  thread.poll.options = thread.poll.options.map((opt) => {
    let votes = opt.votes;
    if (opt.id === prevVote) votes = Math.max(0, votes - 1);
    if (opt.id === optionId) votes += 1;
    return { ...opt, votes };
  });

  thread.poll.userVote = optionId;
  saveChatThreads(threads);
  return thread;
}
