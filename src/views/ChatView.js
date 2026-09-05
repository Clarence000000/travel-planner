/**
 * View: Per-Activity Chat Threads
 * Contextual discussions anchored strictly to individual itinerary blocks,
 * with real-time thread switching, native mini-polls, and interactive Quick Group Polls.
 */

import {
  getChatThreads,
  getThreadById,
  addMessageToThread,
  voteInPoll,
} from '../models/chatData.js';
import { createGroupPolls } from '../components/GroupPolls.js';

export function createChatView(initialBlockId = 'd1-3') {
  const container = document.createElement('div');
  container.className = 'feature-view chat-view';

  let activeThreadId = initialBlockId;

  function render() {
    const threads = getChatThreads();
    let activeThread = threads.find((t) => t.blockId === activeThreadId) || threads[0];
    activeThreadId = activeThread.blockId;

    container.innerHTML = `
      <div class="view-header">
        <div class="view-header__meta">
          <span class="view-badge">Topic-Focused Messaging</span>
          <p class="view-subtitle">Discussions stay tied to specific timeline blocks to keep meal and timing debates organized</p>
        </div>

        <!-- Thread Anchor Selector -->
        <div class="thread-selector-chips" role="tablist">
          ${threads
            .map(
              (t) => `
            <button 
              type="button" 
              class="thread-chip ${t.blockId === activeThreadId ? 'thread-chip--active' : ''}" 
              data-thread-id="${t.blockId}"
              role="tab"
            >
              ${t.title}
            </button>
          `
            )
            .join('')}
        </div>
      </div>

      <!-- Active Thread Context Card -->
      <div class="active-thread-card">
        <div class="active-thread-card__info">
          <span class="active-thread-card__event">${activeThread.eventTitle}</span>
          <span class="active-thread-card__count">📍 ${activeThread.location} • ${activeThread.participantCount} active travelers</span>
        </div>
      </div>

      <!-- Native Mini-Poll Card (if available for thread) -->
      ${renderPollHTML(activeThread.poll)}

      <!-- Quick Group Polls Component Mount -->
      <div id="group-polls-mount"></div>

      <!-- Chat Message Feed -->
      <div class="chat-feed" id="chat-messages-target">
        ${activeThread.messages
          .map(
            (msg) => `
          <div class="chat-message ${msg.isCurrentUser ? 'chat-message--outgoing' : 'chat-message--incoming'}">
            ${!msg.isCurrentUser ? `<div class="chat-message__avatar">${msg.avatar}</div>` : ''}
            <div class="chat-message__bubble">
              ${!msg.isCurrentUser ? `<div class="chat-message__sender">${msg.sender}</div>` : ''}
              <p class="chat-message__text">${escapeHtml(msg.text)}</p>
              <span class="chat-message__time">${msg.time}</span>
            </div>
          </div>
        `
          )
          .join('')}
      </div>

      <!-- Message Input Bar -->
      <div class="chat-input-bar">
        <input 
          type="text" 
          class="chat-input" 
          id="chat-input-field" 
          placeholder="Message #${activeThread.eventTitle}..." 
        />
        <button type="button" class="chat-send-btn" id="btn-send-chat" aria-label="Send message">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    `;

    // Thread chip switching
    container.querySelectorAll('.thread-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeThreadId = btn.getAttribute('data-thread-id');
        render();
      });
    });

    // Poll voting
    if (activeThread.poll) {
      container.querySelectorAll('.poll-option').forEach((optBtn) => {
        optBtn.addEventListener('click', () => {
          const optId = optBtn.getAttribute('data-opt-id');
          voteInPoll(activeThread.blockId, optId);
          render();
        });
      });
    }

    // Message sending
    const inputField = container.querySelector('#chat-input-field');
    const sendBtn = container.querySelector('#btn-send-chat');

    function handleSend() {
      const text = inputField.value.trim();
      if (!text) return;
      addMessageToThread(activeThread.blockId, text);
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

    // Mount interactive Group Polls
    const pollsMount = container.querySelector('#group-polls-mount');
    if (pollsMount) {
      const groupPolls = createGroupPolls();
      pollsMount.appendChild(groupPolls.element);
    }
  }

  function renderPollHTML(poll) {
    if (!poll) return '';
    const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);

    return `
      <div class="poll-card">
        <div class="poll-card__header">
          <span class="poll-card__badge">📊 Activity Consensus Poll</span>
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
                  <span>${isSelected ? '✓ ' : ''}${opt.label}</span>
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
