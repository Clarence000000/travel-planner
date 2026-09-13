/**
 * StepSurveyViews: Destination input, date pickers, duration stepper, and AI vibe/pace preferences.
 */

import { formatDateRange } from '../../models/tripSettings.js';
import { escapeHtml } from './onboardingPresets.js';

export function renderDestinationView(survey) {
  const rangeLabel = formatDateRange(survey.startDate, survey.endDate, survey.duration);

  return `
    <div class="onboarding-header onboarding-header--with-back">
      <button type="button" class="onboarding-back-btn" id="btn-back-menu" aria-label="Go back">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
        <span>Back</span>
      </button>
      <div class="onboarding-step-indicator">Step 1 of 2 • Where &amp; When</div>
      <h2 class="onboarding-title">Where are we going?</h2>
      <p class="onboarding-subtitle">Set your destination and trip duration:</p>
    </div>

    <div class="onboarding-form">
      <!-- Destination Input -->
      <div class="onboarding-field">
        <label class="onboarding-field__label">Destination</label>
        <div class="onboarding-input-wrap">
          <svg class="onboarding-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          <input 
            type="text" 
            class="onboarding-input" 
            id="dest-search-input" 
            value="${escapeHtml(survey.destination)}"
            placeholder="e.g. Penang, Malaysia"
          />
        </div>
        <div class="onboarding-quick-chips">
          <button type="button" class="onboarding-quick-chip ${survey.destination.includes('Penang') ? 'onboarding-quick-chip--active' : ''}" data-dest="Penang, Malaysia">Penang, Malaysia</button>
          <button type="button" class="onboarding-quick-chip ${survey.destination.includes('Tokyo') ? 'onboarding-quick-chip--active' : ''}" data-dest="Tokyo &amp; Kyoto, Japan">Tokyo &amp; Kyoto</button>
          <button type="button" class="onboarding-quick-chip ${survey.destination.includes('Seoul') ? 'onboarding-quick-chip--active' : ''}" data-dest="Seoul, South Korea">Seoul</button>
          <button type="button" class="onboarding-quick-chip ${survey.destination.includes('Taipei') ? 'onboarding-quick-chip--active' : ''}" data-dest="Taipei, Taiwan">Taipei</button>
        </div>
      </div>

      <!-- Date Range Configuration -->
      <div class="onboarding-field">
        <div class="onboarding-field__split-header">
          <label class="onboarding-field__label">Trip Dates</label>
          <span class="onboarding-duration-badge" id="range-display-label">${rangeLabel}</span>
        </div>

        <div class="onboarding-dates-row">
          <div class="onboarding-date-box">
            <label class="onboarding-date-label">Start Date</label>
            <input 
              type="date" 
              class="onboarding-date-input" 
              id="trip-start-date" 
              value="${survey.startDate}" 
            />
          </div>
          <div class="onboarding-date-arrow">→</div>
          <div class="onboarding-date-box">
            <label class="onboarding-date-label">End Date</label>
            <input 
              type="date" 
              class="onboarding-date-input" 
              id="trip-end-date" 
              value="${survey.endDate}" 
            />
          </div>
        </div>

        <!-- Quick Duration Stepper -->
        <div class="onboarding-stepper-row">
          <span class="onboarding-stepper-label">Duration Quick Stepper:</span>
          <div class="onboarding-stepper">
            <button type="button" class="onboarding-stepper-btn" id="btn-duration-minus" aria-label="Decrease days">−</button>
            <span class="onboarding-stepper-val" id=\"stepper-duration-val\">${survey.duration} Days</span>
            <button type="button" class="onboarding-stepper-btn" id="btn-duration-plus" aria-label="Increase days">+</button>
          </div>
        </div>
      </div>

      <button type="button" class="btn btn--primary onboarding-submit-btn" id="btn-next-preferences">
        <span>Next: Travel Preferences</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>
    </div>
  `;
}

export function renderQuestionsView(survey) {
  const isPenang = !survey.destination || survey.destination.toLowerCase().includes('penang');
  const isTokyo = survey.destination && survey.destination.toLowerCase().includes('tokyo');
  const spots = isPenang
    ? ['Penang Road Famous Teochew Chendul', 'Chew Jetty Heritage Walk', 'Penang Hill Funicular']
    : isTokyo
    ? ['Fushimi Inari 10,000 Torii Shrine', 'Ghibli Museum Mitaka', 'Tsukiji Outer Market Food Tour']
    : ['Historic Old Town Walking Tour', 'Local Street Food Night Market', 'Panoramic City Lookout'];

  return `
    <div class="onboarding-header onboarding-header--with-back">
      <button type="button" class="onboarding-back-btn" id="btn-back-destination" aria-label="Go back">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
        <span>Back</span>
      </button>
      <div class="onboarding-step-indicator">Step 2 of 2 • AI Synthesis &amp; Preferences</div>
      <h2 class="onboarding-title">Tailor Your Schedule</h2>
      <p class="onboarding-subtitle">We balance pacing and weave in top team ideas:</p>
    </div>

    <div class="onboarding-form">
      <!-- Location & Trip Dates Context Badge -->
      <div class="onboarding-location-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
        <span>${escapeHtml(survey.destination || 'Penang, Malaysia')} • ${survey.duration} Days</span>
      </div>

      <!-- Vibe Selector -->
      <div class="onboarding-field">
        <label class="onboarding-field__label">Primary Focus / Vibe</label>
        <div class="onboarding-chips-grid">
          <button type="button" class="onboarding-chip ${survey.vibe === 'food' ? 'onboarding-chip--active' : ''}" data-vibe="food">
            <span>🍜</span> Food &amp; Hawkers
          </button>
          <button type="button" class="onboarding-chip ${survey.vibe === 'culture' ? 'onboarding-chip--active' : ''}" data-vibe="culture">
            <span>⛩️</span> Culture &amp; Heritage
          </button>
          <button type="button" class="onboarding-chip ${survey.vibe === 'scenic' ? 'onboarding-chip--active' : ''}" data-vibe="scenic">
            <span>🏞️</span> Nature &amp; Views
          </button>
          <button type="button" class="onboarding-chip ${survey.vibe === 'modern' ? 'onboarding-chip--active' : ''}" data-vibe="modern">
            <span>🏙️</span> City &amp; Nightlife
          </button>
        </div>
      </div>

      <!-- Pacing Selector -->
      <div class="onboarding-field">
        <label class="onboarding-field__label">Daily Travel Pacing</label>
        <div class="onboarding-chips-grid">
          <button type="button" class="onboarding-chip ${survey.pace === 'chill' ? 'onboarding-chip--active' : ''}" data-pace="chill">
            <span>☕</span> Chill (2–3 stops)
          </button>
          <button type="button" class="onboarding-chip ${survey.pace === 'balanced' ? 'onboarding-chip--active' : ''}" data-pace="balanced">
            <span>⚖️</span> Balanced (3–4 stops)
          </button>
          <button type="button" class="onboarding-chip ${survey.pace === 'turbo' ? 'onboarding-chip--active' : ''}" data-pace="turbo">
            <span>⚡</span> Turbo (5+ stops)
          </button>
        </div>
      </div>

      <!-- Wishlist Integration Glass Card -->
      <div class="onboarding-field">
        <div class="onboarding-wishlist-card">
          <div class="onboarding-wishlist-header">
            <div class="onboarding-wishlist-info">
              <label class="onboarding-wishlist-title" for="toggle-anchor-wishlist">Incorporate Group Wishlist</label>
              <div class="onboarding-wishlist-subtitle">Lock top-voted spots into open schedule slots</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="toggle-anchor-wishlist" ${survey.anchorWishlist ? 'checked' : ''} />
              <span class="toggle-slider"></span>
            </label>
          </div>

          ${
            survey.anchorWishlist
              ? `
            <div class="onboarding-wishlist-content">
              <div class="onboarding-wishlist-lock-note">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <span>Auto-locked into Day 1 &amp; Day 2</span>
              </div>
              <div class="onboarding-wishlist-spots">
                ${spots
                  .map(
                    (s) => `
                  <div class="onboarding-wishlist-spot-tag">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    <span>${escapeHtml(s)}</span>
                  </div>
                `
                  )
                  .join('')}
              </div>
            </div>
          `
              : ''
          }
        </div>
      </div>

      <button type="button" class="btn btn--primary onboarding-submit-btn" id="btn-submit-questions">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
        <span>Synthesize Live Trip</span>
      </button>
    </div>
  `;
}
