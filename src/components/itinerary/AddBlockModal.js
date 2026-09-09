/**
 * Add / Propose Block Modal Component
 * Allows travelers to propose a new activity, meal, transit, or rest block.
 */

export function createAddBlockModal({ onAdd }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'itinerary-modal-backdrop';
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');

  backdrop.innerHTML = `
    <div class="itinerary-modal-sheet">
      <div class="itinerary-modal-header">
        <div>
          <span style="font-size: 11px; font-weight: bold; color: var(--color-primary); text-transform: uppercase;">
            Interactive Timeline
          </span>
          <h3 class="itinerary-modal-title">Propose New Time Block</h3>
        </div>
        <button type="button" class="drawer-close-btn" id="close-add-modal-btn" aria-label="Close modal">✕</button>
      </div>

      <form class="itinerary-form" id="add-block-form">
        <!-- Title -->
        <div class="form-group">
          <label class="form-label" for="block-title">Event Title *</label>
          <input type="text" class="form-input" id="block-title" placeholder="e.g. Meiji Shrine Morning Walk" required />
        </div>

        <!-- Category & Status -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label" for="block-category">Category</label>
            <select class="form-select" id="block-category">
              <option value="activity">Activity</option>
              <option value="meal">Meal</option>
              <option value="transit">Transit</option>
              <option value="rest">Check-in / Rest</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="block-status">Initial Status</label>
            <select class="form-select" id="block-status">
              <option value="proposed">Proposed</option>
              <option value="confirmed">Confirmed</option>
              <option value="tentative">Weather Permitting</option>
            </select>
          </div>
        </div>

        <!-- Times -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label" for="block-start">Start Time *</label>
            <input type="time" class="form-input" id="block-start" value="10:00" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="block-end">End Time *</label>
            <input type="time" class="form-input" id="block-end" value="11:30" required />
          </div>
        </div>

        <!-- Location -->
        <div class="form-group">
          <label class="form-label" for="block-location">Location / Stop</label>
          <input type="text" class="form-input" id="block-location" placeholder="e.g. Harajuku, Shibuya City" />
        </div>

        <!-- Requirements -->
        <div class="form-group">
          <label class="form-label" for="block-reqs">Requirements (comma-separated)</label>
          <input type="text" class="form-input" id="block-reqs" placeholder="e.g. Walking Shoes, Hat Clips, Tickets" />
        </div>

        <!-- Weather Fallback (Conditional) -->
        <div class="form-group" id="add-fallback-group" style="display: none;">
          <label class="form-label" for="block-fallback">Indoor / Weather Backup Stop</label>
          <input type="text" class="form-input" id="block-fallback" placeholder="e.g. Mori Art Museum Roppongi Hills" />
        </div>

        <div class="itinerary-modal-footer">
          <button type="button" class="btn btn--secondary" id="cancel-add-btn">Cancel</button>
          <button type="submit" class="btn btn--primary" id="confirm-add-btn">Add to Timeline</button>
        </div>
      </form>
    </div>
  `;

  const form = backdrop.querySelector('#add-block-form');
  const closeBtn = backdrop.querySelector('#close-add-modal-btn');
  const cancelBtn = backdrop.querySelector('#cancel-add-btn');
  const statusSelect = backdrop.querySelector('#block-status');
  const fallbackGroup = backdrop.querySelector('#add-fallback-group');

  let activeDay = 1;

  statusSelect.addEventListener('change', () => {
    if (statusSelect.value === 'tentative') {
      fallbackGroup.style.display = 'flex';
    } else {
      fallbackGroup.style.display = 'none';
    }
  });

  function open(day, defaults = {}) {
    activeDay = day || 1;
    form.reset();
    if (defaults.startTime) {
      const startEl = backdrop.querySelector('#block-start');
      if (startEl) startEl.value = defaults.startTime;
      const [h, m] = defaults.startTime.split(':').map(Number);
      const endH = Math.min(23, h + 2);
      const endEl = backdrop.querySelector('#block-end');
      if (endEl) endEl.value = `${String(endH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
    }
    statusSelect.value = 'proposed';
    fallbackGroup.style.display = 'none';
    backdrop.classList.add('is-open');
  }

  function close() {
    backdrop.classList.remove('is-open');
  }

  closeBtn.addEventListener('click', close);
  cancelBtn.addEventListener('click', close);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = backdrop.querySelector('#block-title').value.trim();
    const category = backdrop.querySelector('#block-category').value;
    const status = statusSelect.value;
    const startTime = backdrop.querySelector('#block-start').value;
    const endTime = backdrop.querySelector('#block-end').value;
    const location = backdrop.querySelector('#block-location').value.trim() || 'TBD';
    const reqsStr = backdrop.querySelector('#block-reqs').value.trim();
    const fallback = backdrop.querySelector('#block-fallback').value.trim() || null;

    const requirements = reqsStr ? reqsStr.split(',').map((s) => s.trim()) : [];

    const newBlock = {
      id: `block-${Date.now()}`,
      day: activeDay,
      startTime,
      endTime,
      category,
      status,
      title,
      location,
      transitToNextMinutes: 20,
      transitMode: 'Transit to next stop',
      requirements,
      fallback: status === 'tentative' ? fallback : null,
      notes: 'Proposed by group member',
      dressCode: 'Casual',
    };

    if (onAdd) {
      onAdd(newBlock);
    }
    close();
  });

  return {
    element: backdrop,
    open,
    close,
  };
}
