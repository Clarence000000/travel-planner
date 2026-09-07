/**
 * View: "Now & Next" Live Dashboard
 * Real-time HUD for the day of the trip: current spot, next transit directions,
 * 1-tap schedule shift buttons (+30m, +1h), and pre-departure checklist.
 *
 * Interactive Features:
 * 1. QR Pass Modal – high-fidelity ticket modal with SVG QR code
 * 2. One-Tap Shift – toast notification + dynamic time/countdown updates & itinerary recalculation
 * 3. Live State Progression – simulate destination arrival with fade animation
 * 4. Carpool & Transit Drawer – collaborative seat claims & pickup points
 * 5. Checklist Interaction – toggle items + live completion counter
 */

import { applyReshuffle } from '../models/itineraryData.js';
import { openCarpoolDrawer } from '../components/CarpoolDrawer.js';

// ── Activity Pipeline ───────────────────────────────────────────────────
const ACTIVITY_PIPELINE = [
  {
    id: 'sensoji',
    title: 'Senso-ji Main Temple & Grounds',
    address: '2-3-1 Asakusa, Taito City, Tokyo',
    remainingMins: 45,
    nextTime: '01:15 PM',
    nextStartsIn: 50,
    qr: {
      name: 'Senso-ji Temple Pass',
      time: '10:30 AM – 12:15 PM',
      guests: '3 Guests',
    },
  },
  {
    id: 'matcha',
    title: 'Rooftop Matcha & Street Food',
    address: 'Shibuya Crossing Tower, 21F, Tokyo',
    remainingMins: 60,
    nextTime: '03:00 PM',
    nextStartsIn: 40,
    transit: {
      mode: 'train',
      line: 'Tokyo Metro Ginza Line',
      route: 'Asakusa Station → Shibuya Station (18 mins)',
    },
    qr: {
      name: 'Rooftop Matcha Experience',
      time: '01:15 PM – 02:45 PM',
      guests: '3 Guests',
    },
  },
  {
    id: 'teamlab',
    title: 'teamLab Borderless Digital Art',
    address: 'Azabudai Hills, Minato City, Tokyo',
    remainingMins: 90,
    nextTime: '04:30 PM',
    nextStartsIn: 55,
    transit: {
      mode: 'walk',
      line: 'Walk via Shibuya Scramble',
      route: 'Shibuya Tower → teamLab Borderless (12 mins)',
    },
    qr: {
      name: 'teamLab Borderless',
      time: '03:00 PM – 04:30 PM',
      guests: '3 Guests',
    },
  },
  {
    id: 'ramen',
    title: 'Ichiran Ramen Late-Night Run',
    address: '1-22-7 Jinnan, Shibuya, Tokyo',
    remainingMins: 45,
    nextTime: '06:00 PM',
    nextStartsIn: 35,
    transit: {
      mode: 'train',
      line: 'Hibiya Line',
      route: 'Roppongi → Shibuya (9 mins)',
    },
    qr: {
      name: 'Ichiran Ramen',
      time: '04:30 PM – 05:30 PM',
      guests: '3 Guests',
    },
  },
  {
    id: 'karaoke',
    title: 'Karaoke Night @ Big Echo',
    address: 'Big Echo Shibuya Main, 3F, Tokyo',
    remainingMins: 120,
    nextTime: '08:30 PM',
    nextStartsIn: 60,
    transit: {
      mode: 'walk',
      line: 'Walk',
      route: 'Ichiran Shibuya → Big Echo (5 mins)',
    },
    qr: {
      name: 'Big Echo Karaoke',
      time: '06:00 PM – 08:00 PM',
      guests: '3 Guests',
    },
  },
];

// ── QR Code SVG Generator ───────────────────────────────────────────────
function generateQRSvg() {
  const size = 21;
  const moduleSize = 8;
  const totalSize = size * moduleSize;

  const finderPositions = [
    [0, 0],
    [14, 0],
    [0, 14],
  ];

  let modules = [];

  for (const [fx, fy] of finderPositions) {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const isOuter = x === 0 || x === 6 || y === 0 || y === 6;
        const isInner = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        if (isOuter || isInner) {
          modules.push([fx + x, fy + y]);
        }
      }
    }
  }

  const seed = [
    1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1,
    0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1,
    1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1,
    0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0,
  ];
  let si = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inFinder =
        (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12);
      if (inFinder) continue;
      if (seed[si % seed.length]) {
        modules.push([x, y]);
      }
      si++;
    }
  }

  const rects = modules
    .map(
      ([x, y]) =>
        `<rect x="${x * moduleSize}" y="${y * moduleSize}" width="${moduleSize}" height="${moduleSize}" rx="1.5" />`
    )
    .join('\n      ');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" class="qr-svg" aria-label="QR Code">
      <rect width="${totalSize}" height="${totalSize}" fill="white" rx="8" />
      <g fill="#1A1A1A">
        ${rects}
      </g>
    </svg>
  `;
}

// ── Toast Notification System ───────────────────────────────────────────
function showToast(container, message, type = 'info') {
  const existing = container.querySelector('.dash-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `dash-toast dash-toast--${type}`;

  let iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  if (type === 'success') {
    iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else if (type === 'shift') {
    iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
  }

  toast.innerHTML = `
    <span class="dash-toast__icon">${iconSvg}</span>
    <span class="dash-toast__msg">${message}</span>
  `;

  container.insertBefore(toast, container.firstChild);

  requestAnimationFrame(() => {
    toast.classList.add('dash-toast--visible');
  });

  setTimeout(() => {
    toast.classList.remove('dash-toast--visible');
    toast.classList.add('dash-toast--exit');
    setTimeout(() => toast.remove(), 350);
  }, 2800);
}

// ── QR Pass Modal ───────────────────────────────────────────────────────
function showQRModal(container, activity) {
  const existing = container.querySelector('.qr-modal-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'qr-modal-overlay';
  overlay.innerHTML = `
    <div class="qr-modal">
      <div class="qr-modal__header">
        <span class="qr-modal__badge">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          Digital Pass
        </span>
        <button type="button" class="qr-modal__close" aria-label="Close modal">✕</button>
      </div>
      <div class="qr-modal__qr-wrapper">
        ${generateQRSvg()}
      </div>
      <div class="qr-modal__info">
        <h3 class="qr-modal__title">${activity.qr.name}</h3>
        <div class="qr-modal__details">
          <div class="qr-modal__detail-row">
            <span class="qr-modal__detail-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </span>
            <span>${activity.qr.time}</span>
          </div>
          <div class="qr-modal__detail-row">
            <span class="qr-modal__detail-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </span>
            <span>${activity.qr.guests}</span>
          </div>
          <div class="qr-modal__detail-row">
            <span class="qr-modal__detail-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </span>
            <span>Today, ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>
      <button type="button" class="btn btn--primary qr-modal__close-btn">Close</button>
    </div>
  `;

  container.appendChild(overlay);
  requestAnimationFrame(() => {
    overlay.classList.add('qr-modal-overlay--visible');
  });

  const closeModal = () => {
    overlay.classList.remove('qr-modal-overlay--visible');
    overlay.classList.add('qr-modal-overlay--exit');
    setTimeout(() => overlay.remove(), 300);
  };

  overlay.querySelector('.qr-modal__close').addEventListener('click', closeModal);
  overlay.querySelector('.qr-modal__close-btn').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN VIEW FACTORY
// ══════════════════════════════════════════════════════════════════════════
export function createDashboardView() {
  const container = document.createElement('div');
  container.className = 'feature-view dashboard-view';

  let currentIndex = 0;
  let shiftOffset = 0;
  let isTransitioning = false;

  const pipeline = JSON.parse(JSON.stringify(ACTIVITY_PIPELINE));

  function getCurrent() {
    return pipeline[currentIndex] || pipeline[pipeline.length - 1];
  }
  function getNext() {
    return pipeline[currentIndex + 1] || null;
  }

  function applyShiftToUI(deltaMins) {
    shiftOffset += deltaMins;

    const current = getCurrent();
    current.remainingMins += deltaMins;

    const remainEl = container.querySelector('#hud-remaining');
    if (remainEl) {
      remainEl.textContent = `Remaining: ${current.remainingMins} mins`;
      remainEl.classList.add('countdown-flash');
      setTimeout(() => remainEl.classList.remove('countdown-flash'), 600);
    }

    const next = getNext();
    if (next) {
      next.nextStartsIn += deltaMins;
      const startsEl = container.querySelector('#hud-starts-in');
      if (startsEl) {
        startsEl.textContent = `Starts in ${next.nextStartsIn}m`;
        startsEl.classList.add('countdown-flash');
        setTimeout(() => startsEl.classList.remove('countdown-flash'), 600);
      }
    }
  }

  function renderNowCard(activity) {
    return `
      <div class="hud-card hud-card--now" id="hud-now-card">
        <div class="hud-card__badge-row">
          <span class="live-pill">● ACTIVE NOW</span>
          <span class="hud-card__countdown" id="hud-remaining">Remaining: ${activity.remainingMins} mins</span>
        </div>
        <h3 class="hud-card__title">${activity.title}</h3>
        <p class="hud-card__address">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: -1px; margin-right: 3px; color: var(--color-text-secondary);"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          ${activity.address}
        </p>
        <div class="hud-card__actions">
          <a href="https://maps.google.com" target="_blank" rel="noopener" class="btn btn--primary btn--sm">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
            <span>Open in Maps</span>
          </a>
          <button type="button" class="btn btn--secondary btn--sm" id="btn-qr-pass">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            <span>View QR Pass</span>
          </button>
        </div>
      </div>
    `;
  }

  function renderNextCard(activity) {
    if (!activity) {
      return `
        <div class="hud-card hud-card--next hud-card--done">
          <div class="hud-card__badge-row">
            <span class="next-pill">ALL COMPLETED</span>
          </div>
          <h3 class="hud-card__title">No more activities today!</h3>
          <p class="hud-card__address">Time to explore on your own.</p>
        </div>
      `;
    }

    const transitIconSvg = activity.transit?.mode === 'walk'
      ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2"></circle><path d="m9 20 3-6 2 3 3 6"></path><path d="m6 8 6 2 5-3"></path><path d="M12 10v4"></path></svg>`
      : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="16" rx="2"></rect><path d="M4 11h16"></path><path d="M12 3v8"></path><path d="m8 19-2 3"></path><path d="m16 19 2 3"></path></svg>`;

    const transitHTML = activity.transit
      ? `
      <div class="transit-step">
        <span class="transit-step__icon">${transitIconSvg}</span>
        <div class="transit-step__info">
          <strong>${activity.transit.line}</strong>
          <span>${activity.transit.route}</span>
        </div>
      </div>
      <button type="button" class="btn btn--secondary btn--sm btn-carpool" id="btn-carpool"
        data-from="${activity.transit.route.split('→')[0]?.trim() || 'Station A'}"
        data-to="${activity.transit.route.split('→')[1]?.split('(')[0]?.trim() || 'Station B'}"
        data-duration="${activity.transit.route.match(/\((.*?)\)/)?.[1] || '15 mins'}"
        data-line="${activity.transit.line}">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11.2 2 11.6 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg>
        <span>View Carpool & Seats</span>
      </button>`
      : '';

    return `
      <div class="hud-card hud-card--next" id="hud-next-card">
        <div class="hud-card__badge-row">
          <span class="next-pill">NEXT UP • ${activity.nextTime}</span>
          <span class="hud-card__countdown" id="hud-starts-in">Starts in ${activity.nextStartsIn}m</span>
        </div>
        <h3 class="hud-card__title">${activity.title}</h3>
        ${transitHTML}
      </div>
    `;
  }

  function renderChecklist() {
    return `
      <div class="checklist-card" id="checklist-card">
        <div class="checklist-card__header">
          <h4 class="checklist-card__title" style="display: flex; align-items: center; gap: 6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
            <span>Daily Prep Checklist</span>
          </h4>
          <span class="checklist-card__count" id="checklist-count">2/3 completed</span>
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
  }

  function renderAll() {
    const current = getCurrent();
    const next = getNext();

    container.innerHTML = `
      <!-- Atmospheric Vertical Asset Banner (Sticky Cat Photo Header) -->
      <div class="view-banner" style="background-image: url('./src/assets/bg-dashboard.png');">
        <button type="button" class="view-banner__menu-btn" id="btn-open-sidebar" aria-label="Open Trip Menu" title="Open Menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div class="view-banner__scrim">
          <span class="view-banner__badge"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> Cozy Live HUD</span>
          <h2 class="view-banner__title">Now & Next Dashboard</h2>
        </div>
      </div>

      <div class="view-header">
        <div class="view-header__meta">
          <div class="dash-header-row">
            <span class="view-badge">Day-of-Trip HUD</span>
            <button type="button" class="btn-sim-arrival" id="btn-sim-arrival" title="Simulate Destination Arrival" aria-label="Simulate Destination Arrival">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
            </button>
          </div>
          <p class="view-subtitle">Real-time status, upcoming transit directions, and delay controls</p>
        </div>
      </div>

      <!-- 1-Tap Schedule Shift Toolbar -->
      <div class="shift-toolbar">
        <div class="shift-toolbar__label">
          <span style="display: flex; align-items: center; gap: 5px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Running behind schedule?
          </span>
          <span class="shift-toolbar__sub">Shifts non-fixed slots forward automatically</span>
        </div>
        <div class="shift-buttons">
          <button type="button" class="btn-shift" data-shift="30">+30 Mins</button>
          <button type="button" class="btn-shift" data-shift="60">+1 Hour</button>
        </div>
      </div>

      <!-- HUD Cards Container -->
      <div class="hud-cards-container" id="hud-cards-container">
        ${renderNowCard(current)}
        ${renderNextCard(next)}
      </div>

      <!-- Preparation Checklist -->
      ${renderChecklist()}
    `;

    bindEvents();
  }

  function bindEvents() {
    container.querySelectorAll('.btn-shift').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mins = parseInt(btn.dataset.shift, 10);
        const label = mins === 60 ? '1 hour' : `${mins} mins`;
        applyShiftToUI(mins);
        applyReshuffle('delay-30m');
        showToast(container, `Schedule shifted by ${label}!`, 'shift');
      });
    });

    const qrBtn = container.querySelector('#btn-qr-pass');
    if (qrBtn) {
      qrBtn.addEventListener('click', () => {
        showQRModal(container, getCurrent());
      });
    }

    const simBtn = container.querySelector('#btn-sim-arrival');
    if (simBtn) {
      simBtn.addEventListener('click', () => {
        simulateArrival();
      });
    }

    const nowCard = container.querySelector('#hud-now-card');
    if (nowCard) {
      nowCard.addEventListener('dblclick', () => {
        simulateArrival();
      });
    }

    bindCarpoolBtn();
    bindChecklist();
  }

  function bindCarpoolBtn() {
    const carpoolBtn = container.querySelector('#btn-carpool');
    if (carpoolBtn) {
      carpoolBtn.addEventListener('click', () => {
        openCarpoolDrawer({
          from: carpoolBtn.dataset.from,
          to: carpoolBtn.dataset.to,
          duration: carpoolBtn.dataset.duration,
          line: carpoolBtn.dataset.line,
        });
      });
    }
  }

  function simulateArrival() {
    if (isTransitioning) return;
    if (currentIndex >= pipeline.length - 1) {
      showToast(container, 'No more activities to advance!', 'info');
      return;
    }

    isTransitioning = true;
    const cardsContainer = container.querySelector('#hud-cards-container');
    if (!cardsContainer) {
      isTransitioning = false;
      return;
    }

    cardsContainer.classList.add('hud-cards--exit');

    setTimeout(() => {
      currentIndex++;
      shiftOffset = 0;

      const current = getCurrent();
      const next = getNext();

      cardsContainer.innerHTML = renderNowCard(current) + renderNextCard(next);
      cardsContainer.classList.remove('hud-cards--exit');
      cardsContainer.classList.add('hud-cards--enter');

      const qrBtn = container.querySelector('#btn-qr-pass');
      if (qrBtn) {
        qrBtn.addEventListener('click', () => showQRModal(container, getCurrent()));
      }
      const nowCard = container.querySelector('#hud-now-card');
      if (nowCard) {
        nowCard.addEventListener('dblclick', () => simulateArrival());
      }
      bindCarpoolBtn();

      showToast(container, `Now visiting: ${current.title}`, 'success');

      setTimeout(() => {
        cardsContainer.classList.remove('hud-cards--enter');
        isTransitioning = false;
      }, 450);
    }, 350);
  }

  function bindChecklist() {
    const checkboxes = container.querySelectorAll('.checklist-item input[type="checkbox"]');
    const countEl = container.querySelector('#checklist-count');

    function updateCount() {
      const total = checkboxes.length;
      const checked = container.querySelectorAll('.checklist-item input[type="checkbox"]:checked').length;
      if (countEl) {
        countEl.textContent = `${checked}/${total} completed`;
        countEl.classList.remove('checklist-card__count--done');
        if (checked === total) {
          countEl.classList.add('checklist-card__count--done');
        }
      }
    }

    checkboxes.forEach((cb) => {
      cb.addEventListener('change', () => {
        const label = cb.nextElementSibling;
        if (label) {
          label.classList.toggle('checklist-label--done', cb.checked);
        }
        updateCount();
      });

      const label = cb.nextElementSibling;
      if (label && cb.checked) {
        label.classList.add('checklist-label--done');
      }
    });

    updateCount();
  }

  renderAll();

  return {
    element: container,
  };
}
