/**
 * WanderSync BroadcastChannel Simulation Synchronization Utility
 * Enables zero-lag, headless two-way messaging between the main application
 * and the standalone presenter remote controller (remote.html).
 */

const CHANNEL_NAME = 'wandersync_simulation';

class RemoteSync {
  constructor() {
    this.channel = null;
    this.subscribers = new Map(); // eventType -> Set of callbacks
    this.init();
  }

  init() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          this.handleIncomingMessage(event.data);
        };
      } catch (err) {
        console.warn('[RemoteSync] BroadcastChannel init error:', err);
      }
    }

    // Also bridge window-level CustomEvents
    if (typeof window !== 'undefined') {
      window.addEventListener('message', (e) => {
        if (e.data && e.data.__wandersync_sim) {
          this.handleIncomingMessage(e.data);
        }
      });
    }
  }

  handleIncomingMessage(data) {
    if (!data || typeof data !== 'object') return;
    const { type, payload } = data;

    // Auto-respond to PING with PONG
    if (type === 'PING') {
      this.broadcast('PONG', {
        activeHash: typeof window !== 'undefined' ? window.location.hash : '',
        timestamp: Date.now(),
        origin: 'main_app',
      });
    }

    // Notify registered subscribers
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
          cb(type, payload, data);
        } catch (e) {
          console.error('[RemoteSync] Error executing wildcard subscriber:', e);
        }
      });
    }

    // Also dispatch to local window for decoupled UI triggers
    if (typeof window !== 'undefined' && type) {
      try {
        const eventName = `wandersync:${type.toLowerCase()}`;
        window.dispatchEvent(new CustomEvent(eventName, { detail: { type, payload, raw: data } }));
      } catch (e) {}
    }
  }

  /**
   * Broadcast an event to all open tabs/windows and controller
   */
  broadcast(type, payload = {}) {
    const msg = {
      __wandersync_sim: true,
      type,
      payload,
      timestamp: Date.now(),
      sender: typeof window !== 'undefined' && window.location.pathname.includes('remote') ? 'remote' : 'app',
    };

    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch (e) {
        console.warn('[RemoteSync] Broadcast failed:', e);
      }
    }

    // Local notification for same-window execution
    this.handleIncomingMessage(msg);

    return msg;
  }

  /**
   * Subscribe to simulation events
   * @param {string} eventType - Event name or '*' for all events
   * @param {Function} callback - (payload, fullData) => void
   * @returns {Function} unsubscribe function
   */
  subscribe(eventType, callback) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType).add(callback);

    return () => {
      const set = this.subscribers.get(eventType);
      if (set) {
        set.delete(callback);
        if (set.size === 0) this.subscribers.delete(eventType);
      }
    };
  }
}

export const remoteSync = new RemoteSync();
export default remoteSync;
