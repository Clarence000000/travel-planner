/**
 * Autonomous Simulation Engine for WanderSync (Penang Edition)
 * Orchestrates multi-user ambient background generation, group chat influx,
 * democratic mini-polling consensus, anti-slop advisories, and tropical
 * monsoon contingency triggers.
 */

import {
  PENANG_CHEW_JETTY,
  PENANG_HILL_CANOPY,
  PENANG_CHENDUL_GAP,
  PENANG_SIAM_ROAD_CKT,
  PENANG_DAY2_BLOCKS,
  PENANG_DAY3_BLOCKS,
  PENANG_FALLBACKS,
} from '../models/penangSeedData.js';
import {
  initPenangSparseDay1,
  addOrUpdateBlock,
  confirmProposedBlock,
  shiftBlockToDay,
  resolveContingencyBlock,
  getItineraryData,
  resetToGenesisState,
} from '../models/itineraryData.js';
import { resetChatToGenesis } from '../models/chatData.js';
import {
  sendRemoteEvent,
  onRemoteEvent,
  REMOTE_EVENT_TYPES,
} from '../utils/remoteSync.js';
import { addMessageToThread, createChatThread, getChatThreads } from '../models/chatData.js';
import { addNotification } from '../models/notificationsData.js';

// Timer tracking for clean cancellation and resets
const activeTimerIds = new Set();

function scheduleTimer(fn, delayMs) {
  const timerId = setTimeout(() => {
    activeTimerIds.delete(timerId);
    try {
      fn();
    } catch (err) {
      console.error('[DemoScript] Error executing scheduled timer:', err);
    }
  }, delayMs);
  activeTimerIds.add(timerId);
  return timerId;
}

// Simulation State
const simulationState = {
  isDay2Running: false,
  day2Step: 0,
  isVotingRunning: false,
  voteProgress: 0,
  weatherAlertActive: false,
  contingencyResolved: false,
  contingencyMode: null,
};

export function getSimulationState() {
  return { ...simulationState };
}

/**
 * Act 2: Day 2 Parallel Ambient Population Loop
 * Populates Day 2 in the background on staggered delays (Entopia at T+4s, Escape at T+8s, Bora Bora at T+12s)
 * Dispatches activity dot updates and notifications.
 */
export function startDay2Simulation(options = {}) {
  if (simulationState.isDay2Running) {
    console.log('[DemoScript] Day 2 simulation already active.');
    return;
  }

  simulationState.isDay2Running = true;
  simulationState.day2Step = 0;

  window.dispatchEvent(new CustomEvent('wandersync:day2_worker_start'));
  try {
    const bc = new BroadcastChannel('wandersync_simulation');
    bc.postMessage({ type: 'DAY2_WORKER_START' });
  } catch (e) {}

  const delays = options.delays || [5000, 15000, 25000];

  // Step 1: Entopia Butterfly Farm (T+4s)
  scheduleTimer(() => {
    const entopia = PENANG_DAY2_BLOCKS[0];
    addOrUpdateBlock(entopia);
    simulationState.day2Step = 1;

    try {
      createChatThread({
        blockId: entopia.id,
        title: entopia.title,
        category: entopia.category,
        day: 2,
        location: entopia.location,
        initialMessage: 'Morning nature walk at Entopia Butterfly Farm booked for 09:30 AM.',
      });
      addMessageToThread('day-2-penang', {
        sender: 'Tony',
        avatar: 'TN',
        isCurrentUser: false,
        text: 'Added Entopia by Penang Butterfly Farm to Day 2 for 09:30 AM! 🦋',
      });
    } catch (e) {
      console.warn('[DemoScript] Could not update Day 2 chat:', e);
    }

    addNotification({
      title: 'Tony added Entopia Butterfly Farm',
      text: 'Day 2 morning nature walk in Teluk Bahang booked for 09:30 AM.',
      type: 'info',
    });

    sendRemoteEvent(REMOTE_EVENT_TYPES.DAY2_ACTIVITY, {
      block: entopia,
      step: 1,
      total: 3,
      user: 'Tony',
      title: 'Tony added Entopia by Penang Butterfly Farm to Day 2',
      unreadCount: 1,
    });
    window.dispatchEvent(new CustomEvent('wandersync:day2_activity', { detail: { step: 1, block: entopia } }));

    options.onStep?.(1, entopia);
  }, delays[0]);

  // Step 2: Escape Adventure Park (T+8s)
  scheduleTimer(() => {
    const escapePark = PENANG_DAY2_BLOCKS[1];
    addOrUpdateBlock(escapePark);
    simulationState.day2Step = 2;

    try {
      createChatThread({
        blockId: escapePark.id,
        title: escapePark.title,
        category: escapePark.category,
        day: 2,
        location: escapePark.location,
        initialMessage: 'Day 2 afternoon gravity play & world-record tube slide added.',
      });
      addMessageToThread('day-2-penang', {
        sender: 'Wei Gang',
        avatar: 'WG',
        isCurrentUser: false,
        text: 'Just added Escape Adventure Park & Gravityplay right after Entopia! Ready for the gravity slides. 🧗',
      });
    } catch (e) {
      console.warn('[DemoScript] Could not update Day 2 chat:', e);
    }

    addNotification({
      title: 'Wei Gang added Escape Adventure Park',
      text: 'Day 2 afternoon gravity play & world-record tube slide added.',
      type: 'info',
    });

    sendRemoteEvent(REMOTE_EVENT_TYPES.DAY2_ACTIVITY, {
      block: escapePark,
      step: 2,
      total: 3,
      user: 'Wei Gang',
      title: 'Wei Gang added Escape Adventure Park to Day 2',
      unreadCount: 2,
    });
    window.dispatchEvent(new CustomEvent('wandersync:day2_activity', { detail: { step: 2, block: escapePark } }));

    options.onStep?.(2, escapePark);
  }, delays[1]);

  // Step 3: Bora Bora Batu Ferringhi (T+12s)
  scheduleTimer(() => {
    const borabora = PENANG_DAY2_BLOCKS[2];
    addOrUpdateBlock(borabora);
    simulationState.day2Step = 3;
    simulationState.isDay2Running = false;

    try {
      createChatThread({
        blockId: borabora.id,
        title: borabora.title,
        category: borabora.category,
        day: 2,
        location: borabora.location,
        initialMessage: 'Sunset drinks and beachfront dining along Batu Ferringhi.',
      });
      addMessageToThread('day-2-penang', {
        sender: 'Tony',
        avatar: 'TN',
        isCurrentUser: false,
        text: 'Proposed Sunset Drinks at Bora Bora Batu Ferringhi for 6:30 PM! Great beach vibes to wrap up Day 2. 🍹',
      });
    } catch (e) {
      console.warn('[DemoScript] Could not update Day 2 chat:', e);
    }

    addNotification({
      title: 'Sunset Drinks Proposed',
      text: 'Tony proposed beachfront drinks at Bora Bora Batu Ferringhi.',
      type: 'info',
    });

    sendRemoteEvent(REMOTE_EVENT_TYPES.DAY2_ACTIVITY, {
      block: borabora,
      step: 3,
      total: 3,
      user: 'Tony',
      title: 'Tony proposed Sunset Drinks at Bora Bora Batu Ferringhi',
      unreadCount: 3,
      completed: true,
    });
    window.dispatchEvent(new CustomEvent('wandersync:day2_activity', { detail: { step: 3, block: borabora } }));

    options.onStep?.(3, borabora);
    options.onComplete?.();
  }, delays[2]);

  console.log('[DemoScript] Started Day 2 ambient generation loop.');
}

/**
 * Act 3: Contextual Group Chat Banter & WanderBot Inline Proposal
 * Simulates incoming banter from Tony & Wei Gang followed by WanderBot's gap proposal card.
 */
export function triggerChatInflux(threadId = 'penang-day1-thread', options = {}) {
  // Ensure thread exists
  const existingThreads = getChatThreads();
  let targetThread = existingThreads.find(
    (t) => t.blockId === threadId || t.blockId === 'penang-chew-jetty' || t.blockId === 'general'
  );

  const activeThreadId = targetThread ? targetThread.blockId : threadId;

  if (!targetThread) {
    targetThread = createChatThread({
      blockId: activeThreadId,
      title: 'Day 1: Chew Jetty & Penang Hill',
      category: 'food',
      day: 1,
      location: 'George Town & Penang Hill',
      initialMessage: 'Group discussion for Day 1 itinerary timing and food stops.',
    });
  }

  const delays = options.delays || [1500, 3500, 5500];

  // Message 1: Tony at T+1.5s
  scheduleTimer(() => {
    const msg1 = {
      sender: 'Tony',
      avatar: 'TY',
      isCurrentUser: false,
      text: 'Guys, what are we eating after Chew Jetty? Anyone craving Char Koay Teow or Chendul?',
    };
    addMessageToThread(activeThreadId, msg1);

    sendRemoteEvent(REMOTE_EVENT_TYPES.CHAT_INFLUX, {
      step: 1,
      threadId: activeThreadId,
      message: msg1,
    });
  }, delays[0]);

  // Message 2: Wei Gang at T+3.5s
  scheduleTimer(() => {
    const msg2 = {
      sender: 'Wei Gang',
      avatar: 'WG',
      isCurrentUser: false,
      text: 'Lebuh Keng Kwee Famous Teochew Chendul is a must-try. Right by Penang Road!',
    };
    addMessageToThread(activeThreadId, msg2);

    sendRemoteEvent(REMOTE_EVENT_TYPES.CHAT_INFLUX, {
      step: 2,
      threadId: activeThreadId,
      message: msg2,
    });
  }, delays[1]);

  // Message 3: WanderBot Meal Gap Proposal Card at T+5.5s
  scheduleTimer(() => {
    const botMsg = {
      sender: 'WanderBot AI',
      avatar: '🤖',
      isCurrentUser: false,
      isBot: true,
      isProposal: true,
      proposalBlock: { ...PENANG_CHENDUL_GAP },
      text: '🤖 Meal Gap Detected (12:30 PM): Penang Road Famous Teochew Chendul & Asam Laksa · 8 min Grab from Chew Jetty',
    };
    addMessageToThread(activeThreadId, botMsg);

    sendRemoteEvent(REMOTE_EVENT_TYPES.CHAT_INFLUX, {
      step: 3,
      threadId: activeThreadId,
      message: botMsg,
      isProposal: true,
    });

    options.onComplete?.();
  }, delays[2]);

  console.log(`[DemoScript] Triggered contextual chat influx in thread '${activeThreadId}'.`);
}

/**
 * Injects Penang Road Teochew Chendul into Day 1 as a Proposed Ghost Card
 */
export function insertChendulProposal() {
  const proposalBlock = { ...PENANG_CHENDUL_GAP, status: 'proposed' };
  addOrUpdateBlock(proposalBlock);

  sendRemoteEvent(REMOTE_EVENT_TYPES.INSERT_PROPOSAL, {
    block: proposalBlock,
  });

  return proposalBlock;
}

/**
 * Act 4: Democratic Consensus Polling Simulation
 * Staggers votes from Wei Gang (T+1.0s) and Tony (T+2.2s) to 100% consensus,
 * then morphs card into confirmed solid at T+2.8s.
 */
export function simulateConsensusVote(
  blockId = 'penang-chendul-gap',
  onProgress = null,
  onComplete = null
) {
  if (simulationState.isVotingRunning) {
    console.log('[DemoScript] Voting simulation currently in progress.');
    return;
  }

  simulationState.isVotingRunning = true;
  simulationState.voteProgress = 0;

  // T=0s: Vote Initiated
  sendRemoteEvent(REMOTE_EVENT_TYPES.START_VOTE, {
    blockId,
    votes: 0,
    total: 2,
    percent: 0,
    status: 'started',
  });
  onProgress?.({ voter: null, count: 0, total: 2, percent: 0, status: 'started' });

  // T+1.0s: Wei Gang votes (50%)
  scheduleTimer(() => {
    simulationState.voteProgress = 50;
    const progressData = {
      blockId,
      voter: 'Wei Gang',
      count: 1,
      total: 2,
      percent: 50,
      status: 'voting',
    };
    sendRemoteEvent(REMOTE_EVENT_TYPES.START_VOTE, progressData);
    onProgress?.(progressData);
  }, 1000);

  // T+2.2s: Tony votes (100% Consensus reached)
  scheduleTimer(() => {
    simulationState.voteProgress = 100;
    const consensusData = {
      blockId,
      voter: 'Tony',
      count: 2,
      total: 2,
      percent: 100,
      consensus: true,
      status: 'consensus',
    };
    sendRemoteEvent(REMOTE_EVENT_TYPES.START_VOTE, consensusData);
    onProgress?.(consensusData);
  }, 2200);

  // T+2.8s: Card morphs to Confirmed Solid and recalculates buffers
  scheduleTimer(() => {
    simulationState.isVotingRunning = false;
    confirmProposedBlock(blockId);

    const items = getItineraryData();
    const confirmed = items.find((b) => b.id === blockId);

    addNotification({
      title: 'Consensus Reached! (2/2 Votes)',
      text: 'Penang Road Teochew Chendul & Asam Laksa confirmed on Day 1.',
      type: 'success',
    });

    sendRemoteEvent(REMOTE_EVENT_TYPES.VOTE_COMPLETED, {
      blockId,
      block: confirmed,
      confirmed: true,
    });

    onComplete?.(confirmed);
  }, 2800);

  console.log(`[DemoScript] Started consensus vote simulation on block '${blockId}'.`);
}

/**
 * Schedule Advisory Action:
 * Shift Siam Road Char Koay Teow from Day 1 (Monday closure) to Day 3 (Wednesday)
 */
export function shiftSiamRoadToDay3() {
  const updatedList = shiftBlockToDay('penang-siam-road-ckt', 3);

  addNotification({
    title: 'Schedule Conflict Resolved',
    text: 'Siam Road Char Koay Teow moved to Day 3 (Wednesday). Monday closure averted.',
    type: 'success',
  });

  sendRemoteEvent(REMOTE_EVENT_TYPES.SHIFT_TO_DAY3, {
    blockId: 'penang-siam-road-ckt',
    targetDay: 3,
  });

  return updatedList;
}

/**
 * Act 5: Weather Disruption Contingency Trigger
 * Flashes monsoon rain alert on Penang Hill outdoor canopy walk.
 */
export function triggerWeatherAlert() {
  simulationState.weatherAlertActive = true;
  simulationState.contingencyResolved = false;

  addNotification({
    title: 'Tropical Monsoon Warning',
    text: 'Torrential downpour at Penang Hill. The Habitat outdoor canopy walk suspended.',
    type: 'alert',
  });

  sendRemoteEvent(REMOTE_EVENT_TYPES.CONTINGENCY_RAIN, {
    location: 'Penang Hill',
    venueId: 'penang-hill-canopy',
    severity: 'monsoon',
    message: 'Heavy Monsoon Downpour at Penang Hill Outdoor Station',
  });

  console.log('[DemoScript] Weather disruption contingency triggered for Penang Hill.');
}

/**
 * Act 5: 3-Way Contingency Resolution
 * @param {'fallback' | 'freetime' | 'reflow'} mode
 */
export function resolveWeatherContingency(mode = 'fallback') {
  simulationState.weatherAlertActive = false;
  simulationState.contingencyResolved = true;
  simulationState.contingencyMode = mode;

  const updatedList = resolveContingencyBlock('penang-hill-canopy', mode);

  let notifText = '';
  if (mode === 'fallback') {
    notifText = 'Swapped Penang Hill for The Top Komtar Indoor Theme Park & Glass Skywalk.';
  } else if (mode === 'freetime') {
    notifText = 'Converted slot into relaxed afternoon tea at ChinaHouse Heritage Cafe.';
  } else if (mode === 'reflow') {
    notifText = 'Removed outdoor summit walk and reflowed evening dinner schedule forward.';
  }

  addNotification({
    title: 'Contingency Resolved',
    text: notifText,
    type: 'success',
  });

  sendRemoteEvent(REMOTE_EVENT_TYPES.RESOLVE_CONTINGENCY, {
    mode,
    venueId: 'penang-hill-canopy',
  });

  return updatedList;
}

/**
 * Reset Simulation Timers and State
 */
export function resetSimulation() {
  activeTimerIds.forEach((id) => clearTimeout(id));
  activeTimerIds.clear();

  simulationState.isDay2Running = false;
  simulationState.day2Step = 0;
  simulationState.isVotingRunning = false;
  simulationState.voteProgress = 0;
  simulationState.weatherAlertActive = false;
  simulationState.contingencyResolved = false;
  simulationState.contingencyMode = null;

  resetToGenesisState();
  resetChatToGenesis();

// local reset completed, no circular broadcast

  window.dispatchEvent(new CustomEvent('wandersync:reset_all'));
  sendRemoteEvent(REMOTE_EVENT_TYPES.RESET_DEMO, {});
  console.log('[DemoScript] Simulation reset cleanly.');
}

// Auto-bind listener for remote controller commands
onRemoteEvent(REMOTE_EVENT_TYPES.TRIGGER_PHASE, (payload) => {
  if (!payload || !payload.phase) return;
  console.log(`[DemoScript] Received remote trigger phase: ${payload.phase}`);

  switch (payload.phase) {
    case 'GENESIS':
    case 'PHASE_1':
      initPenangSparseDay1();
      break;

    case 'DAY2_LOOP':
    case 'PHASE_2':
      startDay2Simulation();
      break;

    case 'CHAT_INFLUX':
    case 'PHASE_3':
      triggerChatInflux();
      break;

    case 'INSERT_PROPOSAL':
      insertChendulProposal();
      break;

    case 'START_VOTE':
    case 'PHASE_4':
      simulateConsensusVote();
      break;

    case 'SHIFT_TO_DAY3':
      shiftSiamRoadToDay3();
      break;

    case 'CONTINGENCY_RAIN':
    case 'PHASE_5':
      triggerWeatherAlert();
      break;

    case 'RESOLVE_CONTINGENCY':
      resolveWeatherContingency(payload.mode || 'fallback');
      break;

    case 'RESET':
      resetSimulation();
      break;

    default:
      console.log(`[DemoScript] Unrecognized phase '${payload.phase}'`);
  }
});
