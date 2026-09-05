/**
 * Component: Onboarding & Data Import Modal
 * Provides an interactive welcome experience allowing travelers to:
 * 1. Answer quick AI questions to generate a tailored itinerary (mock/fake generation)
 * 2. Import travel data from Instagram Reels / TikTok links (mock/fake extraction)
 * 3. Explore pre-curated default Tokyo & Kyoto itinerary
 */

import { saveItineraryData, getItineraryData } from '../models/itineraryData.js';
import { setActiveTab } from '../config/navigation.js';

export function createOnboardingModal(options = {}) {
  const { onComplete } = options;

  const overlay = document.createElement('div');
  overlay.className = 'onboarding-overlay';
  overlay.id = 'onboarding-modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'onboarding-title');
  overlay.style.display = 'none';

  // State
  let currentStep = 'menu'; // 'menu' | 'questions' | 'reels' | 'processing'
  let processingType = 'questions'; // 'questions' | 'reels'
  let processingStep = 0;

  // Questionnaire state
  const survey = {
    vibe: 'food', // 'food' | 'culture' | 'modern' | 'scenic'
    pace: 'balanced', // 'chill' | 'balanced' | 'turbo'
    travelers: 'duo', // 'duo' | 'squad' | 'solo'
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
    if (currentStep === 'processing') {
      return renderProcessingView();
    }
    if (currentStep === 'questions') {
      return renderQuestionsView();
    }
    if (currentStep === 'reels') {
      return renderReelsView();
    }
    return renderMenuView();
  }

  // ── Step 1: Main Menu ──────────────────────────────────────────────────
  function renderMenuView() {
    return `
      <div class="onboarding-header">
        <div class="onboarding-icon-badge">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </div>
        <h2 class="onboarding-title" id="onboarding-title">Plan Your Adventure</h2>
        <p class="onboarding-subtitle">Choose how you would like to build or import your trip itinerary:</p>
      </div>

      <div class="onboarding-options">
        <!-- Option 1: AI Questions -->
        <button type="button" class="onboarding-option-card" id="btn-select-questions">
          <div class="onboarding-option-card__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              <line x1="9" y1="10" x2="15" y2="10"></line>
            </svg>
          </div>
          <div class="onboarding-option-card__info">
            <div class="onboarding-option-card__top">
              <h3 class="onboarding-option-card__title">Quick Trip Questionnaire</h3>
              <span class="onboarding-option-card__badge">Smart AI</span>
            </div>
            <p class="onboarding-option-card__desc">Answer 3 simple questions about your group's vibe, budget, and desired pace.</p>
          </div>
          <div class="onboarding-option-card__arrow">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
        </button>

        <!-- Option 2: Social Media Reels Import -->
        <button type="button" class="onboarding-option-card" id="btn-select-reels">
          <div class="onboarding-option-card__icon" style="color: #E1306C; background-color: #FDF2F8; border-color: #FBCFE8;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </div>
          <div class="onboarding-option-card__info">
            <div class="onboarding-option-card__top">
              <h3 class="onboarding-option-card__title">Import from IG Reels / TikTok</h3>
              <span class="onboarding-option-card__badge" style="background-color: #FDF2F8; color: #BE185D;">Auto-Extract</span>
            </div>
            <p class="onboarding-option-card__desc">Paste a travel video or select trending viral Reels to scan spots into your schedule.</p>
          </div>
          <div class="onboarding-option-card__arrow">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
        </button>
      </div>

      <div class="onboarding-footer">
        <button type="button" class="onboarding-skip-btn" id="btn-skip-onboarding">
          Explore Curated Tokyo & Kyoto Itinerary
        </button>
      </div>
    `;
  }

  // ── Step 2A: Questionnaire Form ───────────────────────────────────────
  function renderQuestionsView() {
    return `
      <div class="onboarding-header">
        <button type="button" class="onboarding-back-btn" id="btn-back-menu">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
          <span>Back</span>
        </button>
        <h2 class="onboarding-title" style="margin-top: 8px;">Trip Preferences</h2>
        <p class="onboarding-subtitle">Tell us what Clarence and Wei Gang love most:</p>
      </div>

      <div class="onboarding-form">
        <!-- Question 1: Vibe -->
        <div class="onboarding-field">
          <label class="onboarding-field__label">1. What's the primary travel focus?</label>
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

        <button type="button" class="btn btn--primary onboarding-submit-btn" id="btn-submit-questions">
          <span>Generate Customized Itinerary</span>
        </button>
      </div>
    `;
  }

  // ── Step 2B: IG Reels / Social Import Form ─────────────────────────────
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

  // ── Step 3: Mock AI Processing Animation ──────────────────────────────
  function renderProcessingView() {
    const isReel = processingType === 'reels';
    const steps = isReel
      ? [
          'Downloading audio transcript and video metadata...',
          'Detecting geo-coordinates and spot names (4 venues found)...',
          'Aligning opening hours & transit buffer recalculation...',
          'Building your 3-day itinerary stops!',
        ]
      : [
          'Analyzing travel vibe and group preferences...',
          'Optimizing Tokyo and Kyoto route transit corridors...',
          'Assigning meal slots and weather-permitting fallbacks...',
          'Finalizing your customized Japan itinerary!',
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
                <span class="step-indicator">${isDone ? '✓' : isCurrent ? '●' : '○'}</span>
                <span>${text}</span>
              </div>
            `;
            })
            .join('')}
        </div>
      </div>
    `;
  }

  // ── Event Handlers ────────────────────────────────────────────────────
  function bindEvents() {
    // Close / Skip
    const closeBtn = overlay.querySelector('#btn-close-onboarding');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    const skipBtn = overlay.querySelector('#btn-skip-onboarding');
    if (skipBtn) {
      skipBtn.addEventListener('click', closeModal);
    }

    // Step navigation
    const selectQuestions = overlay.querySelector('#btn-select-questions');
    if (selectQuestions) {
      selectQuestions.addEventListener('click', () => {
        currentStep = 'questions';
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

    const backBtn = overlay.querySelector('#btn-back-menu');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        currentStep = 'menu';
        render();
      });
    }

    // Questionnaire chips
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

    // Questionnaire submit
    const submitQuestions = overlay.querySelector('#btn-submit-questions');
    if (submitQuestions) {
      submitQuestions.addEventListener('click', () => {
        startProcessing('questions');
      });
    }

    // Reel presets
    overlay.querySelectorAll('.demo-reel-card').forEach((card) => {
      card.addEventListener('click', () => {
        const url = card.getAttribute('data-reel-url');
        reelUrl = url;
        const input = overlay.querySelector('#reel-url-input');
        if (input) input.value = url;
        startProcessing('reels');
      });
    });

    // Reel submit
    const submitReel = overlay.querySelector('#btn-submit-reel');
    if (submitReel) {
      submitReel.addEventListener('click', () => {
        const input = overlay.querySelector('#reel-url-input');
        if (input) reelUrl = input.value.trim() || reelUrl;
        startProcessing('reels');
      });
    }
  }

  // ── Fake Processing Animation & Data Injection ────────────────────────
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
        finishOnboarding(type);
      }
    }, 600);
  }

  function finishOnboarding(type) {
    // Generate simulated themed itinerary blocks
    applyGeneratedData(type);

    localStorage.setItem('travel_planner_onboarded_v1', 'true');
    closeModal();

    // Navigate to itinerary tab
    setActiveTab('itinerary');

    if (typeof onComplete === 'function') {
      onComplete(type);
    }
  }

  function applyGeneratedData(type) {
    const list = getItineraryData();

    if (type === 'reels') {
      // Injected Reel Spot
      const newSpot = {
        id: `reel-${Date.now()}`,
        day: 1,
        startTime: '15:30',
        endTime: '17:00',
        category: 'activity',
        status: 'confirmed',
        title: 'Shibuya Sky & Rooftop Lounge (Extracted from Reel)',
        location: 'Shibuya Scramble Square 47F',
        transitToNextMinutes: 20,
        transitMode: 'Direct Elevator',
        requirements: ['Advance E-Tickets Validated', 'Audio Transcript Verified'],
        fallback: 'Shibuya Parco Nintendo Store (Indoor Backup)',
        notes: `Extracted via Instagram Reel import: ${reelUrl}. Automatically synced with group schedule.`,
        dressCode: 'Casual comfortable',
      };
      list.splice(3, 0, newSpot);
    } else {
      // Custom Vibe adjustment
      list[1].title =
        survey.vibe === 'food'
          ? 'Nakamise Street Food Crawl & Matcha Tour'
          : survey.vibe === 'scenic'
          ? 'Sumida Riverfront Scenic Walk & Gardens'
          : 'Senso-ji Traditional Shrine Walk';
      list[1].notes = `Tailored by AI for Clarence & Wei Gang (${survey.pace} pace, ${survey.vibe} focus).`;
    }

    saveItineraryData(list);
  }

  function closeModal() {
    overlay.style.display = 'none';
    currentStep = 'menu';
    processingStep = 0;
  }

  function openModal() {
    currentStep = 'menu';
    processingStep = 0;
    render();
    overlay.style.display = 'flex';
  }

  // Initial render
  render();

  return {
    element: overlay,
    open: openModal,
    close: closeModal,
  };
}
