/**
 * MessageFeed: Renders list of conversation bubbles, date stamps, and rich formatted links.
 */

import { escapeHtml } from './ToastNotice.js';
import { renderWanderBotCard } from './WanderBotCard.js';

export function formatChatMessageText(rawText) {
  if (!rawText) return '';
  let safe = escapeHtml(String(rawText));

  // Markdown bold: **text**
  safe = safe.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Markdown links: [Text](https://...)
  safe = safe.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (match, label, url) => {
    const cleanUrl = url.replace(/&amp;/g, '&');
    return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="chat-text-link"><svg class="chat-link-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg><span>${label}</span></a>`;
  });

  // Bare URLs: https://...
  safe = safe.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)(?=[)\s]|$)/g, (match, prefix, url) => {
    const cleanUrl = url.replace(/&amp;/g, '&');
    return `${prefix}<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="chat-text-link chat-text-link--bare"><svg class="chat-link-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg><span>${url}</span></a>`;
  });

  // Newlines
  safe = safe.replace(/\n/g, '<br/>');

  return safe;
}

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
            <div class="chat-message__text">${formatChatMessageText(m.text)}</div>
            <span class="chat-message__time">${escapeHtml(m.time)}</span>
          </div>
        </div>
      `;
    }
  });

  return html;
}
