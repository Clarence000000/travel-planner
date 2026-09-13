/**
 * MessageFeed: Renders list of conversation bubbles and date stamps.
 */

import { escapeHtml } from './ToastNotice.js';
import { renderWanderBotCard } from './WanderBotCard.js';

export function renderFeedMessages(messages, isInserted) {
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
      html += renderWanderBotCard(m, isInserted, msgDate);
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
