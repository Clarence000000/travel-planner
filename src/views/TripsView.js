/**
 * View: My Trips / Trips Portfolio (Clean Zero-State Landing)
 * Displays list of all trip itineraries or an atmospheric clean-slate
 * invitation to create a new trip with Apple iOS 26 Liquid Glass styling.
 * Connects directly to the original AI Questionnaire & Reels Importer modal.
 */

import { getTrips, setActiveTripId, deleteTrip, subscribeTrips } from '../models/tripsModel.js';
import { formatDateRange } from '../models/tripSettings.js';

export function createTripsView(options = {}) {
  const onOpenTrip = options.onOpenTrip || options.onSelectTrip;
  const onOpenOnboarding = options.onOpenOnboarding || (() => {
    if (window.TravelApp && window.TravelApp.openOnboarding) {
      window.TravelApp.openOnboarding();
    }
  });

  const container = document.createElement('div');
  container.className = 'feature-view trips-view';

  function render() {
    const trips = getTrips();

    container.innerHTML = `
      <!-- Atmospheric Top Banner -->
      <div class="view-banner trips-banner" style="background-image: url('./src/assets/bg-itinerary.png');">
        <div class="view-banner__scrim">
          <span class="view-banner__badge">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            WanderSync Journeys
          </span>
          <h2 class="view-banner__title">My Expeditions</h2>
        </div>
      </div>

      <div class="trips-content-wrap" style="padding: 16px;">
        ${
          trips.length === 0
            ? `
          <!-- Pure Clean Slate Zero-State Card -->
          <div class="trips-zero-card">
            <div class="trips-zero-card__icon-capsule">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#E8621A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
              </svg>
            </div>

            <h3 class="trips-zero-card__title">No Expeditions Planned Yet</h3>
            <p class="trips-zero-card__desc">
              Start with a clean canvas. Map timeline stops, calculate automatic transit buffers, brainstorm on the whiteboard, and collaborate with friends.
            </p>

            <div class="trips-zero-card__action">
              <button type="button" class="btn btn--primary btn--lg" id="btn-create-first-trip" style="width: 100%; justify-content: center; padding: 14px 20px; font-size: 15px; font-weight: 700; border-radius: 16px; box-shadow: 0 4px 16px rgba(232, 98, 26, 0.3);">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>Plan New Itinerary</span>
              </button>
            </div>

            <div class="trips-feature-preview-grid">
              <div class="feature-preview-pill">
                <div class="feature-preview-pill__icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div>
                  <strong>Dynamic Timeline</strong>
                  <span>Auto-transit buffering & day reflow</span>
                </div>
              </div>

              <div class="feature-preview-pill">
                <div class="feature-preview-pill__icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E8621A" stroke-width="2.2"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>
                </div>
                <div>
                  <strong>Idea Whiteboard</strong>
                  <span>Instagram reels, TikToks & stickies</span>
                </div>
              </div>

              <div class="feature-preview-pill">
                <div class="feature-preview-pill__icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                </div>
                <div>
                  <strong>AI Route Co-Pilot</strong>
                  <span>Transit calculations & schedule optimization</span>
                </div>
              </div>
            </div>
          </div>
        `
            : `
          <!-- Populated Trips List -->
          <div class="trips-list-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <span style="font-size: 14px; font-weight: 700; color: var(--color-text-primary);">
              Your Trips (${trips.length})
            </span>
            <button type="button" class="btn btn--primary btn--sm" id="btn-create-trip-nav">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>New Trip</span>
            </button>
          </div>

          <div class="trips-cards-grid" style="display: flex; flex-direction: column; gap: 14px;">
            ${trips
              .map((trip) => {
                const dateLabel = formatDateRange(trip.startDate, trip.endDate, trip.totalDays);
                return `
              <div class="trip-summary-card" data-trip-id="${trip.id}">
                <div class="trip-summary-card__cover" style="background-image: url('${trip.coverImage || './src/assets/bg-itinerary.png'}');">
                  <span class="trip-summary-card__tag">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span>${trip.totalDays} Days</span>
                  </span>
                </div>
                <div class="trip-summary-card__body">
                  <h4 class="trip-summary-card__title">${trip.title}</h4>
                  <p class="trip-summary-card__dest">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span>${trip.destination}</span>
                  </p>
                  <p class="trip-summary-card__dates">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <span>${dateLabel}</span>
                  </p>
                  <div class="trip-summary-card__footer">
                    <span class="trip-summary-card__members">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      <span>${(trip.members || ['You']).join(', ')}</span>
                    </span>
                    <button type="button" class="btn-trip-delete" data-delete-trip-id="${trip.id}" title="Delete trip">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            `;
              })
              .join('')}
          </div>
        `
        }
      </div>
    `;

    // Event listeners
    const createFirstBtn = container.querySelector('#btn-create-first-trip');
    if (createFirstBtn) {
      createFirstBtn.addEventListener('click', () => onOpenOnboarding());
    }

    const createNavBtn = container.querySelector('#btn-create-trip-nav');
    if (createNavBtn) {
      createNavBtn.addEventListener('click', () => onOpenOnboarding());
    }

    container.querySelectorAll('.trip-summary-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-trip-delete')) return;
        const tripId = card.getAttribute('data-trip-id');
        setActiveTripId(tripId);
        const trip = trips.find((t) => t.id === tripId);
        if (typeof onOpenTrip === 'function') {
          onOpenTrip(trip);
        }
      });
    });

    container.querySelectorAll('.btn-trip-delete').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tripId = btn.getAttribute('data-delete-trip-id');
        if (confirm('Delete this trip itinerary?')) {
          deleteTrip(tripId);
          render();
        }
      });
    });
  }

  // Subscribe to changes in trips
  const unsubscribe = subscribeTrips(() => {
    render();
  });

  render();

  return {
    element: container,
    render,
    destroy: unsubscribe,
  };
}
