/**
 * View: Categorised Activity Chat Threads
 * Dedicated contextual discussions anchored to itinerary blocks, trip days, and categories.
 * Features:
 * 1. Main Categorised Threads Hub (filtered by Day: All/Day 1/Day 2/Day 3/Trip-wide, and Category: Food/Location/Hotel/Transit/General/Polls)
 * 2. Vector SVG iconography for all category pills, day pills, and badges (no emojis)
 * 3. Focused Thread Conversation view with back navigation, real-time message feed, and consensus polls
 * 4. Modal to start custom discussion threads with day & category assignment & itinerary metadata
 */

import {
  getChatThreads,
  getThreadById,
  addMessageToThread,
  voteInPoll,
  createChatThread,
  THREAD_CATEGORIES,
  getCategoryConfig,
  normalizeCategory,
  getCategoryIconSvg,
  getPollsIconSvg,
  getAllIconSvg,
  getDayCalendarIconSvg,
  getThreadDay,
} from '../models/chatData.js';
import { enableDragScroll } from '../utils/dragScroll.js';

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

  function render() {
    container.innerHTML = '';

    if (activeThreadId) {
      renderThreadConversation(activeThreadId);
    } else {
      renderThreadsHub();
    }
  }

  // ──────────────── 1. Main Threads Hub (Categorised View) ────────────────

  function renderThreadsHub() {
    const allThreads = getChatThreads();

    // Compute day counts
    const dayCounts = {
      all: allThreads.length,
      1: allThreads.filter((t) => getThreadDay(t) === 1).length,
      2: allThreads.filter((t) => getThreadDay(t) === 2).length,
      3: allThreads.filter((t) => getThreadDay(t) === 3).length,
      trip: allThreads.filter((t) => getThreadDay(t) === null).length,
    };

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

    const hubElem = document.createElement('div');
    hubElem.className = 'threads-hub';

    hubElem.innerHTML = `
      <!-- Atmospheric Vertical Asset Banner -->
      <div class="view-banner" style="background-image: url('./src/assets/bg-chat.png');">
        <div class="view-banner__scrim">
          <span class="view-banner__badge">📦 Boxed Buddies Chat</span>
          <h2 class="view-banner__title">Per-Activity Chat</h2>
        </div>
      </div>

      <div class="view-header">
        <div class="view-header__top-row" style="display: flex; justify-content: space-between; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2);">
          <div class="view-header__meta">
            <span class="view-badge">Categorised Discussions</span>
          </div>
          <button type="button" class="btn btn--primary btn--sm" id="btn-open-new-thread" style="flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; border-radius: var(--radius-pill); padding: 8px 14px; font-weight: var(--font-semibold); min-height: 40px;" aria-label="Start new discussion thread">
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
          <button type="button" role="tab" aria-selected="${hubDayFilter === 1 || hubDayFilter === '1'}" class="day-filter-chip ${hubDayFilter === 1 || hubDayFilter === '1' ? 'day-filter-chip--active' : ''}" data-day-filter="1">
            <span>Day 1 • Tokyo</span>
            <span class="day-filter-chip__count">(${dayCounts[1]})</span>
          </button>
          <button type="button" role="tab" aria-selected="${hubDayFilter === 2 || hubDayFilter === '2'}" class="day-filter-chip ${hubDayFilter === 2 || hubDayFilter === '2' ? 'day-filter-chip--active' : ''}" data-day-filter="2">
            <span>Day 2 • Kyoto</span>
            <span class="day-filter-chip__count">(${dayCounts[2]})</span>
          </button>
          <button type="button" role="tab" aria-selected="${hubDayFilter === 3 || hubDayFilter === '3'}" class="day-filter-chip ${hubDayFilter === 3 || hubDayFilter === '3' ? 'day-filter-chip--active' : ''}" data-day-filter="3">
            <span>Day 3 • Shibuya</span>
            <span class="day-filter-chip__count">(${dayCounts[3]})</span>
          </button>
          <button type="button" role="tab" aria-selected="${hubDayFilter === 'trip'}" class="day-filter-chip ${hubDayFilter === 'trip' ? 'day-filter-chip--active' : ''}" data-day-filter="trip">
            <span>Trip-Wide</span>
            <span class="day-filter-chip__count">(${dayCounts.trip})</span>
          </button>
        </div>

        <!-- Category Filter Chips Bar (Vector SVGs, No Emojis) -->
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

    // Enable horizontal drag scroll on both filter bars
    enableDragScroll(hubElem.querySelector('.thread-day-filter-bar'));
    enableDragScroll(hubElem.querySelector('.category-filter-bar'));

    // Day filter chip button handlers
    hubElem.querySelectorAll('.day-filter-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        const d = btn.getAttribute('data-day-filter');
        hubDayFilter = d === 'all' || d === 'trip' ? d : parseInt(d, 10);
        render();
      });
    });

    // Category filter chip button handlers
    hubElem.querySelectorAll('.filter-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        hubFilter = btn.getAttribute('data-filter');
        render();
      });
    });

    // Reset filter button if clicked from empty state
    const resetBtn = hubElem.querySelector('#btn-reset-filter');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        hubFilter = 'all';
        hubDayFilter = 'all';
        render();
      });
    }

    // Card click handlers to enter thread
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



    container.appendChild(hubElem);
  }

  function renderCategorisedSectionsHTML(scopedThreads, filter) {
    if (scopedThreads.length === 0) {
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

    // Determine which categories to render
    const categoriesToRender = filter === 'all'
      ? THREAD_CATEGORIES
      : THREAD_CATEGORIES.filter((c) => c.id === filter);

    let renderedAny = false;
    let html = '';

    categoriesToRender.forEach((cat) => {
      const catThreads = scopedThreads.filter((t) => normalizeCategory(t.category) === cat.id);
      if (catThreads.length === 0 && filter === 'all') {
        return; // Don't show empty category in "all" view
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
    // Common landmark shortenings
    if (part.startsWith('Shibuya')) return 'Shibuya';
    if (part.startsWith('Shinjuku')) return 'Shinjuku';
    if (part.startsWith('Roppongi')) return 'Roppongi';
    if (part.startsWith('Tokyo')) return 'Tokyo';
    if (part.startsWith('Kyoto')) return 'Kyoto';
    if (part.startsWith('Arashiyama')) return 'Arashiyama';
    return part;
  }

  function renderThreadCardHTML(t) {
    const lastMsg = t.messages.length > 0 ? t.messages[t.messages.length - 1] : null;
    const normCat = normalizeCategory(t.category);
    const catConfig = getCategoryConfig(normCat);
    const day = getThreadDay(t);
    const dayLabel = day ? `Day ${day}` : 'Trip-Wide';
    const shortLoc = formatShortLocation(t.location);

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
            <span class="thread-category-pill thread-category-pill--${normCat}">
              ${getCategoryIconSvg(normCat, 10)}
              <span>${catConfig.label}</span>
            </span>
            ${
              shortLoc
                ? `
              <span class="thread-item-card__badge thread-item-card__badge--loc" title="${escapeHtml(t.location)}">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span>${escapeHtml(shortLoc)}</span>
              </span>`
                : ''
            }
            ${
              t.poll
                ? `
              <span class="thread-item-card__badge thread-item-card__badge--poll">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                <span>Poll</span>
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

  // ──────────────── 2. Focused Thread Conversation View ────────────────

  function renderThreadConversation(blockId) {
    const thread = getThreadById(blockId) || {
      blockId,
      title: 'Activity Discussion',
      eventTitle: 'Itinerary Stop',
      category: 'location',
      location: 'Tokyo & Kyoto',
      participantCount: 4,
      poll: null,
      messages: [],
    };

    const normCat = normalizeCategory(thread.category);
    const catConfig = getCategoryConfig(normCat);
    const day = getThreadDay(thread);
    const dayLabel = day ? `Day ${day}` : 'Trip-Wide';

    const convElem = document.createElement('div');
    convElem.className = 'thread-conversation';

    convElem.innerHTML = `
      <!-- Back Navigation & Thread Info Header -->
      <div class="thread-conv-header">
        <button type="button" class="btn-back-threads" id="btn-back-to-threads" aria-label="Back to all threads">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
          <span>All Threads</span>
        </button>
        <div class="thread-conv-header__info">
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <h2 class="thread-conv-header__title" style="margin: 0; font-size: var(--text-base);">${escapeHtml(thread.eventTitle || thread.title)}</h2>
            <span class="thread-day-pill">${getDayCalendarIconSvg(10)} <span>${dayLabel}</span></span>
            <span class="thread-category-pill thread-category-pill--${normCat}">${getCategoryIconSvg(normCat, 10)} <span>${catConfig.label}</span></span>
          </div>
          <span class="thread-conv-header__meta">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -1px; margin-right: 2px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            ${escapeHtml(thread.location)} • ${thread.participantCount || 4} travelers
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
            : thread.messages
                .map(
                  (m) => `
          <div class="chat-message ${m.isCurrentUser ? 'chat-message--outgoing' : 'chat-message--incoming'}">
            ${!m.isCurrentUser ? `<div class="user-avatar-initials">${escapeHtml(m.avatar || m.sender.slice(0, 2).toUpperCase())}</div>` : ''}
            <div class="chat-message__bubble">
              ${!m.isCurrentUser ? `<div class="chat-message__sender">${escapeHtml(m.sender)}</div>` : ''}
              <p class="chat-message__text">${escapeHtml(m.text)}</p>
              <span class="chat-message__time">${m.time}</span>
            </div>
          </div>
        `
                )
                .join('')
        }
      </div>

      <!-- Quick Context-Aware Action Prompts -->
      <div class="chat-quick-actions" style="margin-top: 8px; margin-bottom: 8px;">
        <button type="button" class="btn-quick-reply" data-reply="Sounds great to me! 👍">Sounds great! 👍</button>
        <button type="button" class="btn-quick-reply" data-reply="What time are we meeting there?">What time? ⏰</button>
        <button type="button" class="btn-quick-reply" data-reply="Do we need advance reservations for this?">Need reservations? 🎟️</button>
      </div>

      <!-- Message Compose Input Bar -->
      <form class="chat-input-bar" id="form-thread-compose" style="margin-top: auto;">
        <input 
          type="text" 
          id="input-thread-message" 
          class="chat-input" 
          placeholder="Message ${escapeHtml(thread.title)}..." 
          autocomplete="off"
          required
        />
        <button type="submit" class="btn-chat-send" aria-label="Send Message">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </form>
    `;

    // Back to threads list
    convElem.querySelector('#btn-back-to-threads').addEventListener('click', () => {
      activeThreadId = null;
      render();
    });

    // Handle Quick Reply buttons
    convElem.querySelectorAll('.btn-quick-reply').forEach((btn) => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-reply');
        if (text) {
          addMessageToThread(blockId, text);
          render();
          scrollToBottom();
        }
      });
    });

    // Handle Message Form submit
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
    }

    container.appendChild(convElem);
    scrollToBottom();
  }

  function scrollToBottom() {
    setTimeout(() => {
      const feed = container.querySelector('#thread-chat-feed');
      if (feed) {
        feed.scrollTop = feed.scrollHeight;
      }
    }, 50);
  }

  // ──────────────── 3. New Discussion Thread Modal ────────────────

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
              <button type="button" class="new-thread-day-chip ${hubDayFilter === 1 || hubDayFilter === '1' ? 'new-thread-day-chip--active' : ''}" data-day="1">Day 1 • Tokyo</button>
              <button type="button" class="new-thread-day-chip ${hubDayFilter === 2 || hubDayFilter === '2' ? 'new-thread-day-chip--active' : ''}" data-day="2">Day 2 • Kyoto</button>
              <button type="button" class="new-thread-day-chip ${hubDayFilter === 3 || hubDayFilter === '3' ? 'new-thread-day-chip--active' : ''}" data-day="3">Day 3 • Shibuya</button>
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
              placeholder="e.g. Dinner reservation at Roppongi Hills" 
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
              placeholder="e.g. Roppongi, Minato City" 
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

    // Category button selection
    const catInput = backdrop.querySelector('#input-thread-category');
    backdrop.querySelectorAll('.new-thread-cat-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        backdrop.querySelectorAll('.new-thread-cat-chip').forEach((c) => c.classList.remove('new-thread-cat-chip--active'));
        chip.classList.add('new-thread-cat-chip--active');
        catInput.value = chip.getAttribute('data-cat');
      });
    });

    // Day button selection
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

    // Form submission
    const form = backdrop.querySelector('#form-new-thread');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = backdrop.querySelector('#input-thread-title').value.trim();
      const category = catInput.value;
      const dayVal = dayInput.value;
      const location = backdrop.querySelector('#input-thread-location').value.trim() || 'Tokyo & Kyoto';
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

    return `
      <div class="poll-card" style="margin-top: var(--space-2);">
        <div class="poll-card__header">
          <span class="poll-card__badge">
            ${getPollsIconSvg(13)}
            Consensus Poll
          </span>
          <span class="poll-card__meta">${totalVotes} group votes cast</span>
        </div>
        <p class="poll-card__question">${escapeHtml(poll.question)}</p>
        <div class="poll-card__options">
          ${poll.options
            .map((opt) => {
              const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
              const isSelected = poll.userVote === opt.id;
              return `
              <button 
                type="button" 
                class="poll-option-btn ${isSelected ? 'poll-option-btn--voted' : ''}" 
                data-option-id="${opt.id}"
                aria-pressed="${isSelected}"
              >
                <div class="poll-option-btn__fill" style="width: ${pct}%;"></div>
                <div class="poll-option-btn__content">
                  <span class="poll-option-btn__label">
                    ${isSelected ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-right: 4px; vertical-align: -1px;"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
                    ${escapeHtml(opt.label)}
                  </span>
                  <span class="poll-option-btn__stat">${pct}% (${opt.votes})</span>
                </div>
              </button>
            `;
            })
            .join('')}
        </div>
      </div>
    `;
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

  render();
  return { element: container };
}
