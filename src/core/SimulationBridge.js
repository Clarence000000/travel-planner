/**
 * SimulationBridge: Decouples remote simulation & BroadcastChannel events from app.js.
 * Handles headless controller (/remote.html) commands and coordinates state mutations
 * across itineraryData, chatData, and custom UI events.
 */

import { remoteSync } from '../utils/remoteSync.js';
import { getItineraryData, addItineraryBlock, resetToGenesisState } from '../models/itineraryData.js';
import { resetChatToGenesis, attachPollToThread, addMessageToThread, createChatThread } from '../models/chatData.js';
import * as DemoEngine from '../config/demoScript.js';
import { setActiveTab, getActiveTab } from '../config/navigation.js';
import { appBus } from './EventBus.js';

export function initSimulationBridge({ onRefreshActiveView, showToast }) {
  const triggerRefresh = () => {
    const cur = getActiveTab();
    if (typeof onRefreshActiveView === 'function') {
      onRefreshActiveView(cur);
    }
  };

  // 1. Tab switching
  remoteSync.subscribe('SWITCH_TAB', (payload) => {
    if (payload && payload.tab) {
      setActiveTab(payload.tab);
    }
  });

  // 2. Reel Genesis
  remoteSync.subscribe('START_REEL_GENESIS', () => {
    setActiveTab('ideas');
    if (typeof showToast === 'function') {
      showToast('Act 1: Dynamic Genesis initiated', 'info');
    }
    appBus.emit('simulation:reel_genesis');
  });

  // 3. Populate Day 1 Anchors
  remoteSync.subscribe('POPULATE_DAY1_ANCHORS', () => {
    const items = getItineraryData();
    if (!items.some((i) => i.id === 'd1-chew-jetty')) {
      addItineraryBlock({
        id: 'd1-chew-jetty',
        day: 1,
        startTime: '09:00',
        endTime: '11:30',
        title: 'Chew Jetty Clan Waterfront Walk',
        location: 'Weld Quay, George Town',
        category: 'location',
        cost: 'Free',
        status: 'confirmed',
        notes: 'Historic stilt village founded by Chinese immigrants in the 19th century.',
      });
    }
    if (!items.some((i) => i.id === 'd1-penang-hill')) {
      addItineraryBlock({
        id: 'd1-penang-hill',
        day: 1,
        startTime: '15:00',
        endTime: '18:00',
        title: 'Penang Hill Funicular & The Habitat',
        location: 'Bukit Bendera, Air Itam',
        category: 'location',
        cost: 'RM 30 / pax',
        status: 'confirmed',
        notes: 'Panoramic views across Penang island and canopy rainforest walk.',
      });
    }
    remoteSync.broadcast('STATUS_ACK', {
      phase: 'GENESIS_POPULATED',
      message: 'Day 1 Chew Jetty & Penang Hill anchors locked.',
    });
    appBus.emit('simulation:anchors_populated');
    triggerRefresh();
  });

  // 4. Insert Proposed Chendul
  remoteSync.subscribe('INSERT_PROPOSAL', () => {
    const items = getItineraryData();
    if (!items.some((i) => i.id === 'd1-chendul')) {
      addItineraryBlock({
        id: 'd1-chendul',
        day: 1,
        startTime: '12:30',
        endTime: '13:30',
        title: 'Penang Road Famous Teochew Chendul & Asam Laksa',
        location: '492, Lebuh Keng Kwee, George Town',
        category: 'food',
        cost: 'RM 12 / pax',
        status: 'proposed',
        notes: 'Iconic shaved ice dessert with pandan jelly, coconut milk, and gula melaka. Michelin Bib Gourmand selected.',
        grabTime: '8 min Grab from Chew Jetty',
        transitToNextMinutes: 25,
        transitMode: 'Transit (25 min) to Penang Hill',
        requirements: [],
      });
    }
    attachPollToThread('day-1-penang', {
      id: 'poll-chendul',
      question: 'Lock Penang Road Famous Teochew Chendul into Day 1 schedule?',
      status: 'active',
      userVote: null,
      options: [
        { id: 'opt-yes', label: 'Yes, lock into schedule', votes: 0 },
        { id: 'opt-no', label: 'Explore other options', votes: 0 },
      ],
    });

    window.dispatchEvent(new CustomEvent('wandersync:proposal_inserted', { detail: { blockId: 'd1-chendul' } }));
    appBus.emit('proposal:inserted', { blockId: 'd1-chendul' });

    remoteSync.broadcast('STATUS_ACK', {
      phase: 'PROPOSAL_INSERTED',
      message: 'Chendul inserted into Day 1 schedule as proposed.',
    });

    triggerRefresh();
  });

  // 5. Day 2 Parallel Ambient Simulation
  remoteSync.subscribe('TRIGGER_DAY2_WORKER', () => {
    DemoEngine.startDay2Simulation({ delays: [5000, 15000, 25000] });
    window.dispatchEvent(new CustomEvent('wandersync:day2_activity', { detail: { active: true } }));
    appBus.emit('simulation:day2_active', { active: true });
    remoteSync.broadcast('STATUS_ACK', {
      phase: 'DAY2_WORKER_ACTIVE',
      message: 'Day 2 ambient background simulation running.',
    });
  });

  remoteSync.subscribe('ADD_ENTOPIA_DAY2', () => {
    const items = getItineraryData();
    if (!items.some((i) => i.id === 'd2-entopia')) {
      addItineraryBlock({
        id: 'd2-entopia',
        day: 2,
        startTime: '10:00',
        endTime: '12:30',
        title: 'Entopia by Penang Butterfly Farm',
        location: 'Jalan Teluk Bahang',
        category: 'location',
        cost: 'RM 65 / pax',
        status: 'confirmed',
        notes: 'Living sanctuary with over 15,000 free-flying butterflies.',
      });
    }
    try {
      createChatThread({
        blockId: 'd2-entopia',
        title: 'Entopia by Penang Butterfly Farm',
        category: 'location',
        day: 2,
        location: 'Jalan Teluk Bahang',
        initialMessage: 'Morning nature walk at Entopia Butterfly Farm booked for 10:00 AM.',
      });
      addMessageToThread('day-2-penang', {
        sender: 'Tony',
        avatar: 'TN',
        isCurrentUser: false,
        text: 'I was looking at [Entopia Butterfly Farm](https://www.entopia.com) 🦋 — massive living sanctuary with 15,000 free-flying butterflies in Teluk Bahang. Looks incredible for our morning walk!',
      });
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('wandersync:day2_activity', { detail: { active: true } }));
    appBus.emit('simulation:day2_active', { active: true });
    remoteSync.broadcast('STATUS_ACK', { phase: 'ENTOPIA_ADDED', message: 'Entopia added to Day 2.' });
    triggerRefresh();
  });

  remoteSync.subscribe('DAY2_ACTIVITY', (payload) => {
    window.dispatchEvent(new CustomEvent('wandersync:day2_activity', { detail: payload }));
    appBus.emit('simulation:day2_activity', payload);
  });

  // 6. Chat Banter & Polling Sequences
  remoteSync.subscribe('TRIGGER_CHAT_BANTER', () => {
    setActiveTab('chat');
    remoteSync.broadcast('STATUS_ACK', { phase: 'CHAT_BANTER_STARTED', message: 'Chat banter active in Day 1 thread.' });
  });

  remoteSync.subscribe('VOTE_CONSENSUS', (payload) => {
    setActiveTab('chat');
    window.dispatchEvent(new CustomEvent('wandersync:vote_consensus', { detail: payload }));
    appBus.emit('simulation:vote_consensus', payload);
    remoteSync.broadcast('STATUS_ACK', { phase: 'VOTING_ACTIVE', message: 'Consensus voting sequence running.' });
  });

  remoteSync.subscribe('START_MINI_POLL', () => {
    setActiveTab('chat');
    remoteSync.broadcast('STATUS_ACK', { phase: 'POLL_ACTIVE', message: 'Consensus poll active.' });
  });

  // 7. Schedule Advisories
  remoteSync.subscribe('TRIGGER_SIAM_ROAD_ADVISORY', () => {
    window.dispatchEvent(new CustomEvent('wandersync:siam_road_advisory'));
    appBus.emit('simulation:siam_road_advisory');
    remoteSync.broadcast('STATUS_ACK', { phase: 'ADVISORY_ACTIVE', message: 'Siam Road Monday closure advisory active.' });
  });

  // 8. Monsoon Alert & 3-Way Contingencies
  remoteSync.subscribe('TRIGGER_MONSOON', () => {
    window.dispatchEvent(new CustomEvent('wandersync:monsoon_alert', { detail: { alert: true } }));
    appBus.emit('simulation:monsoon_alert', { alert: true });
    remoteSync.broadcast('STATUS_ACK', { phase: 'MONSOON_ACTIVE', message: 'Tropical monsoon alert active on Penang Hill.' });
  });

  remoteSync.subscribe('CONTINGENCY_1', () => {
    window.dispatchEvent(new CustomEvent('wandersync:contingency_1'));
    appBus.emit('simulation:contingency_1');
    remoteSync.broadcast('STATUS_ACK', { phase: 'CONTINGENCY_1_APPLIED', message: 'Swapped to Indoor Fallback (The Top Komtar).' });
  });

  remoteSync.subscribe('CONTINGENCY_2', () => {
    window.dispatchEvent(new CustomEvent('wandersync:contingency_2'));
    appBus.emit('simulation:contingency_2');
    remoteSync.broadcast('STATUS_ACK', { phase: 'CONTINGENCY_2_APPLIED', message: 'Free-time pocket inserted at ChinaHouse Cafe.' });
  });

  remoteSync.subscribe('CONTINGENCY_3', () => {
    window.dispatchEvent(new CustomEvent('wandersync:contingency_3'));
    appBus.emit('simulation:contingency_3');
    remoteSync.broadcast('STATUS_ACK', { phase: 'CONTINGENCY_3_APPLIED', message: 'Chronological reflow applied.' });
  });

  // 9. Reset All to Genesis Zero-State
  remoteSync.subscribe('RESET_ALL', () => {
    DemoEngine.resetSimulation();
    resetToGenesisState();
    resetChatToGenesis();
    window.dispatchEvent(new CustomEvent('wandersync:reset_all'));
    appBus.emit('simulation:reset_all');
    remoteSync.broadcast('RESET_COMPLETE', { success: true, message: 'All demo state restored to Genesis zero-state.' });
    triggerRefresh();
  });
}
