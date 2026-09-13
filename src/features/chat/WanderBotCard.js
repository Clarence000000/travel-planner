/**
 * WanderBotCard: AI in-thread meal gap extraction card with 1-tap timeline insertion.
 */

import { escapeHtml } from './ToastNotice.js';

export function renderWanderBotCard(m, isInserted, msgDate) {
  const proposal = m.proposal || {
    title: 'Penang Road Famous Teochew Chendul & Asam Laksa',
    tag: 'Michelin Bib Gourmand',
    distance: '8 min Grab / walk from Chew Jetty',
    price: 'RM 12 / pax',
    slotId: 'd1-chendul',
  };

  return `
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
}
