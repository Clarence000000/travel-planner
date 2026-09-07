/**
 * Mobile Clean Side Menu / Sidebar Drawer Component
 * Slides out smoothly from the left with backdrop blur.
 * Contains:
 * - "Trip Setup & Recommendations" (triggers onboarding modal)
 * - "Notifications" (with interactive alert cards)
 * - Quick navigation jump & trip overview
 */

export function createSidebar(options = {}) {
  const { onOpenOnboarding, onSelectTab } = options;

  const container = document.createElement('div');
  container.className = 'sidebar-container';
  container.setAttribute('aria-hidden', 'true');

  container.innerHTML = `
    <!-- Backdrop Overlay -->
    <div class="sidebar-backdrop" id="sidebar-backdrop"></div>

    <!-- Slide-out Drawer Panel -->
    <aside class="sidebar-drawer" role="dialog" aria-label="Trip Navigation Menu" aria-modal="true">
      <!-- Drawer Header -->
      <div class="sidebar-header">
        <div class="sidebar-header__brand">
          <div class="sidebar-header__badge">TOKYO 2026</div>
          <h2 class="sidebar-header__title">Summer Tour</h2>
          <span class="sidebar-header__subtitle">July 14 – July 16 • 3 Days</span>
        </div>
        <button type="button" class="sidebar-close-btn" id="sidebar-close-btn" aria-label="Close Menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Drawer Body (Scrollable) -->
      <div class="sidebar-body">
        <!-- Main Actions Section -->
        <div class="sidebar-section">
          <div class="sidebar-section__label">Trip Management</div>

          <!-- Trip Setup & Recommendations -->
          <button type="button" class="sidebar-item" id="sidebar-btn-setup">
            <div class="sidebar-item__icon sidebar-item__icon--primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
            <div class="sidebar-item__text">
              <span class="sidebar-item__title">Trip Setup & Recommendations</span>
              <span class="sidebar-item__desc">Pacing, interests, companions & budget</span>
            </div>
            <svg class="sidebar-item__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>

          <!-- Notifications Item (Toggleable Accordion) -->
          <div class="sidebar-item-group">
            <button type="button" class="sidebar-item" id="sidebar-btn-notifications">
              <div class="sidebar-item__icon sidebar-item__icon--warning">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </div>
              <div class="sidebar-item__text">
                <div class="sidebar-item__row">
                  <span class="sidebar-item__title">Trip Notifications</span>
                  <span class="sidebar-pill-badge">3 New</span>
                </div>
                <span class="sidebar-item__desc">Schedule alerts, transit & bookings</span>
              </div>
              <svg class="sidebar-item__chevron" id="sidebar-notif-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            <!-- Notifications Drawer List -->
            <div class="sidebar-notifications-list" id="sidebar-notifs-container">
              <div class="sidebar-notif-card sidebar-notif-card--success">
                <span class="sidebar-notif-dot"></span>
                <div class="sidebar-notif-content">
                  <strong class="sidebar-notif-heading">Senso-ji Visit Confirmed</strong>
                  <p class="sidebar-notif-text">Booked 10:45 AM – 12:30 PM. 2 requirements verified.</p>
                  <span class="sidebar-notif-time">Just now</span>
                </div>
              </div>

              <div class="sidebar-notif-card sidebar-notif-card--warning">
                <span class="sidebar-notif-dot"></span>
                <div class="sidebar-notif-content">
                  <strong class="sidebar-notif-heading">Tight Transit Buffer (30m)</strong>
                  <p class="sidebar-notif-text">Day 1: Hotel Check-In to Senso-ji on Subway.</p>
                  <span class="sidebar-notif-time">15m ago</span>
                </div>
              </div>

              <div class="sidebar-notif-card sidebar-notif-card--info">
                <span class="sidebar-notif-dot"></span>
                <div class="sidebar-notif-content">
                  <strong class="sidebar-notif-heading">Tokyo Weather Forecast</strong>
                  <p class="sidebar-notif-text">Sunny 24°C / 75°F. Ideal for temple walking.</p>
                  <span class="sidebar-notif-time">1h ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Navigation Links -->
        <div class="sidebar-section">
          <div class="sidebar-section__label">Quick Switch</div>
          <div class="sidebar-nav-grid">
            <button type="button" class="sidebar-nav-chip" data-tab="itinerary">
              <span class="sidebar-nav-chip__icon">📅</span>
              <span>Itinerary</span>
            </button>
            <button type="button" class="sidebar-nav-chip" data-tab="chat">
              <span class="sidebar-nav-chip__icon">💬</span>
              <span>Group Chat</span>
            </button>
            <button type="button" class="sidebar-nav-chip" data-tab="assistant">
              <span class="sidebar-nav-chip__icon">✨</span>
              <span>AI Assistant</span>
            </button>
            <button type="button" class="sidebar-nav-chip" data-tab="ideas">
              <span class="sidebar-nav-chip__icon">💡</span>
              <span>Trip Ideas</span>
            </button>
            <button type="button" class="sidebar-nav-chip" data-tab="dashboard">
              <span class="sidebar-nav-chip__icon">⚡</span>
              <span>Live HUD</span>
            </button>
          </div>
        </div>

        <!-- Trip Overview Summary Card -->
        <div class="sidebar-section">
          <div class="sidebar-summary-box">
            <div class="sidebar-summary-row">
              <span class="sidebar-summary-stat">3 Days</span>
              <span class="sidebar-summary-divider">•</span>
              <span class="sidebar-summary-stat">12 Stops</span>
              <span class="sidebar-summary-divider">•</span>
              <span class="sidebar-summary-stat">2 Cities</span>
            </div>
            <p class="sidebar-summary-note">Tokyo Arrival → Kyoto Heritage → Modern Shibuya</p>
          </div>
        </div>
      </div>

      <!-- Drawer Footer -->
      <div class="sidebar-footer">
        <span class="sidebar-footer__text">Travel Planner Mobile • 2026 Edition</span>
      </div>
    </aside>
  `;

  const backdrop = container.querySelector('#sidebar-backdrop');
  const closeBtn = container.querySelector('#sidebar-close-btn');
  const setupBtn = container.querySelector('#sidebar-btn-setup');
  const notifBtn = container.querySelector('#sidebar-btn-notifications');
  const notifContainer = container.querySelector('#sidebar-notifs-container');
  const notifChevron = container.querySelector('#sidebar-notif-chevron');
  const navChips = container.querySelectorAll('.sidebar-nav-chip');

  let isOpen = false;
  let notifsExpanded = true;

  function open() {
    isOpen = true;
    container.classList.add('sidebar-container--open');
    container.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    isOpen = false;
    container.classList.remove('sidebar-container--open');
    container.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  backdrop.addEventListener('click', close);
  closeBtn.addEventListener('click', close);

  // Keyboard Escape listener
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      close();
    }
  });

  // Trip Setup & Recommendations click
  setupBtn.addEventListener('click', () => {
    close();
    if (typeof onOpenOnboarding === 'function') {
      setTimeout(() => {
        onOpenOnboarding();
      }, 150);
    }
  });

  // Notifications toggle click
  notifBtn.addEventListener('click', () => {
    notifsExpanded = !notifsExpanded;
    if (notifsExpanded) {
      notifContainer.style.display = 'flex';
      notifChevron.style.transform = 'rotate(0deg)';
    } else {
      notifContainer.style.display = 'none';
      notifChevron.style.transform = 'rotate(-90deg)';
    }
  });

  // Quick nav tab clicks
  navChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const tabId = chip.getAttribute('data-tab');
      close();
      if (typeof onSelectTab === 'function') {
        onSelectTab(tabId);
      }
    });
  });

  return {
    element: container,
    open,
    close,
    isOpen: () => isOpen,
  };
}
