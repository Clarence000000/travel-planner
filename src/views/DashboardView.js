/**
 * View: "Now & Next" Live Dashboard
 * Real-time HUD for the day of the trip: current spot, next transit directions,
 * 1-tap schedule shift buttons (+30m, +1h), and pre-departure checklist.
 */

export function createDashboardView() {
  const container = document.createElement('div');
  container.className = 'feature-view dashboard-view';

  container.innerHTML = `
    <!-- /* FEATURE INJECTION POINT: NOW & NEXT LIVE DASHBOARD */ -->
    <!-- Atmospheric Vertical Asset Banner -->
    <div class="view-banner" style="background-image: url('./src/assets/bg-dashboard.png');">
      <div class="view-banner__scrim">
        <span class="view-banner__badge">🐾 Cozy Live HUD</span>
        <h2 class="view-banner__title">Now & Next Dashboard</h2>
      </div>
    </div>

    <div class="view-header">
      <div class="view-header__meta">
        <span class="view-badge">Day-of-Trip HUD</span>
        <p class="view-subtitle">Real-time status, upcoming transit directions, and delay controls</p>
      </div>
    </div>

    <!-- 1-Tap Schedule Shift Toolbar -->
    <div class="shift-toolbar">
      <div class="shift-toolbar__label">
        <span>⏱ Stuck in traffic or running late?</span>
        <span class="shift-toolbar__sub">Shifts non-fixed slots forward automatically</span>
      </div>
      <div class="shift-buttons">
        <button type="button" class="btn-shift">+30 Mins</button>
        <button type="button" class="btn-shift">+1 Hour</button>
      </div>
    </div>

    <!-- "NOW" Active Spot Card -->
    <div class="hud-card hud-card--now">
      <div class="hud-card__badge-row">
        <span class="live-pill">● ACTIVE NOW</span>
        <span class="hud-card__countdown">Remaining: 45 mins</span>
      </div>
      <h3 class="hud-card__title">Senso-ji Main Temple & Grounds</h3>
      <p class="hud-card__address">📍 2-3-1 Asakusa, Taito City, Tokyo</p>
      
      <div class="hud-card__actions">
        <a href="https://maps.google.com" target="_blank" rel="noopener" class="btn btn--primary btn--sm">
          <span>🗺 Open in Maps</span>
        </a>
        <button type="button" class="btn btn--secondary btn--sm">
          <span>🎟 View QR Pass</span>
        </button>
      </div>
    </div>

    <!-- "NEXT" Upcoming Activity & Transit -->
    <div class="hud-card hud-card--next">
      <div class="hud-card__badge-row">
        <span class="next-pill">NEXT UP • 01:15 PM</span>
        <span class="hud-card__countdown">Starts in 50m</span>
      </div>
      <h3 class="hud-card__title">Rooftop Matcha & Street Food</h3>
      <div class="transit-step">
        <span class="transit-step__icon">🚇</span>
        <div class="transit-step__info">
          <strong>Tokyo Metro Ginza Line</strong>
          <span>Asakusa Station → Shibuya Station (18 mins)</span>
        </div>
      </div>
    </div>

    <!-- Preparation Checklist -->
    <div class="checklist-card">
      <div class="checklist-card__header">
        <h4 class="checklist-card__title">🎒 Daily Prep Checklist</h4>
        <span class="checklist-card__count">3 items</span>
      </div>
      <ul class="checklist-items">
        <li class="checklist-item">
          <input type="checkbox" id="check-powerbank" checked />
          <label for="check-powerbank">Portable Power Bank Charged</label>
        </li>
        <li class="checklist-item">
          <input type="checkbox" id="check-cash" checked />
          <label for="check-cash">Cash (Yen) for Street Food Market</label>
        </li>
        <li class="checklist-item">
          <input type="checkbox" id="check-shoes" />
          <label for="check-shoes">Comfortable Walking Shoes</label>
        </li>
      </ul>
    </div>

    <!-- Sub-feature Injection Zone -->
    <div class="slot-injection-box">
      <span class="slot-injection-box__label">/* LIVE TELEMETRY & QR SCANNER MOUNT POINT */</span>
      <p class="slot-injection-box__text">
        Feature container ready for geolocation tracking, Apple/Google Wallet pass rendering, and timetable API sync.
      </p>
    </div>
  `;

  // Attach interactive shift buttons demo feedback
  const shiftBtns = container.querySelectorAll('.btn-shift');
  shiftBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const text = btn.textContent.trim();
      alert(`Schedule shifted by ${text}! Non-fixed activities adjusted with buffer recalculation.`);
    });
  });

  return {
    element: container,
  };
}
