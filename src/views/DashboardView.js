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
    address: '📍 2-3-1 Asakusa, Taito City, Tokyo',
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
  toast.innerHTML = `
    <span class="dash-toast__icon">${type === 'success' ? '✅' : type === 'shift' ? '⏱' : 'ℹ️'}</span>
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

  function renderAll() {
    const current = getCurrent();
    const next = getNext();

    container.innerHTML = `
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
        showToast(container, `Schedule shifted by ${label}! ✨`, 'shift');
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
      showToast(container, 'No more activities to advance! 🎉', 'info');
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
