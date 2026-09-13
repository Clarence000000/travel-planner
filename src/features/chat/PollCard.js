/**
 * PollCard: Liquid Glass Consensus Mini-Poll Card Component.
 */

import { getPollsIconSvg } from '../../models/chatData.js';
import { escapeHtml } from './ToastNotice.js';

export function renderPollCard(poll, activeThreadId) {
  if (!poll) return '';
  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
  const isClosed = poll.status === 'closed';
  const isVoted = Boolean(poll.userVote);
  const maxVotes = Math.max(...poll.options.map((o) => o.votes), 0);

  return `
    <div class="poll-card ${isClosed ? 'poll-card--closed' : 'poll-card--active'}">
      <div class="poll-card__header">
        <div class="poll-card__badge-group">
          <span class="poll-card__badge">
            ${getPollsIconSvg(12)}
            <span>Consensus Poll</span>
          </span>
          ${
            isClosed
              ? `<span class="poll-status-tag poll-status-tag--closed">
                   <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
                   <span>Decided</span>
                 </span>`
              : `<span class="poll-status-tag poll-status-tag--live">
                   <span class="poll-status-tag__dot" aria-hidden="true"></span>
                   <span>Voting Open</span>
                 </span>`
          }
        </div>
        <div class="poll-card__actions-top">
          <span class="poll-card__meta">
            ${totalVotes} vote${totalVotes !== 1 ? 's' : ''} ${isClosed ? 'locked in' : 'cast'}
          </span>
          <button type="button" class="btn-close-poll" data-dismiss-poll="${activeThreadId || 'day-1-penang'}" title="Close & Dismiss Poll">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            <span>Close Poll</span>
          </button>
        </div>
      </div>

      <h3 class="poll-card__question">${escapeHtml(poll.question)}</h3>

      <div class="poll-card__options">
        ${poll.options
          .map((opt) => {
            const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
            const isSelected = poll.userVote === opt.id;
            const isWinning = maxVotes > 0 && opt.votes === maxVotes;
            return `
            <button 
              type="button" 
              class="poll-option-btn ${isSelected ? 'poll-option-btn--voted' : ''} ${isWinning && (isClosed || isVoted) ? 'poll-option-btn--leading' : ''}" 
              data-option-id="${opt.id}"
              aria-pressed="${isSelected}"
            >
              <div class="poll-option-btn__fill" style="width: ${pct}%;"></div>
              <div class="poll-option-btn__content">
                <div class="poll-option-btn__left">
                  <span class="poll-option-btn__radio" aria-hidden="true">
                    ${isSelected ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
                  </span>
                  <span class="poll-option-btn__label">${escapeHtml(opt.label)}</span>
                </div>
                <div class="poll-option-btn__stat-badge">
                  <span class="poll-option-btn__pct">${pct}%</span>
                  <span class="poll-option-btn__votes">${opt.votes} ${opt.votes === 1 ? 'vote' : 'votes'}</span>
                </div>
              </div>
            </button>
          `;
          })
          .join('')}
      </div>
      <div class="poll-card__footer">
        <span class="poll-card__hint">
          ${
            isClosed
              ? 'Consensus reached. Option locked in schedule.'
              : isVoted
              ? 'Your vote is recorded! Tap another option to change anytime.'
              : 'Tap any option above to cast your group vote.'
          }
        </span>
      </div>
    </div>
  `;
}
