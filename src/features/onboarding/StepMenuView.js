/**
 * StepMenuView: Choose between AI Survey Flow or Social Reel Import.
 */

export function renderMenuView() {
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
          <span class="onboarding-menu-card__tag">Recommended Demo</span>
          <strong class="onboarding-menu-card__title">Import from Instagram Reel</strong>
          <p class="onboarding-menu-card__desc">Extract spots, durations &amp; transit times automatically with AI Vision.</p>
        </div>
        <div class="onboarding-menu-card__arrow">→</div>
      </button>
    </div>
  `;
}
