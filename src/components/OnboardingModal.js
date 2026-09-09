/**
 * Component: Onboarding & Data Import Modal
 * Provides an interactive welcome experience allowing travelers to:
 * 1. Configure Destination & Arbitrary Date Range (Step 1)
 * 2. Answer quick AI questions on Vibe, Pace, and anchor top-voted Wishlist spots (Step 2)
 * 3. Import travel data from Instagram Reels / TikTok links
 * 4. Review Trip Reveal Summary Sheet (Step 3) before editing timeline
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

export function createOnboardingModal(options = {}) {
  const { onComplete } = options;

  const overlay = document.createElement('div');
  overlay.className = 'onboarding-overlay';
  overlay.id = 'onboarding-modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'onboarding-title');
  overlay.style.display = 'none';

  // Modal Step State: 'menu' | 'destination' | 'questions' | 'reels' | 'processing' | 'reveal'
  let currentStep = 'menu';
  let processingType = 'questions'; // 'questions' | 'reels'
  let processingStep = 0;

  // Questionnaire state loaded from trip settings
  const initialSettings = getTripSettings();
  const survey = {
    destination: initialSettings.destination || 'Tokyo & Kyoto, Japan',
    startDate: initialSettings.startDate || '2026-07-14',
    endDate: initialSettings.endDate || '2026-07-16',
    duration: initialSettings.totalDays || 3,
    vibe: initialSettings.vibe || 'food', // 'food' | 'culture' | 'modern' | 'scenic'
    pace: initialSettings.pace || 'balanced', // 'chill' | 'balanced' | 'turbo'
    travelers: 'duo', // 'duo' | 'squad' | 'solo'
    anchorWishlist: true,
  };

  // Reels state
  let reelUrl = 'https://www.instagram.com/reel/C8x9Y2zK_tokyo_eats';

  function render() {
    overlay.innerHTML = `
      <div class="onboarding-card">
        <!-- Close Button -->
        <button type="button" class="onboarding-close-btn" id="btn-close-onboarding" aria-label="Close setup modal">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
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
      case 'processing':
        return renderProcessingView();
      case 'reveal':
        return renderRevealView();
      case 'menu':
      default:
        return renderMenuView();
    }
  }

  // ── Step 0: Welcome Choice Menu ─────────────────────────────
  function renderMenuView() {
    return `
      <div class="onboarding-header">
        <div class="onboarding-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          <span>WanderSync Initializer</span>
        </div>
        <h2 class="onboarding-title" id="onboarding-title">How do you want to start?</h2>
        <p class="onboarding-subtitle">Choose a smart path to craft your collaborative schedule</p>
      </div>

      <div class="onboarding-options">
        <!-- Option 1: AI Vibe & Pace Assistant -->
        <button type="button" class="onboarding-option-card" id="btn-select-questions">
          <div class="onboarding-option-card__icon onboarding-option-card__icon--primary">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          </div>
          <div class="onboarding-option-card__text">
            <h3 class="onboarding-option-card__title">Dates, Vibe & Preferences</h3>
            <p class="onboarding-option-card__desc">Define custom calendar dates, party pace, and auto-anchor top wishlist spots.</p>
          </div>
          <svg class="onboarding-option-card__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>

        <!-- Option 2: IG Reels / Social Importer -->
        <button type="button" class="onboarding-option-card" id="btn-select-reels">
          <div class="onboarding-option-card__icon onboarding-option-card__icon--reel">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </div>
          <div class="onboarding-option-card__text">
            <h3 class="onboarding-option-card__title">Import from Social Reels</h3>
            <p class="onboarding-option-card__desc">Paste an Instagram Reel or TikTok link to extract venues directly into Day 1 & Wishlist.</p>
          </div>
          <svg class="onboarding-option-card__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>

      <div class="onboarding-footer">
        <button type="button" class="onboarding-skip-btn" id="btn-skip-onboarding">
          Skip and explore existing timeline
        </button>
      </div>
    `;
  }

  // ── Step 1: Destination & Custom Date Range ─────────────────
  function renderDestinationView() {
    const popularDestinations = [
      'Tokyo & Kyoto, Japan',
      'Seoul, South Korea',
      'Taipei, Taiwan',
      'Paris, France',
      'Rome, Italy',
    ];

    const rangeLabel = formatDateRange(survey.startDate, survey.endDate, survey.duration);

    return `
      <div class="onboarding-header">
        <button type="button" class="onboarding-back-btn" id="btn-back-menu">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
          <span>Back</span>
        </button>
        <h2 class="onboarding-title" style="margin-top: 8px;">Where & When?</h2>
        <p class="onboarding-subtitle">Step 1 of 2: Set trip destination and arbitrary date range</p>
      </div>

      <div class="onboarding-form">
        <!-- Destination Input -->
        <div class="onboarding-field">
          <label class="onboarding-field__label" for="dest-search-input">Destination</label>
          <div class="onboarding-input-wrap">
            <input
              type="text"
              class="onboarding-url-input"
              id="dest-search-input"
              value="${survey.destination}"
              placeholder="e.g. Tokyo, Seoul, Paris..."
            />
          </div>

          <!-- Quick City Chips -->
          <div class="onboarding-dest-chips">
            ${popularDestinations
              .map(
                (city) => `
              <button
                type="button"
                class="onboarding-dest-chip ${survey.destination === city ? 'onboarding-dest-chip--active' : ''}"
                data-dest="${city}"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span>${city.split(',')[0]}</span>
              </button>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Flexible Date Range Selection -->
        <div class="onboarding-field">
          <label class="onboarding-field__label">Trip Dates & Flexible Duration</label>
          
          <div class="onboarding-date-inputs-row">
            <div class="onboarding-date-field">
              <span class="onboarding-date-label">Start Date</span>
              <input 
                type="date" 
                class="onboarding-date-picker" 
                id="trip-start-date" 
                value="${survey.startDate}" 
              />
            </div>
            <div class="onboarding-date-arrow">→</div>
            <div class="onboarding-date-field">
              <span class="onboarding-date-label">End Date</span>
              <input 
                type="date" 
                class="onboarding-date-picker" 
                id="trip-end-date" 
                value="${survey.endDate}" 
              />
            </div>
          </div>

          <!-- Duration Stepper & Summary Pill -->
          <div class="onboarding-duration-stepper-wrap">
            <div class="onboarding-stepper">
              <button type="button" class="onboarding-stepper-btn" id="btn-duration-minus" aria-label="Decrease days">−</button>
              <span class="onboarding-stepper-value" id="stepper-duration-val">${survey.duration} Days</span>
              <button type="button" class="onboarding-stepper-btn" id="btn-duration-plus" aria-label="Increase days">+</button>
            </div>
            <div class="onboarding-duration-calc-tag">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span id="range-display-label">${rangeLabel}</span>
            </div>
          </div>
        </div>

        <button type="button" class="btn btn--primary onboarding-submit-btn" id="btn-next-preferences">
          <span>Continue to Preferences</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-left: 6px;"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>
    `;
  }

  // ── Step 2: Vibe, Pace & Wishlist Anchors ───────────────────
  function renderQuestionsView() {
    const topWishlist = getTopVotedWishlistItems(3);

    return `
      <div class="onboarding-header">
        <button type="button" class="onboarding-back-btn" id="btn-back-destination">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
          <span>Back to Destination</span>
        </button>
        <h2 class="onboarding-title" style="margin-top: 8px;">Trip Preferences & Anchors</h2>
        <p class="onboarding-subtitle">Step 2 of 2: Customize vibe, pace, and group consensus</p>
      </div>

      <div class="onboarding-form">
        <!-- Question 1: Vibe -->
        <div class="onboarding-field">
          <label class="onboarding-field__label">1. Primary travel focus?</label>
          <div class="onboarding-chip-group">
            <button type="button" class="onboarding-chip ${survey.vibe === 'food' ? 'onboarding-chip--active' : ''}" data-vibe="food">
              Food & Night Markets
            </button>
            <button type="button" class="onboarding-chip ${survey.vibe === 'culture' ? 'onboarding-chip--active' : ''}" data-vibe="culture">
              Shrines & Traditional Culture
            </button>
            <button type="button" class="onboarding-chip ${survey.vibe === 'modern' ? 'onboarding-chip--active' : ''}" data-vibe="modern">
              Modern City & Skyline
            </button>
            <button type="button" class="onboarding-chip ${survey.vibe === 'scenic' ? 'onboarding-chip--active' : ''}" data-vibe="scenic">
              Nature & Scenic Trails
            </button>
          </div>
        </div>

        <!-- Question 2: Pace -->
        <div class="onboarding-field">
          <label class="onboarding-field__label">2. Preferred daily travel pace?</label>
          <div class="onboarding-chip-group">
            <button type="button" class="onboarding-chip ${survey.pace === 'chill' ? 'onboarding-chip--active' : ''}" data-pace="chill">
              Chill & Relaxed (2-3 stops)
            </button>
            <button type="button" class="onboarding-chip ${survey.pace === 'balanced' ? 'onboarding-chip--active' : ''}" data-pace="balanced">
              Balanced (4 stops + buffers)
            </button>
            <button type="button" class="onboarding-chip ${survey.pace === 'turbo' ? 'onboarding-chip--active' : ''}" data-pace="turbo">
              High Energy (Full day)
            </button>
          </div>
        </div>

        <!-- Question 3: Group -->
        <div class="onboarding-field">
          <label class="onboarding-field__label">3. Travel Party</label>
          <div class="onboarding-chip-group">
            <button type="button" class="onboarding-chip ${survey.travelers === 'duo' ? 'onboarding-chip--active' : ''}" data-group="duo">
              Clarence & Wei Gang (Duo)
            </button>
            <button type="button" class="onboarding-chip ${survey.travelers === 'squad' ? 'onboarding-chip--active' : ''}" data-group="squad">
              Group Squad (4+ Friends)
            </button>
            <button type="button" class="onboarding-chip ${survey.travelers === 'solo' ? 'onboarding-chip--active' : ''}" data-group="solo">
              Solo Explorer
            </button>
          </div>
        </div>

        <!-- Question 4: Wishlist Anchors Integration -->
        <div class="onboarding-anchor-box">
          <div class="onboarding-anchor-header">
            <div class="onboarding-anchor-title-wrap">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-primary);"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              <span>Anchor Group Wishlist Spots</span>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="toggle-anchor-wishlist" ${survey.anchorWishlist ? 'checked' : ''} />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <p class="onboarding-anchor-desc">Automatically locks top-voted wishlist ideas as core itinerary anchors.</p>

          ${
            survey.anchorWishlist && topWishlist.length > 0
              ? `
            <div class="onboarding-anchor-chips">
              ${topWishlist
                .map(
                  (item) => `
                <span class="onboarding-anchor-chip">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>${item.title.split(' ')[0]} (${item.votes} votes)</span>
                </span>
              `
                )
                .join('')}
            </div>
          `
              : ''
          }
        </div>

        <button type="button" class="btn btn--primary onboarding-submit-btn" id="btn-submit-questions">
          <span>Generate Customized Itinerary</span>
        </button>
      </div>
    `;
  }

  // ── Step 2B: IG Reels / Social Import Form ───────────────────
  function renderReelsView() {
    return `
      <div class="onboarding-header">
        <button type="button" class="onboarding-back-btn" id="btn-back-menu">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
          <span>Back</span>
        </button>
        <h2 class="onboarding-title" style="margin-top: 8px;">Import from Social Reels</h2>
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
            <button type="button" class="demo-reel-card" data-reel-url="https://www.instagram.com/reel/C7_asakusa_eats">
              <div class="demo-reel-card__badge">VIRAL</div>
              <strong class="demo-reel-card__title">@tokyofoodie: 5 Secret Alley Eats in Asakusa</strong>
              <span class="demo-reel-card__meta">4.2M views • 4 locations detected</span>
            </button>

            <button type="button" class="demo-reel-card" data-reel-url="https://www.instagram.com/reel/C8_kyoto_hidden">
              <div class="demo-reel-card__badge" style="background:#E0E7FF; color:#4338CA;">TRENDING</div>
              <strong class="demo-reel-card__title">@kyotoguide: Morning Tea & Bamboo Shrines</strong>
              <span class="demo-reel-card__meta">1.8M views • 3 locations detected</span>
            </button>

            <button type="button" class="demo-reel-card" data-reel-url="https://www.instagram.com/reel/C9_shibuya_night">
              <div class="demo-reel-card__badge" style="background:#FEF3C7; color:#B45309;">FEATURED</div>
              <strong class="demo-reel-card__title">@japanpulse: Rooftop Sunsets & Neon Microbars</strong>
              <span class="demo-reel-card__meta">950K views • 4 locations detected</span>
            </button>
          </div>
        </div>

        <button type="button" class="btn btn--primary onboarding-submit-btn" id="btn-submit-reel">
          <span>Scan Video & Extract Spots</span>
        </button>
      </div>
    `;
  }

  // ── Step 3: AI Processing Animation ─────────────────────────
  function renderProcessingView() {
    const isReel = processingType === 'reels';
    const steps = isReel
      ? [
          'Downloading audio transcript and video metadata...',
          'Detecting geo-coordinates and spot names (4 venues found)...',
          'Saving secondary venues to Trip Wishlist...',
          'Scheduling hero spot into Day 1 timeline with buffers!',
        ]
      : [
          'Aligning travel vibe and group pace preferences...',
          'Extracting top-voted spots from Trip Wishlist as anchors...',
          'Balancing transit travel windows & weather contingencies...',
          `Synthesizing your optimized ${survey.duration}-day itinerary!`,
        ];

    const currentText = steps[Math.min(processingStep, steps.length - 1)];

    return `
      <div class="onboarding-processing">
        <div class="processing-spinner-ring">
          <div class="processing-spinner"></div>
        </div>
        
        <h3 class="processing-title">${isReel ? 'Scanning Social Reel' : 'Generating Itinerary'}</h3>
        <p class="processing-sub">${currentText}</p>

        <div class="processing-progress-track">
          <div class="processing-progress-bar" style="width: ${((processingStep + 1) / steps.length) * 100}%;"></div>
        </div>

        <div class="processing-steps-list">
          ${steps
            .map((text, i) => {
              const isDone = i < processingStep;
              const isCurrent = i === processingStep;
              return `
              <div class="processing-step-item ${isDone ? 'is-done' : isCurrent ? 'is-active' : ''}">
                <span class="step-indicator">
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

  // ── Step 4: Trip Reveal Summary Sheet ───────────────────────
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
              <h4 class="reveal-day-title">Arrival, Historic Asakusa & Digital Art</h4>
              <span class="reveal-day-meta">4 activities • 30m allocated transit buffer</span>
            </div>
          </div>

          <div class="reveal-day-card">
            <div class="reveal-day-num">D2</div>
            <div class="reveal-day-info">
              <h4 class="reveal-day-title">Kyoto Cultural Shrines & Riverside Soba</h4>
              <span class="reveal-day-meta">3 activities • Weather-permitting fallback armed</span>
            </div>
          </div>

          ${
            survey.duration >= 3
              ? `
            <div class="reveal-day-card">
              <div class="reveal-day-num">D3</div>
              <div class="reveal-day-info">
                <h4 class="reveal-day-title">Modern Cityscape, Skyline & Farewell BBQ</h4>
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

    // Date Pickers
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
          // Shift end date back by 1 day
          const end = new Date(survey.endDate);
          end.setDate(end.getDate() - 1);
          survey.endDate = end.toISOString().split('T')[0];
          render();
        }
      });
    }

    if (btnPlus) {
      btnPlus.addEventListener('click', () => {
        survey.duration++;
        // Shift end date forward by 1 day
        const end = new Date(survey.endDate);
        end.setDate(end.getDate() + 1);
        survey.endDate = end.toISOString().split('T')[0];
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

    // Step 2: Questionnaire handlers
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

    overlay.querySelectorAll('[data-group]').forEach((chip) => {
      chip.addEventListener('click', () => {
        survey.travelers = chip.getAttribute('data-group');
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

    // Reels handlers
    overlay.querySelectorAll('.demo-reel-card').forEach((card) => {
      card.addEventListener('click', () => {
        const url = card.getAttribute('data-reel-url');
        reelUrl = url;
        const input = overlay.querySelector('#reel-url-input');
        if (input) input.value = url;
        startProcessing('reels');
      });
    });

    const submitReel = overlay.querySelector('#btn-submit-reel');
    if (submitReel) {
      submitReel.addEventListener('click', () => {
        const input = overlay.querySelector('#reel-url-input');
        if (input) reelUrl = input.value.trim() || reelUrl;
        startProcessing('reels');
      });
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
        // Advance to Step 3: Trip Reveal Summary Sheet
        currentStep = 'reveal';
        render();
      }
    }, 550);
  }

  // ── Finalization & Cross-Tab Ecosystem Propagation ─────────
  function finishOnboarding(type) {
    applyGeneratedData(type);

    localStorage.setItem('travel_planner_onboarded_v1', 'true');
    closeModal();

    // Navigate to itinerary tab
    setActiveTab('itinerary');

    // Show clean celebration toast
    showToastNotice('Itinerary generated! Dates synced and transit buffers optimized.');

    if (typeof onComplete === 'function') {
      onComplete(type);
    }
  }

  function applyGeneratedData(type) {
    // Save updated dates, pace, destination
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
      // Injected Primary Reel Spot into Day 1 Schedule
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

      // Deposit detected secondary venues into Trip Wishlist
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
      // 1. Tailor Itinerary based on Vibe & Pace
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

      // 2. Wishlist Anchoring
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
    close: closeModal,
  };
}
