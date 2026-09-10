/**
 * Remote Synchronization Layer
 * Zero-lag inter-tab & intra-tab communication layer powered by
 * the browser's BroadcastChannel API ('wandersync_simulation').
 *
 * Facilitates real-time control from headless / remote surfaces (e.g. /remote.html)
 * to the main presentation view, as well as background simulation events.
 */

export const SIMULATION_CHANNEL_NAME = 'wandersync_simulation';

export const REMOTE_EVENT_TYPES = {
  TRIGGER_PHASE: 'TRIGGER_PHASE',
  DAY2_ACTIVITY: 'DAY2_ACTIVITY',
  CHAT_INFLUX: 'CHAT_INFLUX',
  INSERT_PROPOSAL: 'INSERT_PROPOSAL',
  START_VOTE: 'START_VOTE',
  VOTE_COMPLETED: 'VOTE_COMPLETED',
  SHIFT_TO_DAY3: 'SHIFT_TO_DAY3',
  CONTINGENCY_RAIN: 'CONTINGENCY_RAIN',
  RESOLVE_CONTINGENCY: 'RESOLVE_CONTINGENCY',
  RESET_DEMO: 'RESET_DEMO',
};

let broadcastChannelInstance = null;
const registeredListeners = new Set();
const processedMessageIds = new Set();
const MAX_PROCESSED_HISTORY = 200;

function rememberMessageId(id) {
  if (!id) return;
  processedMessageIds.add(id);
  if (processedMessageIds.size > MAX_PROCESSED_HISTORY) {
    const first = processedMessageIds.values().next().value;
    processedMessageIds.delete(first);
  }
}

/**
 * Get or create the BroadcastChannel instance for simulation
 */
export function getSimulationChannel() {
  if (typeof BroadcastChannel === 'undefined') {
    return null;
  }
  if (!broadcastChannelInstance) {
    try {
      broadcastChannelInstance = new BroadcastChannel(SIMULATION_CHANNEL_NAME);
      broadcastChannelInstance.onmessage = (event) => {
        handleIncomingMessage(event.data, 'broadcast');
      };
    } catch (e) {
      console.warn('[RemoteSync] Failed to initialize BroadcastChannel:', e);
      broadcastChannelInstance = null;
    }
  }
  return broadcastChannelInstance;
}

/**
 * Internal handler for incoming messages from either BroadcastChannel or DOM CustomEvent
 */
function handleIncomingMessage(data, origin = 'unknown') {
  if (!data || typeof data !== 'object') return;
  const { id, type, payload } = data;

  if (id && processedMessageIds.has(id)) {
    return; // Prevent duplicate invocation
  }
  if (id) {
    rememberMessageId(id);
  }

  registeredListeners.forEach((listenerObj) => {
    if (listenerObj.type === '*' || listenerObj.type === type) {
      try {
        listenerObj.callback(payload, data);
      } catch (err) {
        console.error(`[RemoteSync] Error executing listener for event '${type}':`, err);
      }
    }
  });
}

// Setup window listener for intra-tab custom events
if (typeof window !== 'undefined') {
  window.addEventListener('wandersync:remote', (event) => {
    if (event.detail) {
      handleIncomingMessage(event.detail, 'custom-event');
    }
  });
}

/**
 * Send a remote simulation event over BroadcastChannel and local window dispatch.
 *
 * @param {string} type One of REMOTE_EVENT_TYPES or custom event name
 * @param {Object} payload Event data payload
 * @returns {Object} Complete event envelope with id and timestamp
 */
export function sendRemoteEvent(type, payload = {}) {
  const eventId = `ws-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const envelope = {
    id: eventId,
    type,
    payload,
    timestamp: Date.now(),
    sender: typeof window !== 'undefined' ? window.name || 'client' : 'backend',
  };

  // Broadcast to other tabs / windows
  const channel = getSimulationChannel();
  if (channel) {
    try {
      channel.postMessage(envelope);
    } catch (err) {
      console.warn('[RemoteSync] BroadcastChannel postMessage failed:', err);
    }
  }

  // Dispatch within the same window / tab
  if (typeof window !== 'undefined') {
    try {
      // Record this message ID so local window listener handles it once
      window.dispatchEvent(
        new CustomEvent('wandersync:remote', { detail: envelope })
      );

      // Also trigger a direct semantic custom event e.g. wandersync:day2_activity
      const semanticType = `wandersync:${String(type).toLowerCase().replace(/_/g, '_')}`;
      window.dispatchEvent(
        new CustomEvent(semanticType, { detail: payload })
      );
    } catch (err) {
      console.warn('[RemoteSync] Local window dispatch failed:', err);
    }
  }

  return envelope;
}

/**
 * Subscribe to remote simulation events.
 *
 * @param {string} type Target event type (or '*' for all events)
 * @param {Function} callback Function receiving (payload, envelope)
 * @returns {Function} Unsubscribe function
 */
export function onRemoteEvent(type, callback) {
  if (typeof callback !== 'function') {
    return () => {};
  }

  // Ensure channel is initialized
  getSimulationChannel();

  const listenerObj = { type, callback };
  registeredListeners.add(listenerObj);

  return () => {
    registeredListeners.delete(listenerObj);
  };
}

/**
 * Reset all registered listeners (for testing / cleanup)
 */
export function clearRemoteListeners() {
  registeredListeners.clear();
}
