/**
 * Utility: Enable smooth mouse-drag & wheel scrolling on horizontal pill rows
 * Allows desktop and mouse users to click and drag horizontal containers
 * such as day-chip-rows, category-filter-bars, and scenario chips.
 */

export function enableDragScroll(slider) {
  if (!slider) return;

  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;

  slider.style.cursor = 'grab';

  slider.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    isDown = true;
    slider.style.cursor = 'grabbing';
    const pageX = e.pageX !== undefined && e.pageX !== 0 ? e.pageX : e.clientX;
    startX = pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
  });

  window.addEventListener('mouseup', () => {
    if (isDown) {
      isDown = false;
      slider.style.cursor = 'grab';
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    const pageX = e.pageX !== undefined && e.pageX !== 0 ? e.pageX : e.clientX;
    const x = pageX - slider.offsetLeft;
    const walk = (x - startX) * 1.5;
    slider.scrollLeft = scrollLeft - walk;
  });

  // Enable horizontal mouse wheel scrolling
  slider.addEventListener('wheel', (e) => {
    if (e.deltaY !== 0 && slider.scrollWidth > slider.clientWidth) {
      e.preventDefault();
      slider.scrollLeft += e.deltaY;
    }
  }, { passive: false });
}
