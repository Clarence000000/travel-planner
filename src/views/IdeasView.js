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
import { getTripSettings } from '../models/tripSettings.js';

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
    const settings = getTripSettings();
    const coverBg = './src/assets/bg-ideas.jpg';
    const cityTitle = (settings.destination || settings.title || 'Tokyo').split(',')[0].trim();

    container.innerHTML = `
      <!-- Atmospheric Vertical Asset Banner -->
      <div class="view-banner" style="background-image: url('${coverBg}');">

        <button type="button" class="view-banner__menu-btn" id="btn-open-sidebar" aria-label="Open Trip Menu" title="Open Menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div class="view-banner__scrim">
          <span class="view-banner__badge">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7zM9 21a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-1H9v1z"></path></svg>
            ${cityTitle} Ideas
          </span>
          <h2 class="view-banner__title">Wishlist & Notes</h2>
        </div>
      </div>

      <div class="view-header">
        <!-- Segmented Sub-view Switcher -->
        <div class="segmented-control" role="tablist">
          <button 
            type="button" 
            class="segmented-btn ${currentSubTab === 'wishlist' ? 'segmented-btn--active' : ''}" 
            data-subtab="wishlist"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
            <span>Trip Wishlist</span>
          </button>
          <button 
            type="button" 
            class="segmented-btn ${currentSubTab === 'whiteboard' ? 'segmented-btn--active' : ''}" 
            data-subtab="whiteboard"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
            <span>Idea Whiteboard</span>
          </button>
        </div>
      </div>

      <!-- Sub-view Container -->
      <div id="ideas-subview-content"></div>
    `;



    const openSidebarBtn = container.querySelector('#btn-open-sidebar');
    if (openSidebarBtn) {
      openSidebarBtn.addEventListener('click', () => {
        if (window.TravelApp && window.TravelApp.sidebar) {
          window.TravelApp.sidebar.open();
        }
      });
    }

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

  // ── Render Wishlist ──────────────────────────────────────────
  function renderWishlist(target) {
    const allItems = getWishlist();

    // Extract dynamic categories ONLY from items user created
    const userCategories = Array.from(
      new Set(
        allItems
          .map((item) => (item.category || '').toLowerCase().trim())
          .filter(Boolean)
      )
    );

    if (currentCategory !== 'all' && !userCategories.includes(currentCategory.toLowerCase())) {
      currentCategory = 'all';
    }

    const categories = userCategories.length > 0 ? ['all', ...userCategories] : [];

    // Filter items according to active category
    const items = currentCategory === 'all'
      ? allItems
      : allItems.filter((i) => (i.category || '').toLowerCase().trim() === currentCategory.toLowerCase().trim());

    const wrap = document.createElement('div');
    wrap.className = 'wishlist-container';

    wrap.innerHTML = `
      <div class="wishlist-controls">
        <div class="wishlist-controls__summary">
          <span class="wishlist-count-badge">${items.length} of ${allItems.length} ${allItems.length === 1 ? 'Idea' : 'Ideas'}</span>
          <span class="wishlist-count-desc">Saved places & activities</span>
        </div>
        <button type="button" class="btn btn--primary btn--sm" id="btn-open-add-wishlist">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <span>Add Idea</span>
        </button>
      </div>

      <!-- Category Filter Bar (Dynamically reflects ONLY user placed categories) -->
      ${categories.length > 1 ? `
      <div class="category-filter-bar" role="tablist" aria-label="Filter wishlist by type">
        ${categories.map((cat) => {
      const count = cat === 'all'
        ? allItems.length
        : allItems.filter((i) => (i.category || '').toLowerCase().trim() === cat).length;
      const label = cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1);
      const isActive = currentCategory.toLowerCase() === cat.toLowerCase();
      return `
            <button type="button" role="tab" aria-selected="${isActive}" class="filter-chip ${isActive ? 'filter-chip--active' : ''}" data-cat="${cat}">
              <span>${label}</span>
              <span class="filter-chip__count" style="font-size: 10.5px; opacity: 0.85; margin-left: 4px;">(${count})</span>
            </button>
          `;
    }).join('')}
      </div>
      ` : ''}

      <div class="wishlist-grid">
        ${items.length === 0
        ? `<div class="ideas-zero-grid" style="grid-column: 1 / -1;">
                <div class="ideas-zero-card">
                  <div class="ideas-zero-card__icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E8621A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </div>
                  <div>
                    <h4>Drop Instagram Reels or TikToks</h4>
                    <p>Save viral travel clips to auto-extract venue details, location pins, and ratings.</p>
                  </div>
                </div>

                <div class="ideas-zero-card">
                  <div class="ideas-zero-card__icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                  <div>
                    <h4>Pin Google Maps Venues</h4>
                    <p>Collect candidate ramen bars, shrines, and spots in your group voting pool.</p>
                  </div>
                </div>
              </div>`
        : items
          .map(
            (item) => `
            <div class="wishlist-card ${item.source === 'reel' ? 'wishlist-card--has-reel' : ''}" data-id="${item.id}">
              <div class="wishlist-card__image-wrap">
                <img src="${item.imageUrl || './src/assets/card-temple.png'}" alt="${item.title}" class="wishlist-card__image" loading="lazy" />
                <div class="wishlist-card__badge-row">
                  <span class="card-origin-badge card-origin-badge--category">
                    ${item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : 'Activity'}
                  </span>
                  ${item.source === 'reel'
                ? `
                    <span class="card-origin-badge card-origin-badge--reel">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                      <span>Reel Pick</span>
                    </span>
                  `
                : ''
              }
                  ${item.isScheduled
                ? `
                    <span class="wishlist-card__status-tag">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <span>Scheduled Day ${item.scheduledDay || 1}</span>
                    </span>
                  `
                : ''
              }
                  <span class="wishlist-card__cost">${item.estimatedCost || 'Free'}</span>
                </div>
              </div>
              <div class="wishlist-card__body">
                <div class="wishlist-card__header">
                  <h3 class="wishlist-card__title">${item.title}</h3>
                </div>
                <p class="wishlist-card__desc">${item.description}</p>
                
                <div class="wishlist-card__meta">
                  <span class="wishlist-card__author">Added by ${item.addedBy}</span>
                  ${item.url
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
                  <button type="button" class="btn-vote ${item.userVoted ? 'btn-vote--active' : ''}" data-vote-id="${item.id}" aria-label="Vote for ${item.title}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="${item.userVoted ? 'var(--color-primary)' : 'none'}" stroke="${item.userVoted ? 'var(--color-primary)' : 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    <span>${item.votes}</span>
                  </button>
                  <button type="button" class="btn btn--primary btn--sm" style="flex: 1;" data-schedule-id="${item.id}">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <span>Add to Schedule</span>
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
    wrap.querySelectorAll('[data-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentCategory = btn.getAttribute('data-cat');
        renderWishlist(target);
      });
    });

    // Voting click handler
    wrap.querySelectorAll('[data-vote-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-vote-id');
        const updatedItem = toggleWishlistVote(id);
        if (updatedItem) {
          renderWishlist(target);
          showToast(`Vote recorded for "${updatedItem.title}"`);
        }
      });
    });

    // Add to schedule handler
    wrap.querySelectorAll('[data-schedule-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-schedule-id');
        openSchedulePicker(id, target);
      });
    });

    // Add Idea button handler
    const addBtn = wrap.querySelector('#btn-open-add-wishlist');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        openAddWishlistModal(target);
      });
    }

    target.replaceChildren(wrap);
  }

  // ── Render Whiteboard ────────────────────────────────────────
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
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>Add Note</span>
          </button>
        </div>
        <div class="whiteboard-instructions">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <span>Drag notes freely • Double-tap canvas to place note</span>
        </div>
      </div>

      <div class="whiteboard-canvas" id="whiteboard-canvas-surface">
        ${notes
        .map(
          (n) => `
          <div 
            class="sticky-note sticky-note--${n.color || 'yellow'}" 
            id="note-elem-${n.id}"
            data-note-id="${n.id}"
            style="left: ${n.x || 20}px; top: ${n.y || 20}px;"
          >
            <div class="sticky-note__pin">
              <span class="sticky-note__tag">${n.tag || 'Idea'}</span>
              <button type="button" class="sticky-note__delete" data-del-id="${n.id}" title="Delete note">✕</button>
            </div>
            <input 
              type="text" 
              class="sticky-note__title-input" 
              value="${n.title || ''}" 
              data-edit-title="${n.id}"
              placeholder="Note title..."
            />
            <textarea 
              class="sticky-note__content" 
              data-edit-text="${n.id}"
              placeholder="Write thoughts..."
            >${n.text || ''}</textarea>
            <div class="sticky-note__footer">
              <span class="sticky-note__author">By ${n.author || 'You'}</span>
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
    const addNoteBtn = wrap.querySelector('#btn-add-note');
    if (addNoteBtn) {
      addNoteBtn.addEventListener('click', () => {
        addWhiteboardNote({
          title: 'New Idea',
          text: '',
          color: selectedStickyColor,
          x: 24 + Math.floor(Math.random() * 80),
          y: 28 + Math.floor(Math.random() * 100),
          tag: 'Idea',
          author: 'You',
        });
        renderWhiteboard(target);
        showToast('Sticky note added to whiteboard!');
      });
    }

    // Double-click canvas to place note
    if (canvas) {
      canvas.addEventListener('dblclick', (e) => {
        if (e.target.closest('.sticky-note')) return;
        const rect = canvas.getBoundingClientRect();
        const x = Math.max(10, Math.min(rect.width - 180, e.clientX - rect.left - 80));
        const y = Math.max(10, Math.min(rect.height - 160, e.clientY - rect.top - 40));

        addWhiteboardNote({
          title: 'Quick Thought',
          text: '',
          color: selectedStickyColor,
          x: Math.round(x),
          y: Math.round(y),
          tag: 'Idea',
          author: 'You',
        });
        renderWhiteboard(target);
        showToast('Sticky note placed!');
      });
    }

    // Delete note
    wrap.querySelectorAll('.sticky-note__delete').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-del-id');
        deleteWhiteboardNote(id);
        renderWhiteboard(target);
        showToast('Note removed from whiteboard');
      });
    });

    // Title editing
    wrap.querySelectorAll('[data-edit-title]').forEach((input) => {
      input.addEventListener('input', () => {
        const id = input.getAttribute('data-edit-title');
        updateWhiteboardNote(id, { title: input.value });
      });
      input.addEventListener('pointerdown', (e) => e.stopPropagation());
    });

    // Text editing
    wrap.querySelectorAll('[data-edit-text]').forEach((textarea) => {
      textarea.addEventListener('input', () => {
        const id = textarea.getAttribute('data-edit-text');
        updateWhiteboardNote(id, { text: textarea.value });
      });
      textarea.addEventListener('pointerdown', (e) => e.stopPropagation());
    });

    // Schedule note button
    wrap.querySelectorAll('[data-note-schedule]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-note-schedule');
        const note = notes.find((n) => n.id === id);
        if (note) openScheduleNoteModal(note, target);
      });
      btn.addEventListener('pointerdown', (e) => e.stopPropagation());
    });

    // Dragging mechanics with Pointer Events
    const noteElements = wrap.querySelectorAll('.sticky-note');
    noteElements.forEach((elem) => {
      let isDragging = false;
      let startX, startY;
      let initialLeft, initialTop;
      const noteId = elem.getAttribute('data-note-id');

      elem.addEventListener('pointerdown', (e) => {
        // Prevent drag when interacting with inputs, textareas or buttons
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
        const maxLeft = Math.max(10, canvasRect.width - elem.offsetWidth - 10);
        const maxTop = Math.max(10, 800 - elem.offsetHeight - 10);

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

    target.replaceChildren(wrap);
  }

  // ── Modal: Schedule Sticky Note to Itinerary ─────────────────
  function openScheduleNoteModal(note, target) {
    const backdrop = document.createElement('div');
    backdrop.className = 'itinerary-modal-backdrop is-open';

    const settings = getTripSettings();
    const daysCount = settings.totalDays || 3;
    const dayOptions = [];
    for (let i = 1; i <= daysCount; i++) {
      dayOptions.push(`<option value="${i}">Day ${i}</option>`);
    }

    backdrop.innerHTML = `
      <div class="itinerary-modal-sheet">
        <div class="itinerary-modal-header">
          <div>
            <span style="font-size: 11px; font-weight: bold; color: var(--color-primary); text-transform: uppercase;">
              Add to Itinerary
            </span>
            <h3 class="itinerary-modal-title">Schedule Sticky Note</h3>
          </div>
          <button type="button" class="drawer-close-btn" id="close-note-modal">✕</button>
        </div>

        <form class="itinerary-form" id="note-promote-form">
          <div class="form-group">
            <label class="form-label" for="note-promote-day">Which day?</label>
            <select class="form-input" id="note-promote-day">
              ${dayOptions.join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="note-promote-time">Target Start Time</label>
            <input type="time" class="form-input" id="note-promote-time" value="14:00" required />
          </div>

          <div style="display: flex; gap: 8px; margin-top: 8px;">
            <button type="submit" class="btn btn--primary" style="flex: 1;">Schedule Spot</button>
            <button type="button" class="btn btn--secondary" id="cancel-note-promote-btn">Cancel</button>
          </div>
        </form>
      </div>
    `;

    const close = () => backdrop.remove();
    backdrop.querySelector('#close-note-modal').addEventListener('click', close);
    backdrop.querySelector('#cancel-note-promote-btn').addEventListener('click', close);

    backdrop.querySelector('#note-promote-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const day = parseInt(backdrop.querySelector('#note-promote-day').value, 10);
      const time = backdrop.querySelector('#note-promote-time').value;

      promoteToItinerary(
        { title: note.title || 'Whiteboard Idea', text: note.text, category: 'activity' },
        { day, startTime: time }
      );

      close();
      showToast(`Scheduled "${note.title || 'Note'}" on Day ${day} at ${time}`);
    });

    document.body.appendChild(backdrop);
  }

  // ── Modal: Add to Wishlist ──────────────────────────────────────────
  function openAddWishlistModal(target) {
    const backdrop = document.createElement('div');
    backdrop.className = 'itinerary-modal-backdrop is-open';

    backdrop.innerHTML = `
      <div class="itinerary-modal-sheet">
        <div class="itinerary-modal-header">
          <div>
            <span style="font-size: 11px; font-weight: bold; color: var(--color-primary); text-transform: uppercase;">
              New Recommendation
            </span>
            <h3 class="itinerary-modal-title">Add to Group Wishlist</h3>
          </div>
          <button type="button" class="drawer-close-btn" id="close-wishlist-modal">✕</button>
        </div>

        <form class="itinerary-form" id="wishlist-form">
          <div class="form-group">
            <label class="form-label" for="wl-title">Place / Activity Name <span style="color: var(--color-primary);">*</span></label>
            <input type="text" class="form-input" id="wl-title" placeholder="e.g. Fushimi Inari Shrine" required />
          </div>

          <!-- Category / Type Selector -->
          <div class="form-group">
            <label class="form-label" for="wl-category">Category / Type <span style="color: var(--color-primary);">*</span></label>
            <select class="form-input" id="wl-category" style="background: var(--color-surface); cursor: pointer;" required>
              <option value="sightseeing">Sightseeing & Culture</option>
              <option value="food">Food & Dining</option>
              <option value="activity">Activity & Adventure</option>
              <option value="nightlife">Nightlife & Drinks</option>
              <option value="shopping">Shopping</option>
              <option value="custom">+ Custom Type...</option>
            </select>
            <input 
              type="text" 
              class="form-input" 
              id="wl-custom-category" 
              placeholder="e.g. Onsen, Photography, Cafe" 
              style="display: none; margin-top: 6px;" 
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="wl-cost">Estimated Cost</label>
            <input type="text" class="form-input" id="wl-cost" placeholder="e.g. ¥2,000 (~$13) or Free" />
          </div>

          <div class="form-group">
            <label class="form-label" for="wl-desc">Why should the group go?</label>
            <textarea class="form-input" id="wl-desc" rows="3" placeholder="Notes, recommendations, or why you want to visit..."></textarea>
          </div>

          <div class="form-group">
            <label class="form-label" for="wl-url">Reference / Map Link (Optional)</label>
            <input type="url" class="form-input" id="wl-url" placeholder="https://..." />
          </div>

          <div style="display: flex; gap: 8px; margin-top: 8px;">
            <button type="submit" class="btn btn--primary" style="flex: 1;">Add to Wishlist</button>
            <button type="button" class="btn btn--secondary" id="cancel-wl-btn">Cancel</button>
          </div>
        </form>
      </div>
    `;

    const close = () => backdrop.remove();
    backdrop.querySelector('#close-wishlist-modal').addEventListener('click', close);
    backdrop.querySelector('#cancel-wl-btn').addEventListener('click', close);

    const categorySelect = backdrop.querySelector('#wl-category');
    const customCategoryInput = backdrop.querySelector('#wl-custom-category');
    categorySelect.addEventListener('change', () => {
      if (categorySelect.value === 'custom') {
        customCategoryInput.style.display = 'block';
        customCategoryInput.focus();
        customCategoryInput.required = true;
      } else {
        customCategoryInput.style.display = 'none';
        customCategoryInput.required = false;
      }
    });



    backdrop.querySelector('#wishlist-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const title = backdrop.querySelector('#wl-title').value.trim();
      let category = categorySelect.value;
      if (category === 'custom') {
        category = customCategoryInput.value.trim() || 'activity';
      }
      category = category.toLowerCase();
      const estimatedCost = backdrop.querySelector('#wl-cost').value.trim() || 'Free';
      const description = backdrop.querySelector('#wl-desc').value.trim();
      const url = backdrop.querySelector('#wl-url').value.trim();

      addWishlistItem({
        title,
        category,
        estimatedCost,
        description,
        url,
        addedBy: 'You',
        votes: 1,
        userVoted: true,
      });

      close();
      renderWishlist(target);
      showToast(`Added "${title}" (${category}) to Wishlist`);
    });

    document.body.appendChild(backdrop);
  }

  // ── Modal: Schedule Picker (Wishlist -> Itinerary) ───────────
  function openSchedulePicker(wishlistId, target) {
    const backdrop = document.createElement('div');
    backdrop.className = 'itinerary-modal-backdrop is-open';

    const settings = getTripSettings();
    const daysCount = settings.totalDays || 3;
    const dayOptions = [];
    for (let i = 1; i <= daysCount; i++) {
      dayOptions.push(`<option value="${i}">Day ${i}</option>`);
    }

    backdrop.innerHTML = `
      <div class="itinerary-modal-sheet">
        <div class="itinerary-modal-header">
          <div>
            <span style="font-size: 11px; font-weight: bold; color: var(--color-primary); text-transform: uppercase;">
              Timeline Promotion
            </span>
            <h3 class="itinerary-modal-title">Promote to Itinerary</h3>
          </div>
          <button type="button" class="drawer-close-btn" id="close-promote-modal">✕</button>
        </div>

        <form class="itinerary-form" id="promote-form">
          <div class="form-group">
            <label class="form-label" for="promote-day">Which day?</label>
            <select class="form-input" id="promote-day">
              ${dayOptions.join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="promote-time">Target Time</label>
            <input type="time" class="form-input" id="promote-time" value="14:00" required />
          </div>

          <div style="display: flex; gap: 8px; margin-top: 8px;">
            <button type="submit" class="btn btn--primary" style="flex: 1;">Schedule Spot</button>
            <button type="button" class="btn btn--secondary" id="cancel-promote-btn">Cancel</button>
          </div>
        </form>
      </div>
    `;

    const close = () => backdrop.remove();
    backdrop.querySelector('#close-promote-modal').addEventListener('click', close);
    backdrop.querySelector('#cancel-promote-btn').addEventListener('click', close);

    backdrop.querySelector('#promote-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const day = parseInt(backdrop.querySelector('#promote-day').value, 10);
      const time = backdrop.querySelector('#promote-time').value;

      promoteToItinerary(wishlistId, day, time);

      close();
      renderWishlist(target);
      showToast(`Scheduled spot on Day ${day} at ${time}`);
    });

    document.body.appendChild(backdrop);
  }

  if (!window.TravelApp) window.TravelApp = {};
  window.TravelApp.openAddWishlistModal = () => {
    currentSubTab = 'wishlist';
    render();
    const content = container.querySelector('#ideas-content');
    if (content) openAddWishlistModal(content);
  };
  window.addEventListener('open-add-wishlist', () => {
    currentSubTab = 'wishlist';
    render();
    const content = container.querySelector('#ideas-content');
    if (content) openAddWishlistModal(content);
  });

  // Re-render when trip settings or destination change
  window.addEventListener('trip-settings-updated', () => {
    render();
  });

  // Initial render
  render();

  return {
    element: container,
    render,
  };
}
