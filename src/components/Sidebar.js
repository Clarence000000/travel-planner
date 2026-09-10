/**
 * Mobile Clean Side Menu / Sidebar Drawer Component
 * Slides out smoothly from the left with Apple iOS 26 Liquid Glass styling.
 * Houses secondary hubs and controls to keep the main view decluttered:
 * - Trip Details & Cover Editor (Name, Start/End Dates, Cover Presets & URL)
 * - AI Copilot & Pacing (Chill, Balanced, High Energy + Weather Contingency)
 * - Collaboration Hub (Discussions & Polls)
 * - Notifications & Alerts (Interactive accordion with 0-new zero state & JSON ingest)
 */

import { getTripSettings, saveTripSettings, updateTripCover, PRESET_COVERS, formatDateRange, applyCoverToDom } from '../models/tripSettings.js';
import { applyReshuffle } from '../models/itineraryData.js';
import { getActiveTripId, updateTrip } from '../models/tripsModel.js';
import {
  getNotifications,
  getUnreadCount,
  ingestNotificationsJson,
  clearNotifications,
  deleteNotification,
  SAMPLE_NOTIFICATIONS_JSON,
} from '../models/notificationsData.js';

export function createSidebar(options = {}) {
  const { onSelectTab } = options;

  const container = document.createElement('div');
  container.className = 'sidebar-container';
  container.setAttribute('aria-hidden', 'true');

  let isOpen = false;
  let appearanceOpen = false;
  let notifsExpanded = true;
  let selectedCover = null;

  function renderSidebar() {
    const settings = getTripSettings();
    const dateSubtitle = formatDateRange(settings.startDate, settings.endDate, settings.totalDays);
    const activeCover = selectedCover || settings.coverImage;
    const notifications = getNotifications();
    const unreadCount = getUnreadCount();

    container.innerHTML = `
      <!-- Backdrop Overlay -->
      <div class=\"sidebar-backdrop\" id=\"sidebar-backdrop\"></div>

      <!-- Slide-out Drawer Panel -->
      <aside class=\"sidebar-drawer\" role=\"dialog\" aria-label=\"Trip Navigation Menu\" aria-modal=\"true\">
        <!-- Drawer Header -->
        <div class=\"sidebar-header\">
          <div class=\"sidebar-header__brand\">
            <div class=\"sidebar-header__top-bar\">
              <button type=\"button\" class=\"sidebar-all-trips-chip\" id=\"sidebar-btn-all-trips\" title=\"View all trips\">
                <svg width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\">
                  <polyline points=\"15 18 9 12 15 6\"></polyline>
                </svg>
                <span>My Trips</span>
              </button>
            </div>
            <div class=\"sidebar-header__title-row\">
              <h2 class=\"sidebar-header__title\">
                <span>${settings.title}</span>
                <button type=\"button\" class=\"sidebar-pencil-btn ${appearanceOpen ? 'sidebar-pencil-btn--active' : ''}\" id=\"sidebar-btn-edit-cover\" title=\"Edit trip details & cover\" aria-label=\"Edit trip details\">
                  <svg width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.3\" stroke-linecap=\"round\" stroke-linejoin=\"round\">
                    <path d=\"M12 20h9\"></path>
                    <path d=\"M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z\"></path>
                  </svg>
                </button>
              </h2>
            </div>
            <span class=\"sidebar-header__subtitle\">${dateSubtitle}</span>
          </div>
          <button type=\"button\" class=\"sidebar-close-btn\" id=\"sidebar-close-btn\" aria-label=\"Close Menu\">
            <svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">
              <line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"></line>
              <line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"></line>
            </svg>
          </button>
        </div>

        <!-- Sleek Sub-drawer for Appearance & Trip Details (Toggled via Pencil Icon) -->
        <div class=\"sidebar-appearance-drawer ${appearanceOpen ? 'is-open' : ''}\" id=\"sidebar-appearance-drawer\">
          <div class=\"sidebar-appearance-drawer__header\">
            <span class=\"sidebar-appearance-drawer__title\">Edit Trip Details</span>
            <button type=\"button\" class=\"sidebar-appearance-drawer__close\" id=\"sidebar-btn-close-appearance\" aria-label=\"Close appearance picker\">✕</button>
          </div>

          <!-- Trip Name -->
          <div class=\"sidebar-appearance-drawer__form-group\">
            <label class=\"sidebar-appearance-drawer__label\" for=\"sidebar-edit-title\">Trip Name</label>
            <input 
              type=\"text\" 
              class=\"sidebar-appearance-drawer__input\" 
              id=\"sidebar-edit-title\" 
              value=\"${settings.title || 'Tokyo Expedition'}\" 
              placeholder=\"e.g. Tokyo Expedition\" 
            />
          </div>
          <!-- Destination / City Tag -->
          <div class=\"sidebar-appearance-drawer__form-group\">
            <label class=\"sidebar-appearance-drawer__label\" for=\"sidebar-edit-destination\">Destination / Region</label>
            <input 
              type=\"text\" 
              class=\"sidebar-appearance-drawer__input\" 
              id=\"sidebar-edit-destination\" 
              value=\"${settings.destination || 'Tokyo & Kyoto, Japan'}\" 
              placeholder=\"e.g. Tokyo & Kyoto, Japan\" 
            />
          </div>


          <!-- Dates Row -->
          <div class=\"sidebar-appearance-drawer__dates-row\">
            <div class=\"sidebar-appearance-drawer__form-group\">
              <label class=\"sidebar-appearance-drawer__label\" for=\"sidebar-edit-start-date\">Start Date</label>
              <input 
                type=\"date\" 
                class=\"sidebar-appearance-drawer__input\" 
                id=\"sidebar-edit-start-date\" 
                value=\"${settings.startDate || '2026-10-12'}\" 
              />
            </div>
            <div class=\"sidebar-appearance-drawer__form-group\">
              <label class=\"sidebar-appearance-drawer__label\" for=\"sidebar-edit-end-date\">End Date</label>
              <input 
                type=\"date\" 
                class=\"sidebar-appearance-drawer__input\" 
                id=\"sidebar-edit-end-date\" 
                value=\"${settings.endDate || '2026-10-14'}\" 
              />
            </div>
          </div>

          <!-- Cover Image Presets -->
          <div class=\"sidebar-appearance-drawer__form-group\">
            <label class=\"sidebar-appearance-drawer__label\">Header Cover Image</label>
            <div class=\"sidebar-cover-pills\">
              ${PRESET_COVERS.map(
                (cover) => `
                <button 
                  type=\"button\" 
                  class=\"sidebar-cover-pill ${activeCover === cover.url ? 'sidebar-cover-pill--active' : ''}\" 
                  data-cover-url=\"${cover.url}\"
                  title=\"${cover.name}\"
                >
                  <span class=\"sidebar-cover-pill__thumb\" style=\"background-image: url('${cover.thumb}');\"></span>
                  <span class=\"sidebar-cover-pill__name\">${cover.name}</span>
                  ${activeCover === cover.url ? `
                    <svg class=\"sidebar-cover-pill__check\" width=\"11\" height=\"11\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\">
                      <polyline points=\"20 6 9 17 4 12\"></polyline>
                    </svg>
                  ` : ''}
                </button>
              `
              ).join('')}
            </div>
          </div>

          <!-- Custom Cover Input -->
          <div class=\"sidebar-appearance-drawer__form-group\">
            <label class=\"sidebar-appearance-drawer__label\" for=\"sidebar-custom-cover-input\">Custom Cover URL</label>
            <input 
              type=\"url\" 
              class=\"sidebar-appearance-drawer__input\" 
              id=\"sidebar-custom-cover-input\" 
              placeholder=\"https://images.unsplash.com/...\" 
              value=\"${PRESET_COVERS.some((c) => c.url === activeCover) ? '' : (activeCover || '')}\"
            />
          </div>

          <!-- Save Button -->
          <button type=\"button\" class=\"sidebar-appearance-drawer__save-btn\" id=\"sidebar-btn-save-details\">
            <svg width=\"13\" height=\"13\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\"><polyline points=\"20 6 9 17 4 12\"/></svg>
            <span>Save Trip Details</span>
          </button>
        </div>

        <!-- Drawer Body (Scrollable) -->
        <div class=\"sidebar-body\">
          <!-- 1. AI Copilot & Pacing -->
          <div class=\"sidebar-section\">
            <div class=\"sidebar-section__label\">AI Copilot & Pacing</div>
            <div class=\"sidebar-card\">
              <div class=\"sidebar-card__row\">
                <span class=\"sidebar-card__sublabel\">Schedule Pacing:</span>
                <div class=\"sidebar-pace-chips\">
                  <button type=\"button\" class=\"sidebar-pace-btn ${settings.pace === 'chill' ? 'sidebar-pace-btn--active' : ''}\" data-pace=\"chill\">
                    Chill
                  </button>
                  <button type=\"button\" class=\"sidebar-pace-btn ${settings.pace === 'balanced' ? 'sidebar-pace-btn--active' : ''}\" data-pace=\"balanced\">
                    Balanced
                  </button>
                  <button type=\"button\" class=\"sidebar-pace-btn ${settings.pace === 'turbo' ? 'sidebar-pace-btn--active' : ''}\" data-pace=\"turbo\">
                    High Energy
                  </button>
                </div>
              </div>

              <div class=\"sidebar-card__divider\"></div>

              <div class=\"sidebar-reshuffle-row\">
                <div class=\"sidebar-reshuffle-text\">
                  <strong>Weather Contingency</strong>
                  <span>Auto-swap outdoor spots if rain is forecast</span>
                </div>
                <button type=\"button\" class=\"btn btn--secondary btn--sm\" id=\"sidebar-btn-reshuffle\">
                  <svg width=\"13\" height=\"13\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.3\" stroke-linecap=\"round\" stroke-linejoin=\"round\">
                    <path d=\"M23 4v6h-6\"></path>
                    <path d=\"M20.49 15a9 9 0 1 1-2.12-9.36L23 10\"></path>
                  </svg>
                  <span>Reshuffle</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 2. Planning & Collaboration -->
          <div class=\"sidebar-section\">
            <div class=\"sidebar-section__label\">Planning & Collaboration</div>

            <!-- Group Discussions Hub -->
            <button type=\"button\" class=\"sidebar-item\" id=\"sidebar-btn-chat-hub\">
              <div class=\"sidebar-item__icon\" style=\"background: rgba(37, 99, 235, 0.12); color: #2563EB;\">
                <svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">
                  <path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\"></path>
                </svg>
              </div>
              <div class=\"sidebar-item__text\">
                <span class=\"sidebar-item__title\">Discussion Threads & Polls</span>
                <span class=\"sidebar-item__desc\">Chat history, active mini-polls & votes</span>
              </div>
              <svg class=\"sidebar-item__arrow\" width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\">
                <polyline points=\"9 18 15 12 9 6\"></polyline>
              </svg>
            </button>
          </div>

          <!-- 3. Notifications & Alerts (Accordion with 0-New Initial State & JSON Ingest) -->
          <div class=\"sidebar-section\">
            <div class=\"sidebar-section__label\">Alerts & Updates</div>
            <div class=\"sidebar-item-group\">
              <button type=\"button\" class=\"sidebar-item\" id=\"sidebar-btn-notifications\">
                <div class=\"sidebar-item__icon\" style=\"background: rgba(245, 158, 11, 0.12); color: #D97706;\">
                  <svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">
                    <path d=\"M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9\"></path>
                    <path d=\"M13.73 21a2 2 0 0 1-3.46 0\"></path>
                  </svg>
                </div>
                <div class=\"sidebar-item__text\">
                  <div class=\"sidebar-item__row\" style=\"display: flex; align-items: center; justify-content: space-between;\">
                    <span class=\"sidebar-item__title\">Trip Notifications</span>
                    <span class=\"sidebar-pill-badge\" style=\"background: ${unreadCount > 0 ? '#FEF3C7' : 'rgba(148, 163, 184, 0.18)'}; color: ${unreadCount > 0 ? '#D97706' : '#64748B'}; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 9999px;\">
                      ${unreadCount} New
                    </span>
                  </div>
                  <span class=\"sidebar-item__desc\">Schedule alerts, transit & bookings</span>
                </div>
                <svg class=\"sidebar-item__chevron\" id=\"sidebar-notif-chevron\" width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"transform: ${notifsExpanded ? 'rotate(0deg)' : 'rotate(-90deg)'}; transition: transform 200ms ease;\">
                  <polyline points=\"6 9 12 15 18 9\"></polyline>
                </svg>
              </button>

              <!-- Notifications Drawer List -->
              <div class=\"sidebar-notifications-list\" id=\"sidebar-notifs-container\" style=\"display: ${notifsExpanded ? 'flex' : 'none'}; flex-direction: column; gap: 8px; margin-top: 8px;\">
                ${notifications.length > 0 ? `
                <div style=\"display: flex; align-items: center; justify-content: flex-end; padding: 0 4px;\">
                  <button type=\"button\" class=\"sidebar-notif-clear-btn\" id=\"sidebar-btn-clear-notifs\">
                    Clear All
                  </button>
                </div>
                ` : ''}

                ${notifications.length === 0 ? `
                  <div class=\"sidebar-notif-empty-card\">
                    <svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#94A3B8\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\">
                      <path d=\"M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9\"></path>
                      <path d=\"M13.73 21a2 2 0 0 1-3.46 0\"></path>
                    </svg>
                    <div style=\"display: flex; flex-direction: column; gap: 2px;\">
                      <strong style=\"font-size: 11.5px; color: #475569;\">0 new notifications</strong>
                      <span style=\"font-size: 10.5px; color: #94A3B8;\">All alerts and schedule notices will appear here.</span>
                    </div>
                  </div>
                ` : notifications.map((notif) => `
                  <div class=\"sidebar-notif-card sidebar-notif-card--${notif.type || 'info'}\">
                    <span class=\"sidebar-notif-dot\"></span>
                    <div class=\"sidebar-notif-content\">
                      <div style=\"display: flex; align-items: flex-start; justify-content: space-between; gap: 4px;\">
                        <strong class=\"sidebar-notif-heading\">${notif.title}</strong>
                        <button type=\"button\" class=\"sidebar-notif-del-btn\" data-delete-notif=\"${notif.id}\" title=\"Dismiss notification\">✕</button>
                      </div>
                      ${notif.text ? `<p class=\"sidebar-notif-text\">${notif.text}</p>` : ''}
                      <span class=\"sidebar-notif-time\">${notif.time || 'Just now'}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- Drawer Footer -->
        <div class=\"sidebar-footer\">
          <span class=\"sidebar-footer__text\">WanderSync • Smart Travel Companion</span>
        </div>
      </aside>
    `;

    bindEvents();
  }

  function bindEvents() {
    const backdrop = container.querySelector('#sidebar-backdrop');
    const closeBtn = container.querySelector('#sidebar-close-btn');
    const allTripsBtn = container.querySelector('#sidebar-btn-all-trips');
    if (allTripsBtn) {
      allTripsBtn.addEventListener('click', () => {
        close();
        if (window.TravelApp && window.TravelApp.openTrips) {
          window.TravelApp.openTrips();
        }
      });
    }

    const chatHubBtn = container.querySelector('#sidebar-btn-chat-hub');
    const notifBtn = container.querySelector('#sidebar-btn-notifications');
    const notifContainer = container.querySelector('#sidebar-notifs-container');
    const notifChevron = container.querySelector('#sidebar-notif-chevron');
    const reshuffleBtn = container.querySelector('#sidebar-btn-reshuffle');
    const editCoverBtn = container.querySelector('#sidebar-btn-edit-cover');
    const closeAppearanceBtn = container.querySelector('#sidebar-btn-close-appearance');
    const saveDetailsBtn = container.querySelector('#sidebar-btn-save-details');

    if (backdrop) backdrop.addEventListener('click', close);
    if (closeBtn) closeBtn.addEventListener('click', close);

    // Toggle appearance sub-drawer via pencil icon
    if (editCoverBtn) {
      editCoverBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        appearanceOpen = !appearanceOpen;
        renderSidebar();
      });
    }

    if (closeAppearanceBtn) {
      closeAppearanceBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        appearanceOpen = false;
        renderSidebar();
      });
    }

    // Cover preset pills selection
    container.querySelectorAll('.sidebar-cover-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        const coverUrl = pill.getAttribute('data-cover-url');
        if (coverUrl) {
          selectedCover = coverUrl;
          const input = container.querySelector('#sidebar-custom-cover-input');
          if (input) input.value = '';
          container.querySelectorAll('.sidebar-cover-pill').forEach((p) => {
            p.classList.toggle('sidebar-cover-pill--active', p === pill);
          });
        }
      });
    });

    // Save Trip Details Button
    if (saveDetailsBtn) {
      saveDetailsBtn.addEventListener('click', () => {
        const titleInput = container.querySelector('#sidebar-edit-title');
        const destInput = container.querySelector('#sidebar-edit-destination');
        const startDateInput = container.querySelector('#sidebar-edit-start-date');
        const endDateInput = container.querySelector('#sidebar-edit-end-date');
        const customCoverInput = container.querySelector('#sidebar-custom-cover-input');

        const currentSettings = getTripSettings();
        const newTitle = titleInput ? titleInput.value.trim() || currentSettings.title : currentSettings.title;
        let newDestination = destInput ? destInput.value.trim() || currentSettings.destination : currentSettings.destination;
        if (!newDestination) newDestination = newTitle.split(' ')[0] || 'Tokyo';
        const newStartDate = startDateInput ? startDateInput.value || currentSettings.startDate : currentSettings.startDate;
        const newEndDate = endDateInput ? endDateInput.value || currentSettings.endDate : currentSettings.endDate;
        const customUrl = customCoverInput ? customCoverInput.value.trim() : '';
        const newCover = customUrl || selectedCover || currentSettings.coverImage;

        // Calculate duration days
        let totalDays = currentSettings.totalDays;
        if (newStartDate && newEndDate) {
          const diffMs = new Date(newEndDate) - new Date(newStartDate);
          const days = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
          if (days > 0) totalDays = days;
        }

        // 1. Update tripSettings model with destination
        saveTripSettings({
          title: newTitle,
          destination: newDestination,
          startDate: newStartDate,
          endDate: newEndDate,
          totalDays,
          coverImage: newCover,
        });

        // 2. Update active trip in tripsModel
        const activeTripId = getActiveTripId();
        if (activeTripId) {
          updateTrip(activeTripId, {
            title: newTitle,
            destination: newDestination,
            startDate: newStartDate,
            endDate: newEndDate,
            totalDays,
            coverImage: newCover,
          });
        }

        // 3. Apply cover to DOM
        applyCoverToDom(newCover);

        // 4. Update Header banner & tags across all active views
        const bannerTitles = document.querySelectorAll('.view-banner__title, .cat-header__title');
        bannerTitles.forEach((bt) => {
          if (window.location.hash === '#itinerary' || !window.location.hash || bt.classList.contains('cat-header__title')) {
            bt.textContent = newTitle;
          }
        });
        const bannerSubs = document.querySelector('.cat-header__subtitle');
        if (bannerSubs) bannerSubs.textContent = formatDateRange(newStartDate, newEndDate, totalDays);
        document.title = `${newTitle} — WanderSync`;

        // Update tag / badges (e.g. "Tokyo & Kyoto • Day 1 of 3 • ... Stops" and "Tokyo & Kyoto Ideas")
        const cityPart = newDestination.split(',')[0].trim();
        const itineraryBadge = document.querySelector('#itinerary-banner-badge');
        if (itineraryBadge) {
          itineraryBadge.innerHTML = `
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            ${cityPart} • Day 1 of ${totalDays} • Schedule
          `;
        }
        const ideasBadge = document.querySelector('.ideas-view .view-banner__badge');
        if (ideasBadge) {
          ideasBadge.innerHTML = `
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7zM9 21a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-1H9v1z"></path></svg>
            ${cityPart} Ideas
          `;
        }

        appearanceOpen = false;
        selectedCover = null;
        renderSidebar();

        // Dispatch toast notification
        const toast = document.createElement('div');
        toast.className = 'dash-toast dash-toast--shift dash-toast--visible';
        toast.innerHTML = `<span>Trip details & destination updated!</span>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);

        // Notify app
        window.dispatchEvent(new CustomEvent('trip-settings-updated', {
          detail: { title: newTitle, destination: newDestination, startDate: newStartDate, endDate: newEndDate, totalDays, coverImage: newCover }
        }));
      });
    }

    // Pace selector chips - reactive and persistent
    container.querySelectorAll('.sidebar-pace-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pace = btn.getAttribute('data-pace');
        saveTripSettings({ pace });
        renderSidebar();

        // Dispatch pace update
        window.dispatchEvent(new CustomEvent('trip-pace-changed', { detail: { pace } }));

        // Quick toast
        const toast = document.createElement('div');
        toast.className = 'dash-toast dash-toast--shift dash-toast--visible';
        const paceName = pace === 'turbo' ? 'High Energy' : pace === 'chill' ? 'Chill' : 'Balanced';
        toast.innerHTML = `<span>Pace set to ${paceName}</span>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 1800);
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

    // Notifications toggle
    if (notifBtn && notifContainer && notifChevron) {
      notifBtn.addEventListener('click', () => {
        notifsExpanded = !notifsExpanded;
        notifContainer.style.display = notifsExpanded ? 'flex' : 'none';
        notifChevron.style.transform = notifsExpanded ? 'rotate(0deg)' : 'rotate(-90deg)';
      });
    }



    // Clear all notifications
    const clearNotifsBtn = container.querySelector('#sidebar-btn-clear-notifs');
    if (clearNotifsBtn) {
      clearNotifsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearNotifications();
        renderSidebar();
      });
    }

    // Delete single notification
    container.querySelectorAll('[data-delete-notif]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-delete-notif');
        deleteNotification(id);
        renderSidebar();
      });
    });
  }

  function open() {
    isOpen = true;
    container.classList.add('sidebar-container--open');
    container.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    renderSidebar();
  }

  function close() {
    isOpen = false;
    appearanceOpen = false;
    selectedCover = null;
    container.classList.remove('sidebar-container--open');
    container.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Keyboard navigation: Escape key closes sidebar
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      close();
    }
  });

  renderSidebar();

  return {
    element: container,
    open,
    close,
    isOpen: () => isOpen,
  };
}
