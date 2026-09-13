/**
 * Auto-scroll and drag-and-drop mechanics for the Itinerary timeline.
 */

export function createDragScrollController() {
  let autoScrollRaf = null;
  let autoScrollDelta = 0;
  let savedScrollBehavior = '';

  function startDragSession() {
    savedScrollBehavior = document.documentElement.style.scrollBehavior || '';
    document.documentElement.style.scrollBehavior = 'auto';
  }

  function stopAutoScroll() {
    autoScrollDelta = 0;
    if (autoScrollRaf) {
      cancelAnimationFrame(autoScrollRaf);
      autoScrollRaf = null;
    }
  }

  function endDragSession() {
    stopAutoScroll();
    document.documentElement.style.scrollBehavior = savedScrollBehavior;
  }

  function updateAutoScroll(pointerY) {
    const vh = window.innerHeight;
    const topThreshold = 150;
    const bottomThreshold = vh - 130;

    if (pointerY > bottomThreshold) {
      const distanceIntoZone = pointerY - bottomThreshold;
      const ratio = Math.min(1.8, Math.max(0, distanceIntoZone / 80));
      autoScrollDelta = Math.round(12 + Math.pow(ratio, 1.1) * 28);
    } else if (pointerY < topThreshold) {
      const distanceIntoZone = topThreshold - pointerY;
      const ratio = Math.min(1.8, Math.max(0, distanceIntoZone / 80));
      autoScrollDelta = -Math.round(12 + Math.pow(ratio, 1.1) * 28);
    } else {
      autoScrollDelta = 0;
    }

    if (autoScrollDelta !== 0 && !autoScrollRaf) {
      const loop = () => {
        if (autoScrollDelta !== 0) {
          window.scrollBy({ top: autoScrollDelta, left: 0, behavior: 'instant' });
          autoScrollRaf = requestAnimationFrame(loop);
        } else {
          autoScrollRaf = null;
        }
      };
      autoScrollRaf = requestAnimationFrame(loop);
    } else if (autoScrollDelta === 0 && autoScrollRaf) {
      cancelAnimationFrame(autoScrollRaf);
      autoScrollRaf = null;
    }
  }

  return {
    startDragSession,
    updateAutoScroll,
    stopAutoScroll,
    endDragSession,
    destroy: stopAutoScroll,
  };
}
