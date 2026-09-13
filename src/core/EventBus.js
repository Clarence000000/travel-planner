/**
 * Lightweight, zero-dependency EventBus for WanderSync.
 * Enables decoupled communication between feature views, components,
 * data models, and the remote simulation engine.
 */

class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Subscribe to an event.
   * @param {string} event
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    return () => this.off(event, callback);
  }

  /**
   * Subscribe to an event once.
   * @param {string} event
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  once(event, callback) {
    const wrapper = (payload) => {
      this.off(event, wrapper);
      callback(payload);
    };
    return this.on(event, wrapper);
  }

  /**
   * Unsubscribe from an event.
   * @param {string} event
   * @param {Function} callback
   */
  off(event, callback) {
    const bucket = this.listeners.get(event);
    if (bucket) {
      bucket.delete(callback);
      if (bucket.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emit an event to all subscribers.
   * @param {string} event
   * @param {*} payload
   */
  emit(event, payload) {
    const bucket = this.listeners.get(event);
    if (bucket) {
      // Create a snapshot to prevent mutation during iteration
      Array.from(bucket).forEach((callback) => {
        try {
          callback(payload);
        } catch (err) {
          console.error(`[EventBus] Error in handler for event "${event}":`, err);
        }
      });
    }
  }

  /**
   * Clear all registered listeners.
   */
  clear() {
    this.listeners.clear();
  }
}

export const appBus = new EventBus();
