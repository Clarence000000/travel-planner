/**
 * Wishlist & Whiteboard Data Model & State Store
 * Manages candidate trip ideas and interactive whiteboard notes,
 * with direct promotion flow into scheduled Itinerary Blocks.
 */

import { getItineraryData, saveItineraryData } from './itineraryData.js';

const STORAGE_KEY_WISHLIST = 'travel_planner_wishlist_v2';
const STORAGE_KEY_WHITEBOARD = 'travel_planner_whiteboard_v2';

const INITIAL_WISHLIST = [
  {
    id: 'wl-1',
    title: 'Ghibli Museum Mitaka',
    category: 'sightseeing',
    description: 'Whimsical animation wonderland with exclusive short films and Hayao Miyazaki sketches.',
    url: 'https://www.ghibli-museum.jp/en/',
    imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80',
    estimatedCost: '¥1,000 (~$7)',
    votes: 5,
    userVoted: true,
    addedBy: 'Clarence',
  },
  {
    id: 'wl-2',
    title: 'Tsukiji Outer Market Food Tour',
    category: 'food',
    description: 'Wander lively alleys tasting fresh sea urchin, tamagoyaki skewers, and wagyu beef buns.',
    url: 'https://www.tsukiji.or.jp/english/',
    imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=600&q=80',
    estimatedCost: '¥2,500 (~$17)',
    votes: 4,
    userVoted: false,
    addedBy: 'Wei Gang',
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
  },
  {
    id: 'wl-4',
    title: 'Golden Gai Micro-Bars Alley',
    category: 'nightlife',
    description: 'Six narrow alleys lined with over 200 tiny 5-seat character bars and jazz lounges.',
    url: 'https://goldengai.jp',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
    estimatedCost: '¥3,000 (~$20)',
    votes: 3,
    userVoted: false,
    addedBy: 'Clarence',
  },
];

const INITIAL_WHITEBOARD_NOTES = [
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
    text: 'Tokyo Station B1 has large coin lockers (¥800/day) if hotel luggage hold is full.',
    color: 'sky',
    x: 215,
    y: 215,
    author: 'Clarence',
    tag: 'Logistics',
  },
];

export function getWishlist() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_WISHLIST);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('[Wishlist] Failed to read stored items:', e);
  }
  return JSON.parse(JSON.stringify(INITIAL_WISHLIST));
}

export function saveWishlist(items) {
  try {
    localStorage.setItem(STORAGE_KEY_WISHLIST, JSON.stringify(items));
  } catch (e) {
    console.error('[Wishlist] Failed to save items:', e);
  }
}

export function addWishlistItem(item) {
  const list = getWishlist();
  const newItem = {
    id: 'wl-' + Date.now(),
    votes: 1,
    userVoted: true,
    addedBy: 'Clarence',
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

export function getWhiteboardNotes() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_WHITEBOARD);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('[Whiteboard] Failed to read stored notes:', e);
  }
  return JSON.parse(JSON.stringify(INITIAL_WHITEBOARD_NOTES));
}

export function saveWhiteboardNotes(notes) {
  try {
    localStorage.setItem(STORAGE_KEY_WHITEBOARD, JSON.stringify(notes));
  } catch (e) {
    console.error('[Whiteboard] Failed to save notes:', e);
  }
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
    author: 'Clarence',
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
export function promoteToItinerary({ title, location, category, day = 1, startTime = '03:00', endTime = '04:30', notes = '' }) {
  const itinerary = getItineraryData();
  const newId = `d${day}-${Date.now().toString().slice(-4)}`;

  const newBlock = {
    id: newId,
    day: Number(day),
    startTime,
    endTime,
    category: category || 'activity',
    status: 'proposed',
    title,
    location: location || title,
    transitToNextMinutes: 15,
    transitMode: 'Metro or Walking',
    requirements: ['Added from Group Wishlist'],
    fallback: null,
    notes: notes || 'Scheduled from collaborative ideas wishlist.',
    dressCode: 'Comfortable',
  };

  itinerary.push(newBlock);
  saveItineraryData(itinerary);
  return newBlock;
}
