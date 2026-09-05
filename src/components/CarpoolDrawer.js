/**
 * Component: Carpool & Transit Planner — Bottom Sheet Drawer
 * A visually rich seat-selection drawer with top-down 7-seat van layout.
 *
 * Features:
 *   1. Route + time summary header
 *   2. Top-down van visualization (Driver + 6 passenger seats)
 *   3. Pre-occupied seats with cute cat avatars + teammate names
 *   4. Empty seats with "+ Join" — click to claim with spring animation
 *   5. Live seat count (X/7 Seats Filled)
 *   6. Smooth open/close via backdrop tap, ✕ button, or Escape
 *
 * Usage:
 *   import { openCarpoolDrawer } from '../components/CarpoolDrawer.js';
 *   openCarpoolDrawer({ from, to, duration, line });
 */

// ── Seat Layout Data ────────────────────────────────────────────────────
// 7-seat van: [row0: Driver, Passenger], [row1: 2 seats], [row2: 3 seats]
const DEFAULT_SEATS = [
  // Row 0 — Front
  { id: 'seat-driver', row: 0, label: 'Driver', isDriver: true, occupant: { initials: 'NS', name: 'Neko-san' } },
  { id: 'seat-front', row: 0, label: 'Shotgun', isDriver: false, occupant: { initials: 'SK', name: 'Sakura' } },
  // Row 1 — Middle
  { id: 'seat-mid-l', row: 1, label: 'Middle Left', isDriver: false, occupant: { initials: 'HR', name: 'Haru' } },
  { id: 'seat-mid-r', row: 1, label: 'Middle Right', isDriver: false, occupant: null },
  // Row 2 — Back
  { id: 'seat-back-l', row: 2, label: 'Back Left', isDriver: false, occupant: null },
  { id: 'seat-back-c', row: 2, label: 'Back Center', isDriver: false, occupant: null },
  { id: 'seat-back-r', row: 2, label: 'Back Right', isDriver: false, occupant: null },
];

/**
 * Opens the Carpool & Transit Planner bottom sheet drawer.
 * @param {Object} opts
 * @param {string} opts.from - Origin station/location
 * @param {string} opts.to - Destination
 * @param {string} opts.duration - Travel time string
 * @param {string} opts.line - Transit line name
 */
export function openCarpoolDrawer(opts = {}) {
  const {
    from = 'Asakusa Station',
    to = 'Shibuya Station',
    duration = '18 mins',
    line = 'Tokyo Metro Ginza Line',
  } = opts;

  // Remove existing drawer if open
  const existing = document.querySelector('.carpool-overlay');
  if (existing) existing.remove();

  // ── State ───────────────────────────────────────────────────────────
  const seats = JSON.parse(JSON.stringify(DEFAULT_SEATS));
  let userSeatId = null;

  // ── Build DOM ───────────────────────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.className = 'carpool-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Carpool & Transit Planner');

  function getFilledCount() {
    return seats.filter((s) => s.occupant !== null).length;
  }

  function render() {
    const filled = getFilledCount();

    overlay.innerHTML = `
      <div class="carpool-backdrop"></div>
      <div class="carpool-sheet">
        <!-- Handle bar -->
        <div class="carpool-sheet__handle"><span></span></div>

        <!-- Header -->
        <div class="carpool-sheet__header">
          <div class="carpool-sheet__header-top">
            <span class="carpool-sheet__badge">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11.2 2 11.6 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg>
              Carpool Planner
            </span>
            <button type="button" class="carpool-sheet__close" aria-label="Close drawer">✕</button>
          </div>
          <div class="carpool-route">
            <div class="carpool-route__endpoints">
              <span class="carpool-route__dot carpool-route__dot--from"></span>
              <span class="carpool-route__name">${from}</span>
              <span class="carpool-route__arrow">→</span>
              <span class="carpool-route__dot carpool-route__dot--to"></span>
              <span class="carpool-route__name">${to}</span>
            </div>
            <div class="carpool-route__meta">
              <span class="carpool-route__line">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:-1px; margin-right:3px;"><rect x="4" y="3" width="16" height="16" rx="2"></rect><path d="M4 11h16"></path><path d="M12 3v8"></path><path d="m8 19-2 3"></path><path d="m16 19 2 3"></path></svg>
                ${line}
              </span>
              <span class="carpool-route__duration">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:-1px; margin-right:3px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                ${duration}
              </span>
            </div>
          </div>
        </div>

        <!-- Seat Count Bar -->
        <div class="carpool-seat-bar">
          <div class="carpool-seat-bar__info">
            <span class="carpool-seat-bar__count" id="carpool-seat-count">${filled}/7 Seats Filled</span>
            <span class="carpool-seat-bar__hint">${filled < 7 ? 'Tap an empty seat to join' : 'Van is full!'}</span>
          </div>
          <div class="carpool-seat-bar__progress">
            <div class="carpool-seat-bar__fill" style="width: ${(filled / 7) * 100}%;"></div>
          </div>
        </div>

        <!-- Van Visualization -->
        <div class="carpool-van">
          <!-- Van body outline -->
          <div class="carpool-van__body">
            <!-- Windshield -->
            <div class="carpool-van__windshield">
              <span>FRONT</span>
            </div>

            <!-- Row 0: Front -->
            <div class="carpool-van__row carpool-van__row--front">
              ${renderSeat(seats[0])}
              <div class="carpool-van__aisle"></div>
              ${renderSeat(seats[1])}
            </div>

            <!-- Row 1: Middle -->
            <div class="carpool-van__row carpool-van__row--mid">
              ${renderSeat(seats[2])}
              <div class="carpool-van__aisle"></div>
              ${renderSeat(seats[3])}
            </div>

            <!-- Row 2: Back -->
            <div class="carpool-van__row carpool-van__row--back">
              ${renderSeat(seats[4])}
              ${renderSeat(seats[5])}
              ${renderSeat(seats[6])}
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="carpool-sheet__footer">
          <button type="button" class="btn btn--secondary carpool-sheet__reset-btn" id="carpool-reset-btn">
            Reset Seat
          </button>
          <button type="button" class="btn btn--primary carpool-sheet__confirm-btn" id="carpool-confirm-btn" ${!userSeatId ? 'disabled' : ''}>
            Confirm Ride
          </button>
        </div>
      </div>
    `;

    bindEvents();
  }

  function renderSeat(seat) {
    const isOccupied = seat.occupant !== null;
    const isUser = seat.id === userSeatId;
    const isDriverSeat = seat.isDriver;

    if (isDriverSeat) {
      return `
        <div class="carpool-seat carpool-seat--driver" data-seat-id="${seat.id}">
          <div class="user-avatar-initials" style="margin: 0 auto 4px; width: 32px; height: 32px; font-size: 11px; background: var(--color-surface); border-color: var(--color-primary);">
            ${seat.occupant.initials}
          </div>
          <span class="carpool-seat__name">${seat.occupant.name}</span>
          <span class="carpool-seat__role">Driver</span>
        </div>
      `;
    }

    if (isOccupied) {
      return `
        <div class="carpool-seat carpool-seat--filled ${isUser ? 'carpool-seat--you' : ''}" data-seat-id="${seat.id}">
          <div class="user-avatar-initials" style="margin: 0 auto 4px; width: 32px; height: 32px; font-size: 11px;">
            ${isUser ? 'ME' : seat.occupant.initials}
          </div>
          <span class="carpool-seat__name">${isUser ? 'You' : seat.occupant.name}</span>
        </div>
      `;
    }

    return `
      <button type="button" class="carpool-seat carpool-seat--empty" data-seat-id="${seat.id}" aria-label="Join ${seat.label}">
        <div class="carpool-seat__empty-ring">
          <span class="carpool-seat__plus">+</span>
        </div>
        <span class="carpool-seat__join">Join</span>
      </button>
    `;
  }

  // ── Events ──────────────────────────────────────────────────────────
  function bindEvents() {
    // Close
    const backdrop = overlay.querySelector('.carpool-backdrop');
    const closeBtn = overlay.querySelector('.carpool-sheet__close');
    if (backdrop) backdrop.addEventListener('click', closeDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

    // Seat clicks
    overlay.querySelectorAll('.carpool-seat--empty').forEach((btn) => {
      btn.addEventListener('click', () => {
        const seatId = btn.dataset.seatId;
        claimSeat(seatId);
      });
    });

    // Reset
    const resetBtn = overlay.querySelector('#carpool-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (userSeatId) {
          const seat = seats.find((s) => s.id === userSeatId);
          if (seat) seat.occupant = null;
          userSeatId = null;
          render();
        }
      });
    }

    // Confirm
    const confirmBtn = overlay.querySelector('#carpool-confirm-btn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        if (userSeatId) {
          showCarpoolToast(`🎉 Ride confirmed! Seat reserved.`);
          setTimeout(() => closeDrawer(), 1200);
        }
      });
    }

    // Escape key
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        closeDrawer();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
  }

  function claimSeat(seatId) {
    // Release previous seat if switching
    if (userSeatId) {
      const prevSeat = seats.find((s) => s.id === userSeatId);
      if (prevSeat) prevSeat.occupant = null;
    }

    const seat = seats.find((s) => s.id === seatId);
    if (!seat || seat.occupant) return;

    seat.occupant = { emoji: '🧑', name: 'You' };
    userSeatId = seatId;

    // Animate the specific seat
    render();

    // Add pop animation to newly claimed seat
    requestAnimationFrame(() => {
      const seatEl = overlay.querySelector(`[data-seat-id="${seatId}"]`);
      if (seatEl) {
        seatEl.classList.add('carpool-seat--claimed');
        setTimeout(() => seatEl.classList.remove('carpool-seat--claimed'), 500);
      }
    });
  }

  function showCarpoolToast(message) {
    const existing = overlay.querySelector('.carpool-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'carpool-toast';
    toast.textContent = message;

    const sheet = overlay.querySelector('.carpool-sheet');
    if (sheet) sheet.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('carpool-toast--visible'));
    setTimeout(() => {
      toast.classList.remove('carpool-toast--visible');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  function closeDrawer() {
    overlay.classList.remove('carpool-overlay--open');
    overlay.classList.add('carpool-overlay--closing');
    setTimeout(() => overlay.remove(), 350);
  }

  // ── Mount & Open ────────────────────────────────────────────────────
  render();
  document.body.appendChild(overlay);

  // Trigger open animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.classList.add('carpool-overlay--open');
    });
  });
}
