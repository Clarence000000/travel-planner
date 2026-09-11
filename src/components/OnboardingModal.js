/**
 * Component: Onboarding & Data Import Modal
 * Provides an interactive welcome experience allowing travelers to:
 * 1. Configure Destination & Arbitrary Date Range (Step 1)
 * 2. Answer quick AI questions on Vibe, Pace, and anchor top-voted Wishlist spots (Step 2)
 * 3. Import travel data from Instagram Reels / TikTok links (Step 2B)
 * 4. Customize Extracted Schedule: Date/duration selector & draggable anchors (Step 2C)
 * 5. Review Trip Reveal Summary Sheet (Step 3) before editing timeline
 */

import { saveItineraryData, getItineraryData } from '../models/itineraryData.js';
import {
  getWishlist,
  addWishlistItem,
  getTopVotedWishlistItems,
  markWishlistScheduled,
} from '../models/wishlistData.js';
import { setActiveTab } from '../config/navigation.js';
import {
  getTripSettings,
  saveTripSettings,
  calculateDaysBetween,
  formatDateRange,
} from '../models/tripSettings.js';
import {
  getActiveTrip,
  setActiveTripId,
  createTrip,
  updateTrip,
  getActiveTripId,
} from '../models/tripsModel.js';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function createOnboardingModal(options = {}) {
  const { onComplete } = options;

  const overlay = document.createElement('div');
  overlay.className = 'onboarding-overlay';
  overlay.id = 'onboarding-modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'onboarding-title');
  overlay.style.display = 'none';

  // Modal Step State: 'menu' | 'destination' | 'questions' | 'reels' | 'customize' | 'processing' | 'reveal'
  let currentStep = 'menu';
  let processingType = 'reels'; // 'questions' | 'reels'
  let processingStep = 0;

  // Questionnaire / Trip state loaded from trip settings
  const initialSettings = getTripSettings();
  const survey = {
    destination: initialSettings.destination || 'Penang, Malaysia',
    title: initialSettings.title || 'Penang Expedition',
    startDate: initialSettings.startDate || '2026-10-12',
    endDate: initialSettings.endDate || '2026-10-14',
    duration: initialSettings.totalDays || 3,
    vibe: initialSettings.vibe || 'food', // 'food' | 'culture' | 'modern' | 'scenic'
    pace: initialSettings.pace || 'balanced', // 'chill' | 'balanced' | 'turbo'
    travelers: 'duo', // 'duo' | 'squad' | 'solo'
    anchorWishlist: true,
  };

  // Social Reel Extraction State (Penang Heritage & Foodie Demo)
  let reelUrl = 'https://www.instagram.com/reel/C8x9_penang_heritage';

  // Draggable Extracted Anchors
  let extractedAnchors = [
    {
      id: 'anchor-chew-jetty',
      title: 'Clan Jetties (Chew Jetty) Morning Heritage Walk',
      location: 'Chew Jetty, Weld Quay, George Town',
      day: 1,
      startTime: '09:30',
      endTime: '11:00',
      timeSlot: '09:30 – 11:00',
      category: 'activity',
      tag: 'Heritage Walk',
      icon: '📍',
    },
    {
      id: 'anchor-penang-hill',
      title: 'Penang Hill Funicular & The Habitat Sunset Canopy Walk',
      location: 'Bukit Bendera, Air Itam',
      day: 1,
      startTime: '16:30',
      endTime: '19:00',
      timeSlot: '16:30 – 19:00',
      category: 'activity',
      tag: 'Nature & Sunset',
      icon: '📍',
    },
  ];

  // Helper: date addition without UTC drift
  function addDaysToDate(startDateStr, numDays) {
    if (!startDateStr) return '2026-10-14';
    const parts = startDateStr.split('-').map(Number);
    if (parts.length !== 3) return '2026-10-14';
    const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    d.setUTCDate(d.getUTCDate() + numDays);
    return d.toISOString().split('T')[0];
  }

  function render() {
    overlay.innerHTML = `
      <div class="onboarding-card">
        <!-- Close Button -->
        <button type="button" class="onboarding-close-btn" id="btn-close-onboarding" aria-label="Close modal">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        ${renderStepContent()}
      </div>
    `;

    bindEvents();
  }

  function renderStepContent() {
    switch (currentStep) {
      case 'destination':
        return renderDestinationView();
      case 'questions':
        return renderQuestionsView();
      case 'reels':
        return renderReelsView();
      case 'customize':
        return renderCustomizeView();
      case 'processing':
        return renderProcessingView();
      case 'reveal':
        return renderRevealView();
      case 'menu':
      default:
        return renderMenuView();
    }
  }

  // ── Menu View: Choose Path ──────────────────────────────────
  function renderMenuView() {
    return `
      <div class="onboarding-header">
        <div class="onboarding-badge">WanderSync Genesis</div>
        <h2 class="onboarding-title" id="onboarding-title">Plan Your Next Trip</h2>
        <p class="onboarding-subtitle">Choose how you'd like to seed your collaborative itinerary:</p>
      </div>

      <div class="onboarding-menu-grid">
        <!-- Option A: AI Survey Flow -->
        <button type="button" class="onboarding-menu-card" id="btn-select-questions">
          <div class="onboarding-menu-card__icon onboarding-menu-card__icon--ai">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          </div>
          <div class="onboarding-menu-card__content">
            <strong class="onboarding-menu-card__title">Quick Survey Flow</strong>
            <p class="onboarding-menu-card__desc">Choose destination, dates, travel pace &amp; incorporate group wishlist.</p>
          </div>
          <div class="onboarding-menu-card__arrow">→</div>
        </button>

        <!-- Option B: Social Reel Import -->
        <button type="button" class="onboarding-menu-card onboarding-menu-card--highlight" id="btn-select-reels">
          <div class="onboarding-menu-card__icon onboarding-menu-card__icon--reels">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
          </div>
          <div class="onboarding-menu-card__content">
            <strong class="onboarding-menu-card__title">Import from Social Reels</strong>
            <p class="onboarding-menu-card__desc">Extract spots directly from an Instagram Reel or TikTok video.</p>
          </div>
          <div class="onboarding-menu-card__arrow">→</div>
        </button>
      </div>

      <div class="onboarding-footer">
        <button type="button" class="onboarding-skip-btn" id="btn-skip-onboarding">Skip &amp; explore blank canvas</button>
      </div>
    `;
  }

  // ── Step 1: Destination & Arbitrary Date Range ───────────────
  function renderDestinationView() {
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
              value="${survey.destination}"
              placeholder="e.g. Tokyo &amp; Kyoto, Japan"
            />
          </div>
          <div class="onboarding-quick-chips">
            <button type="button" class="onboarding-quick-chip" data-dest="Penang, Malaysia">Penang, Malaysia</button>
            <button type="button" class="onboarding-quick-chip" data-dest="Tokyo &amp; Kyoto, Japan">Tokyo &amp; Kyoto</button>
            <button type="button" class="onboarding-quick-chip" data-dest="Seoul, South Korea">Seoul</button>
            <button type="button" class="onboarding-quick-chip" data-dest="Taipei, Taiwan">Taipei</button>
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
              <span class="onboarding-stepper-val" id="stepper-duration-val">${survey.duration} Days</span>
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

  // ── Step 2A: Quick AI Travel Preferences ─────────────────────
  function renderQuestionsView() {
    const isPenang = !survey.destination || survey.destination.toLowerCase().includes('penang');
    const isTokyo = survey.destination && survey.destination.toLowerCase().includes('tokyo');
    const spots = isPenang
      ? ['Penang Road Famous Teochew Chendul', 'Chew Jetty Heritage Walk', 'Penang Hill Funicular']
      : isTokyo
      ? ['Fushimi Inari 10,000 Torii Shrine', 'Ghibli Museum Mitaka', 'Tsukiji Outer Market Food Tour']
      : ['Top Group Wishlist Pick 1', 'Top Group Wishlist Pick 2', 'Top Group Wishlist Pick 3'];

    return `
      <div class="onboarding-header onboarding-header--with-back">
        <button type="button" class="onboarding-back-btn" id="btn-back-destination" aria-label="Go back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
          <span>Back</span>
        </button>
        <div class="onboarding-step-indicator">Step 2 of 2 • AI Synthesis</div>
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
              <span>🍜</span> Food &amp; Izakayas
            </button>
            <button type="button" class="onboarding-chip ${survey.vibe === 'culture' ? 'onboarding-chip--active' : ''}" data-vibe="culture">
              <span>⛩️</span> Culture &amp; Shrines
            </button>
            <button type="button" class="onboarding-chip ${survey.vibe === 'scenic' ? 'onboarding-chip--active' : ''}" data-vibe="scenic">
              <span>🗻</span> Nature &amp; Views
            </button>
            <button type="button" class="onboarding-chip ${survey.vibe === 'modern' ? 'onboarding-chip--active' : ''}" data-vibe="modern">
              <span>🏙️</span> City &amp; Tech
            </button>
          </div>
        </div>

        <!-- Pacing Selector -->
        <div class="onboarding-field">
          <label class="onboarding-field__label">Daily Travel Pacing</label>
          <div class="onboarding-chips-grid">
            <button type="button" class="onboarding-chip ${survey.pace === 'chill' ? 'onboarding-chip--active' : ''}" data-pace="chill">
              <span>☕</span> Chill (2–3 spots)
            </button>
            <button type="button" class="onboarding-chip ${survey.pace === 'balanced' ? 'onboarding-chip--active' : ''}" data-pace="balanced">
              <span>⚖️</span> Balanced (3–4 spots)
            </button>
            <button type="button" class="onboarding-chip ${survey.pace === 'turbo' ? 'onboarding-chip--active' : ''}" data-pace="turbo">
              <span>⚡</span> Turbo (5+ spots)
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

            ${survey.anchorWishlist ? `
              <div class="onboarding-wishlist-content">
                <div class="onboarding-wishlist-lock-note">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  <span>Auto-locked into Day 1 &amp; Day 2</span>
                </div>
                <div class="onboarding-wishlist-spots">
                  ${spots.map(s => `
                    <div class="onboarding-wishlist-spot-tag">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                      <span>${escapeHtml(s)}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>

        <button type="button" class="btn btn--primary onboarding-submit-btn" id="btn-submit-questions">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          <span>Generate Smart Itinerary</span>
        </button>
      </div>
    `;
  }
  // ── Step 2B: IG Reels / Social Import Form ───────────────────
  function renderReelsView() {
    return `
      <div class="onboarding-header onboarding-header--with-back">
        <button type="button" class="onboarding-back-btn" id="btn-back-menu" aria-label="Go back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
          <span>Back</span>
        </button>
        <h2 class="onboarding-title">Import from Social Reels</h2>
        <p class="onboarding-subtitle">Paste an Instagram Reel, TikTok, or YouTube Short link:</p>
      </div>

      <div class="onboarding-form">
        <div class="onboarding-field">
          <label class="onboarding-field__label">Social Video Link</label>
          <div class="onboarding-input-wrap">
            <input 
              type="url" 
              class="onboarding-url-input" 
              id="reel-url-input" 
              value="${reelUrl}"
              placeholder="https://www.instagram.com/reel/..."
            />
          </div>
        </div>

        <div class="onboarding-field">
          <label class="onboarding-field__label">Or pick a trending demo video:</label>
          <div class="onboarding-demo-reels">
            <!-- Hero Featured Reel: Penang Heritage & Sunset Spots -->
            <button type="button" class="demo-reel-card demo-reel-card--hero" data-reel-url="https://www.instagram.com/reel/C8x9_penang_heritage">
              <div class="demo-reel-card__badge" style="background:#FEE2E2; color:#DC2626;">FEATURED REEL</div>
              <strong class="demo-reel-card__title">@penangfoodie: 5 Must-Visit Heritage Spots &amp; Sunset Lookouts</strong>
              <span class="demo-reel-card__meta">3.8M views • 2 anchors detected</span>
            </button>

            <button type="button" class="demo-reel-card" data-reel-url="https://www.instagram.com/reel/C8_georgetown_heritage">
              <div class="demo-reel-card__badge" style="background:#E0E7FF; color:#4338CA;">TRENDING</div>
              <strong class="demo-reel-card__title">@penangvibes: George Town Colonial Streets &amp; Street Art</strong>
              <span class="demo-reel-card__meta">1.9M views • 3 anchors detected</span>
            </button>
          </div>
        </div>

        <button type="button" class="btn btn--primary onboarding-submit-btn" id="btn-submit-reel">
          <span>Scan Video &amp; Extract Spots</span>
        </button>
      </div>
    `;
  }

  // ── Step 2C: Customize Extracted Schedule (Liquid Glass) ─────
  function renderCustomizeView() {
    const rangeLabel = formatDateRange(survey.startDate, survey.endDate, survey.duration);

    return `
      <div class="onboarding-header onboarding-header--with-back">
        <button type="button" class="onboarding-back-btn" id="btn-back-reels" aria-label="Go back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
          <span>Back</span>
        </button>
        <h2 class="onboarding-title">Customize Extracted Schedule</h2>
        <p class="onboarding-subtitle">Review detected venues, configure trip dates, and drag to prioritize.</p>
      </div>

      <div class="onboarding-form customize-form">
        <!-- Source Reel Callout Card (Liquid Glass) -->
        <div class="customize-source-card">
          <div class="customize-source-card__icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </div>
          <div class="customize-source-card__info">
            <div class="customize-source-card__creator">@penangfoodie</div>
            <div class="customize-source-card__title">5 Must-Visit Heritage Spots &amp; Sunset Lookouts</div>
          </div>
          <span class="customize-source-card__tag">Verified Scan</span>
        </div>

        <!-- Date Range Configuration (Identical to Quick Survey Flow) -->
        <div class="onboarding-field">
          <div class="onboarding-field__split-header">
            <label class="onboarding-field__label">Trip Dates</label>
            <span class="onboarding-duration-badge" id="customize-range-display-label">${rangeLabel}</span>
          </div>

          <div class="onboarding-dates-row">
            <div class="onboarding-date-box">
              <label class="onboarding-date-label">Start Date</label>
              <input 
                type="date" 
                class="onboarding-date-input" 
                id="customize-start-date" 
                value="${survey.startDate}" 
              />
            </div>
            <div class="onboarding-date-arrow">→</div>
            <div class="onboarding-date-box">
              <label class="onboarding-date-label">End Date</label>
              <input 
                type="date" 
                class="onboarding-date-input" 
                id="customize-end-date" 
                value="${survey.endDate}" 
              />
            </div>
          </div>

          <!-- Quick Duration Stepper -->
          <div class="onboarding-stepper-row">
            <span class="onboarding-stepper-label">Duration Quick Stepper:</span>
            <div class="onboarding-stepper">
              <button type="button" class="onboarding-stepper-btn" id="btn-cust-duration-minus" aria-label="Decrease days">−</button>
              <span class="onboarding-stepper-val" id="cust-stepper-duration-val">${survey.duration} Days</span>
              <button type="button" class="onboarding-stepper-btn" id="btn-cust-duration-plus" aria-label="Increase days">+</button>
            </div>
          </div>
        </div>

        <!-- Section 2: Draggable Extracted Anchors -->
        <div class="onboarding-field customize-anchors-section">
          <div class="customize-section-header">
            <label class="onboarding-field__label" style="margin-bottom: 0;">Extracted Anchors</label>
            <span class="customize-drag-hint">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="7 8 12 3 17 8"></polyline><polyline points="7 16 12 21 17 16"></polyline><line x1="12" y1="3" x2="12" y2="21"></line></svg>
              <span>Drag or tap handle to reorder</span>
            </span>
          </div>

          <div class="customize-anchors-list" id="customize-anchors-list" role="list">
            ${extractedAnchors.map((anchor, index) => renderAnchorCard(anchor, index)).join('')}
          </div>
        </div>

        <!-- Build Itinerary CTA Button -->
        <button type="button" class="btn btn--primary onboarding-submit-btn" id="btn-build-itinerary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          <span>Build Itinerary</span>
        </button>
      </div>
    `;
  }
  function renderAnchorCard(anchor, index) {
    const defaultTime = index === 0 ? '09:30 – 11:00' : '16:30 – 19:00';
    return `
      <div 
        class="customize-anchor-card" 
        draggable="true" 
        data-anchor-id="${anchor.id}" 
        data-index="${index}"
        tabindex="0"
        role="listitem"
      >
        <!-- Itinerary Reusable Drag Handle -->
        <div 
          class="drag-grip drag-grip--inline customize-drag-handle" 
          data-action="reorder"
          data-index="${index}"
          title="Hold and drag to reorder schedule" 
          aria-label="Drag handle"
        >
          <svg width="12" height="14" viewBox="0 0 16 20" fill="currentColor" opacity="0.65">
            <circle cx="5" cy="4" r="1.5"/><circle cx="11" cy="4" r="1.5"/>
            <circle cx="5" cy="10" r="1.5"/><circle cx="11" cy="10" r="1.5"/>
            <circle cx="5" cy="16" r="1.5"/><circle cx="11" cy="16" r="1.5"/>
          </svg>
        </div>

        <!-- Content: Title, Location (with location icon above time, not truncated), Time -->
        <div class="customize-anchor-content">
          <h4 class="customize-anchor-title">${escapeHtml(anchor.title)}</h4>
          <div class="customize-anchor-loc-row">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="customize-anchor-loc-icon">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span class="customize-anchor-loc-text">${escapeHtml(anchor.location)}</span>
          </div>
          <div class="customize-anchor-time-row">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="customize-anchor-time-icon">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span class="customize-anchor-time-text">${escapeHtml(anchor.timeSlot || defaultTime)}</span>
          </div>
        </div>

        <!-- Day Dropdown Pill -->
        <div class="customize-day-select-wrap">
          <select 
            class="customize-day-select" 
            data-anchor-id="${anchor.id}"
            aria-label="Assigned day for ${anchor.title}"
          >
            <option value="1" ${anchor.day === 1 ? 'selected' : ''}>Day 1 ▾</option>
            <option value="2" ${anchor.day === 2 ? 'selected' : ''}>Day 2 ▾</option>
            <option value="3" ${anchor.day === 3 ? 'selected' : ''}>Day 3 ▾</option>
          </select>
        </div>
      </div>
    `;
  }
  // ── Step 3: Processing Animation Screen ──────────────────────
  function renderProcessingView() {
    const steps = [
      'Scanning video keyframes & audio transcript...',
      'Recognizing landmarks & geo-coordinates...',
      'Synthesizing transit times & buffer guards...',
      'Finalizing collaborative timeline...',
    ];

    return `
      <div class="onboarding-processing">
        <div class="processing-spinner-ring">
          <div class="spinner-dot"></div>
        </div>
        <h3 class="processing-title">Synthesizing Itinerary</h3>
        <p class="processing-subtitle">Our AI engine is compiling your custom itinerary.</p>

        <div class="processing-steps-list">
          ${steps
            .map((text, i) => {
              const isDone = i < processingStep;
              const isCurrent = i === processingStep;
              return `
              <div class="processing-step-item ${isDone ? 'processing-step-item--done' : ''} ${isCurrent ? 'processing-step-item--current' : ''}">
                <span class="processing-step-icon">
                  ${
                    isDone
                      ? `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>`
                      : isCurrent
                      ? `<svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"></circle></svg>`
                      : `<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg>`
                  }
                </span>
                <span>${text}</span>
              </div>
            `;
            })
            .join('')}
        </div>
      </div>
    `;
  }

  // ── Step 4: Trip Reveal Summary Sheet ────────────────────────
  function renderRevealView() {
    const isReel = processingType === 'reels';
    const topWishlist = getTopVotedWishlistItems(2);

    return `
      <div class="onboarding-reveal">
        <!-- Hero Summary Card -->
        <div class="reveal-hero">
          <span class="reveal-hero__badge">Trip Synthesis Ready</span>
          <h2 class="reveal-hero__title">${survey.destination}</h2>
          
          <!-- Trip DNA Badges -->
          <div class="reveal-dna-bar">
            <span class="reveal-dna-pill">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>${survey.duration} Days</span>
            </span>
            <span class="reveal-dna-pill">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>${survey.pace.charAt(0).toUpperCase() + survey.pace.slice(1)} Pace</span>
            </span>
            <span class="reveal-dna-pill">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Transit Buffer Safe</span>
            </span>
          </div>
        </div>

        <!-- Dynamic Day Snapshot List -->
        <div class="reveal-days-list">
          <div class="reveal-day-card">
            <div class="reveal-day-num">D1</div>
            <div class="reveal-day-info">
              <h4 class="reveal-day-title">Arrival, Historic Asakusa &amp; Digital Art</h4>
              <span class="reveal-day-meta">4 activities • 30m allocated transit buffer</span>
            </div>
          </div>

          <div class="reveal-day-card">
            <div class="reveal-day-num">D2</div>
            <div class="reveal-day-info">
              <h4 class="reveal-day-title">Kyoto Cultural Shrines &amp; Riverside Soba</h4>
              <span class="reveal-day-meta">3 activities • Weather-permitting fallback armed</span>
            </div>
          </div>

          ${
            survey.duration >= 3
              ? `
            <div class="reveal-day-card">
              <div class="reveal-day-num">D3</div>
              <div class="reveal-day-info">
                <h4 class="reveal-day-title">Modern Cityscape, Skyline &amp; Farewell BBQ</h4>
                <span class="reveal-day-meta">2 activities • Direct airport transit linked</span>
              </div>
            </div>
          `
              : ''
          }
        </div>

        <!-- Anchors Summary Box -->
        <div class="reveal-anchors-box">
          <span class="reveal-anchors-title">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            <span>${isReel ? 'Extracted Spots Linked' : 'Group Wishlist Anchors Scheduled'}</span>
          </span>
          <div class="reveal-anchors-chips">
            ${
              isReel
                ? `
              <span class="reveal-anchor-tag">Shibuya Sky (Scheduled Day 1)</span>
              <span class="reveal-anchor-tag">3 Alley Venues (Saved to Wishlist)</span>
            `
                : survey.anchorWishlist && topWishlist.length > 0
                ? topWishlist.map((item) => `<span class="reveal-anchor-tag">${item.title}</span>`).join('')
                : `<span class="reveal-anchor-tag">Curated Highlights</span>`
            }
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="reveal-actions">
          <button type="button" class="btn btn--primary onboarding-submit-btn" id="btn-reveal-confirm">
            <span>Explore Full Itinerary</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-left: 6px;"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
          <button type="button" class="reveal-btn-reedit" id="btn-reveal-adjust">
            Adjust Vibe or Pace
          </button>
        </div>
      </div>
    `;
  }

  // ── Event Handlers ──────────────────────────────────────────
  function bindEvents() {
    // Close / Skip
    const closeBtn = overlay.querySelector('#btn-close-onboarding');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    const skipBtn = overlay.querySelector('#btn-skip-onboarding');
    if (skipBtn) skipBtn.addEventListener('click', closeModal);

    // Menu Navigation
    const selectQuestions = overlay.querySelector('#btn-select-questions');
    if (selectQuestions) {
      selectQuestions.addEventListener('click', () => {
        currentStep = 'destination';
        render();
      });
    }

    const selectReels = overlay.querySelector('#btn-select-reels');
    if (selectReels) {
      selectReels.addEventListener('click', () => {
        currentStep = 'reels';
        render();
      });
    }

    // Step 1: Destination handlers
    const backMenuBtn = overlay.querySelector('#btn-back-menu');
    if (backMenuBtn) {
      backMenuBtn.addEventListener('click', () => {
        currentStep = 'menu';
        render();
      });
    }

    const destInput = overlay.querySelector('#dest-search-input');
    if (destInput) {
      destInput.addEventListener('input', (e) => {
        survey.destination = e.target.value;
      });
    }

    overlay.querySelectorAll('[data-dest]').forEach((btn) => {
      btn.addEventListener('click', () => {
        survey.destination = btn.getAttribute('data-dest');
        render();
      });
    });

    // Date Pickers in Destination step
    const startDateInput = overlay.querySelector('#trip-start-date');
    const endDateInput = overlay.querySelector('#trip-end-date');
    const rangeDisplay = overlay.querySelector('#range-display-label');
    const stepperVal = overlay.querySelector('#stepper-duration-val');

    function syncDates() {
      if (startDateInput && endDateInput) {
        survey.startDate = startDateInput.value;
        survey.endDate = endDateInput.value;
        survey.duration = calculateDaysBetween(survey.startDate, survey.endDate);
        if (stepperVal) stepperVal.textContent = `${survey.duration} Days`;
        if (rangeDisplay) rangeDisplay.textContent = formatDateRange(survey.startDate, survey.endDate, survey.duration);
      }
    }

    if (startDateInput) {
      startDateInput.addEventListener('change', syncDates);
    }
    if (endDateInput) {
      endDateInput.addEventListener('change', syncDates);
    }

    // Duration Stepper Buttons
    const btnMinus = overlay.querySelector('#btn-duration-minus');
    const btnPlus = overlay.querySelector('#btn-duration-plus');

    if (btnMinus) {
      btnMinus.addEventListener('click', () => {
        if (survey.duration > 1) {
          survey.duration--;
          survey.endDate = addDaysToDate(survey.startDate, survey.duration - 1);
          render();
        }
      });
    }

    if (btnPlus) {
      btnPlus.addEventListener('click', () => {
        survey.duration++;
        survey.endDate = addDaysToDate(survey.startDate, survey.duration - 1);
        render();
      });
    }

    const nextPrefBtn = overlay.querySelector('#btn-next-preferences');
    if (nextPrefBtn) {
      nextPrefBtn.addEventListener('click', () => {
        currentStep = 'questions';
        render();
      });
    }

    // Step 2A: Questionnaire handlers
    const backDestBtn = overlay.querySelector('#btn-back-destination');
    if (backDestBtn) {
      backDestBtn.addEventListener('click', () => {
        currentStep = 'destination';
        render();
      });
    }

    overlay.querySelectorAll('[data-vibe]').forEach((chip) => {
      chip.addEventListener('click', () => {
        survey.vibe = chip.getAttribute('data-vibe');
        render();
      });
    });

    overlay.querySelectorAll('[data-pace]').forEach((chip) => {
      chip.addEventListener('click', () => {
        survey.pace = chip.getAttribute('data-pace');
        render();
      });
    });

    const anchorToggle = overlay.querySelector('#toggle-anchor-wishlist');
    if (anchorToggle) {
      anchorToggle.addEventListener('change', (e) => {
        survey.anchorWishlist = e.target.checked;
        render();
      });
    }

    const submitQuestions = overlay.querySelector('#btn-submit-questions');
    if (submitQuestions) {
      submitQuestions.addEventListener('click', () => {
        startProcessing('questions');
      });
    }

    // Step 2B: Reels handlers -> Navigate directly to customize step
    overlay.querySelectorAll('.demo-reel-card').forEach((card) => {
      card.addEventListener('click', () => {
        const url = card.getAttribute('data-reel-url');
        reelUrl = url;
        const input = overlay.querySelector('#reel-url-input');
        if (input) input.value = url;
        currentStep = 'customize';
        render();
      });
    });

    const submitReel = overlay.querySelector('#btn-submit-reel');
    if (submitReel) {
      submitReel.addEventListener('click', () => {
        const input = overlay.querySelector('#reel-url-input');
        if (input) reelUrl = input.value.trim() || reelUrl;
        currentStep = 'customize';
        render();
      });
    }

    // Step 2C: Customize handlers
    if (currentStep === 'customize') {
      bindCustomizeStepEvents();
    }

    // Step 3: Reveal Sheet Handlers
    const confirmReveal = overlay.querySelector('#btn-reveal-confirm');
    if (confirmReveal) {
      confirmReveal.addEventListener('click', () => {
        finishOnboarding(processingType);
      });
    }

    const adjustReveal = overlay.querySelector('#btn-reveal-adjust');
    if (adjustReveal) {
      adjustReveal.addEventListener('click', () => {
        currentStep = 'questions';
        render();
      });
    }
  }

  // ── Customize Step Event Bindings ───────────────────────────
  function bindCustomizeStepEvents() {
    // Back Button to Reels view
    const backReelsBtn = overlay.querySelector('#btn-back-reels');
    if (backReelsBtn) {
      backReelsBtn.addEventListener('click', () => {
        currentStep = 'reels';
        render();
      });
    }

    // Date Range Configuration (Identical to Quick Survey Flow)
    const startDateInput = overlay.querySelector('#customize-start-date');
    const endDateInput = overlay.querySelector('#customize-end-date');
    const rangeDisplay = overlay.querySelector('#customize-range-display-label');
    const stepperVal = overlay.querySelector('#cust-stepper-duration-val');

    function syncCustomizeDates() {
      if (startDateInput && endDateInput) {
        if (startDateInput.value) survey.startDate = startDateInput.value;
        if (endDateInput.value) {
          if (endDateInput.value < survey.startDate) {
            survey.endDate = survey.startDate;
            endDateInput.value = survey.startDate;
          } else {
            survey.endDate = endDateInput.value;
          }
        }
        survey.duration = calculateDaysBetween(survey.startDate, survey.endDate);
        if (stepperVal) stepperVal.textContent = `${survey.duration} Days`;
        if (rangeDisplay) rangeDisplay.textContent = formatDateRange(survey.startDate, survey.endDate, survey.duration);
      }
    }

    if (startDateInput) {
      startDateInput.addEventListener('change', () => {
        if (startDateInput.value) {
          survey.startDate = startDateInput.value;
          survey.endDate = addDaysToDate(survey.startDate, survey.duration - 1);
          if (endDateInput) endDateInput.value = survey.endDate;
          syncCustomizeDates();
        }
      });
    }

    if (endDateInput) {
      endDateInput.addEventListener('change', syncCustomizeDates);
    }

    // Duration Stepper Buttons
    const btnCustMinus = overlay.querySelector('#btn-cust-duration-minus');
    const btnCustPlus = overlay.querySelector('#btn-cust-duration-plus');

    if (btnCustMinus) {
      btnCustMinus.addEventListener('click', () => {
        if (survey.duration > 1) {
          survey.duration--;
          survey.endDate = addDaysToDate(survey.startDate, survey.duration - 1);
          if (endDateInput) endDateInput.value = survey.endDate;
          if (stepperVal) stepperVal.textContent = `${survey.duration} Days`;
          if (rangeDisplay) rangeDisplay.textContent = formatDateRange(survey.startDate, survey.endDate, survey.duration);
        }
      });
    }

    if (btnCustPlus) {
      btnCustPlus.addEventListener('click', () => {
        survey.duration++;
        survey.endDate = addDaysToDate(survey.startDate, survey.duration - 1);
        if (endDateInput) endDateInput.value = survey.endDate;
        if (stepperVal) stepperVal.textContent = `${survey.duration} Days`;
        if (rangeDisplay) rangeDisplay.textContent = formatDateRange(survey.startDate, survey.endDate, survey.duration);
      });
    }

    // Draggable Anchors
    bindDragAndReorderEvents();

    // Build Itinerary CTA
    const btnBuild = overlay.querySelector('#btn-build-itinerary');
    if (btnBuild) {
      btnBuild.addEventListener('click', () => {
        buildPenangItinerary();
      });
    }
  }
  // ── Drag & Drop / Handle Reorder for Anchors ──────────────────
  function bindDragAndReorderEvents() {
    const listEl = overlay.querySelector('#customize-anchors-list');
    if (!listEl) return;

    let draggedIdx = null;
    const cards = listEl.querySelectorAll('.customize-anchor-card');

    cards.forEach((card) => {
      card.addEventListener('dragstart', (e) => {
        draggedIdx = Number(card.getAttribute('data-index'));
        card.classList.add('is-dragging');
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', String(draggedIdx));
        }
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('is-dragging');
        cards.forEach((c) => c.classList.remove('is-drag-over'));
        draggedIdx = null;
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
        card.classList.add('is-drag-over');
      });

      card.addEventListener('dragleave', () => {
        card.classList.remove('is-drag-over');
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('is-drag-over');
        const targetIdx = Number(card.getAttribute('data-index'));
        if (draggedIdx !== null && draggedIdx !== targetIdx) {
          swapAnchors(draggedIdx, targetIdx);
        }
      });

      // Handle Click Reorder (swap with other spot)
      const handleBtn = card.querySelector('.customize-drag-handle');
      if (handleBtn) {
        handleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const currIdx = Number(card.getAttribute('data-index'));
          const nextIdx = currIdx === 0 ? 1 : 0;
          swapAnchors(currIdx, nextIdx);
        });
      }

      // Day Dropdown Select
      const daySelect = card.querySelector('.customize-day-select');
      if (daySelect) {
        daySelect.addEventListener('change', (e) => {
          const id = daySelect.getAttribute('data-anchor-id');
          const found = extractedAnchors.find((a) => a.id === id);
          if (found) {
            found.day = Number(e.target.value);
          }
        });
      }
    });
  }

  function swapAnchors(fromIdx, toIdx) {
    if (
      fromIdx < 0 ||
      toIdx < 0 ||
      fromIdx >= extractedAnchors.length ||
      toIdx >= extractedAnchors.length
    ) {
      return;
    }

    const temp = extractedAnchors[fromIdx];
    extractedAnchors[fromIdx] = extractedAnchors[toIdx];
    extractedAnchors[toIdx] = temp;

    // Recalculate scheduled time slots based on slot position
    if (extractedAnchors.length >= 2) {
      extractedAnchors[0].startTime = '09:30';
      extractedAnchors[0].endTime = '11:00';
      extractedAnchors[0].timeSlot = '09:30 – 11:00';

      extractedAnchors[1].startTime = '16:30';
      extractedAnchors[1].endTime = '19:00';
      extractedAnchors[1].timeSlot = '16:30 – 19:00';
    }

    const listEl = overlay.querySelector('#customize-anchors-list');
    if (listEl) {
      listEl.innerHTML = extractedAnchors
        .map((anchor, index) => renderAnchorCard(anchor, index))
        .join('');
      bindDragAndReorderEvents();
    }
  }

  // ── Build Itinerary Action ───────────────────────────────────
  function buildPenangItinerary() {
    survey.destination = 'Penang, Malaysia';
    survey.title = 'Penang Expedition';
    if (!survey.startDate) survey.startDate = '2026-10-12';
    if (!survey.endDate) survey.endDate = '2026-10-14';
    if (!survey.duration) survey.duration = 3;

    const coverImage = './src/assets/hero-banner.jpg';

    // 1. Ensure or update active trip record in tripsModel
    let activeTrip = getActiveTrip();
    if (!activeTrip) {
      activeTrip = createTrip({
        title: 'Penang Expedition',
        destination: 'Penang, Malaysia',
        startDate: survey.startDate,
        endDate: survey.endDate,
        totalDays: survey.duration,
        coverImage,
      });
    } else {
      activeTrip = updateTrip(activeTrip.id, {
        title: 'Penang Expedition',
        destination: 'Penang, Malaysia',
        startDate: survey.startDate,
        endDate: survey.endDate,
        totalDays: survey.duration,
        coverImage,
      });
    }
    setActiveTripId(activeTrip.id);

    // 2. Persist trip settings
    saveTripSettings({
      title: 'Penang Expedition',
      destination: 'Penang, Malaysia',
      startDate: survey.startDate,
      endDate: survey.endDate,
      totalDays: survey.duration,
      coverImage,
      pace: survey.pace,
      vibe: survey.vibe,
    });

    // 3. Populate Day 1 blocks STRICTLY with the 2 extracted anchors
    const day1Blocks = extractedAnchors.map((anchor, idx) => {
      const isFirst = idx === 0;
      const isChew =
        anchor.id.includes('chew') ||
        anchor.title.toLowerCase().includes('chew') ||
        anchor.title.toLowerCase().includes('jetty');

      return {
        id: isChew ? 'd1-chew-jetty' : 'd1-penang-hill',
        day: Number(anchor.day) || 1,
        startTime: isFirst ? '09:30' : '16:30',
        endTime: isFirst ? '11:00' : '19:00',
        category: 'activity',
        status: 'confirmed',
        title: anchor.title,
        location: isChew ? 'Chew Jetty, Weld Quay, George Town' : 'Bukit Bendera, Air Itam',
        transitToNextMinutes: isChew ? 25 : 20,
        transitMode: isChew ? 'GrabCar / Rapid Penang' : 'GrabCar',
        requirements: isChew
          ? ['Walking Shoes', 'Modest Heritage Attire']
          : ['Online Funicular Fast-Lane Pass', 'Light Windbreaker'],
        fallback: isChew ? null : 'The Top Komtar Indoor Theme Park & Glass Rainbow Skywalk',
        fallbackReason: isChew ? null : 'weather',
        notes: isChew
          ? 'Historic 19th-century Chinese waterfront settlement on wooden stilts. Morning walk along the wooden boardwalk.'
          : 'Ride the historical funicular railway to 833m peak. Sunset at The Habitat Curtis Crest Tree Top Walk.',
        dressCode: isChew ? 'Light cotton & sunscreen' : 'Comfortable walking gear',
        source: 'reel',
        reelUrl: reelUrl || 'https://www.instagram.com/reel/C8x9_penang_heritage',
        reelCreator: '@penangfoodie',
      };
    });

    // Save strictly to active itinerary storage
    saveItineraryData(day1Blocks);
    try {
      localStorage.setItem('travel_planner_itinerary_v3', JSON.stringify(day1Blocks));
      if (activeTrip && activeTrip.id) {
        localStorage.setItem(`travel_planner_itinerary_${activeTrip.id}`, JSON.stringify(day1Blocks));
      }
    } catch (e) {}

    // 4. Deposit secondary venues into Trip Wishlist
    addWishlistItem({
      title: 'Lebuh Keng Kwee Famous Teochew Chendul',
      category: 'food',
      description: 'Heritage street dessert stall known for shaved ice with fresh coconut milk and pandan jelly noodles.',
      estimatedCost: 'RM 5 (~$1.10)',
      votes: 4,
      addedBy: 'IG Reel Import',
      source: 'reel',
    });
    addWishlistItem({
      title: 'Siam Road Charcoal Char Koay Teow',
      category: 'food',
      description: 'Legendary charcoal-fired wok hei flat rice noodles with cockles and lap cheong.',
      estimatedCost: 'RM 9 (~$2.00)',
      votes: 3,
      addedBy: 'IG Reel Import',
      source: 'reel',
    });

    localStorage.setItem('travel_planner_onboarded_v1', 'true');
    closeModal();

    // 5. Dispatch custom event trip:created
    const detail = {
      trip: activeTrip,
      tripId: activeTrip.id,
      destination: 'Penang, Malaysia',
      title: 'Penang Expedition',
      startDate: survey.startDate,
      endDate: survey.endDate,
      totalDays: survey.duration,
      coverImage,
      blocks: day1Blocks,
      anchors: extractedAnchors,
      reelUrl,
    };

    const tripCreatedEvent = new CustomEvent('trip:created', { detail, bubbles: true });
    window.dispatchEvent(tripCreatedEvent);
    document.dispatchEvent(tripCreatedEvent);

    // 6. BroadcastChannel and remote sync
    try {
      const bc = new BroadcastChannel('wandersync_remote_sync');
      bc.postMessage({
        type: 'TRIGGER_PHASE',
        phase: 'ACT_1_GENESIS',
        tripId: activeTrip.id,
        payload: detail,
      });
    } catch (e) {}

    if (window.RemoteSync && typeof window.RemoteSync.send === 'function') {
      try {
        window.RemoteSync.send('TRIGGER_PHASE', { phase: 'ACT_1_GENESIS', tripId: activeTrip.id });
      } catch (e) {}
    }
    if (window.DemoScript && typeof window.DemoScript.startDay2Simulation === 'function') {
      try {
        window.DemoScript.startDay2Simulation();
      } catch (e) {}
    }
    if (window.DemoScript && typeof window.DemoScript.onTripCreated === 'function') {
      try {
        window.DemoScript.onTripCreated(activeTrip);
      } catch (e) {}
    }

    // 7. Open #itinerary view
    window.location.hash = '#itinerary';
    setActiveTab('itinerary');
    showToastNotice('Penang itinerary initialized! Chew Jetty & Penang Hill anchors locked.');

    // 8. Invoke onComplete if provided, ensuring 2 blocks are preserved
    if (typeof onComplete === 'function') {
      onComplete('reels_penang', survey, activeTrip);
      const activeId = getActiveTripId();
      if (activeId) {
        updateTrip(activeId, {
          coverImage,
          destination: 'Penang, Malaysia',
          title: 'Penang Expedition',
          startDate: survey.startDate,
          endDate: survey.endDate,
          totalDays: survey.duration,
        });
        saveItineraryData(day1Blocks);
        try {
          localStorage.setItem(`travel_planner_itinerary_${activeId}`, JSON.stringify(day1Blocks));
        } catch (e) {}
      }
    }
  }

  // ── Processing Animation ────────────────────────────────────
  function startProcessing(type) {
    processingType = type;
    currentStep = 'processing';
    processingStep = 0;
    render();

    const interval = setInterval(() => {
      processingStep++;
      if (processingStep < 4) {
        render();
      } else {
        clearInterval(interval);
        currentStep = 'reveal';
        render();
      }
    }, 550);
  }

  // ── Finalization for Questionnaire Flow ─────────────────────
  function finishOnboarding(type) {
    applyGeneratedData(type);

    localStorage.setItem('travel_planner_onboarded_v1', 'true');
    closeModal();

    window.location.hash = '#itinerary';
    setActiveTab('itinerary');
    showToastNotice('Itinerary generated! Dates synced and transit buffers optimized.');

    if (typeof onComplete === 'function') {
      onComplete(type, survey);
    }
  }

  function applyGeneratedData(type) {
    saveTripSettings({
      destination: survey.destination,
      startDate: survey.startDate,
      endDate: survey.endDate,
      totalDays: survey.duration,
      pace: survey.pace,
      vibe: survey.vibe,
    });

    const list = getItineraryData();

    if (type === 'reels') {
      const newSpot = {
        id: `reel-${Date.now()}`,
        day: 1,
        startTime: '15:30',
        endTime: '17:00',
        category: 'activity',
        status: 'confirmed',
        title: 'Shibuya Sky & Rooftop Observatory',
        location: 'Shibuya Scramble Square 47F',
        transitToNextMinutes: 20,
        transitMode: 'Direct Elevator',
        requirements: ['Advance E-Tickets Validated', 'Audio Transcript Verified'],
        fallback: 'Shibuya Parco Indoor Shopping & Nintendo Center',
        notes: `Extracted via Instagram Reel import: ${reelUrl}. Automatically synced with group schedule.`,
        dressCode: 'Casual comfortable',
        source: 'reel',
        reelUrl: reelUrl,
        reelCreator: '@tokyofoodie',
      };
      list.splice(3, 0, newSpot);

      addWishlistItem({
        title: 'Uobei Shibuya Conveyor Belt Sushi',
        category: 'food',
        description: 'Futuristic high-speed touch-screen sushi ordering in vibrant Dogenzaka.',
        estimatedCost: '¥1,500 (~$10)',
        votes: 2,
        addedBy: 'IG Reel Import',
        source: 'reel',
      });
      addWishlistItem({
        title: 'Nonbei Yokocho Micro-Izakaya Alleys',
        category: 'nightlife',
        description: 'Retro Showa-era alleyway featuring intimate skewers and sake counters.',
        estimatedCost: '¥2,800 (~$19)',
        votes: 3,
        addedBy: 'IG Reel Import',
        source: 'reel',
      });
    } else {
      if (list[1]) {
        list[1].title =
          survey.vibe === 'food'
            ? 'Nakamise Street Food Crawl & Matcha Tasting'
            : survey.vibe === 'scenic'
            ? 'Sumida Riverfront Scenic Walk & Gardens'
            : survey.vibe === 'modern'
            ? 'Ginza Skyline Architecture & Art Walk'
            : 'Senso-ji Traditional Shrine & Garden Walk';
        list[1].notes = `Tailored by AI for ${survey.travelers === 'duo' ? 'Clarence & Wei Gang' : 'Group'} (${survey.pace} pace, ${survey.vibe} focus).`;
      }

      if (survey.anchorWishlist) {
        const topWishlist = getTopVotedWishlistItems(4);
        const tokyoItem = topWishlist.find(
          (item) => !item.title.toLowerCase().includes('kyoto') && !item.title.toLowerCase().includes('inari')
        );
        const kyotoItem = topWishlist.find(
          (item) => item.title.toLowerCase().includes('kyoto') || item.title.toLowerCase().includes('inari')
        );

        if (tokyoItem && list[2]) {
          list[2].title = tokyoItem.title;
          list[2].location = tokyoItem.title.toLowerCase().includes('tsukiji')
            ? 'Tsukiji Outer Market, Chuo City'
            : (tokyoItem.title.toLowerCase().includes('ghibli') ? 'Mitaka, Tokyo' : 'Shinjuku, Tokyo');
          list[2].category = tokyoItem.category === 'food' ? 'meal' : 'activity';
          list[2].notes = `Group Wishlist anchor item voted by ${tokyoItem.addedBy}.`;
          list[2].source = 'wishlist';
          list[2].sourceVotes = tokyoItem.votes;
          list[2].sourceAuthor = tokyoItem.addedBy;
          markWishlistScheduled(tokyoItem.id, { day: 1, time: list[2].startTime });
        }

        if (kyotoItem && list[6]) {
          list[6].title = kyotoItem.title;
          list[6].location = 'Fushimi Ward, Kyoto';
          list[6].category = 'activity';
          list[6].notes = `Group Wishlist anchor item voted by ${kyotoItem.addedBy}.`;
          list[6].source = 'wishlist';
          list[6].sourceVotes = kyotoItem.votes;
          list[6].sourceAuthor = kyotoItem.addedBy;
          markWishlistScheduled(kyotoItem.id, { day: 2, time: list[6].startTime });
        }
      }
    }

    saveItineraryData(list);
  }

  function showToastNotice(msg) {
    const toast = document.createElement('div');
    toast.className = 'dash-toast dash-toast--success dash-toast--visible';
    toast.innerHTML = `
      <span class="dash-toast__icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </span>
      <span class="dash-toast__msg">${msg}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('dash-toast--exit');
      setTimeout(() => toast.remove(), 350);
    }, 3200);
  }

  function closeModal() {
    overlay.style.display = 'none';
    currentStep = 'menu';
    processingStep = 0;
  }

  function openModal(step = 'menu') {
    currentStep = step;
    processingStep = 0;
    render();
    overlay.style.display = 'flex';
  }

  // Initial render
  render();

  return {
    element: overlay,
    open: openModal,
    openReelImporter: () => openModal('reels'),
    openCustomize: () => openModal('customize'),
    close: closeModal,
  };
}
