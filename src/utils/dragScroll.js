/**
 * Utility: Enable smooth mouse-drag scrolling on horizontal pill rows
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
    // Only handle primary mouse button
    if (e.button !== 0) return;
    isDown = true;
    slider.style.cursor = 'grabbing';
    startX = e.pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
  });

  window.addEventListener('mouseup', () => {
    if (isDown) {
      isDown = false;
      slider.style.cursor = 'grab';
    }
  });

  slider.addEventListener('mouseleave', () => {
    isDown = false;
    slider.style.cursor = 'grab';
  });

  slider.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 1.5;
    slider.scrollLeft = scrollLeft - walk;
  });
}
