/**
 * TimelineGapIndicator: Visual dashed free-time window (>2 hours) between activities.
 */

import { timeToMinutes } from '../../utils/bufferEngine.js';

export function renderTimelineGap(block, nextBlock, allBlocks) {
  if (!nextBlock) return '';

  const hasMealOnDay = allBlocks.some(
    (b) =>
      b.category === 'meal' ||
      b.category === 'food' ||
      b.id.includes('chendul') ||
      b.id.includes('siam') ||
      (b.title && (b.title.includes('Chendul') || b.title.includes('Char Koay Teow')))
  );

  if (hasMealOnDay) return '';

  const gapMinutes = timeToMinutes(nextBlock.startTime) - timeToMinutes(block.endTime);
  if (gapMinutes < 120) return '';

  const gapHours = Math.max(1, Math.round(gapMinutes / 60));
  const fromShort = block.title.split('(')[0].split('&')[0].trim();
  const toShort = nextBlock.title.split('(')[0].split('&')[0].trim();
  const isChewToPenang =
    (block.title.includes('Chew Jetty') || block.id === 'd1-chew-jetty') &&
    (nextBlock.title.includes('Penang Hill') || nextBlock.id === 'd1-penang-hill');

  const gapText = isChewToPenang
    ? '4-hour pocket between Chew Jetty and Penang Hill. Need a lunch recommendation or Grab transit link?'
    : `${gapHours}-hour pocket between ${fromShort} and ${toShort}. Need a lunch recommendation or transit link?`;

  return `
    <div class="timeline-item-wrapper timeline-item-wrapper--gap" aria-label="Schedule advisory gap">
      <!-- Precisely Aligned Spine Pin -->
      <div class="timeline-node-pin timeline-node-pin--gap" aria-hidden="true">
        <div class="gap-pin-circle">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
      </div>
      <!-- Continuous Spine Line to Next Node -->
      <div class="timeline-spine-connector" aria-hidden="true"></div>
      <!-- Liquid Glass Gap Card -->
      <div class="timeline-gap-card" data-gap-from="${block.id}" data-gap-to="${nextBlock.id}">
        <div class="timeline-gap-card__content">
          <div class="timeline-gap-card__info">
            <span class="timeline-gap-card__badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>${gapHours}h Open Window</span>
            </span>
            <h4 class="timeline-gap-card__route">${fromShort} &rarr; ${toShort}</h4>
            <p class="timeline-gap-card__text">${gapText}</p>
          </div>
          <div class="timeline-gap-card__actions">
            <button type="button" class="timeline-gap-card__btn" id="btn-gap-ask-wanderbot" data-gap-from="${block.id}" data-gap-to="${nextBlock.id}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>
                <rect x="4" y="8" width="16" height="12" rx="4"/>
                <circle cx="9" cy="13" r="1"/>
                <circle cx="15" cy="13" r="1"/>
                <line x1="9" y1="17" x2="15" y2="17"/>
              </svg>
              <span>Ask WanderBot / Suggest Lunch</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
