/**
 * Wishlist & Whiteboard Data Model & State Store
 * Manages candidate trip ideas and interactive whiteboard notes,
 * with direct promotion flow into scheduled Itinerary Blocks.
 */

import { getItineraryData, saveItineraryData } from './itineraryData.js';
import { getActiveTripId } from './tripsModel.js';

export const SAMPLE_WISHLIST = [
  {
    id: 'wl-1',
    title: 'Ghibli Museum Mitaka',
    category: 'sightseeing',
    description: 'Whimsical animation wonderland with exclusive short films and Hayao Miyazaki sketches.',
    url: 'https://www.ghibli-museum.jp/en/',
    imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80',
    estimatedCost: '\u00a51,000 (~$7)',
    votes: 5,
    userVoted: true,
    addedBy: 'Clarence',
    isScheduled: false,
  },
  {
    id: 'wl-2',
    title: 'Tsukiji Outer Market Food Tour',
    category: 'food',
    description: 'Wander lively alleys tasting fresh sea urchin, tamagoyaki skewers, and wagyu beef buns.',
    url: 'https://www.tsukiji.or.jp/english/',
    imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=600&q=80',
    estimatedCost: '\u00a52,500 (~$17)',
    votes: 4,
    userVoted: false,
    addedBy: 'Wei Gang',
    isScheduled: false,
  },
  {
    id: 'wl-3',
    title: 'Fushimi Inari 10,000 Torii Shrine',
    category: 'activity',
    description: 'Iconic mountain hike through vibrant vermilion shrine gates in southern Kyoto.',
    url: 'https://inari.jp/en/',
    imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80',
    estimatedCost: 'Free Entry',
    votes: 6,
    userVoted: true,
    addedBy: 'Kenji',
    isScheduled: false,
  },
  {
    id: 'wl-4',
    title: 'Golden Gai Micro-Bars Alley',
    category: 'nightlife',
    description: 'Six narrow alleys lined with over 200 tiny 5-seat character bars and jazz lounges.',
    url: 'https://goldengai.jp',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
    estimatedCost: '\u00a53,000 (~$20)',
    votes: 3,
    userVoted: false,
    addedBy: 'Clarence',
    isScheduled: false,
  },
];

export const INITIAL_WISHLIST = SAMPLE_WISHLIST;

export const SAMPLE_WHITEBOARD_NOTES = [
  {
    id: 'wn-1',
    title: 'IC Card Transit Tip',
    text: 'Load Suica or Pasmo onto Apple/Google Wallet before landing to tap through train turnstiles seamlessly!',
    color: 'yellow',
    x: 16,
    y: 24,
    author: 'Clarence',
    tag: 'Transit',
  },
  {
    id: 'wn-2',
    title: 'Weather Contingency',
    text: 'If Day 2 gets afternoon rain, swap Arashiyama Bamboo Grove with Kyoto Railway Museum.',
    color: 'peach',
    x: 210,
    y: 35,
    author: 'Wei Gang',
    tag: 'Backup',
  },
  {
    id: 'wn-3',
    title: 'Snack Wishlist',
    text: 'Must try: 1. Warabi mochi in Gion, 2. Matcha soft serve at Senso-ji, 3. 7-Eleven egg salad sandwich.',
    color: 'mint',
    x: 24,
    y: 200,
    author: 'Kenji',
    tag: 'Food',
  },
  {
    id: 'wn-4',
    title: 'Coin Lockers',
    text: 'Tokyo Station B1 has large coin lockers (\u00a5800/day) if hotel luggage hold is full.',
    color: 'sky',
    x: 215,
    y: 215,
    author: 'Clarence',
    tag: 'Logistics',
  },
];

export const INITIAL_WHITEBOARD_NOTES = SAMPLE_WHITEBOARD_NOTES;

function getWishlistStorageKey() {
  const tripId = getActiveTripId();
  return tripId ? `travel_planner_wishlist_${tripId}` : 'travel_planner_wishlist_v2';
}

function getWhiteboardStorageKey() {
  const tripId = getActiveTripId();
  return tripId ? `travel_planner_whiteboard_${tripId}` : 'travel_planner_whiteboard_v2';
}

const wishlistListeners = new Set();

export function onWishlistChange(callback) {
  wishlistListeners.add(callback);
  return () => wishlistListeners.delete(callback);
}

function notifyWishlistListeners() {
  const items = getWishlist();
  wishlistListeners.forEach((fn) => {
    try {
      fn(items);
    } catch (e) {
      console.error('[Wishlist] Listener error:', e);
    }
  });
}

/**
 * Load wishlist (Clean slate default: returns [])
 */
export function getWishlist() {
  try {
    const key = getWishlistStorageKey();
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('[Wishlist] Failed to read stored items:', e);
  }
  return [];
}

/**
 * Save wishlist items
 */
export function saveWishlist(items) {
  try {
    const key = getWishlistStorageKey();
    localStorage.setItem(key, JSON.stringify(items));
  } catch (e) {
    console.error('[Wishlist] Failed to save items:', e);
  }
  notifyWishlistListeners();
}

export function clearWishlistData() {
  saveWishlist([]);
  return [];
}

export function resetWishlistSample() {
  const sample = JSON.parse(JSON.stringify(SAMPLE_WISHLIST));
  saveWishlist(sample);
  return sample;
}

export function getTopVotedWishlistItems(limit = 3) {
  const items = getWishlist();
  return items.slice().sort((a, b) => (b.votes || 0) - (a.votes || 0)).slice(0, limit);
}

export function markWishlistScheduled(itemTitleOrId, scheduleInfo = {}) {
  const list = getWishlist().map((item) => {
    if (
      item.id === itemTitleOrId ||
      (item.title && itemTitleOrId && item.title.toLowerCase().includes(itemTitleOrId.toLowerCase()))
    ) {
      return {
        ...item,
        isScheduled: true,
        scheduledDay: scheduleInfo.day || 1,
        scheduledTime: scheduleInfo.time || '14:00',
      };
    }
    return item;
  });
  saveWishlist(list);
  return list;
}

export function resetWishlistScheduled() {
  const list = getWishlist().map((item) => {
    const copy = { ...item };
    copy.isScheduled = false;
    delete copy.scheduledDay;
    delete copy.scheduledTime;
    return copy;
  });
  saveWishlist(list);
  return list;
}

export function addWishlistItem(item) {
  const list = getWishlist();
  const newItem = {
    id: 'wl-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    votes: 1,
    userVoted: true,
    addedBy: 'You',
    isScheduled: false,
    ...item,
  };
  list.unshift(newItem);
  saveWishlist(list);
  return newItem;
}

export function deleteWishlistItem(id) {
  const list = getWishlist().filter((i) => i.id !== id);
  saveWishlist(list);
  return list;
}

export function toggleWishlistVote(id) {
  const list = getWishlist().map((item) => {
    if (item.id === id) {
      const userVoted = !item.userVoted;
      const votes = userVoted ? item.votes + 1 : Math.max(0, item.votes - 1);
      return { ...item, userVoted, votes };
    }
    return item;
  });
  saveWishlist(list);
  return list;
}

/**
 * Load whiteboard notes (Clean slate default: returns [])
 */
export function getWhiteboardNotes() {
  try {
    const key = getWhiteboardStorageKey();
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('[Whiteboard] Failed to read stored notes:', e);
  }
  return [];
}

/**
 * Save whiteboard notes
 */
export function saveWhiteboardNotes(notes) {
  try {
    const key = getWhiteboardStorageKey();
    localStorage.setItem(key, JSON.stringify(notes));
  } catch (e) {
    console.error('[Whiteboard] Failed to save notes:', e);
  }
}

export function clearWhiteboardNotes() {
  saveWhiteboardNotes([]);
  return [];
}

export function resetWhiteboardSample() {
  const sample = JSON.parse(JSON.stringify(SAMPLE_WHITEBOARD_NOTES));
  saveWhiteboardNotes(sample);
  return sample;
}

export function addWhiteboardNote(note) {
  const notes = getWhiteboardNotes();
  const newNote = {
    id: 'wn-' + Date.now(),
    title: note.title || 'New Note',
    text: note.text || 'Write your travel thought or idea here...',
    color: note.color || 'yellow',
    x: note.x !== undefined ? note.x : 40,
    y: note.y !== undefined ? note.y : 40,
    author: 'You',
    tag: note.tag || 'Idea',
  };
  notes.push(newNote);
  saveWhiteboardNotes(notes);
  return newNote;
}

export function updateWhiteboardNote(id, updates) {
  const notes = getWhiteboardNotes().map((n) => {
    if (n.id === id) return { ...n, ...updates };
    return n;
  });
  saveWhiteboardNotes(notes);
  return notes;
}

export function deleteWhiteboardNote(id) {
  const notes = getWhiteboardNotes().filter((n) => n.id !== id);
  saveWhiteboardNotes(notes);
  return notes;
}

/**
 * Promote an item (from Wishlist or Whiteboard note) into an active Itinerary Block
 */
export function promoteToItinerary(item, options = {}) {
  const day = options.day || 1;
  const startTime = options.startTime || '14:30';
  const endTime = options.endTime || '16:00';

  const category = item.category || 'activity';
  const newBlock = {
    id: 'block-' + Date.now(),
    day,
    startTime,
    endTime,
    category,
    status: 'proposed',
    title: item.title || item.text || 'Promoted Spot',
    location: item.location || (item.title ? `${item.title}, Tokyo` : 'Tokyo, Japan'),
    transitToNextMinutes: 20,
    transitMode: 'Subway',
    requirements: ['Added from Whiteboard Wishlist'],
    fallback: null,
    notes: item.description || item.text || 'Promoted directly into day schedule.',
    dressCode: null,
    source: item.source || (item.url && item.url.includes('instagram') ? 'reel' : 'manual'),
    reelUrl: item.url || null,
  };

  const itinerary = getItineraryData();
  itinerary.push(newBlock);
  saveItineraryData(itinerary);

  if (item.id && item.id.startsWith('wl-')) {
    markWishlistScheduled(item.id, { day, time: startTime });
  }

  return newBlock;
}
