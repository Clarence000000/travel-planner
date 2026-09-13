/**
 * ChatView: Activity Threads & Group Consensus Chat Hub (Modular Feature Orchestrator)
 */

import {
  THREAD_CATEGORIES,
  getChatThreads,
  saveChatThreads,
  getThreadById,
  addMessageToThread,
  voteInPoll,
  removePollFromThread,
  getThreadDay,
  getDayCalendarIconSvg,
  getPollsIconSvg,
} from '../../models/chatData.js';
import {
  getItineraryData,
  addItineraryBlock,
  confirmProposedBlock,
} from '../../models/itineraryData.js';
import { getTripSettings } from '../../models/tripSettings.js';
import { getActiveTrip } from '../../models/tripsModel.js';
import { setActiveTab } from '../../config/navigation.js';
import { PENANG_DAY2_BORABORA } from '../../models/penangSeedData.js';
import { remoteSync } from '../../utils/remoteSync.js';

import { escapeHtml, showDashToast } from './ToastNotice.js';
import { HASHTAG_COMMANDS, getHashtagCommandResponse } from './hashtagCommands.js';
import { renderPollCard } from './PollCard.js';
import { renderFeedMessages } from './MessageFeed.js';
import { renderCategorisedSectionsHTML } from './ThreadHub.js';
import { openNewThreadModal } from './NewThreadModal.js';
import { enableDragScroll } from '../../utils/dragScroll.js';

export { showDashToast };

let targetActiveThreadId = null;

export function setTargetChatThread(threadId) {
  targetActiveThreadId = threadId;
}

export function createChatView() {
  const container = document.createElement('div');
  container.className = 'feature-view chat-view';

  let activeThreadId = targetActiveThreadId || null;
  targetActiveThreadId = null;
  let currentCategoryFilter = 'all';
  let hubDayFilter = 'all';

  function render() {
    container.innerHTML = '';
    if (activeThreadId) {
      renderThreadConversation(activeThreadId);
    } else {
      renderThreadsHub();
    }
  }

  // ──────────────── Threads Hub View ────────────────
  function renderThreadsHub() {
    container.classList.remove('chat-view--in-conversation');
    const allThreads = getChatThreads();
    const trip = getActiveTrip();
    const settings = getTripSettings();
    const coverBg = settings.coverImage || './src/assets/bg-chat.png';
    const cityTitle = trip ? trip.destination : (settings.destination ? settings.destination.split(',')[0].trim() : 'Penang');
    const totalDiscussions = allThreads.length;
    const activePollsCount = allThreads.filter((t) => Boolean(t.poll)).length;

    let scopedThreads = allThreads;
    if (hubDayFilter !== 'all') {
      scopedThreads = scopedThreads.filter((t) => {
        const d = getThreadDay(t);
        if (hubDayFilter === 'trip') return d === null;
        return d === parseInt(hubDayFilter, 10);
      });
    }

    container.innerHTML = `
      <!-- Atmospheric Vertical Asset Banner (Sticky Cat Photo Header) -->
      <div class="view-banner" style="background-image: url('${coverBg}');">
        <button type="button" class="view-banner__menu-btn" id="btn-open-sidebar" aria-label="Open Trip Menu" title="Open Menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div class="view-banner__scrim">
          <span class="view-banner__badge">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            ${cityTitle} Discussions
          </span>
          <h2 class="view-banner__title">Activity Chat</h2>
        </div>
      </div>
    `;

    const hubElem = document.createElement('div');
    hubElem.className = 'threads-hub chat-threads-hub';

    hubElem.innerHTML = `
      <div class="threads-hub-header">
        <div class="threads-hub-day-bar" role="tablist" aria-label="Filter threads by schedule day">
          <button type="button" class="hub-day-chip ${hubDayFilter === 'all' ? 'hub-day-chip--active' : ''}" data-hub-day="all">All Discussions</button>
          <button type="button" class="hub-day-chip ${hubDayFilter === 'trip' ? 'hub-day-chip--active' : ''}" data-hub-day="trip">Trip-Wide</button>
          ${Array.from({ length: getTripSettings().totalDays || 3 }, (_, i) => i + 1)
            .map((dayNum) => {
              const isActive = hubDayFilter === dayNum || hubDayFilter === String(dayNum);
              return `<button type="button" class="hub-day-chip ${isActive ? 'hub-day-chip--active' : ''}" data-hub-day="${dayNum}">Day ${dayNum}</button>`;
            })
            .join('')}
        </div>

        <div class="threads-hub-filter-bar">
          <div class="filter-chips-scroll">
            <button type="button" class="filter-chip ${currentCategoryFilter === 'all' ? 'filter-chip--active' : ''}" data-category="all">
              <span>All Topics</span>
            </button>
            <button type="button" class="filter-chip filter-chip--polls ${currentCategoryFilter === 'polls' ? 'filter-chip--active' : ''}" data-category="polls">
              ${getPollsIconSvg(13)}
              <span>Consensus Polls</span>
              ${activePollsCount > 0 ? `<span class="filter-chip__count">${activePollsCount}</span>` : ''}
            </button>
            ${THREAD_CATEGORIES.map((cat) => {
              const count = scopedThreads.filter((t) => t.category === cat.id).length;
              const isActive = currentCategoryFilter === cat.id;
              return `
                <button type="button" class="filter-chip ${isActive ? 'filter-chip--active' : ''}" data-category="${cat.id}">
                  <span class="filter-chip__icon">${cat.iconSvg}</span>
                  <span>${cat.label}</span>
                  ${count > 0 ? `<span class="filter-chip__count">${count}</span>` : ''}
                </button>
              `;
            }).join('')}
          </div>
          <button type="button" class="btn btn--primary btn--sm" id="btn-new-thread-topic" style="white-space: nowrap; flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>New Thread</span>
          </button>
        </div>
      </div>

      <div class="threads-hub-content" id="threads-categories-container">
        ${renderCategorisedSectionsHTML(scopedThreads, currentCategoryFilter, hubDayFilter)}
      </div>
    `;

    container.appendChild(hubElem);
    attachHubEvents(hubElem);
  }

  function attachHubEvents(hubElem) {
    const openSidebarBtn = container.querySelector('#btn-open-sidebar');
    if (openSidebarBtn) {
      openSidebarBtn.addEventListener('click', () => {
        if (window.TravelApp?.sidebar?.open) {
          window.TravelApp.sidebar.open();
        } else if (window.TravelApp?.openSidebar) {
          window.TravelApp.openSidebar();
        }
      });
    }

    const filterScroll = hubElem.querySelector('.filter-chips-scroll');
    if (filterScroll) {
      enableDragScroll(filterScroll);
    }

    const dayBarScroll = hubElem.querySelector('.threads-hub-day-bar');
    if (dayBarScroll) {
      enableDragScroll(dayBarScroll);
    }

    hubElem.querySelectorAll('.hub-day-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        hubDayFilter = chip.getAttribute('data-hub-day');
        render();
      });
    });

    hubElem.querySelectorAll('.filter-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        currentCategoryFilter = chip.getAttribute('data-category');
        render();
      });
    });

    hubElem.querySelectorAll('.thread-item-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-thread-id');
        if (id) {
          activeThreadId = id;
          render();
        }
      });
    });

    const newBtn = hubElem.querySelector('#btn-new-thread-topic');
    if (newBtn) {
      newBtn.addEventListener('click', () => {
        openNewThreadModal('general', hubDayFilter, (created) => {
          activeThreadId = created.blockId;
          render();
        });
      });
    }

    const resetBtn = hubElem.querySelector('#btn-reset-filter');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        currentCategoryFilter = 'all';
        hubDayFilter = 'all';
        render();
      });
    }
  }

  // ──────────────── Focused Thread Conversation View ────────────────
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

    const day = getThreadDay(thread);
    const dayLabel = day ? `Day ${day}` : 'Trip-Wide';
    const rawTitle = thread.eventTitle || thread.title || '';
    const hasDayInTitle = /^Day\s*\d+/i.test(rawTitle);
    const showDayPill = !hasDayInTitle && !!day;

    const isInserted = getItineraryData().some((b) => b.id === 'd1-chendul');

    const convElem = document.createElement('div');
    convElem.className = 'thread-conversation';

    convElem.innerHTML = `
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

      ${renderPollCard(thread.poll, activeThreadId)}

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
        <button type="button" class="btn-quick-reply btn-quick-reply--hashtag" data-hashtag-hint="true">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg>
          <span>Type # for commands</span>
        </button>
      </div>

      <div class="hashtag-command-palette" id="hashtag-palette" aria-label="AI Command Shortcuts" style="display: none;">
        <div class="hashtag-palette__header">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg>
          <span>Command Shortcuts</span>
          <button type="button" class="hashtag-palette__close" id="btn-close-palette" aria-label="Close command palette">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div class="hashtag-palette__commands" id="hashtag-commands-list">
          ${HASHTAG_COMMANDS.map((cmd) => `
            <button type="button" class="hashtag-cmd-chip" data-cmd-id="${cmd.id}" data-cmd-label="${cmd.label}">
              <span class="hashtag-cmd-chip__icon" style="color: ${cmd.color}; background: ${cmd.bg};">${cmd.iconSvg}</span>
              <span class="hashtag-cmd-chip__body">
                <span class="hashtag-cmd-chip__label">${cmd.label}</span>
                <span class="hashtag-cmd-chip__desc">${cmd.desc}</span>
              </span>
            </button>
          `).join('')}
        </div>
      </div>

      <form class="chat-input-bar" id="form-thread-compose">
        <input 
          type="text" 
          id="input-thread-message" 
          class="chat-input" 
          placeholder="Message ${escapeHtml(rawTitle)}... (Type # for commands)" 
          autocomplete="off"
        />
        <button type="submit" class="chat-send-btn" id="btn-thread-send" aria-label="Send message">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </form>
    `;

    container.appendChild(convElem);

    const feed = convElem.querySelector('#thread-chat-feed');
    if (feed) feed.scrollTop = feed.scrollHeight;

    attachConversationEvents(convElem, thread, blockId);
  }

  function attachConversationEvents(convElem, thread, blockId) {
    const backBtn = convElem.querySelector('#btn-back-to-threads');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        activeThreadId = null;
        render();
      });
    }

    // Insert Proposal Buttons (supports Chendul, Bora Bora, and dynamic slots)
    convElem.querySelectorAll('.btn-insert-proposal-action, #btn-insert-proposal').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const slotId = btn.getAttribute('data-slot-id') || 'd1-chendul';
        const day = Number(btn.getAttribute('data-day')) || 1;
        handleInsertProposal(slotId, day);
      });
    });

    // Jump to Itinerary Buttons (from poll confirmed banner or header)
    convElem.querySelectorAll('.btn-jump-itinerary, #btn-jump-itinerary, .btn-poll-jump-itinerary').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const day = Number(btn.getAttribute('data-day')) || 1;
        if (day === 2) {
          const items = getItineraryData();
          if (!items.some((b) => b.id && b.id.includes('borabora'))) {
            addItineraryBlock({
              ...PENANG_DAY2_BORABORA,
              status: 'confirmed',
            });
          }
        }
        window.dispatchEvent(new CustomEvent('itinerary:set_day', { detail: { day } }));
        setActiveTab('itinerary');
      });
    });

    // Poll Dismiss Button
    const dismissBtn = convElem.querySelector('[data-dismiss-poll]');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        removePollFromThread(blockId);
        showDashToast('Poll closed & dismissed from thread.');
        render();
      });
    }

    // Poll Option Vote Buttons
    convElem.querySelectorAll('.poll-option-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const optionId = btn.getAttribute('data-option-id');
        const updatedThread = voteInPoll(blockId, optionId);
        if (updatedThread && updatedThread.poll) {
          const poll = updatedThread.poll;
          const selectedOption = poll.options.find((o) => o.id === optionId);
          showDashToast(`Voted for "${selectedOption ? selectedOption.label : 'Option'}"!`);

          const isConfirmOption =
            optionId === 'opt-confirm' ||
            optionId === 'opt-yes' ||
            optionId === 'opt-chendul' ||
            (selectedOption && (selectedOption.label.toLowerCase().includes('yes') || selectedOption.label.toLowerCase().includes('lock')));
          const targetBlockId = poll.targetBlockId || blockId;

          if (isConfirmOption || selectedOption.votes >= (poll.totalEligible || 3)) {
            // Confirm the proposed block in itinerary!
            confirmProposedBlock(targetBlockId);

            // Mark poll as closed and consensus reached
            poll.status = 'closed';
            poll.consensusReached = true;
            poll.winnerId = optionId;

            const allThreads = getChatThreads();
            const currentTh = allThreads.find(
              (t) => t.blockId === blockId || (blockId && blockId.includes('chendul') && t.blockId && t.blockId.includes('chendul'))
            );
            if (currentTh && currentTh.poll) {
              currentTh.poll.status = 'closed';
              currentTh.poll.consensusReached = true;
              currentTh.poll.winnerId = optionId;
              currentTh.poll.userVote = optionId;
            }
            saveChatThreads(allThreads);

            // Post WanderBot celebration message into feed
            addMessageToThread(blockId, {
              sender: 'WanderBot AI',
              avatar: 'WB',
              isCurrentUser: false,
              isAi: true,
              text: `🎉 **Consensus Reached! (3/3 unanimous votes)**\n\n**${updatedThread.eventTitle || updatedThread.title}** has been confirmed and locked into the Day ${updatedThread.day || 1} schedule.`,
            });

            // Dispatch events for real-time reactivity across all features
            window.dispatchEvent(
              new CustomEvent('wandersync:vote_consensus', {
                detail: { blockId: targetBlockId, threadId: blockId },
              })
            );
            window.dispatchEvent(
              new CustomEvent('itinerary:confirmed', {
                detail: { blockId: targetBlockId },
              })
            );
            window.dispatchEvent(
              new CustomEvent('wandersync:chat_update', {
                detail: { threadId: blockId },
              })
            );

            showDashToast(`Consensus reached! ${updatedThread.title} confirmed into schedule.`);
          }

          render();
        }
      });
    });

    // Enable drag and wheel scroll on quick actions pills
    const quickActions = convElem.querySelector('.chat-quick-actions');
    if (quickActions) {
      enableDragScroll(quickActions);
    }

    // Ensure wheel events anywhere inside conversation scroll the message feed smoothly
    convElem.addEventListener('wheel', (e) => {
      const feed = convElem.querySelector('#thread-chat-feed');
      const target = e.target;
      if (feed && !target.closest('.chat-quick-actions') && !target.closest('.hashtag-command-palette')) {
        if (feed.scrollHeight > feed.clientHeight) {
          feed.scrollTop += e.deltaY;
        }
      }
    }, { passive: true });

    // Quick Reply Buttons
    convElem.querySelectorAll('.btn-quick-reply[data-reply]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const replyText = btn.getAttribute('data-reply');
        sendMessage(blockId, replyText);
      });
    });

    // Form Send Event
    const form = convElem.querySelector('#form-thread-compose');
    const input = convElem.querySelector('#input-thread-message');
    if (form && input) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        sendMessage(blockId, text);
        input.value = '';
      });
    }

    setupHashtagPalette(convElem, input, thread, blockId);
  }

  function setupHashtagPalette(convElem, input, thread, blockId) {
    const palette = convElem.querySelector('#hashtag-palette');
    const closePalette = convElem.querySelector('#btn-close-palette');
    const hintBtn = convElem.querySelector('[data-hashtag-hint]');

    function showPalette(filterText = '') {
      if (!palette) return;
      palette.style.display = 'block';
      palette.classList.add('hashtag-command-palette--visible');

      const query = filterText.toLowerCase();
      palette.querySelectorAll('.hashtag-cmd-chip').forEach((chip) => {
        const label = (chip.getAttribute('data-cmd-label') || '').toLowerCase();
        const id = (chip.getAttribute('data-cmd-id') || '').toLowerCase();
        const match = !query || label.includes(query) || id.includes(query);
        chip.style.display = match ? 'flex' : 'none';
      });
    }

    function hidePalette() {
      if (!palette) return;
      palette.classList.remove('hashtag-command-palette--visible');
      palette.style.display = 'none';
    }

    if (closePalette && palette) {
      closePalette.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        hidePalette();
      });
    }

    if (hintBtn && palette) {
      hintBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (palette.classList.contains('hashtag-command-palette--visible')) {
          hidePalette();
        } else {
          showPalette();
          if (input) {
            if (!input.value.includes('#')) {
              input.value = input.value ? `${input.value.trim()} #` : '#';
            }
            input.focus();
          }
        }
      });
    }

    if (input && palette) {
      input.addEventListener('input', () => {
        const val = input.value;
        const lastWord = val.split(' ').pop();
        if (lastWord.startsWith('#')) {
          showPalette(lastWord.slice(1));
        } else {
          hidePalette();
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          hidePalette();
        }
      });
    }

    // Dismiss on click outside
    document.addEventListener('click', (e) => {
      if (palette && palette.classList.contains('hashtag-command-palette--visible')) {
        if (!palette.contains(e.target) && !hintBtn?.contains(e.target) && e.target !== input) {
          hidePalette();
        }
      }
    });

    convElem.querySelectorAll('.hashtag-cmd-chip').forEach((chip) => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const cmdId = chip.getAttribute('data-cmd-id');
        const cmdLabel = chip.getAttribute('data-cmd-label');
        hidePalette();
        if (input) input.value = '';

        addMessageToThread(blockId, cmdLabel, {
          isCurrentUser: true,
          sender: 'You (Clarence)',
        });

        const resp = getHashtagCommandResponse(cmdId, thread);
        setTimeout(() => {
          addMessageToThread(blockId, `${resp.title}: ${resp.text}`, {
            isCurrentUser: false,
            sender: 'WanderBot',
            isAi: true,
          });
          render();
        }, 350);

        render();
      });
    });
  }

  function sendMessage(blockId, text) {
    addMessageToThread(blockId, text, {
      isCurrentUser: true,
      sender: 'You (Clarence)',
    });
    render();

    // Contextual AI & Squad response if message contains links or venue suggestions
    const lower = text.toLowerCase();
    const hasLink = /https?:\/|www\./.test(lower) || /\[.+\]\(.+\)/.test(text);
    if (hasLink || lower.includes('go here') || lower.includes('what about') || lower.includes('how about')) {
      setTimeout(() => {
        addMessageToThread(blockId, {
          sender: 'WanderBot',
          avatar: 'WB',
          isCurrentUser: false,
          isAi: true,
          text: '💡 Great recommendation! I detected a shared venue link. Would you like me to propose adding this to the schedule?',
        });
        render();

        setTimeout(() => {
          addMessageToThread(blockId, {
            sender: 'Wei Gang',
            avatar: 'WG',
            isCurrentUser: false,
            text: "Love this idea! Looks great, I'm down to add it 👍",
          });
          render();
        }, 1200);
      }, 700);
    }
  }

  function handleInsertProposal(slotId = 'd1-chendul', targetDay = 1) {
    const items = getItineraryData();
    if (slotId && slotId.includes('borabora')) {
      if (!items.some((b) => b.id.includes('borabora'))) {
        addItineraryBlock({
          ...PENANG_DAY2_BORABORA,
          status: 'proposed',
        });
      }
      showDashToast('Bora Bora Batu Ferringhi added as Proposed Slot on Day 2!');
    } else {
      if (!items.some((b) => b.id === 'd1-chendul' || b.id === 'penang-chendul-gap')) {
        addItineraryBlock({
          id: 'd1-chendul',
          day: 1,
          startTime: '12:30',
          endTime: '13:30',
          title: 'Penang Road Famous Teochew Chendul & Asam Laksa',
          location: '492, Lebuh Keng Kwee, George Town',
          category: 'meal',
          cost: 'RM 12 / pax',
          status: 'proposed',
          notes: 'Iconic shaved ice dessert with pandan jelly, coconut milk, and gula melaka.',
          grabTime: '8 min Grab from Chew Jetty',
          transitToNextMinutes: 25,
          transitMode: 'Transit (25 min) to Penang Hill',
          requirements: ['Bring small RM cash', 'Peak lunchtime queue'],
        });
      }
      showDashToast('Teochew Chendul added as Proposed Slot on Day 1!');
    }
    render();
  }

  // Simulation & Event Listeners
  const handleProposalInserted = (e) => {
    activeThreadId = (e && e.detail && e.detail.blockId) ? e.detail.blockId : 'day-1-penang';
    render();
    if (e && e.detail && e.detail.autoOpenPoll) {
      setTimeout(() => {
        const pollElem = container.querySelector('.poll-card');
        if (pollElem) pollElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 200);
    }
  };
  window.addEventListener('wandersync:proposal_inserted', handleProposalInserted);

  const handleVoteConsensus = (e) => {
    const threadId = e?.detail?.threadId || 'd1-chendul';
    const blockId = e?.detail?.blockId || 'd1-chendul';
    voteInPoll(threadId, 'opt-confirm');
    confirmProposedBlock(blockId);
    showDashToast('Consensus reached! Teochew Chendul locked in.');
    render();
  };
  window.addEventListener('wandersync:vote_consensus', handleVoteConsensus);

  const handleOpenThread = (e) => {
    if (e && e.detail && e.detail.threadId) {
      activeThreadId = e.detail.threadId;
      render();
    }
  };
  window.addEventListener('chat:open_thread', handleOpenThread);

  const handleRemoteInsertProposal = () => {
    handleInsertProposal();
  };
  remoteSync.on('INSERT_PROPOSAL', handleRemoteInsertProposal);

  const handleChatUpdate = (e) => {
    const threadId = e?.detail?.threadId;
    if (!threadId || threadId === activeThreadId || !activeThreadId) {
      render();
    }
  };
  window.addEventListener('wandersync:chat_update', handleChatUpdate);
  window.addEventListener('wandersync:day2_activity', handleChatUpdate);

  const handleTripOrChatReset = () => {
    activeThreadId = null;
    render();
  };
  window.addEventListener('wandersync:chat_reset', handleTripOrChatReset);
  window.addEventListener('trip:created', handleTripOrChatReset);
  window.addEventListener('trip:deleted', handleTripOrChatReset);
  window.addEventListener('trip:selected', handleTripOrChatReset);

  render();

  return {
    element: container,
    destroy() {
      window.removeEventListener('wandersync:proposal_inserted', handleProposalInserted);
      window.removeEventListener('wandersync:vote_consensus', handleVoteConsensus);
      window.removeEventListener('chat:open_thread', handleOpenThread);
      window.removeEventListener('wandersync:chat_update', handleChatUpdate);
      window.removeEventListener('wandersync:day2_activity', handleChatUpdate);
      window.removeEventListener('wandersync:chat_reset', handleTripOrChatReset);
      window.removeEventListener('trip:created', handleTripOrChatReset);
      window.removeEventListener('trip:deleted', handleTripOrChatReset);
      window.removeEventListener('trip:selected', handleTripOrChatReset);
      remoteSync.off('INSERT_PROPOSAL', handleRemoteInsertProposal);
      if (container.parentElement) container.remove();
    },
  };
}
