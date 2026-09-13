/**
 * WanderBotCard: AI in-thread meal gap & venue proposal card with 1-tap timeline insertion.
 */

import { escapeHtml } from './ToastNotice.js';
import { formatChatMessageText } from './MessageFeed.js';
import { getItineraryData } from '../../models/itineraryData.js';

export function renderWanderBotCard(m, isInserted, msgDate) {
  // If this AI message has NO proposal, render a sleek AI conversational bubble
  if (!m.proposal && m.type !== 'ai_proposal') {
    return `
      <div class="chat-message chat-message--incoming chat-message--ai">
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
            ${formatChatMessageText(m.text)}
          </div>
          <span class="chat-message__time">${escapeHtml(m.time || `${msgDate}, 03:22 PM • AI Assistant`)}</span>
        </div>
      </div>
    `;
  }

  const proposal = m.proposal || {
    title: 'Penang Road Famous Teochew Chendul & Asam Laksa',
    tag: 'Michelin Bib Gourmand',
    distance: '8 min Grab / walk from Chew Jetty',
    price: 'RM 12 / pax',
    slotId: 'd1-chendul',
    day: 1,
  };

  const slotId = proposal.slotId || 'd1-chendul';
  const targetDay = proposal.day || 1;

  // Check live status in itinerary
  let inserted = isInserted;
  let confirmed = proposal.status === 'confirmed';
  try {
    const items = getItineraryData();
    const existing = items.find(
      (b) =>
        b.id === slotId ||
        (slotId.includes('borabora') && b.id.includes('borabora')) ||
        (slotId.includes('chendul') && b.id.includes('chendul'))
    );
    if (existing) {
      inserted = true;
      if (existing.status === 'confirmed') {
        confirmed = true;
      }
    }
  } catch (e) {}

  let buttonLabel = '+ Add as Proposed Slot';
  let buttonClass = '';
  if (confirmed) {
    buttonLabel = 'Confirmed in Schedule';
    buttonClass = 'btn-insert-proposal--confirmed';
  } else if (inserted) {
    buttonLabel = 'Inserted as Proposed Slot';
    buttonClass = 'btn-insert-proposal--inserted';
  }

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
          <div style="margin: 0 0 8px 0;">
            ${formatChatMessageText(m.text || "I noticed a place suggestion! Here's a preview of the proposed activity:")}
          </div>
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
                <span>${escapeHtml(proposal.price || proposal.cost || 'RM 45 / pax')}</span>
              </span>
            </div>
          </div>
        </div>
        <div class="chat-message__actions">
          <button class="btn btn--sm btn--primary btn-insert-proposal-action ${buttonClass}" id="btn-insert-proposal" data-slot-id="${escapeHtml(slotId)}" data-day="${targetDay}" type="button">
            ${buttonLabel}
          </button>
          ${
            inserted || confirmed
              ? `
            <button class="btn-jump-itinerary" id="btn-jump-itinerary" data-day="${targetDay}" type="button">
              <span>View in Day ${targetDay} Itinerary</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          `
              : ''
          }
        </div>
        <span class="chat-message__time">${escapeHtml(m.time || `${msgDate}, 03:21 PM • AI Suggestion`)}</span>
      </div>
    </div>
  `;
}
