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
import { enableDragScroll } from '../utils/dragScroll.js';
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
    const coverBg = settings.coverImage || './src/assets/bg-itinerary.png';
    const cityTitle = settings.destination.split(',')[0];

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

    // Connect sidebar button
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
          <button class="filter-chip ${currentCategory === 'sightseeing' ? 'filter-chip--active' : ''}" data-cat="sightseeing">Sightseeing</button>
          <button class="filter-chip ${currentCategory === 'food' ? 'filter-chip--active' : ''}" data-cat="food">Food</button>
          <button class="filter-chip ${currentCategory === 'activity' ? 'filter-chip--active' : ''}" data-cat="activity">Activity</button>
          <button class="filter-chip ${currentCategory === 'nightlife' ? 'filter-chip--active' : ''}" data-cat="nightlife">Nightlife</button>
        </div>
        <button type="button" class="btn btn--primary btn--sm" id="btn-open-add-wishlist">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <span>Add Idea</span>
        </button>
      </div>

      <div class="wishlist-grid">
        ${
          filtered.length === 0
            ? `<div style="text-align: center; padding: 32px 16px; color: var(--color-text-secondary); font-size: var(--text-sm);">
                No ideas found in this category. Tap <strong>Add Idea</strong> to save one!
               </div>`
            : filtered
                .map(
                  (item) => `
            <div class="wishlist-card ${item.source === 'reel' ? 'wishlist-card--has-reel' : ''}" data-id="${item.id}">
              <div class="wishlist-card__image-wrap">
                <img src="${item.imageUrl || './src/assets/card-temple.png'}" alt="${item.title}" class="wishlist-card__image" loading="lazy" />
                <div class="wishlist-card__badge-row">
                  <span class="wishlist-card__category">${item.category}</span>
                  ${
                    item.source === 'reel'
                      ? `
                    <span class="card-origin-badge card-origin-badge--reel">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                      <span>Reel Pick</span>
                    </span>
                  `
                      : ''
                  }
                  ${
                    item.isScheduled
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

    // Enable drag scrolling on category filter bar
    enableDragScroll(wrap.querySelector('.category-filter-bar'));

    // Filter chip clicks
    wrap.querySelectorAll('.filter-chip').forEach((btn) => {
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
      <div class="whiteboard-header">
        <div class="whiteboard-header__text">
          <h3 class="whiteboard-title">Collaborative Whiteboard</h3>
          <p class="whiteboard-desc">Jot down unstructured thoughts, food tips, or quick ideas.</p>
        </div>
        <button type="button" class="btn btn--primary btn--sm" id="btn-add-note">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <span>New Sticky</span>
        </button>
      </div>

      <div class="whiteboard-grid">
        ${
          notes.length === 0
            ? `<div style="grid-column: 1 / -1; text-align: center; padding: 40px 16px; color: var(--color-text-secondary); font-size: var(--text-sm);">
                The whiteboard is clean! Tap <strong>New Sticky</strong> to post a thought.
               </div>`
            : notes
                .map(
                  (note) => `
            <div class="sticky-note sticky-note--${note.color}" data-note-id="${note.id}">
              <div class="sticky-note__pin"></div>
              <button type="button" class="sticky-note__delete" data-delete-note="${note.id}" aria-label="Delete note">✕</button>
              <textarea class="sticky-note__text" placeholder="Write something...">${note.text}</textarea>
              <div class="sticky-note__footer">
                <span class="sticky-note__author">${note.author}</span>
                <div class="sticky-note__color-dots">
                  <span class="color-dot color-dot--yellow ${note.color === 'yellow' ? 'is-active' : ''}" data-set-color="yellow"></span>
                  <span class="color-dot color-dot--pink ${note.color === 'pink' ? 'is-active' : ''}" data-set-color="pink"></span>
                  <span class="color-dot color-dot--blue ${note.color === 'blue' ? 'is-active' : ''}" data-set-color="blue"></span>
                  <span class="color-dot color-dot--green ${note.color === 'green' ? 'is-active' : ''}" data-set-color="green"></span>
                </div>
              </div>
            </div>
          `
                )
                .join('')
        }
      </div>
    `;

    // Add note button
    const addNoteBtn = wrap.querySelector('#btn-add-note');
    if (addNoteBtn) {
      addNoteBtn.addEventListener('click', () => {
        addWhiteboardNote({
          text: '',
          color: selectedStickyColor,
          author: 'You',
        });
        renderWhiteboard(target);
      });
    }

    // Auto-saving text changes on input
    wrap.querySelectorAll('.sticky-note__text').forEach((textarea) => {
      textarea.addEventListener('input', (e) => {
        const noteId = textarea.closest('.sticky-note').getAttribute('data-note-id');
        updateWhiteboardNote(noteId, { text: e.target.value });
      });
    });

    // Delete note handler
    wrap.querySelectorAll('[data-delete-note]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const noteId = btn.getAttribute('data-delete-note');
        deleteWhiteboardNote(noteId);
        renderWhiteboard(target);
        showToast('Note removed from whiteboard');
      });
    });

    // Color switcher dots
    wrap.querySelectorAll('[data-set-color]').forEach((dot) => {
      dot.addEventListener('click', () => {
        const color = dot.getAttribute('data-set-color');
        const noteId = dot.closest('.sticky-note').getAttribute('data-note-id');
        selectedStickyColor = color;
        updateWhiteboardNote(noteId, { color });
        renderWhiteboard(target);
      });
    });

    target.replaceChildren(wrap);
  }

  // ── Modal: Add to Wishlist ────────────────────────────────────
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
            <label class="form-label" for="wl-title">Place / Activity Name</label>
            <input type="text" class="form-input" id="wl-title" placeholder="e.g. Fushimi Inari Shrine" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="wl-cat">Category</label>
            <select class="form-input" id="wl-cat">
              <option value="sightseeing">Sightseeing</option>
              <option value="food">Food & Dining</option>
              <option value="activity">Activity</option>
              <option value="nightlife">Nightlife</option>
            </select>
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

    backdrop.querySelector('#wishlist-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const title = backdrop.querySelector('#wl-title').value.trim();
      const category = backdrop.querySelector('#wl-cat').value;
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
      showToast(`Added "${title}" to Wishlist`);
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

  // Initial render
  render();

  return {
    element: container,
    render,
  };
}
