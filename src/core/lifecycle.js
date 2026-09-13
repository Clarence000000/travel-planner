/**
 * Component Lifecycle & Memory Safety Utilities.
 * Manages element binding and auto-disposal of event listeners, intervals, and observers.
 */

export function createLifecycleScope() {
  const disposables = [];

  return {
    /**
     * Attach an event listener and register its cleanup.
     */
    listen(target, event, handler, options) {
      if (!target || typeof target.addEventListener !== 'function') return () => {};
      target.addEventListener(event, handler, options);
      const dispose = () => {
        try {
          target.removeEventListener(event, handler, options);
        } catch (e) {}
      };
      disposables.push(dispose);
      return dispose;
    },

    /**
     * Register a disposable function or object with a destroy/dispose method.
     */
    add(disposable) {
      if (typeof disposable === 'function') {
        disposables.push(disposable);
      } else if (disposable && typeof disposable.destroy === 'function') {
        disposables.push(() => disposable.destroy());
      } else if (disposable && typeof disposable.dispose === 'function') {
        disposables.push(() => disposable.dispose());
      }
      return disposable;
    },

    /**
     * Set a timeout that is automatically cancelled on destroy.
     */
    timeout(fn, delay) {
      const timer = setTimeout(fn, delay);
      disposables.push(() => clearTimeout(timer));
      return timer;
    },

    /**
     * Set an interval that is automatically cancelled on destroy.
     */
    interval(fn, delay) {
      const timer = setInterval(fn, delay);
      disposables.push(() => clearInterval(timer));
      return timer;
    },

    /**
     * Dispose all registered resources.
     */
    dispose() {
      while (disposables.length > 0) {
        const fn = disposables.pop();
        try {
          fn();
        } catch (err) {
          console.error('[Lifecycle] Error during cleanup:', err);
        }
      }
    },
  };
}
