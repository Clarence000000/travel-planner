/**
 * WanderSync Remote Synchronization Layer
 * Zero-lag inter-tab & intra-tab communication layer powered by
 * the browser's BroadcastChannel API ('wandersync_simulation').
 *
 * Facilitates real-time control from headless / remote surfaces (e.g. /remote.html)
 * to the main presentation view, as well as background simulation events.
 * Provides both functional exports (sendRemoteEvent, onRemoteEvent) and
 * object/class exports (remoteSync.broadcast, remoteSync.subscribe).
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
  PING: 'PING',
  PONG: 'PONG',
};

class RemoteSyncEngine {
  constructor() {
    this.channel = null;
    this.subscribers = new Map(); // eventType -> Set of callbacks
    this.processedMessageIds = new Set();
    this.MAX_PROCESSED_HISTORY = 200;
    this.init();
  }

  init() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(SIMULATION_CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          this.handleIncomingMessage(event.data, 'broadcast');
        };
      } catch (err) {
        console.warn('[RemoteSync] BroadcastChannel init error:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('message', (e) => {
        if (e.data && e.data.__wandersync_sim) {
          this.handleIncomingMessage(e.data, 'window_message');
        }
      });

      window.addEventListener('wandersync:remote', (e) => {
        if (e.detail && e.detail.__wandersync_sim) {
          this.handleIncomingMessage(e.detail, 'custom_event');
        }
      });
    }
  }

  rememberMessageId(id) {
    if (!id) return;
    this.processedMessageIds.add(id);
    if (this.processedMessageIds.size > this.MAX_PROCESSED_HISTORY) {
      const first = this.processedMessageIds.values().next().value;
      this.processedMessageIds.delete(first);
    }
  }

  handleIncomingMessage(data, origin = 'unknown') {
    if (!data || typeof data !== 'object') return;
    const { id, type, payload } = data;

    if (id && this.processedMessageIds.has(id)) {
      return; // Deduplicate
    }
    if (id) {
      this.rememberMessageId(id);
    }

    // Auto-respond to PING with PONG
    if (type === 'PING') {
      this.broadcast('PONG', {
        activeHash: typeof window !== 'undefined' ? window.location.hash : '',
        timestamp: Date.now(),
        origin: 'main_app',
      });
    }

    // Type-specific subscribers
    const callbacks = this.subscribers.get(type);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(payload, data);
        } catch (e) {
          console.error(`[RemoteSync] Error executing subscriber for ${type}:`, e);
        }
      });
    }

    // Wildcard subscribers
    const wildcardCallbacks = this.subscribers.get('*');
    if (wildcardCallbacks) {
      wildcardCallbacks.forEach((cb) => {
        try {
          cb(payload, data);
        } catch (e) {
          console.error('[RemoteSync] Error executing wildcard subscriber:', e);
        }
      });
    }

    // Also dispatch to local window for decoupled UI triggers
    if (typeof window !== 'undefined' && type) {
      try {
        const semanticType = `wandersync:${String(type).toLowerCase().replace(/_/g, '_')}`;
        window.dispatchEvent(new CustomEvent(semanticType, { detail: payload || data }));
      } catch (e) {}
    }
  }

  /**
   * Broadcast an event to all open tabs/windows and controller
   */
  broadcast(type, payload = {}) {
    const eventId = `ws-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const msg = {
      __wandersync_sim: true,
      id: eventId,
      type,
      payload,
      timestamp: Date.now(),
      sender:
        typeof window !== 'undefined' && window.location.pathname.includes('remote')
          ? 'remote'
          : 'app',
    };

    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch (e) {
        console.warn('[RemoteSync] Broadcast failed:', e);
      }
    }

    // Local notification for same-window execution
    this.handleIncomingMessage(msg, 'local_broadcast');

    return msg;
  }

  /**
   * Subscribe to simulation events
   * @param {string} eventType - Event name or '*' for all events
   * @param {Function} callback - (payload, fullData) => void
   * @returns {Function} unsubscribe function
   */
  subscribe(eventType, callback) {
    if (typeof callback !== 'function') return () => {};
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType).add(callback);

    return () => {
      this.off(eventType, callback);
    };
  }

  on(eventType, callback) {
    return this.subscribe(eventType, callback);
  }

  off(eventType, callback) {
    const set = this.subscribers.get(eventType);
    if (set) {
      set.delete(callback);
      if (set.size === 0) this.subscribers.delete(eventType);
    }
  }

  clearAll() {
    this.subscribers.clear();
  }
}

export const remoteSync = new RemoteSyncEngine();

/**
 * Functional API compatibility exports
 */
export function getSimulationChannel() {
  return remoteSync.channel;
}

export function sendRemoteEvent(type, payload = {}) {
  return remoteSync.broadcast(type, payload);
}

export function onRemoteEvent(type, callback) {
  return remoteSync.subscribe(type, callback);
}

export function clearRemoteListeners() {
  remoteSync.clearAll();
}

export default remoteSync;
