/**
 * Component: Create Trip Modal / Bottom Sheet
 * Allows users to set destination, custom dates, title, and cover image.
 */

import { createTrip } from '../models/tripsModel.js';
import { PRESET_COVERS, calculateDaysBetween } from '../models/tripSettings.js';

export function createCreateTripModal(options = {}) {
  const { onCreated, onCancel } = options;

  const overlay = document.createElement('div');
  overlay.className = 'onboarding-overlay create-trip-overlay';
  overlay.id = 'create-trip-modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.style.display = 'none';

  let selectedCover = PRESET_COVERS[0].url;
  let destination = 'Tokyo & Kyoto, Japan';
  let title = 'Tokyo Expedition';
  let startDate = '2026-10-12';
  let endDate = '2026-10-14';

  function render() {
    const totalDays = calculateDaysBetween(startDate, endDate);

    overlay.innerHTML = `
      <div class="onboarding-card create-trip-card">
        <div class="onboarding-card__header">
          <div class="onboarding-card__icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E8621A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
            </svg>
          </div>
          <div>
            <h3 class="onboarding-card__title" id="create-trip-title">Create New Itinerary</h3>
            <p class="onboarding-card__subtitle">Configure your destination and schedule to begin</p>
          </div>
          <button type="button" class="onboarding-card__close-btn" id="btn-close-create-trip" aria-label="Close dialog">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="onboarding-card__body">
          <div class="onboarding-field">
            <label class="onboarding-label" for="trip-dest-input">Destination</label>
            <div class="input-with-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <input type="text" id="trip-dest-input" class="onboarding-input" value="${destination}" placeholder="e.g. Tokyo, Japan" />
            </div>
          </div>

          <div class="onboarding-field">
            <label class="onboarding-label" for="trip-title-input">Trip Title</label>
            <div class="input-with-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <input type="text" id="trip-title-input" class="onboarding-input" value="${title}" placeholder="e.g. Tokyo Autumn Explorer" />
            </div>
          </div>

          <div class="onboarding-dates-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div class="onboarding-field">
              <label class="onboarding-label" for="trip-start-date">Start Date</label>
              <input type="date" id="trip-start-date" class="onboarding-input" value="${startDate}" />
            </div>
            <div class="onboarding-field">
              <label class="onboarding-label" for="trip-end-date">End Date</label>
              <input type="date" id="trip-end-date" class="onboarding-input" value="${endDate}" />
            </div>
          </div>

          <div class="trip-duration-pill-bar" style="margin-bottom: 16px;">
            <span class="trip-calc-badge" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: rgba(232, 98, 26, 0.08); border: 1px solid rgba(232, 98, 26, 0.2); border-radius: 9999px; font-size: 12px; font-weight: 600; color: #E8621A;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>Duration: <strong id="trip-days-display">${totalDays} Days</strong></span>
            </span>
          </div>

          <div class="onboarding-field">
            <label class="onboarding-label">Cover Artwork</label>
            <div class="preset-covers-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
              ${PRESET_COVERS.map(
                (cov) => `
                <button type="button" class="preset-cover-btn ${selectedCover === cov.url ? 'is-selected' : ''}" data-cover-url="${cov.url}" title="${cov.name}" style="border: 2px solid ${selectedCover === cov.url ? '#E8621A' : 'transparent'}; border-radius: 12px; overflow: hidden; padding: 0; cursor: pointer; aspect-ratio: 1; position: relative;">
                  <img src="${cov.thumb}" alt="${cov.name}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
                </button>
              `
              ).join('')}
            </div>
          </div>
        </div>

        <div class="onboarding-card__footer" style="display: flex; gap: 10px; margin-top: 16px;">
          <button type="button" class="btn btn--secondary" id="btn-cancel-create" style="flex: 1;">Cancel</button>
          <button type="button" class="btn btn--primary" id="btn-confirm-create" style="flex: 2;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Create Itinerary</span>
          </button>
        </div>
      </div>
    `;

    // Attach event handlers
    const closeBtn = overlay.querySelector('#btn-close-create-trip');
    const cancelBtn = overlay.querySelector('#btn-cancel-create');
    const confirmBtn = overlay.querySelector('#btn-confirm-create');
    const destInput = overlay.querySelector('#trip-dest-input');
    const titleInput = overlay.querySelector('#trip-title-input');
    const startInput = overlay.querySelector('#trip-start-date');
    const endInput = overlay.querySelector('#trip-end-date');
    const daysDisplay = overlay.querySelector('#trip-days-display');

    const handleClose = () => {
      overlay.style.display = 'none';
      if (typeof onCancel === 'function') onCancel();
    };

    if (closeBtn) closeBtn.addEventListener('click', handleClose);
    if (cancelBtn) cancelBtn.addEventListener('click', handleClose);

    if (destInput) {
      destInput.addEventListener('input', (e) => {
        destination = e.target.value;
      });
    }

    if (titleInput) {
      titleInput.addEventListener('input', (e) => {
        title = e.target.value;
      });
    }

    function updateDates() {
      startDate = startInput.value;
      endDate = endInput.value;
      const days = calculateDaysBetween(startDate, endDate);
      if (daysDisplay) daysDisplay.textContent = `${days} ${days === 1 ? 'Day' : 'Days'}`;
    }

    if (startInput) startInput.addEventListener('change', updateDates);
    if (endInput) endInput.addEventListener('change', updateDates);

    overlay.querySelectorAll('.preset-cover-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedCover = btn.getAttribute('data-cover-url');
        overlay.querySelectorAll('.preset-cover-btn').forEach((b) => {
          b.style.borderColor = 'transparent';
          b.classList.remove('is-selected');
        });
        btn.style.borderColor = '#E8621A';
        btn.classList.add('is-selected');
      });
    });

    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        const total = calculateDaysBetween(startDate, endDate);
        const newTrip = createTrip({
          destination: destination.trim() || 'Tokyo, Japan',
          title: title.trim() || 'New Journey',
          startDate,
          endDate,
          totalDays: total,
          coverImage: selectedCover,
        });

        overlay.style.display = 'none';
        if (typeof onCreated === 'function') {
          onCreated(newTrip);
        }
      });
    }
  }

  function open() {
    render();
    overlay.style.display = 'flex';
  }

  function close() {
    overlay.style.display = 'none';
  }

  render();

  return {
    element: overlay,
    open,
    close,
  };
}
