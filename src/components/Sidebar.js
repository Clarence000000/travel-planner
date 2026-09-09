/**
 * Mobile Clean Side Menu / Sidebar Drawer Component
 * Slides out smoothly from the left with Apple iOS 26 Liquid Glass styling.
 * Houses secondary hubs and controls to keep the main view decluttered:
 * - Live Day HUD Mode Launcher
 * - Trip Appearance (Hero Banner Cover Presets & Custom URL)
 * - Trip Preferences & AI Reshuffle (Pacing & Contingency Swap)
 * - Contextual Discussions Hub
 * - Trip Dates & Setup (Dynamic Days)
 * - Notifications & Alerts
 */

import { getTripSettings, saveTripSettings, updateTripCover, PRESET_COVERS, formatDateRange, applyCoverToDom } from '../models/tripSettings.js';
import { applyReshuffle } from '../models/itineraryData.js';

export function createSidebar(options = {}) {
  const { onOpenOnboarding, onSelectTab } = options;

  const container = document.createElement('div');
  container.className = 'sidebar-container';
  container.setAttribute('aria-hidden', 'true');

  let isOpen = false;
  let notifsExpanded = false;

  function renderSidebar() {
    const settings = getTripSettings();
    const dateSubtitle = formatDateRange(settings.startDate, settings.endDate, settings.totalDays);

    container.innerHTML = `
      <!-- Backdrop Overlay -->
      <div class="sidebar-backdrop" id="sidebar-backdrop"></div>

      <!-- Slide-out Drawer Panel -->
      <aside class="sidebar-drawer" role="dialog" aria-label="Trip Navigation Menu" aria-modal="true">
        <!-- Drawer Header -->
        <div class="sidebar-header">
          <div class="sidebar-header__brand">
            <div class="sidebar-header__badge">WANDERSYNC • ${settings.destination.split(',')[0].toUpperCase()}</div>
            <h2 class="sidebar-header__title">${settings.title}</h2>
            <span class="sidebar-header__subtitle">${dateSubtitle}</span>
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
          <!-- 1. Primary Live Execution HUD Mode -->
          <div class="sidebar-section">
            <button type="button" class="sidebar-hud-card" id="sidebar-btn-live-hud">
              <div class="sidebar-hud-card__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </div>
              <div class="sidebar-hud-card__text">
                <div class="sidebar-hud-card__title-row">
                  <strong>Live Day HUD Mode</strong>
                  <span class="sidebar-hud-card__pill">DAY-OF</span>
                </div>
                <span>Focus on current activity, transit countdown & QR passes</span>
              </div>
              <svg class="sidebar-item__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>

          <!-- 2. Trip Appearance: Header Cover Customization -->
          <div class="sidebar-section">
            <div class="sidebar-section__label">Trip Appearance</div>
            <div class="sidebar-appearance-card">
              <span class="sidebar-appearance-card__desc">Choose trip hero cover or paste custom image URL:</span>
              
              <!-- Preset Covers Grid -->
              <div class="sidebar-cover-grid">
                ${PRESET_COVERS.map(
                  (cover) => `
                  <button 
                    type="button" 
                    class="sidebar-cover-chip ${settings.coverImage === cover.url ? 'sidebar-cover-chip--active' : ''}" 
                    data-cover-url="${cover.url}"
                    title="${cover.name}"
                  >
                    <div class="sidebar-cover-chip__img" style="background-image: url('${cover.thumb}');"></div>
                    <span class="sidebar-cover-chip__label">${cover.name}</span>
                    ${settings.coverImage === cover.url ? `
                      <span class="sidebar-cover-chip__check">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </span>
                    ` : ''}
                  </button>
                `
                ).join('')}
              </div>

              <!-- Custom URL Input -->
              <div class="sidebar-custom-url-row">
                <input 
                  type="url" 
                  class="sidebar-url-input" 
                  id="sidebar-custom-cover-input" 
                  placeholder="Paste custom image URL..." 
                  value="${PRESET_COVERS.some((c) => c.url === settings.coverImage) ? '' : (settings.coverImage || '')}"
                />
                <button type="button" class="btn btn--secondary btn--sm" id="sidebar-btn-apply-cover">Apply</button>
              </div>
            </div>
          </div>

          <!-- 3. Trip Preferences & AI Reshuffle -->
          <div class="sidebar-section">
            <div class="sidebar-section__label">AI Copilot & Pacing</div>
            <div class="sidebar-copilot-card">
              <div class="sidebar-pace-wrap">
                <span class="sidebar-copilot-card__title">Pacing Preference:</span>
                <div class="sidebar-pace-chips">
                  <button type="button" class="sidebar-pace-btn ${settings.pace === 'chill' ? 'sidebar-pace-btn--active' : ''}" data-pace="chill">
                    Chill (2-3)
                  </button>
                  <button type="button" class="sidebar-pace-btn ${settings.pace === 'balanced' ? 'sidebar-pace-btn--active' : ''}" data-pace="balanced">
                    Balanced (4)
                  </button>
                  <button type="button" class="sidebar-pace-btn ${settings.pace === 'turbo' ? 'sidebar-pace-btn--active' : ''}" data-pace="turbo">
                    High Energy
                  </button>
                </div>
              </div>

              <div class="sidebar-reshuffle-divider"></div>

              <div class="sidebar-reshuffle-row">
                <div class="sidebar-reshuffle-text">
                  <strong>Contingency Reshuffle</strong>
                  <span>Auto-swap outdoor spots if rain is forecast</span>
                </div>
                <button type="button" class="btn btn--secondary btn--sm" id="sidebar-btn-reshuffle">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M23 4v6h-6"></path>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                  </svg>
                  <span>Reshuffle</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 4. Collaboration & Discussions Hub -->
          <div class="sidebar-section">
            <div class="sidebar-section__label">Collaboration</div>

            <!-- Group Discussions Hub -->
            <button type="button" class="sidebar-item" id="sidebar-btn-chat-hub">
              <div class="sidebar-item__icon" style="background: rgba(37, 99, 235, 0.12); color: #2563EB;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <div class="sidebar-item__text">
                <span class="sidebar-item__title">Discussion Threads & Polls</span>
                <span class="sidebar-item__desc">Chat history, active mini-polls & votes</span>
              </div>
              <svg class="sidebar-item__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>

            <!-- Trip Setup Wizard (Dynamic Dates & Travelers) -->
            <button type="button" class="sidebar-item" id="sidebar-btn-setup">
              <div class="sidebar-item__icon sidebar-item__icon--primary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <div class="sidebar-item__text">
                <span class="sidebar-item__title">Trip Dates & Questionnaire</span>
                <span class="sidebar-item__desc">Adjust dates, party size, and vibe</span>
              </div>
              <svg class="sidebar-item__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>

          <!-- 5. Notifications Item (Toggleable Accordion) -->
          <div class="sidebar-section">
            <div class="sidebar-section__label">Alerts & Updates</div>
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
                <svg class="sidebar-item__chevron" id="sidebar-notif-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: ${notifsExpanded ? 'rotate(0deg)' : 'rotate(-90deg)'}">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              <!-- Notifications Drawer List -->
              <div class="sidebar-notifications-list" id="sidebar-notifs-container" style="display: ${notifsExpanded ? 'flex' : 'none'};">
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
        </div>

        <!-- Drawer Footer -->
        <div class="sidebar-footer">
          <span class="sidebar-footer__text">WanderSync • Team Clearence, Tony, Wei Gang</span>
        </div>
      </aside>
    `;

    bindEvents();
  }

  function bindEvents() {
    const backdrop = container.querySelector('#sidebar-backdrop');
    const closeBtn = container.querySelector('#sidebar-close-btn');
    const liveHudBtn = container.querySelector('#sidebar-btn-live-hud');
    const setupBtn = container.querySelector('#sidebar-btn-setup');
    const chatHubBtn = container.querySelector('#sidebar-btn-chat-hub');
    const notifBtn = container.querySelector('#sidebar-btn-notifications');
    const notifContainer = container.querySelector('#sidebar-notifs-container');
    const notifChevron = container.querySelector('#sidebar-notif-chevron');
    const reshuffleBtn = container.querySelector('#sidebar-btn-reshuffle');
    const applyCoverBtn = container.querySelector('#sidebar-btn-apply-cover');
    const customCoverInput = container.querySelector('#sidebar-custom-cover-input');

    if (backdrop) backdrop.addEventListener('click', close);
    if (closeBtn) closeBtn.addEventListener('click', close);

    // Live HUD Launcher
    if (liveHudBtn) {
      liveHudBtn.addEventListener('click', () => {
        close();
        if (typeof onSelectTab === 'function') {
          onSelectTab('dashboard');
        }
      });
    }

    // Cover preset chips
    container.querySelectorAll('.sidebar-cover-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const coverUrl = chip.getAttribute('data-cover-url');
        if (coverUrl) {
          updateTripCover(coverUrl);
          renderSidebar();
        }
      });
    });

    // Custom Cover URL Apply
    if (applyCoverBtn && customCoverInput) {
      applyCoverBtn.addEventListener('click', () => {
        const url = customCoverInput.value.trim();
        if (url) {
          updateTripCover(url);
          renderSidebar();
        }
      });
    }

    // Pace selector chips
    container.querySelectorAll('.sidebar-pace-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pace = btn.getAttribute('data-pace');
        saveTripSettings({ pace });
        renderSidebar();
      });
    });

    // AI Reshuffle button
    if (reshuffleBtn) {
      reshuffleBtn.addEventListener('click', () => {
        applyReshuffle('rain-delay');
        close();
        if (typeof onSelectTab === 'function') {
          onSelectTab('itinerary');
        }
        // Dispatch toast if present
        const toastNotice = document.createElement('div');
        toastNotice.className = 'dash-toast dash-toast--shift dash-toast--visible';
        toastNotice.innerHTML = `<span>AI Reshuffle: Bamboo Grove swapped for indoor museum fallback</span>`;
        document.body.appendChild(toastNotice);
        setTimeout(() => toastNotice.remove(), 3500);
      });
    }

    // Chat Hub
    if (chatHubBtn) {
      chatHubBtn.addEventListener('click', () => {
        close();
        if (typeof onSelectTab === 'function') {
          onSelectTab('chat');
        }
      });
    }

    // Trip Setup & Dates
    if (setupBtn) {
      setupBtn.addEventListener('click', () => {
        close();
        if (typeof onOpenOnboarding === 'function') {
          setTimeout(() => onOpenOnboarding(), 150);
        }
      });
    }

    // Notifications toggle
    if (notifBtn && notifContainer && notifChevron) {
      notifBtn.addEventListener('click', () => {
        notifsExpanded = !notifsExpanded;
        notifContainer.style.display = notifsExpanded ? 'flex' : 'none';
        notifChevron.style.transform = notifsExpanded ? 'rotate(0deg)' : 'rotate(-90deg)';
      });
    }
  }

  function open() {
    isOpen = true;
    renderSidebar();
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

  // Keyboard Escape listener
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      close();
    }
  });

  // Initial render
  renderSidebar();

  return {
    element: container,
    open,
    close,
    isOpen: () => isOpen,
  };
}
