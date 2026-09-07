/**
 * View: Categorised Activity Chat Threads
 * Dedicated contextual discussions anchored to itinerary blocks and trip categories.
 * Features:
 * 1. Main Categorised Threads Hub (grouped by Food, Location, Hotel, Transit, General + Category Filter Chips)
 * 2. Focused Thread Conversation view with back navigation, real-time message feed, and consensus polls
 * 3. Modal to start custom discussion threads with category assignment & itinerary metadata
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
} from '../models/chatData.js';
import { createGroupPolls } from '../components/GroupPolls.js';
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

    // Compute category counts
    const counts = {
      all: allThreads.length,
      food: allThreads.filter((t) => normalizeCategory(t.category) === 'food').length,
      location: allThreads.filter((t) => normalizeCategory(t.category) === 'location').length,
      hotel: allThreads.filter((t) => normalizeCategory(t.category) === 'hotel').length,
      transit: allThreads.filter((t) => normalizeCategory(t.category) === 'transit').length,
      general: allThreads.filter((t) => normalizeCategory(t.category) === 'general').length,
      polls: allThreads.filter((t) => Boolean(t.poll)).length,
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
        <div class="view-header__top-row" style="display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-2); margin-bottom: var(--space-2);">
          <div class="view-header__meta">
            <span class="view-badge">Categorised Discussions</span>
            <p class="view-subtitle" style="margin-top: 4px;">Coordinate food choices, sights, hotel logistics, and travel plans by category</p>
          </div>
          <button type="button" class="btn btn--primary btn--sm" id="btn-open-new-thread" style="flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; border-radius: var(--radius-pill); padding: 8px 14px; font-weight: var(--font-semibold); min-height: 40px;" aria-label="Start new discussion thread">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>New Thread</span>
          </button>
        </div>

        <!-- Filter Chips Bar -->
        <div class="category-filter-bar" role="tablist" aria-label="Filter threads by category">
          <button type="button" role="tab" aria-selected="${hubFilter === 'all'}" class="filter-chip ${hubFilter === 'all' ? 'filter-chip--active' : ''}" data-filter="all">
            All (${counts.all})
          </button>
          <button type="button" role="tab" aria-selected="${hubFilter === 'food'}" class="filter-chip ${hubFilter === 'food' ? 'filter-chip--active' : ''}" data-filter="food">
            🍽️ Food (${counts.food})
          </button>
          <button type="button" role="tab" aria-selected="${hubFilter === 'location'}" class="filter-chip ${hubFilter === 'location' ? 'filter-chip--active' : ''}" data-filter="location">
            📍 Location (${counts.location})
          </button>
          <button type="button" role="tab" aria-selected="${hubFilter === 'hotel'}" class="filter-chip ${hubFilter === 'hotel' ? 'filter-chip--active' : ''}" data-filter="hotel">
            🏨 Hotel (${counts.hotel})
          </button>
          <button type="button" role="tab" aria-selected="${hubFilter === 'transit'}" class="filter-chip ${hubFilter === 'transit' ? 'filter-chip--active' : ''}" data-filter="transit">
            🚆 Transit (${counts.transit})
          </button>
          <button type="button" role="tab" aria-selected="${hubFilter === 'general'}" class="filter-chip ${hubFilter === 'general' ? 'filter-chip--active' : ''}" data-filter="general">
            💬 General (${counts.general})
          </button>
          <button type="button" role="tab" aria-selected="${hubFilter === 'polls'}" class="filter-chip ${hubFilter === 'polls' ? 'filter-chip--active' : ''}" data-filter="polls">
            📊 Polls (${counts.polls})
          </button>
        </div>
      </div>

      <!-- Categorised Content Sections Container -->
      <div class="threads-categories-container">
        ${renderCategorisedSectionsHTML(allThreads, hubFilter)}
      </div>

      <!-- Quick Group Polls Section -->
      <div id="group-polls-hub-mount" style="margin-top: var(--space-3);"></div>
    `;

    // Enable horizontal drag scroll on filter bar
    enableDragScroll(hubElem.querySelector('.category-filter-bar'));

    // Filter chip button handlers
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

    // Mount Group Polls component on hub
    const pollsMount = hubElem.querySelector('#group-polls-hub-mount');
    if (pollsMount) {
      const groupPolls = createGroupPolls();
      pollsMount.appendChild(groupPolls.element);
    }

    container.appendChild(hubElem);
  }

  function renderCategorisedSectionsHTML(allThreads, filter) {
    if (filter === 'polls') {
      const pollThreads = allThreads.filter((t) => Boolean(t.poll));
      if (pollThreads.length === 0) {
        return renderEmptyState('No threads currently have active consensus polls.');
      }
      return `
        <section class="thread-category-group" data-category="polls">
          <div class="thread-category-header">
            <div class="thread-category-header__left">
              <div class="thread-category-header__icon thread-category-header__icon--polls">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
              </div>
              <div class="thread-category-header__titles">
                <h2 class="thread-category-header__name">Active Consensus Polls</h2>
                <span class="thread-category-header__desc">Threads with group decisions pending vote</span>
              </div>
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
      const catThreads = allThreads.filter((t) => normalizeCategory(t.category) === cat.id);
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
              <div class="thread-category-header__titles">
                <h2 class="thread-category-header__name">${cat.name}</h2>
                <span class="thread-category-header__desc">${cat.description}</span>
              </div>
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
      return renderEmptyState(`No threads found in this category.`);
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
        <button type="button" class="btn btn--secondary btn--sm" id="btn-reset-filter">Show All Threads</button>
      </div>
    `;
  }

  function renderThreadCardHTML(t) {
    const lastMsg = t.messages.length > 0 ? t.messages[t.messages.length - 1] : null;
    const normCat = normalizeCategory(t.category);
    const catConfig = getCategoryConfig(normCat);

    return `
      <div class="thread-item-card" data-thread-id="${t.blockId}" role="button" tabindex="0" aria-label="Open discussion: ${t.title}">
        <div class="thread-item-card__icon thread-item-card__icon--${normCat}" aria-hidden="true">
          ${getThreadCategorySvg(normCat)}
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
            <span class="thread-category-pill thread-category-pill--${normCat}">
              ${catConfig.label}
            </span>
            <span class="thread-item-card__badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <span>${escapeHtml(t.location.split(',')[0])}</span>
            </span>
            <span class="thread-item-card__badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              <span>${t.participantCount || 4}</span>
            </span>
            ${
              t.poll
                ? `
              <span class="thread-item-card__badge thread-item-card__badge--poll">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
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
            <span class="thread-category-pill thread-category-pill--${normCat}">${catConfig.label}</span>
          </div>
          <span class="thread-conv-header__meta">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -1px; margin-right: 2px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            ${escapeHtml(thread.location)} • ${thread.participantCount || 4} travelers
          </span>
        </div>
      </div>

      <!-- Native Mini-Poll (if attached to this event) -->
      ${renderPollHTML(thread.poll)}

      <!-- Chat Message Feed -->
      <div class="chat-feed" id="chat-messages-target" style="margin-top: var(--space-2);">
        ${
          thread.messages.length === 0
            ? `<div style="text-align: center; padding: 36px 16px; color: var(--color-text-secondary); font-size: var(--text-sm);">
                No messages in this ${catConfig.label.toLowerCase()} thread yet. Send the first message below!
               </div>`
            : thread.messages
                .map(
                  (msg) => `
              <div class="chat-message ${msg.isCurrentUser ? 'chat-message--outgoing' : 'chat-message--incoming'}">
                ${!msg.isCurrentUser ? `<div class="user-avatar-initials">${escapeHtml(msg.avatar || 'TR')}</div>` : ''}
                <div class="chat-message__bubble">
                  ${!msg.isCurrentUser ? `<div class="chat-message__sender">${escapeHtml(msg.sender)}</div>` : ''}
                  <p class="chat-message__text">${escapeHtml(msg.text)}</p>
                  <span class="chat-message__time">${msg.time}</span>
                </div>
              </div>
            `
                )
                .join('')
        }
      </div>

      <!-- Message Input Bar -->
      <div class="chat-input-bar">
        <input 
          type="text" 
          class="chat-input" 
          id="chat-input-field" 
          placeholder="Message #${(thread.eventTitle || thread.title).trim()}..." 
          aria-label="Message text"
        />
        <button type="button" class="chat-send-btn" id="btn-send-chat" aria-label="Send message">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    `;

    // Back to threads list
    convElem.querySelector('#btn-back-to-threads').addEventListener('click', () => {
      activeThreadId = null;
      render();
    });

    // Poll voting
    if (thread.poll) {
      convElem.querySelectorAll('.poll-option').forEach((optBtn) => {
        optBtn.addEventListener('click', () => {
          const optId = optBtn.getAttribute('data-opt-id');
          voteInPoll(thread.blockId, optId);
          render();
        });
      });
    }

    // Message sending
    const inputField = convElem.querySelector('#chat-input-field');
    const sendBtn = convElem.querySelector('#btn-send-chat');

    function handleSend() {
      const text = inputField.value.trim();
      if (!text) return;
      addMessageToThread(thread.blockId, text);
      inputField.value = '';
      render();
      const feed = container.querySelector('#chat-messages-target');
      if (feed) {
        feed.scrollTop = feed.scrollHeight;
      }
    }

    sendBtn.addEventListener('click', handleSend);
    inputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSend();
      }
    });

    container.appendChild(convElem);
  }

  // ──────────────── 3. New Thread Creation Modal ────────────────

  function openNewThreadModal(defaultCategory = 'food') {
    const backdrop = document.createElement('div');
    backdrop.className = 'new-thread-backdrop';

    backdrop.innerHTML = `
      <div class="new-thread-sheet" role="dialog" aria-labelledby="modal-thread-title">
        <div class="new-thread-sheet__header">
          <div>
            <span class="view-badge">New Discussion</span>
            <h3 id="modal-thread-title" style="margin: 2px 0 0; font-size: var(--text-base); font-weight: bold; color: var(--color-text-primary);">
              Start Categorised Thread
            </h3>
          </div>
          <button type="button" class="drawer-close-btn" id="btn-close-new-thread" aria-label="Close modal">✕</button>
        </div>

        <form id="form-new-thread" class="new-thread-form">
          <!-- Category Selector -->
          <div class="form-group">
            <label class="form-label" style="display: block; font-size: var(--text-xs); font-weight: var(--font-bold); color: var(--color-text-secondary); margin-bottom: 6px;">
              Category
            </label>
            <div class="new-thread-category-chips" id="category-selector-group">
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
      const location = backdrop.querySelector('#input-thread-location').value.trim() || 'Tokyo & Kyoto';
      const initialMessage = backdrop.querySelector('#input-thread-msg').value.trim();

      if (!title || !initialMessage) return;

      const created = createChatThread({
        title,
        category,
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
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -2px; margin-right: 4px;"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            Consensus Poll
          </span>
          <span class="poll-card__status">${totalVotes} total votes</span>
        </div>
        <h3 class="poll-card__question">${escapeHtml(poll.question)}</h3>
        <div class="poll-options">
          ${poll.options
            .map((opt) => {
              const percent = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
              const isSelected = poll.userVote === opt.id;
              return `
              <button 
                type="button" 
                class="poll-option ${isSelected ? 'poll-option--selected' : ''}" 
                data-opt-id="${opt.id}"
                aria-label="${escapeHtml(opt.label)}, ${percent}% of votes"
              >
                <div class="poll-option__row">
                  <span>${isSelected ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="vertical-align: -1px; margin-right: 4px;"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}${escapeHtml(opt.label)}</span>
                  <span class="poll-option__percent">${percent}% (${opt.votes})</span>
                </div>
                <div class="poll-option__bar" style="width: ${percent}%;" aria-hidden="true"></div>
              </button>
            `;
            })
            .join('')}
        </div>
      </div>
    `;
  }

  function getThreadCategorySvg(category) {
    const config = getCategoryConfig(category);
    return config ? config.iconSvg : THREAD_CATEGORIES[4].iconSvg;
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Initial render
  render();

  return {
    element: container,
    switchThread: (blockId) => {
      activeThreadId = blockId;
      render();
    },
  };
}
