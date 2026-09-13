/**
 * Add / Edit Block Modal Component
 * Allows travelers to propose a new activity, meal, transit, or rest block,
 * or edit an existing schedule block with full details and optional dress code.
 */

import { createChatThread } from '../../models/chatData.js';

export function createAddBlockModal({ onAdd, onUpdate }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'itinerary-modal-backdrop';
  backdrop.id = 'add-block-modal';
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');

  backdrop.innerHTML = `
    <div class="itinerary-modal-sheet">
      <div class="itinerary-modal-header">
        <div>
          <span style="font-size: 11px; font-weight: bold; color: var(--color-primary); text-transform: uppercase;">
            Interactive Timeline
          </span>
          <h3 class="itinerary-modal-title" id="itinerary-modal-heading">Propose New Time Block</h3>
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
            <label class="form-label" for="block-status">Status</label>
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

        <!-- Description / Notes -->
        <div class="form-group">
          <label class="form-label" for="block-notes">Description / Notes</label>
          <textarea class="form-input" id="block-notes" rows="2" placeholder="Helpful details, tips, or group context..."></textarea>
        </div>

        <!-- Dress Code (Optional) -->
        <div class="form-group">
          <label class="form-label" for="block-dress-code">Dress Code (Optional)</label>
          <input type="text" class="form-input" id="block-dress-code" placeholder="e.g. Smart Casual, Modest attire (Leave blank if none)" />
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
  const modalHeading = backdrop.querySelector('#itinerary-modal-heading');
  const confirmBtn = backdrop.querySelector('#confirm-add-btn');

  let activeDay = 1;
  let currentEditingBlock = null;

  statusSelect.addEventListener('change', () => {
    if (statusSelect.value === 'tentative') {
      fallbackGroup.style.display = 'flex';
    } else {
      fallbackGroup.style.display = 'none';
    }
  });

  function open(day, defaults = {}, editingBlock = null) {
    if (!document.body.contains(backdrop)) {
      document.body.appendChild(backdrop);
    }
    activeDay = day || 1;
    currentEditingBlock = editingBlock || null;
    form.reset();

    if (currentEditingBlock) {
      // Pre-fill editing block values
      modalHeading.textContent = 'Edit Activity Details';
      confirmBtn.textContent = 'Save Changes';

      backdrop.querySelector('#block-title').value = currentEditingBlock.title || '';
      backdrop.querySelector('#block-category').value = currentEditingBlock.category || 'activity';
      statusSelect.value = currentEditingBlock.status || 'proposed';
      backdrop.querySelector('#block-start').value = currentEditingBlock.startTime || '10:00';
      backdrop.querySelector('#block-end').value = currentEditingBlock.endTime || '11:30';
      backdrop.querySelector('#block-location').value = currentEditingBlock.location || '';
      backdrop.querySelector('#block-notes').value = currentEditingBlock.notes || '';
      backdrop.querySelector('#block-dress-code').value = currentEditingBlock.dressCode || '';
      backdrop.querySelector('#block-reqs').value = (currentEditingBlock.requirements || []).join(', ');
      backdrop.querySelector('#block-fallback').value = currentEditingBlock.fallback || '';

      fallbackGroup.style.display = currentEditingBlock.status === 'tentative' ? 'flex' : 'none';
    } else {
      modalHeading.textContent = 'Propose New Time Block';
      confirmBtn.textContent = 'Add to Timeline';

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
      backdrop.querySelector('#block-dress-code').value = '';
    }

    backdrop.classList.add('is-open');
  }

  function close() {
    backdrop.classList.remove('is-open');
    currentEditingBlock = null;
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
    const notesInput = backdrop.querySelector('#block-notes');
    const notesStr = notesInput ? notesInput.value.trim() : '';
    const reqsStr = backdrop.querySelector('#block-reqs').value.trim();
    const fallback = backdrop.querySelector('#block-fallback').value.trim() || null;
    const dressCodeInput = backdrop.querySelector('#block-dress-code');
    const dressCode = dressCodeInput && dressCodeInput.value.trim() ? dressCodeInput.value.trim() : null;

    const requirements = reqsStr ? reqsStr.split(',').map((s) => s.trim()) : [];

    if (currentEditingBlock) {
      const updatedBlock = {
        ...currentEditingBlock,
        title,
        category,
        status,
        startTime,
        endTime,
        location,
        requirements,
        fallback: status === 'tentative' ? fallback : null,
        notes: notesStr || null,
        dressCode: dressCode,
      };

      if (onUpdate) {
        onUpdate(updatedBlock);
      }
    } else {
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
        notes: notesStr || 'Proposed by group member',
        dressCode: dressCode,
      };

      // Auto-create chat thread for this new activity
      try {
        createChatThread({
          blockId: newBlock.id,
          title: newBlock.title,
          category: newBlock.category,
          day: newBlock.day,
          location: newBlock.location,
        });
      } catch (err) {
        console.warn('Could not auto-create thread for new block:', err);
      }

      if (onAdd) {
        onAdd(newBlock);
      }
    }

    close();
  });

  return {
    element: backdrop,
    open,
    close,
  };
}
