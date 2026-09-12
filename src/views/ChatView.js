/**
 * View: Categorised Activity Chat Threads
 * Dedicated contextual discussions anchored to itinerary blocks, trip days, and categories.
 * Features:
 * 1. Main Categorised Threads Hub (filtered by Day: All/Day 1/Day 2/Day 3/Trip-wide, and Category: Food/Location/Hotel/Transit/General/Polls)
 * 2. Vector SVG iconography for all category pills, day pills, and badges (no emojis)
 * 3. Focused Thread Conversation view with back navigation, real-time message feed, and consensus polls
 * 4. Contextual discussion thread for Day 1 ("Day 1: Chew Jetty & Penang Hill") with Tony & Wei Gang banter
 * 5. WanderBot In-Thread Extraction Card with meal gap detection and instant insertion as proposed slot
 * 6. Standalone & remote simulation synchronization via remoteSync (BroadcastChannel)
 */

import {
  getChatThreads,
  getThreadById,
  addMessageToThread,
  voteInPoll,
  createChatThread,
  saveChatThreads,
  attachPollToThread,
  removePollFromThread,
  resetChatToGenesis,
  THREAD_CATEGORIES,
  getCategoryConfig,
  normalizeCategory,
  getCategoryIconSvg,
  getPollsIconSvg,
  getAllIconSvg,
  getDayCalendarIconSvg,
  getThreadDay,
} from '../models/chatData.js';
import { confirmProposedBlock } from '../models/itineraryData.js';
import { enableDragScroll } from '../utils/dragScroll.js';
import { getTripSettings } from '../models/tripSettings.js';
import { getActiveTrip, subscribeTrips } from '../models/tripsModel.js';
import {
  getItineraryData,
  addItineraryBlock,
  updateItineraryBlock,
} from '../models/itineraryData.js';
import { setActiveTab } from '../config/navigation.js';
import { remoteSync } from '../utils/remoteSync.js';

export function showDashToast(message, type = 'success') {
  const existing = document.querySelector('.dash-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `dash-toast dash-toast--${type} dash-toast--visible`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <span class="dash-toast__icon">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </span>
    <span class="dash-toast__msg">${escapeHtml(message)}</span>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('dash-toast--visible');
    toast.classList.add('dash-toast--exit');
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function createChatView(initialBlockId = null) {
  const container = document.createElement('div');
  container.className = 'feature-view chat-view';

  const pending = initialBlockId || sessionStorage.getItem('travel_pending_thread');
  if (pending) {
    sessionStorage.removeItem('travel_pending_thread');
  }

  let activeThreadId = pending || null;
  let hubFilter = 'all'; // 'all' | 'food' | 'location' | 'hotel' | 'transit' | 'general' | 'polls'
  let hubDayFilter = 'all'; // 'all' | 1 | 2 | 3 | 'trip'
  let isSimulatingBanter = false;

  function render() {
    container.innerHTML = '';

    if (activeThreadId) {
      container.classList.add('chat-view--in-conversation');
      renderThreadConversation(activeThreadId);
    } else {
      container.classList.remove('chat-view--in-conversation');
      renderThreadsHub();
    }
  }

  // ──────────────── 1. Main Threads Hub (Categorised View) ────────────────

  function renderThreadsHub() {
    const allThreads = getChatThreads();

    const tripSettings = getTripSettings();
    const activeTrip = getActiveTrip();
    const tripCity = (activeTrip?.destination || tripSettings.destination || 'Penang').split(',')[0].trim();
    const totalTripDays = Math.max(1, tripSettings.totalDays || 3);

    // Compute dynamic day counts
    const dayCounts = {
      all: allThreads.length,
      trip: allThreads.filter((t) => getThreadDay(t) === null).length,
    };
    for (let d = 1; d <= totalTripDays; d++) {
      dayCounts[d] = allThreads.filter((t) => getThreadDay(t) === d).length;
    }

    // Filter threads by currently selected day
    let dayScopedThreads = allThreads;
    if (hubDayFilter !== 'all') {
      if (hubDayFilter === 'trip') {
        dayScopedThreads = allThreads.filter((t) => getThreadDay(t) === null);
      } else {
        const targetDay = parseInt(hubDayFilter, 10);
        dayScopedThreads = allThreads.filter((t) => getThreadDay(t) === targetDay);
      }
    }

    // Compute category counts on day-scoped threads
    const counts = {
      all: dayScopedThreads.length,
      food: dayScopedThreads.filter((t) => normalizeCategory(t.category) === 'food').length,
      location: dayScopedThreads.filter((t) => normalizeCategory(t.category) === 'location').length,
      hotel: dayScopedThreads.filter((t) => normalizeCategory(t.category) === 'hotel').length,
      transit: dayScopedThreads.filter((t) => normalizeCategory(t.category) === 'transit').length,
      general: dayScopedThreads.filter((t) => normalizeCategory(t.category) === 'general').length,
      polls: dayScopedThreads.filter((t) => Boolean(t.poll)).length,
    };

    // Sticky Atmospheric Banner
    const bannerWrapper = document.createElement('div');
    bannerWrapper.innerHTML = `
      <div class="view-banner" style="background-image: url('./src/assets/bg-chat.png');">
        <button type="button" class="view-banner__menu-btn" id="btn-open-sidebar" aria-label="Open Trip Menu" title="Open Menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div class="view-banner__scrim">
          <span class="view-banner__badge"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> ${tripCity} Discussions</span>
          <h2 class="view-banner__title">Activity Chat</h2>
        </div>
      </div>
    `;
    container.appendChild(bannerWrapper.firstElementChild);

    // Main Threads Hub Content
    const hubElem = document.createElement('div');
    hubElem.className = 'threads-hub';

    hubElem.innerHTML = `
      <div class="view-header">
        <div class="view-header__top-row" style="display: flex; justify-content: flex-end; align-items: center; gap: var(--space-2); margin-bottom: var(--space-1);">
          <button type="button" class="btn btn--primary btn--sm" id="btn-open-new-thread" style="flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; border-radius: var(--radius-pill); padding: 7px 14px; font-weight: var(--font-semibold); min-height: 36px;" aria-label="Start new discussion thread">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>New Thread</span>
          </button>
        </div>

        <!-- Days Filter Chips Bar -->
        <div class="thread-day-filter-bar" role="tablist" aria-label="Filter threads by day">
          <button type="button" role="tab" aria-selected="${hubDayFilter === 'all'}" class="day-filter-chip ${hubDayFilter === 'all' ? 'day-filter-chip--active' : ''}" data-day-filter="all">
            ${getDayCalendarIconSvg(13)}
            <span>All Days</span>
            <span class="day-filter-chip__count">(${dayCounts.all})</span>
          </button>
          ${Array.from({ length: totalTripDays }, (_, i) => i + 1)
            .map((dayNum) => {
              const isActive = hubDayFilter === dayNum || hubDayFilter === String(dayNum);
              return `
                <button type="button" role="tab" aria-selected="${isActive}" class="day-filter-chip ${isActive ? 'day-filter-chip--active' : ''}" data-day-filter="${dayNum}">
                  <span>Day ${dayNum}</span>
                  <span class="day-filter-chip__count">(${dayCounts[dayNum] || 0})</span>
                </button>
              `;
            })
            .join('')}
          <button type="button" role="tab" aria-selected="${hubDayFilter === 'trip'}" class="day-filter-chip ${hubDayFilter === 'trip' ? 'day-filter-chip--active' : ''}" data-day-filter="trip">
            <span>Trip-Wide</span>
            <span class="day-filter-chip__count">(${dayCounts.trip})</span>
          </button>
        </div>

        <!-- Category Filter Chips Bar -->
        <div class="category-filter-bar" role="tablist" aria-label="Filter threads by category">
          <button type="button" role="tab" aria-selected="${hubFilter === 'all'}" class="filter-chip ${hubFilter === 'all' ? 'filter-chip--active' : ''}" data-filter="all">
            ${getAllIconSvg(14)}
            <span>All</span>
            <span class="filter-chip__count">(${counts.all})</span>
          </button>
          <button type="button" role="tab" aria-selected="${hubFilter === 'food'}" class="filter-chip ${hubFilter === 'food' ? 'filter-chip--active' : ''}" data-filter="food">
            ${getCategoryIconSvg('food', 14)}
            <span>Food</span>
            <span class="filter-chip__count">(${counts.food})</span>
          </button>
          <button type="button" role="tab" aria-selected="${hubFilter === 'location'}" class="filter-chip ${hubFilter === 'location' ? 'filter-chip--active' : ''}" data-filter="location">
            ${getCategoryIconSvg('location', 14)}
            <span>Location</span>
            <span class="filter-chip__count">(${counts.location})</span>
          </button>
          <button type="button" role="tab" aria-selected="${hubFilter === 'hotel'}" class="filter-chip ${hubFilter === 'hotel' ? 'filter-chip--active' : ''}" data-filter="hotel">
            ${getCategoryIconSvg('hotel', 14)}
            <span>Hotel</span>
            <span class="filter-chip__count">(${counts.hotel})</span>
          </button>
          <button type="button" role="tab" aria-selected="${hubFilter === 'transit'}" class="filter-chip ${hubFilter === 'transit' ? 'filter-chip--active' : ''}" data-filter="transit">
            ${getCategoryIconSvg('transit', 14)}
            <span>Transit</span>
            <span class="filter-chip__count">(${counts.transit})</span>
          </button>
          <button type="button" role="tab" aria-selected="${hubFilter === 'general'}" class="filter-chip ${hubFilter === 'general' ? 'filter-chip--active' : ''}" data-filter="general">
            ${getCategoryIconSvg('general', 14)}
            <span>General</span>
            <span class="filter-chip__count">(${counts.general})</span>
          </button>
          <button type="button" role="tab" aria-selected="${hubFilter === 'polls'}" class="filter-chip ${hubFilter === 'polls' ? 'filter-chip--active' : ''}" data-filter="polls">
            ${getPollsIconSvg(14)}
            <span>Polls</span>
            <span class="filter-chip__count">(${counts.polls})</span>
          </button>
        </div>
      </div>

      <!-- Categorised Content Sections Container -->
      <div class="threads-categories-container">
        ${renderCategorisedSectionsHTML(dayScopedThreads, hubFilter)}
      </div>
    `;

    // Enable drag scroll
    enableDragScroll(hubElem.querySelector('.thread-day-filter-bar'));
    enableDragScroll(hubElem.querySelector('.category-filter-bar'));

    // Day filter handlers
    hubElem.querySelectorAll('.day-filter-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        const d = btn.getAttribute('data-day-filter');
        hubDayFilter = d === 'all' || d === 'trip' ? d : parseInt(d, 10);
        render();
      });
    });

    // Category filter handlers
    hubElem.querySelectorAll('.filter-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        hubFilter = btn.getAttribute('data-filter');
        render();
      });
    });

    // Reset button
    const resetBtn = hubElem.querySelector('#btn-reset-filter');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        hubFilter = 'all';
        hubDayFilter = 'all';
        render();
      });
    }

    // Card click handlers
    hubElem.querySelectorAll('.thread-item-card').forEach((card) => {
      const openThread = () => {
        activeThreadId = card.getAttribute('data-thread-id');
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };

      card.addEventListener('click', openThread);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openThread();
        }
      });
    });

    // New Thread button modal
    const newThreadBtn = hubElem.querySelector('#btn-open-new-thread');
    if (newThreadBtn) {
      newThreadBtn.addEventListener('click', () => {
        openNewThreadModal();
      });
    }

    // Category empty state button
    hubElem.querySelectorAll('.btn-create-in-cat').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cat = btn.getAttribute('data-category') || 'general';
        openNewThreadModal(cat);
      });
    });

    container.appendChild(hubElem);
  }

  function renderCategorisedSectionsHTML(scopedThreads, filter) {
    if (scopedThreads.length === 0 && filter === 'all') {
      const dayText = hubDayFilter === 'all' ? '' : (hubDayFilter === 'trip' ? 'Trip-Wide ' : `Day ${hubDayFilter} `);
      return renderEmptyState(`No ${dayText}discussions match your active filter.`);
    }

    if (filter === 'polls') {
      const pollThreads = scopedThreads.filter((t) => Boolean(t.poll));
      if (pollThreads.length === 0) {
        return renderEmptyState('No threads currently have active consensus polls in this view.');
      }
      return `
        <section class="thread-category-group" data-category="polls">
          <div class="thread-category-header">
            <div class="thread-category-header__left">
              <div class="thread-category-header__icon thread-category-header__icon--polls">
                ${getPollsIconSvg(16)}
              </div>
              <h2 class="thread-category-header__name">Active Consensus Polls</h2>
            </div>
            <span class="thread-category-header__count">${pollThreads.length} ${pollThreads.length === 1 ? 'poll' : 'polls'}</span>
          </div>
          <div class="threads-list">
            ${pollThreads.map(renderThreadCardHTML).join('')}
          </div>
        </section>
      `;
    }

    const categoriesToRender = filter === 'all'
      ? THREAD_CATEGORIES
      : THREAD_CATEGORIES.filter((c) => c.id === filter);

    let renderedAny = false;
    let html = '';

    categoriesToRender.forEach((cat) => {
      const catThreads = scopedThreads.filter((t) => normalizeCategory(t.category) === cat.id);
      if (catThreads.length === 0 && filter === 'all') {
        return;
      }

      renderedAny = true;
      html += `
        <section class="thread-category-group" data-category="${cat.id}">
          <div class="thread-category-header">
            <div class="thread-category-header__left">
              <div class="thread-category-header__icon thread-category-header__icon--${cat.id}">
                ${cat.iconSvg}
              </div>
              <h2 class="thread-category-header__name">${cat.name}</h2>
            </div>
            <span class="thread-category-header__count">${catThreads.length} ${catThreads.length === 1 ? 'thread' : 'threads'}</span>
          </div>

          <div class="threads-list">
            ${
              catThreads.length > 0
                ? catThreads.map(renderThreadCardHTML).join('')
                : `<div class="thread-empty-category">
                    <p>No discussions in ${cat.label} yet.</p>
                    <button type="button" class="btn btn--secondary btn--sm btn-create-in-cat" data-category="${cat.id}">+ Start ${cat.label} Thread</button>
                   </div>`
            }
          </div>
        </section>
      `;
    });

    if (!renderedAny) {
      return renderEmptyState(`No discussions found in this category.`);
    }

    return html;
  }

  function renderEmptyState(message) {
    return `
      <div class="threads-empty-state" style="text-align: center; padding: 40px 20px; background: var(--color-surface); border-radius: var(--radius-xl); border: 1px solid var(--color-border); margin: var(--space-3) 0;">
        <div style="width: 48px; height: 48px; margin: 0 auto var(--space-2); border-radius: 50%; background: var(--color-surface-alt); display: flex; align-items: center; justify-content: center; color: var(--color-text-secondary);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
        </div>
        <p style="font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-3);">${message}</p>
        <button type="button" class="btn btn--secondary btn--sm" id="btn-reset-filter">Reset Filters</button>
      </div>
    `;
  }

  function formatShortLocation(loc) {
    if (!loc) return '';
    let part = loc.split(',')[0].trim();
    const parenMatch = part.match(/\(([^)]+)\)/);
    if (parenMatch) return parenMatch[1].trim();
    return part;
  }

  function renderThreadCardHTML(t) {
    const lastMsg = t.messages.length > 0 ? t.messages[t.messages.length - 1] : null;
    const normCat = normalizeCategory(t.category);
    const day = getThreadDay(t);
    const dayLabel = day ? `Day ${day}` : 'Trip-Wide';

    return `
      <div class="thread-item-card" data-thread-id="${t.blockId}" role="button" tabindex="0" aria-label="Open discussion: ${escapeHtml(t.title)}">
        <div class="thread-item-card__icon thread-item-card__icon--${normCat}" aria-hidden="true">
          ${getCategoryIconSvg(normCat, 18)}
        </div>
        <div class="thread-item-card__content">
          <div class="thread-item-card__top">
            <h3 class="thread-item-card__title">${escapeHtml(t.title)}</h3>
            <span class="thread-item-card__time">${lastMsg ? lastMsg.time : ''}</span>
          </div>
          <p class="thread-item-card__snippet">
            ${lastMsg ? `<strong>${escapeHtml(lastMsg.sender.split(' ')[0])}:</strong> ${escapeHtml(lastMsg.text)}` : 'No messages yet. Tap to start discussion.'}
          </p>
          <div class="thread-item-card__footer">
            <span class="thread-day-pill">
              ${getDayCalendarIconSvg(10)}
              <span>${dayLabel}</span>
            </span>
            ${
              t.poll
                ? `
              <span class="thread-item-card__badge thread-item-card__badge--poll" title="Group Decision Poll Active" aria-label="Group Decision Poll Active">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
              </span>`
                : ''
            }
          </div>
        </div>
        <div class="thread-item-card__arrow" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </div>
      </div>
    `;
  }

  function renderFeedMessages(messages, isInserted) {
    let lastDate = null;
    let html = '';

    messages.forEach((m) => {
      let msgDate = m.date;
      if (!msgDate) {
        if (m.time && m.time.startsWith('Yesterday')) {
          msgDate = 'Yesterday';
        } else if (m.time && m.time.startsWith('Today')) {
          msgDate = 'Today';
        } else {
          msgDate = 'Yesterday';
        }
      }

      if (msgDate !== lastDate) {
        lastDate = msgDate;
        html += `
          <div class="chat-date-separator">
            <span>${escapeHtml(msgDate)}</span>
          </div>
        `;
      }

      if (m.isAi || m.type === 'ai_proposal') {
        const proposal = m.proposal || {
          title: 'Penang Road Famous Teochew Chendul & Asam Laksa',
          tag: 'Michelin Bib Gourmand',
          distance: '8 min Grab / walk from Chew Jetty',
          price: 'RM 12 / pax',
          slotId: 'd1-chendul',
        };

        html += `
          <div class="chat-message chat-message--incoming chat-message--ai" id="wanderbot-proposal-wrapper">
            <div class="user-avatar-initials user-avatar--ai" title="WanderBot AI">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>
                <rect x="4" y="8" width="16" height="12" rx="4"/>
                <circle cx="9" cy="13" r="1"/>
                <circle cx="15" cy="13" r="1"/>
                <line x1="9" y1="17" x2="15" y2="17"/>
              </svg>
            </div>
            <div class="chat-message__bubble chat-message__bubble--ai">
              <div class="chat-message__sender">
                <span class="chat-message__sender-name">${escapeHtml(m.sender || 'WanderBot')}</span>
                <span class="chat-message__sender-role">AI Assistant</span>
              </div>
              <div class="chat-message__text">
                <p style="margin: 0 0 8px 0;">
                  ${escapeHtml(m.text || "I noticed a 4-hour open window between Chew Jetty and Penang Hill at 12:30 PM. Here's a top-rated lunch suggestion:")}
                </p>
                <div class="ai-venue-card">
                  <div class="ai-venue-card__header">
                    <strong class="ai-venue-card__title">${escapeHtml(proposal.title)}</strong>
                    <span class="ai-venue-card__tag">${escapeHtml(proposal.tag)}</span>
                  </div>
                  <div class="ai-venue-card__meta">
                    <span class="ai-venue-card__meta-item">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                      <span>${escapeHtml(proposal.distance)}</span>
                    </span>
                    <span class="ai-venue-card__meta-item">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                      <span>${escapeHtml(proposal.price)}</span>
                    </span>
                  </div>
                </div>
              </div>
              <div class="chat-message__actions">
                <button id="btn-insert-proposal" class="btn btn--sm btn--primary ${isInserted ? 'btn-insert-proposal--inserted' : ''}" type="button">
                  ${isInserted ? '✓ Inserted as Proposed Slot' : '+ Insert as Proposed Slot'}
                </button>
                ${
                  isInserted
                    ? `
                  <button id="btn-jump-itinerary" class="btn-jump-itinerary" type="button">
                    <span>View in Day 1 Itinerary</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                  </button>
                `
                    : ''
                }
              </div>
              <span class="chat-message__time">${escapeHtml(m.time || `${msgDate}, 12:30 PM • AI Suggestion`)}</span>
            </div>
          </div>
        `;
      } else {
        html += `
          <div class="chat-message ${m.isCurrentUser ? 'chat-message--outgoing' : 'chat-message--incoming'}">
            ${!m.isCurrentUser ? `<div class="user-avatar-initials">${escapeHtml(m.avatar || m.sender.slice(0, 2).toUpperCase())}</div>` : ''}
            <div class="chat-message__bubble">
              ${!m.isCurrentUser ? `<div class="chat-message__sender">${escapeHtml(m.sender)}</div>` : ''}
              <p class="chat-message__text">${escapeHtml(m.text)}</p>
              <span class="chat-message__time">${escapeHtml(m.time)}</span>
            </div>
          </div>
        `;
      }
    });

    return html;
  }

  // ──────────────── 2. Focused Thread Conversation View ────────────────

  function renderThreadConversation(blockId) {
    const thread = getThreadById(blockId) || {
      blockId,
      title: 'Activity Discussion',
      eventTitle: 'Itinerary Stop',
      category: 'location',
      location: 'George Town, Penang',
      participantCount: 3,
      poll: null,
      messages: [],
    };

    const normCat = normalizeCategory(thread.category);
    const day = getThreadDay(thread);
    const dayLabel = day ? `Day ${day}` : 'Trip-Wide';
    const rawTitle = thread.eventTitle || thread.title || '';
    const hasDayInTitle = /^Day\s*\d+/i.test(rawTitle);
    const showDayPill = !hasDayInTitle && !!day;

    const activeTrip = getActiveTrip();
    const tripMembers = (activeTrip && activeTrip.members && activeTrip.members.length > 0)
      ? activeTrip.members
      : ['Clarence', 'Tony', 'Wei Gang'];
    const totalTripTravelers = tripMembers.length;

    const isDay1Penang = blockId === 'day-1-penang' || (day === 1 && thread.title.toLowerCase().includes('chew jetty'));
    const isInserted = getItineraryData().some((b) => b.id === 'd1-chendul');

    const convElem = document.createElement('div');
    convElem.className = 'thread-conversation';

    convElem.innerHTML = `
      <!-- Back Navigation & Thread Info Header -->
      <div class="thread-conv-header">
        <button type="button" class="btn-back-threads" id="btn-back-to-threads" aria-label="Back to all threads">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
          <span>Threads</span>
        </button>
        <div class="thread-conv-header__info">
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <h2 class="thread-conv-header__title" style="margin: 0; font-size: var(--text-base);">${escapeHtml(rawTitle)}</h2>
            ${showDayPill ? `<span class="thread-day-pill">${getDayCalendarIconSvg(10)} <span>${dayLabel}</span></span>` : ''}
          </div>
          <span class="thread-conv-header__meta">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <span>${escapeHtml(thread.location || 'George Town, Penang')}</span>
          </span>
        </div>
      </div>

      <!-- Attached Consensus Mini-Poll (if thread has an active poll) -->
      ${renderPollHTML(thread.poll)}

      <!-- Message History Feed -->
      <div class="chat-feed thread-feed" id="thread-chat-feed">
        ${
          thread.messages.length === 0
            ? `<div class="thread-feed-empty" style="text-align: center; padding: 40px 16px; color: var(--color-text-secondary);">
                <p style="font-size: var(--text-sm);">No messages yet in this discussion.</p>
                <p style="font-size: var(--text-xs); margin-top: 4px;">Share questions, recommendations, or logistics with the group below!</p>
               </div>`
            : renderFeedMessages(thread.messages, isInserted)
        }
      </div>

      <!-- Quick Context-Aware Action Prompts -->
      <div class="chat-quick-actions">
        <button type="button" class="btn-quick-reply" data-reply="Sounds great to me!">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
          <span>Sounds great!</span>
        </button>
        <button type="button" class="btn-quick-reply" data-reply="What time are we meeting there?">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          <span>What time?</span>
        </button>
        <button type="button" class="btn-quick-reply" data-reply="Do we need advance reservations for this?">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span>Need reservations?</span>
        </button>
        <button type="button" class="btn-quick-reply" data-reply="How are we getting there? Grab or walking?">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="10" r="3"></circle><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"></path></svg>
          <span>How to get there?</span>
        </button>
        <button type="button" class="btn-quick-reply" data-reply="Let's take a group vote on this.">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
          <span>Vote on this</span>
        </button>
      </div>

      <!-- Message Compose Input Bar -->
      <form class="chat-input-bar" id="form-thread-compose">
        <input 
          type="text" 
          id="input-thread-message" 
          class="chat-input" 
          placeholder="Message ${escapeHtml(thread.title)}..." 
          autocomplete="off"
          required
        />
        <button type="submit" class="chat-send-btn btn-chat-send" aria-label="Send Message">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </form>
    `;

    // Back button
    convElem.querySelector('#btn-back-to-threads').addEventListener('click', () => {
      activeThreadId = null;
      render();
    });

    // (Replay Banter removed from webapp; managed via /remote)

    // Enable horizontal drag & wheel scrolling on Quick Reply pills
    const quickActions = convElem.querySelector('.chat-quick-actions');
    if (quickActions) {
      enableDragScroll(quickActions);
    }

    // Quick Reply buttons
    convElem.querySelectorAll('.btn-quick-reply').forEach((btn) => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-reply');
        if (text) {
          if (text.includes('Vote on this') || text.includes('group vote')) {
            runConsensusVoteSequence(blockId);
          } else {
            addMessageToThread(blockId, text);
            render();
            scrollToBottom();
          }
        }
      });
    });

    // Compose Form submit
    const composeForm = convElem.querySelector('#form-thread-compose');
    composeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = convElem.querySelector('#input-thread-message');
      const text = input.value.trim();
      if (!text) return;

      addMessageToThread(blockId, text);
      input.value = '';
      render();
      scrollToBottom();
    });

    // Handle Poll Voting buttons if poll exists
    if (thread.poll) {
      convElem.querySelectorAll('.poll-option-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const optionId = btn.getAttribute('data-option-id');
          voteInPoll(blockId, optionId);
          render();
        });
      });

      const closePollBtn = convElem.querySelector('.btn-close-poll');
      if (closePollBtn) {
        closePollBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          removePollFromThread(blockId);
          render();
        });
      }
    }

    // WanderBot Insert Proposal button handler
    const insertBtn = convElem.querySelector('#btn-insert-proposal');
    if (insertBtn) {
      insertBtn.addEventListener('click', () => {
        insertProposedSlot();
      });
    }

    // Jump to Itinerary button handler
    const jumpBtn = convElem.querySelector('#btn-jump-itinerary');
    if (jumpBtn) {
      jumpBtn.addEventListener('click', () => {
        window.location.hash = '#itinerary';
        setActiveTab('itinerary');
      });
    }

    container.appendChild(convElem);
    scrollToBottom();
  }

  // ──────────────── Insertion Handler for Proposed Slot ────────────────

  function insertProposedSlot(broadcast = true) {
    const list = getItineraryData();
    const existing = list.find((b) => b.id === 'd1-chendul');

    if (!existing) {
      addItineraryBlock({
        id: 'd1-chendul',
        day: 1,
        startTime: '12:30',
        endTime: '13:30',
        title: 'Penang Road Famous Teochew Chendul & Asam Laksa',
        location: '492, Lebuh Keng Kwee, George Town',
        category: 'food',
        cost: 'RM 12 / pax',
        status: 'proposed',
        notes: 'Iconic shaved ice dessert with pandan jelly, coconut milk, and gula melaka. Michelin Bib Gourmand selected.',
        grabTime: '8 min Grab from Chew Jetty',
        transitToNextMinutes: 25,
        transitMode: 'Transit (25 min) to Penang Hill',
        requirements: [],
      });
    }

    // Attach consensus poll directly to day-1-penang thread
    attachPollToThread('day-1-penang', {
      id: 'poll-chendul',
      question: 'Lock Penang Road Famous Teochew Chendul into Day 1 schedule?',
      status: 'active',
      userVote: null,
      options: [
        { id: 'opt-yes', label: 'Yes, lock into schedule', votes: 0 },
        { id: 'opt-no', label: 'Explore other options', votes: 0 },
      ],
    });

    if (broadcast) {
      remoteSync.broadcast('INSERT_PROPOSAL', {
        blockId: 'd1-chendul',
        day: 1,
        time: '12:30 PM',
        title: 'Penang Road Famous Teochew Chendul & Asam Laksa',
        status: 'proposed',
      });
    }

    window.dispatchEvent(
      new CustomEvent('wandersync:proposal_inserted', {
        detail: { blockId: 'd1-chendul', status: 'proposed' },
      })
    );

    render();
  }

  // ──────────────── Banter Simulation Sequence ────────────────

  function executeBanterSimulation() {
    if (isSimulatingBanter) return;
    isSimulatingBanter = true;

    const feed = container.querySelector('#thread-chat-feed');
    if (!feed) {
      isSimulatingBanter = false;
      return;
    }

    // Reset thread to just Clarence intro message to prevent duplicates
    const threads = getChatThreads();
    const d1Thread = threads.find((t) => t.blockId === 'day-1-penang');
    if (d1Thread) {
      d1Thread.messages = [
        {
          id: 'msg-d1-intro',
          sender: 'Clarence (You)',
          avatar: 'CL',
          text: 'Starting our morning at Chew Jetty! Plan is to explore the clan jetties before heading up to Penang Hill later in the afternoon.',
          date: 'Today',
          time: 'Today, 09:15 AM',
          isCurrentUser: true,
        },
      ];
      saveChatThreads(threads);
      render();
    }

    const currentFeed = container.querySelector('#thread-chat-feed');
    const existingProposal = container.querySelector('#wanderbot-proposal-wrapper');
    if (existingProposal) existingProposal.style.display = 'none';

    // Step 1: Tony typing indicator (1800ms natural delay)
    const tonyTyping = document.createElement('div');
    tonyTyping.className = 'chat-typing-bubble';
    tonyTyping.innerHTML = `
      <span style="font-size: 11px; font-weight: 600; color: #475569; margin-right: 4px;">Tony typing</span>
      <span class="chat-typing-dot"></span>
      <span class="chat-typing-dot"></span>
      <span class="chat-typing-dot"></span>
    `;
    currentFeed.appendChild(tonyTyping);
    scrollToBottom();

    setTimeout(() => {
      tonyTyping.remove();
      // Append Tony message with proper avatar & non-current-user flag
      addMessageToThread('day-1-penang', {
        text: 'Guys, what are we eating after Chew Jetty? Anyone craving Char Koay Teow or Chendul?',
        sender: 'Tony',
        avatar: 'TN',
        isCurrentUser: false,
      });
      render();

      const feed2 = container.querySelector('#thread-chat-feed');
      const prop2 = container.querySelector('#wanderbot-proposal-wrapper');
      if (prop2) prop2.style.display = 'none';

      // Step 2: Wei Gang typing indicator (2000ms delay)
      const wgTyping = document.createElement('div');
      wgTyping.className = 'chat-typing-bubble';
      wgTyping.innerHTML = `
        <span style="font-size: 11px; font-weight: 600; color: #475569; margin-right: 4px;">Wei Gang typing</span>
        <span class="chat-typing-dot"></span>
        <span class="chat-typing-dot"></span>
        <span class="chat-typing-dot"></span>
      `;
      feed2.appendChild(wgTyping);
      scrollToBottom();

      setTimeout(() => {
        wgTyping.remove();
        const currentThread2 = getThreadById('day-1-penang');
        if (!currentThread2?.messages?.some(m => m.text && m.text.includes('Lebuh Keng Kwee'))) {
          addMessageToThread('day-1-penang', {
            text: 'Lebuh Keng Kwee Famous Teochew Chendul is a must-try.',
            sender: 'Wei Gang',
            avatar: 'WG',
            isCurrentUser: false,
          });
        }
        render();

        const feed3 = container.querySelector('#thread-chat-feed');
        const prop3 = container.querySelector('#wanderbot-proposal-wrapper');
        if (prop3) prop3.style.display = 'none';

        // Step 3: WanderBot analyzing indicator (2200ms delay)
        const botTyping = document.createElement('div');
        botTyping.className = 'chat-typing-bubble';
        botTyping.style.background = 'rgba(254, 243, 199, 0.9)';
        botTyping.style.borderColor = 'rgba(245, 158, 11, 0.5)';
        botTyping.innerHTML = `
          <span style="font-size: 11px; font-weight: 700; color: #92400E; margin-right: 4px;">🤖 WanderBot analyzing meal gap</span>
          <span class="chat-typing-dot"></span>
          <span class="chat-typing-dot"></span>
          <span class="chat-typing-dot"></span>
        `;
        feed3.appendChild(botTyping);
        scrollToBottom();

        setTimeout(() => {
          botTyping.remove();
          const currentThread3 = getThreadById('day-1-penang');
          if (!currentThread3?.messages?.some(m => m.text && m.text.includes('open window between Chew Jetty'))) {
            addMessageToThread('day-1-penang', {
              sender: 'WanderBot',
              avatar: 'WB',
              isAi: true,
              isCurrentUser: false,
              type: 'ai_proposal',
              text: "I noticed a 4-hour open window between Chew Jetty and Penang Hill at 12:30 PM. Here's a top-rated lunch suggestion:",
              proposal: {
                title: 'Penang Road Famous Teochew Chendul & Asam Laksa',
                tag: 'Michelin Bib Gourmand',
                distance: '8 min Grab / walk from Chew Jetty',
                price: 'RM 12 / pax',
                slotId: 'd1-chendul',
              },
            });
          }
          render();
          scrollToBottom();
          isSimulatingBanter = false;
          remoteSync.broadcast('CHAT_BANTER_COMPLETE', { success: true });
        }, 2200);
      }, 2000);
    }, 1800);
  }

  // ──────────────── Consensus Voting Simulation (Chat Poll) ────────────────

  function runConsensusVoteSequence(blockId = 'd1-chendul') {
    let thread = getThreadById('day-1-penang');
    if (!thread) return;

    if (!thread.poll) {
      attachPollToThread('day-1-penang', {
        id: 'poll-chendul',
        question: 'Lock Penang Road Famous Teochew Chendul into Day 1 schedule?',
        status: 'active',
        userVote: null,
        options: [
          { id: 'opt-yes', label: 'Yes, lock into schedule', votes: 0 },
          { id: 'opt-no', label: 'Explore other options', votes: 0 },
        ],
      });
    }

    render();
    scrollToBottom();

    // Step 1: Wei Gang votes YES (50% progress)
    setTimeout(() => {
      const t1 = getThreadById('day-1-penang');
      if (t1 && t1.poll && t1.poll.options) {
        t1.poll.options[0].votes = 1;
        saveChatThreads(getChatThreads());
        render();
        scrollToBottom();
      }

      // Step 2: Tony votes YES (100% consensus reached!)
      setTimeout(() => {
        const t2 = getThreadById('day-1-penang');
        if (t2 && t2.poll && t2.poll.options) {
          t2.poll.options[0].votes = 2;
          t2.poll.status = 'closed';
          saveChatThreads(getChatThreads());

          // Confirm the block in the itinerary
          confirmProposedBlock('d1-chendul');
          confirmProposedBlock('penang-chendul-gap');

          window.dispatchEvent(
            new CustomEvent('wandersync:vote_confirmed', {
              detail: { blockId: 'd1-chendul' },
            })
          );

          render();
          scrollToBottom();

          remoteSync.broadcast('VOTE_CONSENSUS_COMPLETE', {
            blockId: 'd1-chendul',
            status: 'confirmed',
          });
        }
      }, 1600);
    }, 1200);
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      const feed = container.querySelector('#thread-chat-feed');
      if (feed) {
        feed.scrollTop = feed.scrollHeight;
      }
    });
    setTimeout(() => {
      const feed = container.querySelector('#thread-chat-feed');
      if (feed) {
        feed.scrollTop = feed.scrollHeight;
      }
    }, 50);
  }

  function openNewThreadModal(defaultCategory = 'general') {
    const backdrop = document.createElement('div');
    backdrop.className = 'new-thread-backdrop';

    backdrop.innerHTML = `
      <div class="new-thread-sheet" role="dialog" aria-labelledby="modal-new-thread-title">
        <div class="new-thread-sheet__header">
          <div>
            <span class="view-badge">New Discussion</span>
            <h2 id="modal-new-thread-title" style="margin: 4px 0 0; font-size: var(--text-base); font-weight: var(--font-bold); color: var(--color-text-primary);">
              Start Topic Thread
            </h2>
          </div>
          <button type="button" class="drawer-close-btn" id="btn-close-new-thread" aria-label="Close modal" style="min-width: 44px; min-height: 44px;">✕</button>
        </div>

        <form id="form-new-thread">
          <!-- Category Selector -->
          <div class="form-group">
            <label class="form-label" style="display: block; font-size: var(--text-xs); font-weight: var(--font-bold); color: var(--color-text-secondary); margin-bottom: 6px;">
              Select Category
            </label>
            <div class="new-thread-category-chips">
              ${THREAD_CATEGORIES.map(
                (c) => `
                <button 
                  type="button" 
                  class="new-thread-cat-chip ${c.id === defaultCategory ? 'new-thread-cat-chip--active' : ''} new-thread-cat-chip--${c.id}" 
                  data-cat="${c.id}"
                >
                  <span class="new-thread-cat-chip__icon">${c.iconSvg}</span>
                  <span>${c.label}</span>
                </button>
              `
              ).join('')}
            </div>
            <input type="hidden" id="input-thread-category" value="${defaultCategory}" />
          </div>

          <!-- Trip Day Schedule -->
          <div class="form-group" style="margin-top: var(--space-3);">
            <label class="form-label" style="display: block; font-size: var(--text-xs); font-weight: var(--font-bold); color: var(--color-text-secondary); margin-bottom: 6px;">
              Trip Day Schedule
            </label>
            <div class="new-thread-day-chips" id="modal-day-selector-group">
              <button type="button" class="new-thread-day-chip ${hubDayFilter === 'all' || hubDayFilter === 'trip' ? 'new-thread-day-chip--active' : ''}" data-day="all">Trip-Wide / All</button>
              ${Array.from({ length: getTripSettings().totalDays || 3 }, (_, i) => i + 1)
                .map((dayNum) => {
                  const isActive = hubDayFilter === dayNum || hubDayFilter === String(dayNum);
                  return `<button type="button" class="new-thread-day-chip ${isActive ? 'new-thread-day-chip--active' : ''}" data-day="${dayNum}">Day ${dayNum}</button>`;
                })
                .join('')}
            </div>
            <input type="hidden" id="input-thread-day" value="${hubDayFilter !== 'all' ? hubDayFilter : 'all'}" />
          </div>

          <!-- Topic / Title -->
          <div class="form-group" style="margin-top: var(--space-3);">
            <label for="input-thread-title" class="form-label" style="display: block; font-size: var(--text-xs); font-weight: var(--font-bold); color: var(--color-text-secondary); margin-bottom: 4px;">
              Topic / Place Name <span style="color: var(--color-primary);">*</span>
            </label>
            <input 
              type="text" 
              id="input-thread-title" 
              class="form-input" 
              placeholder="e.g. Lunch at Gurney Drive Hawker Centre" 
              required
              style="width: 100%; padding: 10px 14px; border-radius: var(--radius-lg); border: 1px solid var(--color-border); font-size: var(--text-sm); background: var(--color-surface-alt);"
            />
          </div>

          <!-- Location -->
          <div class="form-group" style="margin-top: var(--space-3);">
            <label for="input-thread-location" class="form-label" style="display: block; font-size: var(--text-xs); font-weight: var(--font-bold); color: var(--color-text-secondary); margin-bottom: 4px;">
              Location / Area
            </label>
            <input 
              type="text" 
              id="input-thread-location" 
              class="form-input" 
              placeholder="e.g. George Town, Penang" 
              style="width: 100%; padding: 10px 14px; border-radius: var(--radius-lg); border: 1px solid var(--color-border); font-size: var(--text-sm); background: var(--color-surface-alt);"
            />
          </div>

          <!-- Initial Message -->
          <div class="form-group" style="margin-top: var(--space-3);">
            <label for="input-thread-msg" class="form-label" style="display: block; font-size: var(--text-xs); font-weight: var(--font-bold); color: var(--color-text-secondary); margin-bottom: 4px;">
              Initial Message <span style="color: var(--color-primary);">*</span>
            </label>
            <textarea 
              id="input-thread-msg" 
              class="form-textarea" 
              rows="3" 
              placeholder="What would you like to discuss with the travel group?" 
              required
              style="width: 100%; padding: 10px 14px; border-radius: var(--radius-lg); border: 1px solid var(--color-border); font-size: var(--text-sm); background: var(--color-surface-alt); font-family: inherit; resize: none;"
            ></textarea>
          </div>

          <div style="margin-top: var(--space-4); display: flex; gap: var(--space-2);">
            <button type="button" class="btn btn--secondary" id="btn-cancel-new-thread" style="flex: 1;">Cancel</button>
            <button type="submit" class="btn btn--primary" id="btn-submit-new-thread" style="flex: 2;">Create & Open Thread</button>
          </div>
        </form>
      </div>
    `;

    const catInput = backdrop.querySelector('#input-thread-category');
    backdrop.querySelectorAll('.new-thread-cat-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        backdrop.querySelectorAll('.new-thread-cat-chip').forEach((c) => c.classList.remove('new-thread-cat-chip--active'));
        chip.classList.add('new-thread-cat-chip--active');
        catInput.value = chip.getAttribute('data-cat');
      });
    });

    const dayInput = backdrop.querySelector('#input-thread-day');
    backdrop.querySelectorAll('#modal-day-selector-group .new-thread-day-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        backdrop.querySelectorAll('#modal-day-selector-group .new-thread-day-chip').forEach((c) => c.classList.remove('new-thread-day-chip--active'));
        chip.classList.add('new-thread-day-chip--active');
        dayInput.value = chip.getAttribute('data-day');
      });
    });

    const closeModal = () => backdrop.remove();

    backdrop.querySelector('#btn-close-new-thread').addEventListener('click', closeModal);
    backdrop.querySelector('#btn-cancel-new-thread').addEventListener('click', closeModal);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });

    const form = backdrop.querySelector('#form-new-thread');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = backdrop.querySelector('#input-thread-title').value.trim();
      const category = catInput.value;
      const dayVal = dayInput.value;
      const location = backdrop.querySelector('#input-thread-location').value.trim() || 'George Town, Penang';
      const initialMessage = backdrop.querySelector('#input-thread-msg').value.trim();

      if (!title || !initialMessage) return;

      const created = createChatThread({
        title,
        category,
        day: dayVal === 'all' ? null : parseInt(dayVal, 10),
        location,
        initialMessage,
      });

      closeModal();
      activeThreadId = created.blockId;
      render();
    });

    document.body.appendChild(backdrop);
  }

  function renderPollHTML(poll) {
    if (!poll) return '';
    const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
    const isClosed = poll.status === 'closed';
    const isVoted = Boolean(poll.userVote);
    const maxVotes = Math.max(...poll.options.map((o) => o.votes), 0);

    return `
      <div class="poll-card ${isClosed ? 'poll-card--closed' : 'poll-card--active'}">
        <div class="poll-card__header">
          <div class="poll-card__badge-group">
            <span class="poll-card__badge">
              ${getPollsIconSvg(12)}
              <span>Consensus Poll</span>
            </span>
            ${
              isClosed
                ? `<span class="poll-status-tag poll-status-tag--closed">
                     <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
                     <span>Decided</span>
                   </span>`
                : `<span class="poll-status-tag poll-status-tag--live">
                     <span class="poll-status-tag__dot" aria-hidden="true"></span>
                     <span>Voting Open</span>
                   </span>`
            }
          </div>
          <div class="poll-card__actions-top">
            <span class="poll-card__meta">
              ${totalVotes} vote${totalVotes !== 1 ? 's' : ''} ${isClosed ? 'locked in' : 'cast'}
            </span>
            <button type="button" class="btn-close-poll" data-dismiss-poll="${activeThreadId || 'day-1-penang'}" title="Close & Dismiss Poll">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              <span>Close Poll</span>
            </button>
          </div>
        </div>

        <h3 class="poll-card__question">${escapeHtml(poll.question)}</h3>

        <div class="poll-card__options">
          ${poll.options
            .map((opt) => {
              const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
              const isSelected = poll.userVote === opt.id;
              const isWinning = maxVotes > 0 && opt.votes === maxVotes;
              return `
              <button 
                type="button" 
                class="poll-option-btn ${isSelected ? 'poll-option-btn--voted' : ''} ${isWinning && (isClosed || isVoted) ? 'poll-option-btn--leading' : ''}" 
                data-option-id="${opt.id}"
                aria-pressed="${isSelected}"
              >
                <div class="poll-option-btn__fill" style="width: ${pct}%;"></div>
                <div class="poll-option-btn__content">
                  <div class="poll-option-btn__left">
                    <span class="poll-option-btn__radio" aria-hidden="true">
                      ${isSelected ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
                    </span>
                    <span class="poll-option-btn__label">${escapeHtml(opt.label)}</span>
                  </div>
                  <div class="poll-option-btn__stat-badge">
                    <span class="poll-option-btn__pct">${pct}%</span>
                    <span class="poll-option-btn__votes">${opt.votes} ${opt.votes === 1 ? 'vote' : 'votes'}</span>
                  </div>
                </div>
              </button>
            `;
            })
            .join('')}
        </div>
        <div class="poll-card__footer">
          <span class="poll-card__hint">
            ${
              isClosed
                ? 'Consensus reached. Option locked in schedule.'
                : isVoted
                ? 'Your vote is recorded! Tap another option to change anytime.'
                : 'Tap any option above to cast your group vote.'
            }
          </span>
        </div>
      </div>
    `;
  }

  // ──────────────── BroadcastChannel Subscriptions ────────────────

  const unsubs = [
    subscribeTrips(() => {
      activeThreadId = null;
      render();
    }),
    remoteSync.subscribe('TRIGGER_CHAT_BANTER', () => {
      activeThreadId = 'day-1-penang';
      render();
      setTimeout(executeBanterSimulation, 150);
    }),
    remoteSync.subscribe('CHAT_INFLUX', () => {
      activeThreadId = 'day-1-penang';
      render();
      setTimeout(executeBanterSimulation, 150);
    }),
    remoteSync.subscribe('INSERT_PROPOSAL', () => {
      insertProposedSlot(false);
    }),
    remoteSync.subscribe('VOTE_CONSENSUS', (payload) => {
      activeThreadId = 'day-1-penang';
      render();
      runConsensusVoteSequence(payload?.blockId || 'd1-chendul');
    }),
    remoteSync.subscribe('DAY2_ACTIVITY', () => {
      render();
      if (activeThreadId === 'day-2-penang') {
        const feed = container.querySelector('.chat-feed');
        if (feed) feed.scrollTop = feed.scrollHeight;
      }
    }),
    remoteSync.subscribe('RESET_ALL', () => {
      activeThreadId = null;
      isSimulatingBanter = false;
      render();
    }),
  ];

  const handleVoteConsensus = (e) => {
    activeThreadId = 'day-1-penang';
    render();
    runConsensusVoteSequence(e?.detail?.blockId || 'd1-chendul');
  };
  window.addEventListener('wandersync:vote_consensus', handleVoteConsensus);

  const handleDay2Activity = () => {
    render();
    if (activeThreadId === 'day-2-penang') {
      const feed = container.querySelector('.chat-feed');
      if (feed) feed.scrollTop = feed.scrollHeight;
    }
  };
  window.addEventListener('wandersync:day2_activity', handleDay2Activity);

  render();
  return {
    element: container,
    destroy: () => {
      container.classList.remove('chat-view--in-conversation');
      unsubs.forEach((u) => u && u());
      window.removeEventListener('wandersync:vote_consensus', handleVoteConsensus);
      window.removeEventListener('wandersync:day2_activity', handleDay2Activity);
    },
  };
}
