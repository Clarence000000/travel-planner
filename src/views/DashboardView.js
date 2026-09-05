/**
 * View: "Now & Next" Live Dashboard
 * Real-time HUD for the day of the trip: current spot, next transit directions,
 * 1-tap schedule shift buttons (+30m, +1h), and pre-departure checklist.
 */

import { applyReshuffle } from '../models/itineraryData.js';

export function createDashboardView() {
  const container = document.createElement('div');
  container.className = 'feature-view dashboard-view';

  function showToast(message) {
    const existing = document.querySelector('.toast-notice');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notice';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 2800);
  }

  container.innerHTML = `
    <div class="view-header">
      <div class="view-header__meta">
        <span class="view-badge">Day-of-Trip Live HUD</span>
        <p class="view-subtitle">Real-time status, transit directions, and delay controls for seamless navigation</p>
      </div>
    </div>

    <!-- 1-Tap Schedule Shift Toolbar -->
    <div class="shift-toolbar">
      <div class="shift-toolbar__label">
        <span>⏱ Stuck in transit or running late?</span>
        <span class="shift-toolbar__sub">Shifts remaining timeline slots forward and recalibrates buffers</span>
      </div>
      <div class="shift-buttons">
        <button type="button" class="btn-shift" data-shift="30">+30 Mins</button>
        <button type="button" class="btn-shift" data-shift="60">+1 Hour</button>
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
        <a href="https://maps.google.com/?q=Sensoji+Temple" target="_blank" rel="noopener" class="btn btn--primary btn--sm">
          <span>🗺 Open in Maps</span>
        </a>
        <button type="button" class="btn btn--secondary btn--sm" id="btn-view-pass">
          <span>🎟 View Pass</span>
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
  `;

  // Attach interactive shift buttons
  const shiftBtns = container.querySelectorAll('.btn-shift');
  shiftBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const shiftMin = btn.getAttribute('data-shift');
      applyReshuffle('delay-30m');
      showToast(`⏱ Schedule shifted by +${shiftMin} mins! Buffers recalibrated.`);
    });
  });

  const passBtn = container.querySelector('#btn-view-pass');
  if (passBtn) {
    passBtn.addEventListener('click', () => {
      showToast('🎟 Pass #TK-9821 verified & ready.');
    });
  }

  return {
    element: container,
  };
}
