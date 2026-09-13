/**
 * ImportReelModal: Allows importing social media reel recommendations (Instagram / TikTok)
 * directly into the current trip as a PROPOSED activity, without creating a new trip.
 */

import { addItineraryBlock } from '../../models/itineraryData.js';
import { getTripSettings } from '../../models/tripSettings.js';
import { setActiveTab } from '../../config/navigation.js';

const SAMPLE_REEL_PRESETS = [
  {
    id: 'preset-siam-ckt',
    title: 'Siam Road Charcoal Char Koay Teow',
    category: 'meal',
    location: '82, Jalan Siam, George Town, Penang',
    cost: 'RM 9 (~$2.00)',
    transit: 'GrabCar (10 mins)',
    durationHours: 1.25,
    notes: 'Legendary charcoal-fired wok hei flat rice noodles with cockles, prawns, and lap cheong.',
    requirements: ['Cash Only', 'Expect queues at peak hours'],
    reelUrl: 'https://www.instagram.com/reel/C7m1KoayTeowPenang',
    reelSource: 'Instagram Reel @penangfoodie',
    badge: 'Street Food • Wok Hei',
  },
  {
    id: 'preset-chew-jetty',
    title: 'Clan Jetties (Chew Jetty) Morning Walk',
    category: 'activity',
    location: 'Chew Jetty, Weld Quay, George Town',
    cost: 'Free Entry',
    transit: 'GrabCar (12 mins)',
    durationHours: 1.5,
    notes: 'Historic 19th-century Chinese waterfront settlement on wooden stilts over the water.',
    requirements: ['Morning Sunscreen', 'Modest Heritage Attire'],
    reelUrl: 'https://www.instagram.com/reel/C8x9ClanJettiesPenang',
    reelSource: 'Instagram Reel @travelmalaysia',
    badge: 'Heritage • Waterfront',
  },
  {
    id: 'preset-habitat-canopy',
    title: 'The Habitat Penang Hill Rainforest Canopy Walk',
    category: 'activity',
    location: 'Bukit Bendera, Penang Hill',
    cost: 'RM 60 (~$13.50)',
    transit: 'Funicular Railway + GrabCar (25 mins)',
    durationHours: 2,
    notes: 'Curtis Crest Tree Top Walk with 360-degree panoramic rainforest views above the clouds.',
    requirements: ['Funicular Fast Lane Ticket', 'Rain Jacket / Poncho'],
    reelUrl: 'https://www.instagram.com/reel/C9a0PenangHillHabitat',
    reelSource: 'TikTok @visitpenang',
    badge: 'Nature • Rainforest',
  },
  {
    id: 'preset-borabora-sunset',
    title: 'Sunset Drinks at Bora Bora Batu Ferringhi',
    category: 'meal',
    location: 'Batu Ferringhi Beach, Penang',
    cost: 'RM 35 (~$8.00)',
    transit: 'GrabCar (25 mins)',
    durationHours: 2,
    notes: 'Beachfront alfresco dining with live acoustic music, fresh coconut shakes, and sea breeze.',
    requirements: ['Sunset Table Booking', 'Casual Beachwear'],
    reelUrl: 'https://www.instagram.com/reel/C5b8BoraBoraSunset',
    reelSource: 'Instagram Reel @penangvibe',
    badge: 'Sunset • Beachfront',
  },
];

export function createImportReelModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop import-reel-modal-backdrop';
  modal.id = 'modal-import-reel';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-hidden', 'true');
  modal.style.display = 'none';

  let selectedPreset = SAMPLE_REEL_PRESETS[0];

  function render() {
    const settings = getTripSettings();
    const totalDays = settings.totalDays || 3;

    modal.innerHTML = `
      <div class="modal-card import-reel-card">
        <div class="modal-card__header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="card-origin-badge card-origin-badge--reel" style="padding: 4px 8px; font-size: 11px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              <span>Social Reel Import</span>
            </div>
            <h2 class="modal-card__title" style="font-size: 16px; margin: 0;">Propose Activity from Reel</h2>
          </div>
          <button type="button" class="modal-card__close" id="btn-close-reel-modal" aria-label="Close modal">&times;</button>
        </div>

        <p class="modal-card__desc" style="font-size: 11.5px; color: var(--color-text-secondary); margin: 4px 0 12px;">
          Import viral travel recommendations directly into your current trip as a <strong>Proposed Activity</strong> for group voting.
        </p>

        <!-- Quick Reel Presets -->
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label" style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--color-text-secondary); margin-bottom: 6px; display: block;">
            Featured Social Spots (Tap to auto-fill)
          </label>
          <div class="reel-preset-list" style="display: flex; flex-direction: column; gap: 6px;">
            ${SAMPLE_REEL_PRESETS.map((p, idx) => `
              <button type="button" class="reel-preset-btn ${selectedPreset && selectedPreset.id === p.id ? 'reel-preset-btn--selected' : ''}" data-preset-idx="${idx}">
                <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                  <strong style="font-size: 12px; color: var(--color-text-primary); text-align: left;">${p.title}</strong>
                  <span class="reel-preset-badge">${p.badge}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; font-size: 10.5px; color: var(--color-text-secondary); margin-top: 2px;">
                  <span>${p.cost}</span>
                  <span>•</span>
                  <span>${p.reelSource}</span>
                </div>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Reel Link Input -->
        <div class="form-group" style="margin-bottom: 10px;">
          <label class="form-label" for="reel-import-url" style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--color-text-secondary); margin-bottom: 4px; display: block;">
            Reel or TikTok URL
          </label>
          <input 
            type="url" 
            id="reel-import-url" 
            class="input form-input" 
            value="${selectedPreset ? selectedPreset.reelUrl : ''}" 
            placeholder="https://www.instagram.com/reel/..." 
            style="width: 100%; font-size: 12px; padding: 8px 10px; border-radius: 8px;"
          />
        </div>

        <!-- Activity Title Input -->
        <div class="form-group" style="margin-bottom: 10px;">
          <label class="form-label" for="reel-import-title" style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--color-text-secondary); margin-bottom: 4px; display: block;">
            Proposed Activity Title
          </label>
          <input 
            type="text" 
            id="reel-import-title" 
            class="input form-input" 
            value="${selectedPreset ? selectedPreset.title : ''}" 
            placeholder="e.g. Siam Road Charcoal Char Koay Teow" 
            style="width: 100%; font-size: 12px; padding: 8px 10px; border-radius: 8px;"
          />
        </div>

        <!-- Schedule Target Row (Day & Time) -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
          <div class="form-group">
            <label class="form-label" for="reel-import-day" style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--color-text-secondary); margin-bottom: 4px; display: block;">
              Schedule Day
            </label>
            <select id="reel-import-day" class="input form-input" style="width: 100%; font-size: 12px; padding: 8px 10px; border-radius: 8px;">
              ${Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => `
                <option value="${d}">Day ${d}</option>
              `).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="reel-import-category" style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--color-text-secondary); margin-bottom: 4px; display: block;">
              Category
            </label>
            <select id="reel-import-category" class="input form-input" style="width: 100%; font-size: 12px; padding: 8px 10px; border-radius: 8px;">
              <option value="activity" ${selectedPreset?.category === 'activity' ? 'selected' : ''}>Sightseeing</option>
              <option value="meal" ${selectedPreset?.category === 'meal' ? 'selected' : ''}>Dining</option>
              <option value="transit" ${selectedPreset?.category === 'transit' ? 'selected' : ''}>Transit</option>
              <option value="rest" ${selectedPreset?.category === 'rest' ? 'selected' : ''}>Check-in / Rest</option>
            </select>
          </div>
        </div>

        <!-- Time Slot Row -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div class="form-group">
            <label class="form-label" for="reel-import-start" style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--color-text-secondary); margin-bottom: 4px; display: block;">
              Proposed Start
            </label>
            <input type="time" id="reel-import-start" class="input form-input" value="14:30" style="width: 100%; font-size: 12px; padding: 8px 10px; border-radius: 8px;" />
          </div>
          <div class="form-group">
            <label class="form-label" for="reel-import-end" style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--color-text-secondary); margin-bottom: 4px; display: block;">
              Proposed End
            </label>
            <input type="time" id="reel-import-end" class="input form-input" value="16:00" style="width: 100%; font-size: 12px; padding: 8px 10px; border-radius: 8px;" />
          </div>
        </div>

        <!-- Submit & Actions -->
        <div class="modal-card__actions" style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px;">
          <button type="button" class="btn btn--secondary" id="btn-cancel-reel-modal">Cancel</button>
          <button type="button" class="btn btn--primary" id="btn-submit-propose-reel" style="display: inline-flex; align-items: center; gap: 6px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span>Propose to Itinerary</span>
          </button>
        </div>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    const closeBtn = modal.querySelector('#btn-close-reel-modal');
    const cancelBtn = modal.querySelector('#btn-cancel-reel-modal');
    const submitBtn = modal.querySelector('#btn-submit-propose-reel');

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (cancelBtn) cancelBtn.addEventListener('click', close);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });

    // Preset selection
    modal.querySelectorAll('.reel-preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.presetIdx, 10);
        selectedPreset = SAMPLE_REEL_PRESETS[idx];
        render();
      });
    });

    // Submit proposed activity
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const titleInput = modal.querySelector('#reel-import-title');
        const urlInput = modal.querySelector('#reel-import-url');
        const daySelect = modal.querySelector('#reel-import-day');
        const catSelect = modal.querySelector('#reel-import-category');
        const startInput = modal.querySelector('#reel-import-start');
        const endInput = modal.querySelector('#reel-import-end');

        const title = titleInput?.value.trim() || selectedPreset?.title || 'Proposed Reel Spot';
        const reelUrl = urlInput?.value.trim() || selectedPreset?.reelUrl || '';
        const day = parseInt(daySelect?.value || '1', 10);
        const category = catSelect?.value || selectedPreset?.category || 'activity';
        const startTime = startInput?.value || '14:30';
        const endTime = endInput?.value || '16:00';

        const newBlock = {
          id: 'reel-proposed-' + Date.now(),
          day,
          startTime,
          endTime,
          category,
          status: 'proposed', // strictly proposed, ready for voting
          title,
          location: selectedPreset?.location || 'Penang, Malaysia',
          cost: selectedPreset?.cost || 'Free',
          transitToNextMinutes: 15,
          transitMode: selectedPreset?.transit || 'GrabCar (15 mins)',
          requirements: selectedPreset?.requirements || ['Review Reel details'],
          fallback: null,
          notes: selectedPreset?.notes || 'Imported directly from social reel recommendation.',
          source: 'reel',
          reelUrl,
        };

        // Add to active trip itinerary (WITHOUT creating another trip!)
        addItineraryBlock(newBlock);

        // Close modal
        close();

        // Switch to itinerary view so user sees it right away
        setActiveTab('itinerary');

        // Optional Toast
        if (typeof window.showToast === 'function') {
          window.showToast(`Proposed "${title}" added to Day ${day}!`);
        }
      });
    }
  }

  function open() {
    render();
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
  }

  function close() {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  }

  return {
    element: modal,
    open,
    close,
  };
}
