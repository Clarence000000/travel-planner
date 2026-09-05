/**
 * View: Trip Idea Wishlist & Interactive Whiteboard
 * Collaborative space to collect candidate destinations, photos, and links,
 * plus a tactile sticky-notes whiteboard with 1-tap promotion to itinerary days.
 */

import {
  getWishlist,
  addWishlistItem,
  toggleWishlistVote,
  getWhiteboardNotes,
  addWhiteboardNote,
  updateWhiteboardNote,
  deleteWhiteboardNote,
  promoteToItinerary,
} from '../models/wishlistData.js';

export function createIdeasView() {
  const container = document.createElement('div');
  container.className = 'feature-view ideas-view';

  let currentSubTab = 'wishlist'; // 'wishlist' | 'whiteboard'
  let currentCategory = 'all';
  let selectedStickyColor = 'yellow';

  function showToast(message) {
    const existing = document.querySelector('.toast-notice');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notice';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 2800);
  }

  function render() {
    container.innerHTML = `
      <div class="view-header">
        <div class="view-header__meta">
          <span class="view-badge">Collaborative Ideation</span>
          <p class="view-subtitle">Brainstorm stops, drop links & photos, and sketch ideas before locking them in</p>
        </div>

        <!-- Segmented Sub-view Switcher -->
        <div class="segmented-control" role="tablist">
          <button 
            type="button" 
            class="segmented-btn ${currentSubTab === 'wishlist' ? 'segmented-btn--active' : ''}" 
            data-subtab="wishlist"
          >
            <span>💡 Trip Wishlist</span>
          </button>
          <button 
            type="button" 
            class="segmented-btn ${currentSubTab === 'whiteboard' ? 'segmented-btn--active' : ''}" 
            data-subtab="whiteboard"
          >
            <span>📌 Idea Whiteboard</span>
          </button>
        </div>
      </div>

      <!-- Sub-view Container -->
      <div id="ideas-subview-content"></div>
    `;

    // Attach sub-tab events
    const subTabBtns = container.querySelectorAll('.segmented-btn');
    subTabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        currentSubTab = btn.getAttribute('data-subtab');
        render();
      });
    });

    const targetSlot = container.querySelector('#ideas-subview-content');
    if (currentSubTab === 'wishlist') {
      renderWishlist(targetSlot);
    } else {
      renderWhiteboard(targetSlot);
    }
  }

  // ──────────────── Render Wishlist ────────────────

  function renderWishlist(target) {
    const items = getWishlist();
    const filtered =
      currentCategory === 'all'
        ? items
        : items.filter((item) => item.category === currentCategory);

    const wrap = document.createElement('div');
    wrap.className = 'wishlist-container';

    wrap.innerHTML = `
      <div class="wishlist-controls">
        <div class="category-filter-bar">
          <button class="filter-chip ${currentCategory === 'all' ? 'filter-chip--active' : ''}" data-cat="all">All (${items.length})</button>
          <button class="filter-chip ${currentCategory === 'sightseeing' ? 'filter-chip--active' : ''}" data-cat="sightseeing">⛩️ Sightseeing</button>
          <button class="filter-chip ${currentCategory === 'food' ? 'filter-chip--active' : ''}" data-cat="food">🍜 Food</button>
          <button class="filter-chip ${currentCategory === 'activity' ? 'filter-chip--active' : ''}" data-cat="activity">🎯 Activity</button>
          <button class="filter-chip ${currentCategory === 'nightlife' ? 'filter-chip--active' : ''}" data-cat="nightlife">🍸 Nightlife</button>
        </div>
        <button type="button" class="btn btn--primary btn--sm" id="btn-open-add-wishlist">
          <span>➕ Add</span>
        </button>
      </div>

      <div class="wishlist-grid">
        ${
          filtered.length === 0
            ? `<div style="text-align: center; padding: 32px 16px; color: var(--color-text-secondary); font-size: var(--text-sm);">
                No ideas found in this category. Tap <strong>+ Add</strong> to save one!
               </div>`
            : filtered
                .map(
                  (item) => `
            <div class="wishlist-card" data-id="${item.id}">
              <div class="wishlist-card__image-wrap">
                <img src="${item.imageUrl}" alt="${item.title}" class="wishlist-card__image" loading="lazy" />
                <div class="wishlist-card__badge-row">
                  <span class="wishlist-card__category">${item.category}</span>
                  <span class="wishlist-card__cost">${item.estimatedCost}</span>
                </div>
              </div>
              <div class="wishlist-card__body">
                <div class="wishlist-card__header">
                  <h3 class="wishlist-card__title">${item.title}</h3>
                </div>
                <p class="wishlist-card__desc">${item.description}</p>
                
                <div class="wishlist-card__meta">
                  <span class="wishlist-card__author">Added by ${item.addedBy}</span>
                  ${
                    item.url
                      ? `<a href="${item.url}" target="_blank" rel="noopener" class="wishlist-card__link">
                          <span>Explore link</span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                          </svg>
                        </a>`
                      : ''
                  }
                </div>

                <div class="wishlist-card__actions">
                  <button type="button" class="btn-vote ${item.userVoted ? 'btn-vote--active' : ''}" data-vote-id="${item.id}">
                    <span>${item.userVoted ? '❤️' : '🤍'}</span>
                    <span>${item.votes}</span>
                  </button>
                  <button type="button" class="btn btn--primary btn--sm" style="flex: 1;" data-schedule-id="${item.id}">
                    <span>📅 Add to Schedule</span>
                  </button>
                </div>
              </div>
            </div>
          `
                )
                .join('')
        }
      </div>
    `;

    // Filter chip clicks
    wrap.querySelectorAll('.filter-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentCategory = btn.getAttribute('data-cat');
        renderWishlist(target);
      });
    });

    // Vote button clicks
    wrap.querySelectorAll('.btn-vote').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-vote-id');
        toggleWishlistVote(id);
        renderWishlist(target);
      });
    });

    // Add to schedule button clicks
    wrap.querySelectorAll('[data-schedule-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-schedule-id');
        const item = items.find((i) => i.id === id);
        if (item) openScheduleModal(item);
      });
    });

    // Add new wishlist item button
    wrap.querySelector('#btn-open-add-wishlist').addEventListener('click', openAddWishlistModal);

    target.innerHTML = '';
    target.appendChild(wrap);
  }

  // ──────────────── Render Whiteboard ────────────────

  function renderWhiteboard(target) {
    const notes = getWhiteboardNotes();
    const wrap = document.createElement('div');
    wrap.className = 'whiteboard-container';

    wrap.innerHTML = `
      <div class="whiteboard-toolbar">
        <div class="whiteboard-toolbar__row">
          <div class="color-picker-row">
            <span style="font-size: 11px; font-weight: 600; color: var(--color-text-secondary); margin-right: 4px;">Color:</span>
            <button type="button" class="color-swatch swatch--yellow ${selectedStickyColor === 'yellow' ? 'color-swatch--active' : ''}" data-color="yellow" aria-label="Yellow note"></button>
            <button type="button" class="color-swatch swatch--peach ${selectedStickyColor === 'peach' ? 'color-swatch--active' : ''}" data-color="peach" aria-label="Peach note"></button>
            <button type="button" class="color-swatch swatch--mint ${selectedStickyColor === 'mint' ? 'color-swatch--active' : ''}" data-color="mint" aria-label="Mint note"></button>
            <button type="button" class="color-swatch swatch--sky ${selectedStickyColor === 'sky' ? 'color-swatch--active' : ''}" data-color="sky" aria-label="Sky note"></button>
            <button type="button" class="color-swatch swatch--purple ${selectedStickyColor === 'purple' ? 'color-swatch--active' : ''}" data-color="purple" aria-label="Purple note"></button>
          </div>
          <button type="button" class="btn btn--primary btn--sm" id="btn-add-note">
            <span>➕ Note</span>
          </button>
        </div>
        <div class="whiteboard-instructions">
          <span>🖐 Drag notes freely • Double-tap canvas to place note</span>
        </div>
      </div>

      <div class="whiteboard-canvas" id="whiteboard-canvas-surface">
        ${notes
          .map(
            (n) => `
          <div 
            class="sticky-note sticky-note--${n.color}" 
            id="note-elem-${n.id}"
            data-note-id="${n.id}"
            style="left: ${n.x}px; top: ${n.y}px;"
          >
            <div class="sticky-note__pin">
              <span class="sticky-note__tag">${n.tag}</span>
              <button type="button" class="sticky-note__delete" data-del-id="${n.id}" title="Delete note">✕</button>
            </div>
            <input 
              type="text" 
              class="sticky-note__title-input" 
              value="${n.title}" 
              data-edit-title="${n.id}"
              placeholder="Note title..."
            />
            <textarea 
              class="sticky-note__content" 
              data-edit-text="${n.id}"
              placeholder="Write thoughts..."
            >${n.text}</textarea>
            <div class="sticky-note__footer">
              <span class="sticky-note__author">By ${n.author}</span>
              <button type="button" class="btn-note-schedule" data-note-schedule="${n.id}">
                + Schedule
              </button>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    `;

    // Color switcher
    wrap.querySelectorAll('.color-swatch').forEach((swatch) => {
      swatch.addEventListener('click', () => {
        selectedStickyColor = swatch.getAttribute('data-color');
        wrap.querySelectorAll('.color-swatch').forEach((s) => s.classList.remove('color-swatch--active'));
        swatch.classList.add('color-swatch--active');
      });
    });

    const canvas = wrap.querySelector('#whiteboard-canvas-surface');

    // Add note button
    wrap.querySelector('#btn-add-note').addEventListener('click', () => {
      const newNote = addWhiteboardNote({
        title: 'New Idea',
        text: 'Drop inspiration or logistics note here.',
        color: selectedStickyColor,
        x: 40 + Math.floor(Math.random() * 60),
        y: 60 + Math.floor(Math.random() * 80),
        tag: 'Idea',
      });
      renderWhiteboard(target);
      showToast(`📝 Sticky note added!`);
    });

    // Double-click/double-tap canvas to add note
    canvas.addEventListener('dblclick', (e) => {
      if (e.target.closest('.sticky-note')) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(10, Math.min(rect.width - 180, e.clientX - rect.left - 80));
      const y = Math.max(10, Math.min(rect.height - 160, e.clientY - rect.top - 40));

      addWhiteboardNote({
        title: 'Quick Thought',
        text: 'Double-tapped note.',
        color: selectedStickyColor,
        x: Math.round(x),
        y: Math.round(y),
        tag: 'Idea',
      });
      renderWhiteboard(target);
    });

    // Delete note
    wrap.querySelectorAll('.sticky-note__delete').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-del-id');
        deleteWhiteboardNote(id);
        renderWhiteboard(target);
      });
    });

    // Title & text editing
    wrap.querySelectorAll('[data-edit-title]').forEach((input) => {
      input.addEventListener('change', () => {
        const id = input.getAttribute('data-edit-title');
        updateWhiteboardNote(id, { title: input.value });
      });
    });

    wrap.querySelectorAll('[data-edit-text]').forEach((textarea) => {
      textarea.addEventListener('change', () => {
        const id = textarea.getAttribute('data-edit-text');
        updateWhiteboardNote(id, { text: textarea.value });
      });
    });

    // Schedule note button
    wrap.querySelectorAll('[data-note-schedule]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-note-schedule');
        const note = notes.find((n) => n.id === id);
        if (note) {
          openScheduleModal({
            title: note.title,
            description: note.text,
            category: 'activity',
          });
        }
      });
    });

    // Dragging mechanics with Pointer Events
    const noteElements = wrap.querySelectorAll('.sticky-note');
    noteElements.forEach((elem) => {
      let isDragging = false;
      let startX, startY;
      let initialLeft, initialTop;
      const noteId = elem.getAttribute('data-note-id');

      elem.addEventListener('pointerdown', (e) => {
        // Prevent drag when interacting with inputs
        if (['INPUT', 'TEXTAREA', 'BUTTON'].includes(e.target.tagName)) return;

        isDragging = true;
        elem.setPointerCapture(e.pointerId);
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = elem.offsetLeft;
        initialTop = elem.offsetTop;
        elem.style.zIndex = '100';
      });

      elem.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        const canvasRect = canvas.getBoundingClientRect();
        const maxLeft = canvasRect.width - elem.offsetWidth - 10;
        const maxTop = Math.max(canvasRect.height - elem.offsetHeight - 10, 400);

        const newLeft = Math.max(8, Math.min(maxLeft, initialLeft + dx));
        const newTop = Math.max(8, Math.min(maxTop, initialTop + dy));

        elem.style.left = `${newLeft}px`;
        elem.style.top = `${newTop}px`;
      });

      elem.addEventListener('pointerup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        elem.releasePointerCapture(e.pointerId);
        elem.style.zIndex = '';

        updateWhiteboardNote(noteId, {
          x: elem.offsetLeft,
          y: elem.offsetTop,
        });
      });
    });

    target.innerHTML = '';
    target.appendChild(wrap);
  }

  // ──────────────── Modals ────────────────

  function openScheduleModal(item) {
    const modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'schedule-modal-backdrop';

    modalBackdrop.innerHTML = `
      <div class="schedule-modal" role="dialog" aria-labelledby="sch-title">
        <h3 class="schedule-modal__title" id="sch-title">Add to Itinerary</h3>
        <p style="font-size: var(--text-xs); color: var(--color-text-secondary); margin-top: -8px;">
          Scheduling "<strong>${item.title}</strong>"
        </p>

        <div class="schedule-modal__field">
          <label class="schedule-modal__label">Select Itinerary Day</label>
          <select class="schedule-modal__select" id="target-day-select">
            <option value="1">Day 1 (Tokyo Arrival & Ancient Taito)</option>
            <option value="2">Day 2 (Kyoto Culture & Bamboo Groves)</option>
            <option value="3">Day 3 (Modern Vibes & Departure)</option>
          </select>
        </div>

        <div style="display: flex; gap: var(--space-2);">
          <div class="schedule-modal__field" style="flex: 1;">
            <label class="schedule-modal__label">Start Time</label>
            <input type="time" class="schedule-modal__input" id="target-start-time" value="15:30" />
          </div>
          <div class="schedule-modal__field" style="flex: 1;">
            <label class="schedule-modal__label">End Time</label>
            <input type="time" class="schedule-modal__input" id="target-end-time" value="17:00" />
          </div>
        </div>

        <div class="schedule-modal__field">
          <label class="schedule-modal__label">Category</label>
          <select class="schedule-modal__select" id="target-cat-select">
            <option value="activity" ${item.category === 'activity' ? 'selected' : ''}>Activity</option>
            <option value="meal" ${item.category === 'food' || item.category === 'meal' ? 'selected' : ''}>Meal</option>
            <option value="sightseeing" ${item.category === 'sightseeing' ? 'selected' : ''}>Sightseeing</option>
            <option value="rest">Rest</option>
          </select>
        </div>

        <div class="schedule-modal__actions">
          <button type="button" class="btn btn--secondary" style="flex: 1;" id="btn-cancel-schedule">Cancel</button>
          <button type="button" class="btn btn--primary" style="flex: 1;" id="btn-confirm-schedule">Confirm</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalBackdrop);

    modalBackdrop.querySelector('#btn-cancel-schedule').addEventListener('click', () => {
      modalBackdrop.remove();
    });

    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) modalBackdrop.remove();
    });

    modalBackdrop.querySelector('#btn-confirm-schedule').addEventListener('click', () => {
      const day = modalBackdrop.querySelector('#target-day-select').value;
      const startTime = modalBackdrop.querySelector('#target-start-time').value;
      const endTime = modalBackdrop.querySelector('#target-end-time').value;
      const category = modalBackdrop.querySelector('#target-cat-select').value;

      promoteToItinerary({
        title: item.title,
        location: item.location || item.title,
        category,
        day,
        startTime,
        endTime,
        notes: item.description || '',
      });

      modalBackdrop.remove();
      showToast(`✈️ Scheduled "${item.title}" on Day ${day}!`);
    });
  }

  function openAddWishlistModal() {
    const modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'schedule-modal-backdrop';

    modalBackdrop.innerHTML = `
      <div class="schedule-modal" role="dialog" aria-labelledby="add-title">
        <h3 class="schedule-modal__title" id="add-title">Add Trip Idea</h3>

        <div class="schedule-modal__field">
          <label class="schedule-modal__label">Place or Activity Name</label>
          <input type="text" class="schedule-modal__input" id="wishlist-input-title" placeholder="e.g. Robot Restaurant or Tea Ceremony" required />
        </div>

        <div class="schedule-modal__field">
          <label class="schedule-modal__label">Category</label>
          <select class="schedule-modal__select" id="wishlist-input-cat">
            <option value="sightseeing">⛩️ Sightseeing</option>
            <option value="food">🍜 Food</option>
            <option value="activity">🎯 Activity</option>
            <option value="nightlife">🍸 Nightlife</option>
          </select>
        </div>

        <div class="schedule-modal__field">
          <label class="schedule-modal__label">Description & Notes</label>
          <input type="text" class="schedule-modal__input" id="wishlist-input-desc" placeholder="Why should the group visit?" />
        </div>

        <div class="schedule-modal__field">
          <label class="schedule-modal__label">Web Link URL (Optional)</label>
          <input type="url" class="schedule-modal__input" id="wishlist-input-url" placeholder="https://..." />
        </div>

        <div class="schedule-modal__field">
          <label class="schedule-modal__label">Estimated Cost</label>
          <input type="text" class="schedule-modal__input" id="wishlist-input-cost" placeholder="e.g. ¥2,000 (~$14) or Free" value="¥1,500 (~$10)" />
        </div>

        <div class="schedule-modal__actions">
          <button type="button" class="btn btn--secondary" style="flex: 1;" id="btn-cancel-add-wishlist">Cancel</button>
          <button type="button" class="btn btn--primary" style="flex: 1;" id="btn-confirm-add-wishlist">Save Idea</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalBackdrop);

    modalBackdrop.querySelector('#btn-cancel-add-wishlist').addEventListener('click', () => {
      modalBackdrop.remove();
    });

    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) modalBackdrop.remove();
    });

    modalBackdrop.querySelector('#btn-confirm-add-wishlist').addEventListener('click', () => {
      const title = modalBackdrop.querySelector('#wishlist-input-title').value.trim();
      if (!title) {
        alert('Please provide a name for this trip idea.');
        return;
      }
      const category = modalBackdrop.querySelector('#wishlist-input-cat').value;
      const description = modalBackdrop.querySelector('#wishlist-input-desc').value.trim();
      const url = modalBackdrop.querySelector('#wishlist-input-url').value.trim();
      const estimatedCost = modalBackdrop.querySelector('#wishlist-input-cost').value.trim() || 'Free';

      addWishlistItem({
        title,
        category,
        description: description || 'Saved idea for the group itinerary.',
        url: url || null,
        imageUrl: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=600&q=80',
        estimatedCost,
      });

      modalBackdrop.remove();
      render();
      showToast(`💡 "${title}" saved to Wishlist!`);
    });
  }

  // Initial render
  render();

  return {
    element: container,
  };
}
