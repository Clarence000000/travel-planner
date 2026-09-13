/**
 * QuickThreadDrawer: Activity-anchored quick chat discussion modal sheet.
 */

import { getThreadById, addMessageToThread, getDayCalendarIconSvg } from '../../models/chatData.js';
import { setActiveTab } from '../../config/navigation.js';

export function openQuickThreadDrawer(block, currentDay, onMessageAdded) {
  const existing = document.querySelector('.quick-thread-backdrop');
  if (existing) existing.remove();

  const backdrop = document.createElement('div');
  backdrop.className = 'quick-thread-backdrop';

  const blockId = block.id;

  function closeDrawer() {
    backdrop.classList.remove('is-open');
    setTimeout(() => backdrop.remove(), 250);
  }

  function renderThreadContent() {
    const thread = getThreadById(blockId) || {
      id: blockId,
      title: block.title,
      messages: [],
    };

    backdrop.innerHTML = `
      <div class="quick-thread-sheet" role="dialog" aria-labelledby="qt-title">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(15, 23, 42, 0.08); padding-bottom: 10px;">
          <div>
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px;">
              <span class="thread-day-pill">${getDayCalendarIconSvg(10)} <span>Day ${block.day || currentDay}</span></span>
            </div>
            <h3 id="qt-title" style="font-size: 14px; font-weight: 800; color: #0F172A; margin: 0;">${thread.eventTitle || thread.title || block.title}</h3>
          </div>
          <button type="button" class="drawer-close-btn" id="btn-close-qt" aria-label="Close activity thread" style="min-width: 36px; min-height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(15, 23, 42, 0.05); border: none; cursor: pointer; font-size: 14px;">✕</button>
        </div>

        <div class="chat-feed" style="max-height: 250px; overflow-y: auto; padding-right: 4px; display: flex; flex-direction: column; gap: 8px;">
          ${
            thread.messages.length === 0
              ? `<p style="font-size: 12px; color: #64748B; text-align: center; padding: 24px 0;">No messages in this activity thread yet. Start the discussion below!</p>`
              : thread.messages
                  .map(
                    (m) => `
            <div class="chat-message ${m.isCurrentUser ? 'chat-message--outgoing' : 'chat-message--incoming'}">
              ${!m.isCurrentUser ? `<div class="user-avatar-initials" style="width: 26px; height: 26px; font-size: 10px;">${m.avatar || m.sender.slice(0, 2).toUpperCase()}</div>` : ''}
              <div class="chat-message__bubble">
                ${!m.isCurrentUser ? `<div class="chat-message__sender">${m.sender}</div>` : ''}
                <p class="chat-message__text">${m.text}</p>
                <span class="chat-message__time">${m.time}</span>
              </div>
            </div>
          `
                  )
                  .join('')
          }
        </div>

        <div style="display: flex; gap: 8px; align-items: center;">
          <input 
            type="text" 
            class="chat-input" 
            id="qt-input" 
            placeholder="Discuss this stop..." 
            style="flex: 1; padding: 9px 14px; background: #F8FAFC; border-radius: 9999px; border: 1px solid #CBD5E1; font-size: 13px; outline: none;" 
          />
          <button type="button" class="btn btn--primary btn--sm" id="btn-qt-send" style="padding: 8px 16px; border-radius: 9999px; background: #0F172A; color: #FFFFFF; font-weight: 700; font-size: 12px; border: none; cursor: pointer;">Send</button>
        </div>

        <div style="text-align: center; margin-top: 2px;">
          <button type="button" class="btn btn--secondary btn--sm" id="btn-qt-go-full" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px; border-radius: 12px; background: rgba(15, 23, 42, 0.04); border: 1px solid rgba(15, 23, 42, 0.08); font-size: 12px; font-weight: 700; color: #334155; cursor: pointer;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>Open in Central Chat Hub</span>
          </button>
        </div>
      </div>
    `;

    const input = backdrop.querySelector('#qt-input');
    const sendBtn = backdrop.querySelector('#btn-qt-send');
    const closeBtn = backdrop.querySelector('#btn-close-qt');
    const goFullBtn = backdrop.querySelector('#btn-qt-go-full');

    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

    if (goFullBtn) {
      goFullBtn.addEventListener('click', () => {
        closeDrawer();
        setActiveTab('chat');
      });
    }

    const feed = backdrop.querySelector('.chat-feed');
    if (feed) feed.scrollTop = feed.scrollHeight;

    const handleSend = () => {
      const text = input.value.trim();
      if (!text) return;
      addMessageToThread(blockId, text, {
        title: block.title,
        category: block.category,
        location: block.location,
        day: block.day || currentDay,
      });
      input.value = '';
      renderThreadContent();
      if (typeof onMessageAdded === 'function') onMessageAdded();
    };

    if (sendBtn) sendBtn.addEventListener('click', handleSend);
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSend();
      });
    }
  }

  renderThreadContent();
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => backdrop.classList.add('is-open'));

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeDrawer();
  });
}
