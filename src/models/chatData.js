/**
 * Chat Data Model & State Store
 * Manages Categorised Activity Chat Threads and Native Mini-Polls
 * anchored to specific Itinerary Blocks and trip categories (Food, Location, Hotel, Transit, General).
 */

import { getItineraryData } from './itineraryData.js';

const STORAGE_KEY = 'travel_planner_chat_v6';

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
    const m = thread.blockId.match(/^d(\d+)-/);
    if (m) return parseInt(m[1], 10);
  }
  try {
    const allBlocks = getItineraryData();
    const b = allBlocks.find((item) => item.id === thread.blockId);
    if (b && b.day) return b.day;
  } catch (e) {}

  return null;
}

// Initial threads on clean slate: General discussion only
const INITIAL_THREADS = [
  {
    blockId: 'general',
    day: null,
    title: 'General Discussion',
    eventTitle: 'General Trip Discussion',
    category: 'general',
    location: 'Trip Wide',
    participantCount: 4,
    poll: null,
    messages: [
      {
        id: 'msg-gen-1',
        sender: 'Wei Gang',
        avatar: 'WG',
        text: 'Welcome to the trip! Use this general thread to chat, coordinate schedule ideas, and discuss bookings.',
        time: '09:00 AM',
        isCurrentUser: false,
      },
    ],
  },
];

export function getChatThreads() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const normalized = parsed.map((t) => ({
          ...t,
          category: normalizeCategory(t.category),
        }));

        // Ensure starter 'general' thread is always present
        if (!normalized.some((t) => t.blockId === 'general')) {
          normalized.unshift(INITIAL_THREADS[0]);
        }

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
        day: itineraryBlock.day || null,
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

export function addMessageToThread(blockId, textOrMsg, metadata = {}) {
  const threads = getChatThreads();
  let thread = threads.find((t) => t.blockId === blockId);

  let rawText = '';
  let senderName = 'Clarence (You)';
  let avatar = 'CL';
  let isCurrentUser = true;

  if (typeof textOrMsg === 'string') {
    rawText = textOrMsg;
  } else if (textOrMsg && typeof textOrMsg === 'object') {
    rawText = textOrMsg.text || '';
    if (textOrMsg.sender) senderName = textOrMsg.sender;
    if (textOrMsg.avatar) avatar = textOrMsg.avatar;
    if (textOrMsg.isCurrentUser !== undefined) isCurrentUser = textOrMsg.isCurrentUser;
    metadata = { ...metadata, ...textOrMsg };
  }

  if (!thread) {
    // Dynamically populate metadata from itinerary block or passed metadata
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
    sender: senderName,
    avatar,
    text: String(rawText).trim(),
    time: timeStr,
    isCurrentUser,
  };

  thread.messages.push(newMessage);
  saveChatThreads(threads);
  return { thread, newMessage };
}

export function createChatThread({ blockId, title, category, day = null, location, initialMessage, poll = null }) {
  const threads = getChatThreads();
  const id = blockId || ('custom-' + Date.now());

  const existing = threads.find((t) => t.blockId === id);
  if (existing) return existing;

  const normalizedCategory = normalizeCategory(category || 'general');
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const messages = [];
  if (initialMessage && String(initialMessage).trim()) {
    messages.push({
      id: 'msg-' + Date.now(),
      sender: 'Clarence (You)',
      avatar: 'CL',
      text: String(initialMessage).trim(),
      time: timeStr,
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
