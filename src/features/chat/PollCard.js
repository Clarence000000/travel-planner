/**
 * PollCard: Liquid Glass Consensus Mini-Poll Card Component.
 */

import { getPollsIconSvg } from '../../models/chatData.js';
import { escapeHtml } from './ToastNotice.js';

export function renderPollCard(poll, activeThreadId) {
  if (!poll) return '';
  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
  const totalEligible = poll.totalEligible || 3;
  const isClosed = poll.status === 'closed' || Boolean(poll.consensusReached);
  const isVoted = Boolean(poll.userVote);
  const maxVotes = Math.max(...poll.options.map((o) => o.votes), 0);
  const isWaitingForUser = !isClosed && !isVoted && totalVotes === 2;

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
                   <span>Decided · Consensus Reached (3/3)</span>
                 </span>`
              : isWaitingForUser
              ? `<span class="poll-status-tag poll-status-tag--waiting-you" title="Tony & Wei Gang have voted. Waiting for your deciding vote!">
                   <span class="poll-status-tag__dot poll-status-tag__dot--pulse" aria-hidden="true"></span>
                   <span>Waiting for your vote (2/3 in)</span>
                 </span>`
              : `<span class="poll-status-tag poll-status-tag--live">
                   <span class="poll-status-tag__dot" aria-hidden="true"></span>
                   <span>Voting Open</span>
                 </span>`
          }
        </div>
        <div class="poll-card__actions-top">
          <span class="poll-card__meta">
            ${totalVotes}/${totalEligible} votes ${isClosed ? 'confirmed' : 'cast'}
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
            const pct = Math.min(100, Math.round((opt.votes / totalEligible) * 100));
            const isSelected = poll.userVote === opt.id;
            const isWinning = maxVotes > 0 && opt.votes === maxVotes;
            const isTargetConfirm =
              opt.id === 'opt-confirm' ||
              opt.id === 'opt-yes' ||
              opt.id === 'opt-chendul' ||
              opt.label.toLowerCase().includes('yes') ||
              opt.label.toLowerCase().includes('lock');

            let voterHint = '';
            if (opt.voterNames && opt.voterNames.length > 0) {
              if (isClosed && opt.votes >= totalEligible) {
                voterHint = `Unanimous (3/3) · ${opt.voterNames.join(', ')}`;
              } else if (opt.votes === 2 && !isVoted) {
                voterHint = `${opt.voterNames.join(', ')} voted · Waiting for your deciding vote`;
              } else {
                voterHint = `${opt.voterNames.join(', ')}`;
              }
            } else if (isTargetConfirm && opt.votes === 2 && !isVoted) {
              voterHint = `Tony & Wei Gang voted (2/3) · Waiting for your deciding vote`;
            }

            return `
            <button 
              type="button" 
              class="poll-option-btn ${isSelected ? 'poll-option-btn--voted' : ''} ${isWinning && (isClosed || isVoted) ? 'poll-option-btn--leading' : ''} ${isWaitingForUser && isTargetConfirm ? 'poll-option-btn--action-needed' : ''}" 
              data-option-id="${opt.id}"
              aria-pressed="${isSelected}"
              title="${escapeHtml(opt.label)}"
            >
              <div class="poll-option-btn__fill" style="width: ${pct}%;"></div>
              <div class="poll-option-btn__content">
                <div class="poll-option-btn__left">
                  <span class="poll-option-btn__radio" aria-hidden="true">
                    ${isSelected ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
                  </span>
                  <div class="poll-option-btn__text-wrap">
                    <span class="poll-option-btn__label">${escapeHtml(opt.label)}</span>
                    ${voterHint ? `<span class="poll-option-btn__voters">${escapeHtml(voterHint)}</span>` : ''}
                  </div>
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
        ${
          isClosed
            ? `
            <div class="poll-card__confirmed-row">
              <div class="poll-card__confirmed-text">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Consensus reached! Slot confirmed into schedule.</span>
              </div>
              <button type="button" class="btn-jump-itinerary btn-poll-jump-itinerary" data-day="${poll.day || 1}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span>View in Itinerary</span>
              </button>
            </div>
          `
            : isWaitingForUser
            ? `<span class="poll-card__hint poll-card__hint--waiting">
                Tony and Wei Gang voted Yes. Tap <strong>"Yes, lock into schedule"</strong> above to reach 100% consensus and confirm!
               </span>`
            : isVoted
            ? `<span class="poll-card__hint">Your vote is recorded! Tap another option to change anytime.</span>`
            : `<span class="poll-card__hint">Tap any option above to cast your group vote.</span>`
        }
      </div>
    </div>
  `;
}
