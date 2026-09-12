/**
 * Chat Data Model & State Store
 * Manages Categorised Activity Chat Threads and Native Mini-Polls
 * anchored to specific Itinerary Blocks and trip categories (Food, Location, Hotel, Transit, General).
 */

import { getItineraryData } from './itineraryData.js';
import { getActiveTrip, getActiveTripId } from './tripsModel.js';

const DEFAULT_GLOBAL_KEY = 'travel_planner_chat_v6';

export function getStorageKey() {
  const tripId = getActiveTripId();
  return tripId ? `travel_planner_chat_${tripId}` : DEFAULT_GLOBAL_KEY;
}

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

export function getCategoryIconSvg(categoryId, size = 14) {
  const norm = normalizeCategory(categoryId);
  switch (norm) {
    case 'food':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>`;
    case 'location':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
    case 'hotel':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`;
    case 'transit':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3" width="16" height="16" rx="2"></rect><path d="M4 11h16"></path><path d="M12 3v8"></path><path d="m8 19-2 3"></path><path d="m16 19 2 3"></path></svg>`;
    case 'general':
    default:
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
  }
}

export function getPollsIconSvg(size = 14) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`;
}

export function getAllIconSvg(size = 14) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`;
}

export function getDayCalendarIconSvg(size = 14) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
}

export function getThreadDay(thread) {
  if (!thread) return null;
  if (thread.day !== undefined && thread.day !== null) {
    if (thread.day === 'all' || thread.day === 'trip') return null;
    const d = parseInt(thread.day, 10);
    if (!isNaN(d) && d > 0) return d;
  }
  if (typeof thread.blockId === 'string') {
    const m = thread.blockId.match(/(?:^|[-_])(?:d|day-?)(\d+)(?:[-_]|$)/i);
    if (m) return parseInt(m[1], 10);
  }
  try {
    const allBlocks = getItineraryData();
    const b = allBlocks.find((item) => item.id === thread.blockId);
    if (b && b.day) return b.day;
  } catch (e) {}

  return null;
}

/**
 * Generate trip-specific initial starter threads based on the active trip destination and days
 */
export function getInitialThreadsForTrip(activeTrip) {
  const dest = (activeTrip?.destination || 'Penang, Malaysia').trim();
  const tripCity = dest.split(',')[0].trim() || 'Trip';
  const isPenang = tripCity.toLowerCase().includes('penang');

  if (isPenang) {
    return [
      {
        blockId: 'general',
        day: null,
        title: 'General Discussion',
        eventTitle: 'General Trip Discussion',
        category: 'general',
        location: 'Penang Island',
        participantCount: 3,
        poll: null,
        messages: [
          {
            id: 'msg-gen-1',
            sender: 'Wei Gang',
            avatar: 'WG',
            text: 'Welcome to Penang! Use this general thread to chat, coordinate schedule ideas, and discuss bookings.',
            date: 'Today',
            time: 'Today, 09:00 AM',
            isCurrentUser: false,
          },
        ],
      },
      {
        blockId: 'day-1-penang',
        day: 1,
        title: 'Day 1: Chew Jetty & Penang Hill',
        eventTitle: 'Day 1: Chew Jetty & Penang Hill',
        category: 'food',
        location: 'Chew Jetty, George Town',
        participantCount: 3,
        poll: null,
        messages: [
          {
            id: 'msg-d1-intro',
            sender: 'Clarence (You)',
            avatar: 'CL',
            text: 'Starting our morning at Chew Jetty! Plan is to explore the clan jetties before heading up to Penang Hill later in the afternoon.',
            date: 'Today',
            time: 'Today, 09:15 AM',
            isCurrentUser: true,
          },
        ],
      },
      {
        blockId: 'day-2-penang',
        day: 2,
        title: 'Day 2: Entopia & Batu Ferringhi',
        eventTitle: 'Day 2: Entopia & Batu Ferringhi',
        category: 'location',
        location: 'Teluk Bahang & Batu Ferringhi',
        participantCount: 3,
        poll: null,
        messages: [
          {
            id: 'msg-d2-intro',
            sender: 'Tony',
            avatar: 'TN',
            text: 'Morning nature day out at Entopia Butterfly Sanctuary and Escape Park, then sunset drinks along Batu Ferringhi beach!',
            date: 'Today',
            time: 'Today, 10:00 AM',
            isCurrentUser: false,
          },
        ],
      },
    ];
  }

  // Non-Penang trip (e.g. Tokyo, Kyoto, Seoul, Singapore, etc.)
  const isTokyo = tripCity.toLowerCase().includes('tokyo');
  const slug = tripCity.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'trip';

  const day1Title = isTokyo ? 'Day 1: Senso-ji & Asakusa' : `Day 1: ${tripCity} Highlights`;
  const day1Location = isTokyo ? 'Asakusa, Taito City' : tripCity;
  const day2Title = isTokyo ? 'Day 2: Shinjuku & Shibuya' : `Day 2: ${tripCity} Culture & Food`;
  const day2Location = isTokyo ? 'Shinjuku, Tokyo' : tripCity;

  return [
    {
      blockId: 'general',
      day: null,
      title: 'General Discussion',
      eventTitle: 'General Trip Discussion',
      category: 'general',
      location: tripCity,
      participantCount: (activeTrip?.members || ['You']).length,
      poll: null,
      messages: [
        {
          id: 'msg-gen-1',
          sender: 'WanderBot',
          avatar: 'WB',
          text: `Welcome to ${tripCity}! Use this general thread to chat, coordinate schedule ideas, and discuss bookings.`,
          date: 'Today',
          time: 'Today, 09:00 AM',
          isCurrentUser: false,
        },
      ],
    },
    {
      blockId: `day-1-${slug}`,
      day: 1,
      title: day1Title,
      eventTitle: day1Title,
      category: 'location',
      location: day1Location,
      participantCount: (activeTrip?.members || ['You']).length,
      poll: null,
      messages: [
        {
          id: 'msg-d1-intro',
          sender: 'You',
          avatar: 'YO',
          text: `Excited for Day 1 exploring ${tripCity}!`,
          date: 'Today',
          time: 'Today, 09:30 AM',
          isCurrentUser: true,
        },
      ],
    },
    {
      blockId: `day-2-${slug}`,
      day: 2,
      title: day2Title,
      eventTitle: day2Title,
      category: 'food',
      location: day2Location,
      participantCount: (activeTrip?.members || ['You']).length,
      poll: null,
      messages: [],
    },
  ];
}

export function getChatThreads() {
  const activeTrip = getActiveTrip();
  const storageKey = getStorageKey();

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const initial = getInitialThreadsForTrip(activeTrip);
        const normalized = parsed.map((t) => {
          // Normalize messages for dates
          if (Array.isArray(t.messages)) {
            t.messages = t.messages.map((m) => {
              let date = m.date;
              let time = m.time;
              if (!date) {
                if (time && time.startsWith('Yesterday')) {
                  date = 'Yesterday';
                } else if (time && time.startsWith('Today')) {
                  date = 'Today';
                } else {
                  date = 'Today';
                  if (time && !time.includes(',')) {
                    time = `Today, ${time}`;
                  }
                }
              }
              return { ...m, date, time: time || 'Today, 12:00 PM' };
            });
          }

          return {
            ...t,
            category: normalizeCategory(t.category),
          };
        });

        // Ensure general thread is present
        if (!normalized.some((t) => t.blockId === 'general')) {
          const gen = initial.find((x) => x.blockId === 'general');
          if (gen) normalized.unshift(gen);
        }

        return normalized;
      }
    }
  } catch (e) {
    console.warn('[Chat] Failed to load chat data:', e);
  }

  const initial = getInitialThreadsForTrip(activeTrip);
  saveChatThreads(initial);
  return JSON.parse(JSON.stringify(initial));
}

export function saveChatThreads(threads) {
  const storageKey = getStorageKey();
  try {
    localStorage.setItem(storageKey, JSON.stringify(threads));
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
      const activeTrip = getActiveTrip();
      const tripCity = activeTrip?.destination?.split(',')[0]?.trim() || 'Trip Wide';
      return {
        blockId,
        day: itineraryBlock.day || null,
        title: itineraryBlock.title,
        eventTitle: itineraryBlock.title,
        category: normalizeCategory(itineraryBlock.category),
        location: itineraryBlock.location || tripCity,
        participantCount: (activeTrip?.members || ['You']).length,
        poll: null,
        messages: [],
      };
    }
  } catch (e) {
    // Non-blocking fallback
  }

  return null;
}

export function addMessageToThread(blockId, textOrMsg, metadata = {}) {
  const threads = getChatThreads();
  let thread = threads.find((t) => t.blockId === blockId);

  let rawText = '';
  let senderName = 'Clarence (You)';
  let avatar = 'CL';
  let isCurrentUser = true;
  let isAi = false;
  let type = 'text';
  let proposal = null;

  if (typeof textOrMsg === 'string') {
    rawText = textOrMsg;
    if (typeof metadata === 'string') {
      senderName = metadata;
      metadata = { sender: metadata };
    }
  } else if (textOrMsg && typeof textOrMsg === 'object') {
    rawText = textOrMsg.text || '';
    if (textOrMsg.sender) senderName = textOrMsg.sender;
    if (textOrMsg.avatar) avatar = textOrMsg.avatar;
    if (textOrMsg.isCurrentUser !== undefined) isCurrentUser = textOrMsg.isCurrentUser;
    if (textOrMsg.isAi !== undefined) isAi = textOrMsg.isAi;
    if (textOrMsg.type !== undefined) type = textOrMsg.type;
    if (textOrMsg.proposal) proposal = textOrMsg.proposal;
    metadata = { ...metadata, ...textOrMsg };
  }

  if (metadata && typeof metadata === 'object') {
    if (metadata.sender) senderName = metadata.sender;
    if (metadata.avatar) avatar = metadata.avatar;
    if (metadata.isCurrentUser !== undefined) isCurrentUser = metadata.isCurrentUser;
    if (metadata.isAi !== undefined) isAi = metadata.isAi;
    if (metadata.type !== undefined) type = metadata.type;
    if (metadata.proposal) proposal = metadata.proposal;
  }

  // Smart defaults for known demo team members
  const normSender = senderName.toLowerCase();
  if (normSender.includes('tony')) {
    avatar = avatar || 'TN';
    if (metadata?.isCurrentUser === undefined && (typeof textOrMsg !== 'object' || textOrMsg?.isCurrentUser === undefined)) {
      isCurrentUser = false;
    }
  } else if (normSender.includes('wei gang') || normSender.includes('weigang')) {
    avatar = avatar || 'WG';
    if (metadata?.isCurrentUser === undefined && (typeof textOrMsg !== 'object' || textOrMsg?.isCurrentUser === undefined)) {
      isCurrentUser = false;
    }
  } else if (normSender.includes('wanderbot')) {
    avatar = avatar || 'WB';
    isAi = true;
    if (metadata?.isCurrentUser === undefined && (typeof textOrMsg !== 'object' || textOrMsg?.isCurrentUser === undefined)) {
      isCurrentUser = false;
    }
  }

  if (!thread) {
    let itineraryBlock = null;
    try {
      const allBlocks = getItineraryData();
      itineraryBlock = allBlocks.find((b) => b.id === blockId);
    } catch (e) {}

    const title = metadata.title || (itineraryBlock ? itineraryBlock.title : `Discussion (${blockId})`);
    const location = metadata.location || (itineraryBlock ? itineraryBlock.location : 'Trip Wide');
    const rawCategory = metadata.category || (itineraryBlock ? itineraryBlock.category : 'general');
    const day = metadata.day || (itineraryBlock ? itineraryBlock.day : null);

    thread = {
      blockId,
      day,
      title,
      eventTitle: title,
      category: normalizeCategory(rawCategory),
      location,
      participantCount: metadata.participantCount || 3,
      poll: metadata.poll || null,
      messages: [],
    };
    threads.push(thread);
  }

  const now = new Date();
  const timeOnly = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const timeStr = metadata.time || `Today, ${timeOnly}`;
  const dateStr = metadata.date || 'Today';

  const newMessage = {
    id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    sender: senderName,
    avatar,
    text: String(rawText).trim(),
    date: dateStr,
    time: timeStr,
    isCurrentUser,
    isAi,
    type,
    proposal,
  };

  if (!Array.isArray(thread.messages)) {
    thread.messages = [];
  }

  thread.messages.push(newMessage);
  saveChatThreads(threads);
  return newMessage;
}

export function createChatThread(threadData) {
  const threads = getChatThreads();
  const { blockId, title, category, location, day, initialMessage, poll } = threadData;

  const id = blockId || 'thread-' + Date.now();
  const existing = threads.find((t) => t.blockId === id);
  if (existing) return existing;

  const normalizedCategory = normalizeCategory(category);
  const messages = [];
  if (initialMessage) {
    messages.push({
      id: 'msg-' + Date.now(),
      sender: 'Clarence (You)',
      avatar: 'CL',
      text: String(initialMessage).trim(),
      date: 'Today',
      time: 'Today, Just now',
      isCurrentUser: true,
    });
  }

  let parsedDay = null;
  if (day !== undefined && day !== null && day !== 'all' && day !== 'trip') {
    const d = parseInt(day, 10);
    if (!isNaN(d) && d > 0) parsedDay = d;
  }

  const newThread = {
    blockId: id,
    day: parsedDay,
    title: (title || 'New Discussion').trim(),
    eventTitle: (title || 'New Discussion').trim(),
    category: normalizedCategory,
    location: location?.trim() || 'Trip Wide',
    participantCount: 3,
    poll: poll || null,
    messages,
  };

  threads.unshift(newThread);
  saveChatThreads(threads);
  return newThread;
}

export function attachPollToThread(blockId, pollData) {
  const threads = getChatThreads();
  const thread = threads.find((t) => t.blockId === blockId);
  if (!thread) return null;

  thread.poll = {
    id: pollData.id || 'poll-' + Date.now(),
    question: pollData.question || 'Group Decision Poll',
    status: pollData.status || 'active',
    userVote: pollData.userVote || null,
    options: pollData.options || [
      { id: 'opt-yes', label: 'Yes', votes: 0 },
      { id: 'opt-no', label: 'No', votes: 0 },
    ],
  };

  saveChatThreads(threads);
  return thread;
}

export function removePollFromThread(blockId) {
  const threads = getChatThreads();
  const thread = threads.find((t) => t.blockId === blockId);
  if (!thread) return null;

  thread.poll = null;
  saveChatThreads(threads);
  return thread;
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

/**
 * Resets all chat threads back to the pristine Genesis state
 */
export function resetChatToGenesis() {
  const activeTrip = getActiveTrip();
  const initial = getInitialThreadsForTrip(activeTrip);
  saveChatThreads(initial);
  return initial;
}

/**
 * Triggers friendly background banter upon trip creation
 * Runs without switching the presenter away from the itinerary
 */
export function startBackgroundTripBanter() {
  setTimeout(() => {
    addMessageToThread('general', {
      sender: 'Tony',
      avatar: 'TN',
      isCurrentUser: false,
      text: 'Penang trip is locked in! 🚀 Ready for the food crawl.',
    });
    window.dispatchEvent(new CustomEvent('wandersync:chat_update', { detail: { threadId: 'general' } }));
  }, 1200);

  setTimeout(() => {
    addMessageToThread('general', {
      sender: 'Wei Gang',
      avatar: 'WG',
      isCurrentUser: false,
      text: "Hyped! I'll look into street food spots near George Town.",
    });
    window.dispatchEvent(new CustomEvent('wandersync:chat_update', { detail: { threadId: 'general' } }));
  }, 3200);
}
