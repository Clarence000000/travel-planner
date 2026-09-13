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
  let hasDragged = false;

  slider.style.cursor = "grab";

  function onMouseMove(e) {
    if (!isDown) return;
    const currentX = e.pageX !== undefined && e.pageX !== 0 ? e.pageX : e.clientX;
    const walk = (currentX - startX) * 1.5;
    if (Math.abs(walk) > 4) {
      hasDragged = true;
    }
    slider.scrollLeft = scrollLeft - walk;
  }

  function onMouseUp() {
    if (isDown) {
      isDown = false;
      slider.style.cursor = "grab";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }
  }

  slider.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    isDown = true;
    hasDragged = false;
    slider.style.cursor = "grabbing";
    startX = e.pageX !== undefined && e.pageX !== 0 ? e.pageX : e.clientX;
    scrollLeft = slider.scrollLeft;
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  });

  slider.addEventListener("click", (e) => {
    if (hasDragged) {
      e.preventDefault();
      e.stopPropagation();
      hasDragged = false;
    }
  }, true);

  // Enable horizontal mouse wheel scrolling
  slider.addEventListener("wheel", (e) => {
    if (slider.scrollWidth > slider.clientWidth) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && e.deltaY !== 0) {
        e.preventDefault();
        slider.scrollLeft += e.deltaY;
      }
    }
  }, { passive: false });
}
