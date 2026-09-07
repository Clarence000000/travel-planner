/**
 * View: Per-Activity Chat Threads
 * Dedicated contextual discussions anchored to individual itinerary blocks.
 * Features:
 * 1. Main Threads Hub (list view of all activity channels with previews & poll badges)
 * 2. Focused Thread Conversation view with back navigation, real-time message feed, and consensus polls.
 */

import {
  getChatThreads,
  getThreadById,
  addMessageToThread,
  voteInPoll,
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
  let hubFilter = 'all'; // 'all' | 'd1' | 'd2' | 'polls'

  function render() {
    container.innerHTML = '';

    if (activeThreadId) {
      renderThreadConversation(activeThreadId);
    } else {
      renderThreadsHub();
    }
  }

  // ──────────────── 1. Main Threads Hub (List View) ────────────────

  function renderThreadsHub() {
    const threads = getChatThreads();

    const filteredThreads = threads.filter((t) => {
      if (hubFilter === 'd1') return t.blockId.startsWith('d1');
      if (hubFilter === 'd2') return t.blockId.startsWith('d2');
      if (hubFilter === 'polls') return Boolean(t.poll);
      return true;
    });

    const hubElem = document.createElement('div');
    hubElem.className = 'threads-hub';

    hubElem.innerHTML = `
      <div class="view-header">
        <div class="view-header__meta">
          <span class="view-badge">Activity Discussions</span>
          <p class="view-subtitle">Select an event thread to debate timings, food choices, and vote on activities</p>
        </div>

        <!-- Filter Chips Bar -->
        <div class="category-filter-bar">
          <button type="button" class="filter-chip ${hubFilter === 'all' ? 'filter-chip--active' : ''}" data-filter="all">
            All Threads (${threads.length})
          </button>
          <button type="button" class="filter-chip ${hubFilter === 'd1' ? 'filter-chip--active' : ''}" data-filter="d1">
            Day 1 Tokyo
          </button>
          <button type="button" class="filter-chip ${hubFilter === 'd2' ? 'filter-chip--active' : ''}" data-filter="d2">
            Day 2 Kyoto
          </button>
          <button type="button" class="filter-chip ${hubFilter === 'polls' ? 'filter-chip--active' : ''}" data-filter="polls">
            Active Polls
          </button>
        </div>
      </div>

      <!-- Threads Cards List -->
      <div class="threads-list">
        ${filteredThreads
          .map((t) => {
            const lastMsg = t.messages.length > 0 ? t.messages[t.messages.length - 1] : null;

            return `
            <div class="thread-item-card" data-thread-id="${t.blockId}" role="button" tabindex="0">
              <div class="thread-item-card__icon" aria-hidden="true">
                ${getThreadCategorySvg(t.category)}
              </div>
              <div class="thread-item-card__content">
                <div class="thread-item-card__top">
                  <h3 class="thread-item-card__title">${t.title}</h3>
                  <span class="thread-item-card__time">${lastMsg ? lastMsg.time : ''}</span>
                </div>
                <p class="thread-item-card__snippet">
                  ${lastMsg ? `<strong>${lastMsg.sender.split(' ')[0]}:</strong> ${escapeHtml(lastMsg.text)}` : 'No messages yet. Tap to start discussion.'}
                </p>
                <div class="thread-item-card__footer">
                  <span class="thread-item-card__badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    <span>${t.location.split(',')[0]}</span>
                  </span>
                  <span class="thread-item-card__badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    <span>${t.participantCount} travelers</span>
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
          })
          .join('')}
      </div>

      <!-- Quick Group Polls Section -->
      <div id="group-polls-hub-mount" style="margin-top: var(--space-3);"></div>
    `;

    // Enable drag scrolling on the upper filter bar
    enableDragScroll(hubElem.querySelector('.category-filter-bar'));

    // Filter button handlers
    hubElem.querySelectorAll('.filter-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        hubFilter = btn.getAttribute('data-filter');
        render();
      });
    });

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

    // Mount Group Polls component on hub
    const pollsMount = hubElem.querySelector('#group-polls-hub-mount');
    if (pollsMount) {
      const groupPolls = createGroupPolls();
      pollsMount.appendChild(groupPolls.element);
    }

    container.appendChild(hubElem);
  }

  // ──────────────── 2. Focused Thread Conversation View ────────────────

  function renderThreadConversation(blockId) {
    const thread = getThreadById(blockId) || {
      blockId,
      title: 'Activity Discussion',
      eventTitle: 'Itinerary Stop',
      category: 'activity',
      location: 'Tokyo',
      participantCount: 4,
      poll: null,
      messages: [],
    };

    const convElem = document.createElement('div');
    convElem.className = 'thread-conversation';

    convElem.innerHTML = `
      <!-- Back Navigation & Thread Info Header -->
      <div class="thread-conv-header">
        <button type="button" class="btn-back-threads" id="btn-back-to-threads" aria-label="Back to all threads">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
          <span>All Threads</span>
        </button>
        <div class="thread-conv-header__info">
          <h2 class="thread-conv-header__title">${thread.eventTitle || thread.title}</h2>
          <span class="thread-conv-header__meta">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -1px; margin-right: 2px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            ${thread.location} • ${thread.participantCount} travelers
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
                No messages yet. Send the first message below.
               </div>`
            : thread.messages
                .map(
                  (msg) => `
              <div class="chat-message ${msg.isCurrentUser ? 'chat-message--outgoing' : 'chat-message--incoming'}">
                ${!msg.isCurrentUser ? `<div class="user-avatar-initials">${msg.avatar || 'TR'}</div>` : ''}
                <div class="chat-message__bubble">
                  ${!msg.isCurrentUser ? `<div class="chat-message__sender">${msg.sender}</div>` : ''}
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

  function renderPollHTML(poll) {
    if (!poll) return '';
    const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);

    return `
      <div class="poll-card" style="margin-top: var(--space-2);">
        <div class="poll-card__header">
          <span class="poll-card__badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -2px; margin-right: 4px;"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            Activity Consensus Poll
          </span>
          <span class="poll-card__status">${totalVotes} total votes</span>
        </div>
        <h3 class="poll-card__question">${poll.question}</h3>
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
              >
                <div class="poll-option__row">
                  <span>${isSelected ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="vertical-align: -1px; margin-right: 4px;"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}${opt.label}</span>
                  <span class="poll-option__percent">${percent}% (${opt.votes})</span>
                </div>
                <div class="poll-option__bar" style="width: ${percent}%;"></div>
              </button>
            `;
            })
            .join('')}
        </div>
      </div>
    `;
  }

  function getThreadCategorySvg(category) {
    if (category === 'meal') {
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #D97706;"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>`;
    }
    if (category === 'general') {
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-primary);"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
    }
    // Default activity
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-primary);"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>`;
  }

  function escapeHtml(str) {
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
