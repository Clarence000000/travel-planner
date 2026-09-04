/**
 * View: "Now & Next" Live Dashboard
 * Real-time HUD for the day of the trip: current spot, next transit directions,
 * 1-tap schedule shift buttons (+30m, +1h), and pre-departure checklist.
 *
 * Interactive Features:
 * 1. QR Pass Modal – high-fidelity ticket modal with SVG QR code
 * 2. One-Tap Shift – toast notification + dynamic time/countdown updates
 * 3. Live State Progression – simulate destination arrival with fade animation
 * 4. Checklist Interaction – toggle items + live completion counter
 */

import { openCarpoolDrawer } from '../components/CarpoolDrawer.js';

// ── Activity Pipeline (fake data for demo) ──────────────────────────────
const ACTIVITY_PIPELINE = [
  {
    id: 'sensoji',
    title: 'Senso-ji Main Temple & Grounds',
    address: '📍 2-3-1 Asakusa, Taito City, Tokyo',
    remainingMins: 45,
    nextTime: '01:15 PM',
    nextStartsIn: 50,
    qr: {
      name: 'Senso-ji Temple',
      time: '10:30 AM – 12:15 PM',
      guests: '3 Guests',
    },
  },
  {
    id: 'matcha',
    title: 'Rooftop Matcha & Street Food',
    address: '📍 Shibuya Crossing Tower, 21F, Tokyo',
    remainingMins: 60,
    nextTime: '03:00 PM',
    nextStartsIn: 40,
    transit: {
      icon: '🚇',
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
    address: '📍 Azabudai Hills, Minato City, Tokyo',
    remainingMins: 90,
    nextTime: '04:30 PM',
    nextStartsIn: 55,
    transit: {
      icon: '🚶',
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
    address: '📍 1-22-7 Jinnan, Shibuya, Tokyo',
    remainingMins: 45,
    nextTime: '06:00 PM',
    nextStartsIn: 35,
    transit: {
      icon: '🚇',
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
    address: '📍 Big Echo Shibuya Main, 3F, Tokyo',
    remainingMins: 120,
    nextTime: '08:30 PM',
    nextStartsIn: 60,
    transit: {
      icon: '🚶',
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

// ── QR Code SVG Generator (deterministic fake pattern) ──────────────────
function generateQRSvg() {
  // 21×21 module QR-like pattern (static, decorative)
  const size = 21;
  const moduleSize = 8;
  const totalSize = size * moduleSize;

  // Finder patterns (three 7×7 squares in corners)
  const finderPositions = [
    [0, 0],
    [14, 0],
    [0, 14],
  ];

  let modules = [];

  // Draw finder patterns
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

  // Seeded pseudo-random data modules
  const seed = [
    1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1,
    0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1,
    1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1,
    0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0,
  ];
  let si = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Skip finder pattern areas
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
  // Remove existing toast
  const existing = container.querySelector('.dash-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `dash-toast dash-toast--${type}`;
  toast.innerHTML = `
    <span class="dash-toast__icon">${type === 'success' ? '✅' : type === 'shift' ? '⏱' : 'ℹ️'}</span>
    <span class="dash-toast__msg">${message}</span>
  `;

  // Insert as first child (top of view)
  container.insertBefore(toast, container.firstChild);

  // Trigger enter animation
  requestAnimationFrame(() => {
    toast.classList.add('dash-toast--visible');
  });

  // Auto dismiss
  setTimeout(() => {
    toast.classList.remove('dash-toast--visible');
    toast.classList.add('dash-toast--exit');
    setTimeout(() => toast.remove(), 350);
  }, 2800);
}

// ── QR Pass Modal ───────────────────────────────────────────────────────
function showQRModal(container, activity) {
  // Remove existing modal
  const existing = container.querySelector('.qr-modal-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'qr-modal-overlay';
  overlay.innerHTML = `
    <div class="qr-modal">
      <div class="qr-modal__header">
        <span class="qr-modal__badge">🎟 Digital Pass</span>
        <button type="button" class="qr-modal__close" aria-label="Close modal">✕</button>
      </div>
      <div class="qr-modal__qr-wrapper">
        ${generateQRSvg()}
      </div>
      <div class="qr-modal__info">
        <h3 class="qr-modal__title">${activity.qr.name}</h3>
        <div class="qr-modal__details">
          <div class="qr-modal__detail-row">
            <span class="qr-modal__detail-icon">🕐</span>
            <span>${activity.qr.time}</span>
          </div>
          <div class="qr-modal__detail-row">
            <span class="qr-modal__detail-icon">👥</span>
            <span>${activity.qr.guests}</span>
          </div>
          <div class="qr-modal__detail-row">
            <span class="qr-modal__detail-icon">📅</span>
            <span>Today, ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>
      <button type="button" class="btn btn--primary qr-modal__close-btn">Close</button>
    </div>
  `;

  // Enter animation
  container.appendChild(overlay);
  requestAnimationFrame(() => {
    overlay.classList.add('qr-modal-overlay--visible');
  });

  // Close handlers
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

  // Escape key
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

  // ── Mutable State ─────────────────────────────────────────────────────
  let currentIndex = 0; // index into ACTIVITY_PIPELINE
  let shiftOffset = 0; // cumulative minutes shifted
  let isTransitioning = false;

  // Deep-clone so shifts don't corrupt original data
  const pipeline = JSON.parse(JSON.stringify(ACTIVITY_PIPELINE));

  // ── Render Helpers ────────────────────────────────────────────────────

  function getCurrent() {
    return pipeline[currentIndex] || pipeline[pipeline.length - 1];
  }
  function getNext() {
    return pipeline[currentIndex + 1] || null;
  }

  /** Update all countdown / time displays after a shift */
  function applyShiftToUI(deltaMins) {
    shiftOffset += deltaMins;

    // Update remaining mins on ACTIVE card
    const current = getCurrent();
    current.remainingMins += deltaMins;

    const remainEl = container.querySelector('#hud-remaining');
    if (remainEl) {
      remainEl.textContent = `Remaining: ${current.remainingMins} mins`;
      remainEl.classList.add('countdown-flash');
      setTimeout(() => remainEl.classList.remove('countdown-flash'), 600);
    }

    // Update starts-in on NEXT card
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

  /** Build NOW card HTML */
  function renderNowCard(activity) {
    return `
      <div class="hud-card hud-card--now" id="hud-now-card">
        <div class="hud-card__badge-row">
          <span class="live-pill">● ACTIVE NOW</span>
          <span class="hud-card__countdown" id="hud-remaining">Remaining: ${activity.remainingMins} mins</span>
        </div>
        <h3 class="hud-card__title">${activity.title}</h3>
        <p class="hud-card__address">${activity.address}</p>
        <div class="hud-card__actions">
          <a href="https://maps.google.com" target="_blank" rel="noopener" class="btn btn--primary btn--sm">
            <span>🗺 Open in Maps</span>
          </a>
          <button type="button" class="btn btn--secondary btn--sm" id="btn-qr-pass">
            <span>🎟 View QR Pass</span>
          </button>
        </div>
      </div>
    `;
  }

  /** Build NEXT card HTML */
  function renderNextCard(activity) {
    if (!activity) {
      return `
        <div class="hud-card hud-card--next hud-card--done">
          <div class="hud-card__badge-row">
            <span class="next-pill">🎉 ALL DONE</span>
          </div>
          <h3 class="hud-card__title">No more activities today!</h3>
          <p class="hud-card__address">Time to explore on your own 🐾</p>
        </div>
      `;
    }

    const transitHTML = activity.transit
      ? `
      <div class="transit-step">
        <span class="transit-step__icon">${activity.transit.icon}</span>
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
        <span>🚐 View Carpool & Seats</span>
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

  /** Build checklist HTML */
  function renderChecklist() {
    return `
      <div class="checklist-card" id="checklist-card">
        <div class="checklist-card__header">
          <h4 class="checklist-card__title">🎒 Daily Prep Checklist</h4>
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

  /** Render the entire view content */
  function renderAll() {
    const current = getCurrent();
    const next = getNext();

    container.innerHTML = `
      <!-- Atmospheric Vertical Asset Banner -->
      <div class="view-banner" style="background-image: url('./src/assets/bg-dashboard.png');">
        <div class="view-banner__scrim">
          <span class="view-banner__badge">🐾 Cozy Live HUD</span>
          <h2 class="view-banner__title">Now & Next Dashboard</h2>
        </div>
      </div>

      <div class="view-header">
        <div class="view-header__meta">
          <div class="dash-header-row">
            <span class="view-badge">Day-of-Trip HUD</span>
            <button type="button" class="btn-sim-arrival" id="btn-sim-arrival" title="Simulate Destination Arrival">
              <span class="btn-sim-arrival__icon">⏭</span>
            </button>
          </div>
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
          <button type="button" class="btn-shift" data-shift="30">+30 Mins</button>
          <button type="button" class="btn-shift" data-shift="60">+1 Hour</button>
        </div>
      </div>

      <!-- HUD Cards Container (animated swap target) -->
      <div class="hud-cards-container" id="hud-cards-container">
        ${renderNowCard(current)}
        ${renderNextCard(next)}
      </div>

      <!-- Preparation Checklist -->
      ${renderChecklist()}
    `;

    bindEvents();
  }

  // ── Event Binding ─────────────────────────────────────────────────────

  function bindEvents() {
    // Shift buttons
    container.querySelectorAll('.btn-shift').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mins = parseInt(btn.dataset.shift, 10);
        const label = mins === 60 ? '1 hour' : `${mins} mins`;
        applyShiftToUI(mins);
        showToast(container, `Schedule shifted by ${label}! ✨`, 'shift');
      });
    });

    // QR Pass button
    const qrBtn = container.querySelector('#btn-qr-pass');
    if (qrBtn) {
      qrBtn.addEventListener('click', () => {
        showQRModal(container, getCurrent());
      });
    }

    // Simulate Arrival button
    const simBtn = container.querySelector('#btn-sim-arrival');
    if (simBtn) {
      simBtn.addEventListener('click', () => {
        simulateArrival();
      });
    }

    // Double-click on NOW card → also triggers simulation
    const nowCard = container.querySelector('#hud-now-card');
    if (nowCard) {
      nowCard.addEventListener('dblclick', () => {
        simulateArrival();
      });
    }

    // Carpool button
    bindCarpoolBtn();

    // Checklist interaction
    bindChecklist();
  }

  /** Bind carpool drawer trigger */
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

  /** Animate state transition: NEXT UP → ACTIVE NOW */
  function simulateArrival() {
    if (isTransitioning) return;
    if (currentIndex >= pipeline.length - 1) {
      showToast(container, 'No more activities to advance! 🎉', 'info');
      return;
    }

    isTransitioning = true;
    const cardsContainer = container.querySelector('#hud-cards-container');
    if (!cardsContainer) {
      isTransitioning = false;
      return;
    }

    // Fade out
    cardsContainer.classList.add('hud-cards--exit');

    setTimeout(() => {
      // Advance pipeline
      currentIndex++;
      shiftOffset = 0; // reset shifts for new activity

      const current = getCurrent();
      const next = getNext();

      cardsContainer.innerHTML = renderNowCard(current) + renderNextCard(next);
      cardsContainer.classList.remove('hud-cards--exit');
      cardsContainer.classList.add('hud-cards--enter');

      // Re-bind events on new cards
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

  /** Bind checklist toggle + live counter */
  function bindChecklist() {
    const checkboxes = container.querySelectorAll('.checklist-item input[type="checkbox"]');
    const countEl = container.querySelector('#checklist-count');

    function updateCount() {
      const total = checkboxes.length;
      const checked = container.querySelectorAll('.checklist-item input[type="checkbox"]:checked').length;
      if (countEl) {
        countEl.textContent = `${checked}/${total} completed`;

        // Style the count based on completion
        countEl.classList.remove('checklist-card__count--done');
        if (checked === total) {
          countEl.classList.add('checklist-card__count--done');
        }
      }
    }

    checkboxes.forEach((cb) => {
      cb.addEventListener('change', () => {
        // Toggle the label styling
        const label = cb.nextElementSibling;
        if (label) {
          label.classList.toggle('checklist-label--done', cb.checked);
        }
        updateCount();
      });

      // Set initial label state
      const label = cb.nextElementSibling;
      if (label && cb.checked) {
        label.classList.add('checklist-label--done');
      }
    });

    // Initial count
    updateCount();
  }

  // ── Initial Render ────────────────────────────────────────────────────
  renderAll();

  return {
    element: container,
  };
}
