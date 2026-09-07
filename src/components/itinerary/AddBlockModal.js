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
            <label class="form-label" for="block-start">Start Time</label>
            <input type="time" class="form-input" id="block-start" value="14:00" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="block-end">End Time</label>
            <input type="time" class="form-input" id="block-end" value="15:30" required />
          </div>
        </div>

        <!-- Location -->
        <div class="form-group">
          <label class="form-label" for="block-location">Location / Landmark</label>
          <input type="text" class="form-input" id="block-location" placeholder="e.g. Shibuya, Tokyo" />
        </div>

        <!-- Requirements & Dress Code -->
        <div class="form-group">
          <label class="form-label" for="block-reqs">Requirements / What to Bring (comma separated)</label>
          <input type="text" class="form-input" id="block-reqs" placeholder="e.g. Passport, Walking shoes" />
        </div>

        <!-- Fallback if tentative -->
        <div class="form-group" id="add-fallback-group" style="display: none;">
          <label class="form-label" for="block-fallback">Fallback Plan (if rainy/delayed)</label>
          <input type="text" class="form-input" id="block-fallback" placeholder="e.g. Indoor Underground Arcade" />
        </div>

        <div style="display: flex; gap: 8px; margin-top: 8px;">
          <button type="submit" class="btn btn--primary" style="flex: 1;">Add to Timeline</button>
          <button type="button" class="btn btn--secondary" id="cancel-add-btn">Cancel</button>
        </div>
      </form>
    </div>
  `;

  const closeBtn = backdrop.querySelector('#close-add-modal-btn');
  const cancelBtn = backdrop.querySelector('#cancel-add-btn');
  const form = backdrop.querySelector('#add-block-form');
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

  function open(day) {
    activeDay = day || 1;
    form.reset();
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
