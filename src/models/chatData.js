/**
 * Chat Data Model & State Store
 * Manages Per-Activity Chat Threads and Native Mini-Polls
 * anchored to specific Itinerary Blocks.
 */

const STORAGE_KEY = 'travel_planner_chat_v2';

const INITIAL_THREADS = [
  {
    blockId: 'd1-3',
    title: 'Rooftop Matcha & Food Market',
    eventTitle: 'Rooftop Matcha & Street Food Market',
    category: 'meal',
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
        sender: 'Sarah L.',
        avatar: 'SL',
        text: 'The handmade soba place has vegan and gluten-friendly options which fits everyone!',
        time: '10:14 AM',
        isCurrentUser: false,
      },
      {
        id: 'm2',
        sender: 'Tony (You)',
        avatar: 'TY',
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
    blockId: 'd1-2',
    title: 'Senso-ji Temple Walk',
    eventTitle: 'Senso-ji Temple & Traditional Street Walk',
    category: 'activity',
    location: 'Asakusa, Taito City',
    participantCount: 4,
    poll: null,
    messages: [
      {
        id: 'm201',
        sender: 'Elena R.',
        avatar: 'ER',
        text: 'Remember to carry 100-yen coins for fortune omikuji sticks!',
        time: '09:40 AM',
        isCurrentUser: false,
      },
      {
        id: 'm202',
        sender: 'Tony (You)',
        avatar: 'TY',
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
    category: 'activity',
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
        sender: 'Sarah L.',
        avatar: 'SL',
        text: 'Heads up: floors are mirrored in the crystal room, avoid skirts or wear shorts underneath!',
        time: '11:05 AM',
        isCurrentUser: false,
      },
      {
        id: 'm302',
        sender: 'Tony (You)',
        avatar: 'TY',
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
    category: 'activity',
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
  {
    blockId: 'general',
    title: 'General Trip Chat',
    eventTitle: 'Group Discussion',
    category: 'general',
    location: 'Tokyo & Kyoto 2026',
    participantCount: 4,
    poll: null,
    messages: [
      {
        id: 'm501',
        sender: 'Elena R.',
        avatar: 'ER',
        text: 'Welcome everyone to Tokyo! Check the Itinerary tab for Day 1 blocks.',
        time: '08:30 AM',
        isCurrentUser: false,
      },
    ],
  },
];

export function getChatThreads() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
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
  return threads.find((t) => t.blockId === blockId) || null;
}

export function addMessageToThread(blockId, text) {
  const threads = getChatThreads();
  let thread = threads.find((t) => t.blockId === blockId);

  if (!thread) {
    thread = {
      blockId,
      title: `Event Discussion (${blockId})`,
      eventTitle: 'Itinerary Activity',
      category: 'activity',
      location: 'Tokyo',
      participantCount: 1,
      poll: null,
      messages: [],
    };
    threads.push(thread);
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newMessage = {
    id: 'msg-' + Date.now(),
    sender: 'Tony (You)',
    avatar: 'TY',
    text: text.trim(),
    time: timeStr,
    isCurrentUser: true,
  };

  thread.messages.push(newMessage);
  saveChatThreads(threads);
  return { thread, newMessage };
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
