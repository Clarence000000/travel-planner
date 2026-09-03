/**
 * View: Drag-and-Drop Itinerary
 * Interactive schedule cards categorized into Activities, Meals, Transit, and Rest.
 * Includes Slot Status Lifecycle tags and Transit Buffer Warnings.
 */

export function createItineraryView() {
  const container = document.createElement('div');
  container.className = 'feature-view itinerary-view';

  container.innerHTML = `
    <!-- /* FEATURE INJECTION POINT: DRAG-AND-DROP ITINERARY */ -->
    <!-- Atmospheric Vertical Asset Banner -->
    <div class="view-banner" style="background-image: url('./src/assets/bg-itinerary.png');">
      <div class="view-banner__scrim">
        <span class="view-banner__badge">🐱 Day 1 • Tokyo & Kyoto</span>
        <h2 class="view-banner__title">Drag-and-Drop Itinerary</h2>
      </div>
    </div>

    <div class="view-header">
      <div class="view-header__meta">
        <span class="view-badge">Interactive Timeline</span>
        <p class="view-subtitle">Chronological time blocks with auto-calculated transit buffers</p>
      </div>
      
      <!-- Day selector chips -->
      <div class="day-chip-row" role="tablist" aria-label="Trip Days">
        <button class="day-chip day-chip--active" role="tab" aria-selected="true">Day 1 • Thu</button>
        <button class="day-chip" role="tab" aria-selected="false">Day 2 • Fri</button>
        <button class="day-chip" role="tab" aria-selected="false">Day 3 • Sat</button>
      </div>
    </div>

    <!-- Buffer Warning Banner -->
    <div class="alert-banner alert-banner--warning">
      <div class="alert-banner__icon">⚠️</div>
      <div class="alert-banner__content">
        <strong>Transit Buffer Alert:</strong> Only 10 mins allocated for a 35-min train ride between Senso-ji and Shibuya.
      </div>
    </div>

    <!-- Timeline Blocks Feed -->
    <div class="timeline-container" id="itinerary-timeline-target">
      <!-- Slot 1: Check-in / Rest (Confirmed) -->
      <div class="time-block time-block--rest" data-status="confirmed">
        <div class="time-block__time">09:00 AM</div>
        <div class="time-block__card">
          <div class="time-block__header">
            <span class="status-pill status-pill--confirmed">● Confirmed</span>
            <span class="category-tag">Rest & Hotel</span>
          </div>
          <h3 class="time-block__title">Hotel Check-In & Luggage Drop</h3>
          <p class="time-block__location">📍 Shinjuku Granbell Hotel</p>
          <div class="time-block__footer">
            <span class="req-tag">🪪 Passports Ready</span>
          </div>
        </div>
      </div>

      <!-- Slot 2: Activity (Proposed) -->
      <div class="time-block time-block--activity" data-status="proposed">
        <div class="time-block__time">11:30 AM</div>
        <div class="time-block__card">
          <div class="time-block__header">
            <span class="status-pill status-pill--proposed">● Proposed</span>
            <span class="category-tag">Activity</span>
          </div>
          <h3 class="time-block__title">Senso-ji Temple & Traditional Street Walk</h3>
          <p class="time-block__location">📍 Asakusa, Taito City</p>
          <div class="time-block__footer">
            <span class="req-tag">👟 Modest Dress Required</span>
          </div>
        </div>
      </div>

      <!-- Slot 3: Meal (Tentative / Weather Permitting) -->
      <div class="time-block time-block--meal" data-status="tentative">
        <div class="time-block__time">01:30 PM</div>
        <div class="time-block__card">
          <div class="time-block__header">
            <span class="status-pill status-pill--tentative">● Weather Permitting</span>
            <span class="category-tag">Meal</span>
          </div>
          <h3 class="time-block__title">Rooftop Matcha & Street Food Market</h3>
          <p class="time-block__location">📍 Nakamise Street</p>
          <div class="time-block__footer">
            <span class="req-tag">☂ Fallback: Indoor Food Hall</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Sub-feature Injection Zone -->
    <div class="slot-injection-box">
      <span class="slot-injection-box__label">/* DRAG & DROP LOGIC MOUNT POINT */</span>
      <p class="slot-injection-box__text">
        Feature container ready for drag-and-drop gesture listeners, block reordering, and buffer auto-recalculation.
      </p>
    </div>
  `;

  return {
    element: container,
  };
}
