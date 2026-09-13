/**
 * TimelineCard: Renders both collapsed and expanded states of an itinerary card.
 */

import { formatDisplayTime, formatDuration } from '../../utils/bufferEngine.js';
import { getThreadById } from '../../models/chatData.js';
import { getVenueThumbnail } from './venueIcons.js';
import { renderProposedActionsBar } from './GhostCard.js';
import { renderScheduleAdvisory } from './ScheduleAdvisory.js';
import { renderWeatherAlertBanner } from './WeatherAlertBanner.js';

const CATEGORY_MAP = {
  activity: {
    label: 'Sightseeing',
    badgeLabel: 'Sightseeing',
    icon: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
  },
  meal: {
    label: 'Dining',
    badgeLabel: 'Dining',
    icon: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>`,
  },
  transit: {
    label: 'Transit',
    badgeLabel: 'Transit',
    icon: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="4" y="3" width="16" height="16" rx="2"></rect><path d="M4 11h16"></path><path d="M12 3v8"></path></svg>`,
  },
  rest: {
    label: 'Check-in / Rest',
    badgeLabel: 'Check-in',
    icon: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
  },
};

export function renderTimelineCard({
  block,
  index,
  totalBlocks,
  isExpanded,
  checkedRequirements,
  weatherAlertActive,
}) {
  const isCancelled = block.status === 'cancelled';
  const isProposed = block.status === 'proposed';
  const isReel = block.source === 'reel' || block.reelUrl;

  const displayStart = formatDisplayTime(block.startTime);
  const displayEnd = formatDisplayTime(block.endTime);

  let statusClass = 'status-pill-btn--proposed';
  let statusLabel = 'Proposed';
  if (block.status === 'confirmed') {
    statusClass = 'status-pill-btn--confirmed';
    statusLabel = 'Confirmed';
  } else if (block.status === 'tentative') {
    statusClass = 'status-pill-btn--tentative';
    statusLabel = 'Weather Permitting';
  } else if (isCancelled) {
    statusClass = 'status-pill-btn--cancelled';
    statusLabel = 'Free Time / Relax';
  }

  const catInfo = CATEGORY_MAP[block.category] || CATEGORY_MAP.activity;

  const rawReqs = Array.isArray(block.requirements) ? block.requirements : [];
  const cleanReqs = Array.from(new Set(rawReqs.filter(Boolean)));
  const completedCount = cleanReqs.filter((_, idx) => checkedRequirements.has(`${block.id}-${idx}`)).length;

  const thread = getThreadById(block.id);
  const threadMsgCount = thread && thread.messages ? thread.messages.length : 0;

  let statusIconSvg = '';
  if (block.status === 'confirmed') {
    statusIconSvg = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  } else if (block.status === 'tentative') {
    statusIconSvg = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/></svg>';
  } else if (isCancelled) {
    statusIconSvg = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>';
  } else {
    statusIconSvg = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
  }

  const collapsedStatusLabel = isCancelled
    ? 'Free Time'
    : block.status === 'tentative'
    ? 'Weather'
    : block.status === 'confirmed'
    ? 'Confirmed'
    : 'Proposed';

  const proposedActionsHtml = renderProposedActionsBar(block);
  const advisoryHtml = renderScheduleAdvisory(block);
  const weatherAlertBannerHtml = renderWeatherAlertBanner(block, weatherAlertActive);

  const hasAdvisory =
    !block.advisoryDismissed &&
    (block.advisory ||
      (block.title && (block.title.includes('Siam Road') || block.title.includes('Char Koay Teow'))) ||
      block.id === 'd1-siam-ckt');

  const isPenangHill =
    block.id === 'd1-penang-hill' ||
    block.id === 'penang-hill-canopy' ||
    (block.title && block.title.includes('Penang Hill')) ||
    (block.id === 'd1-2' && block.title && block.title.includes('Penang'));

  if (!isExpanded) {
    // Collapsed State
    return `
      <article class="timeline-card timeline-card--collapsed timeline-card--${block.category} ${isProposed ? 'timeline-card--proposed' : ''} ${isCancelled ? 'timeline-card--cancelled' : ''} ${isReel ? 'timeline-card--has-reel' : ''}">
        <div class="timeline-card__collapsed-split" data-toggle-details="${block.id}" role="button" tabindex="0" aria-expanded="false">
          <!-- Left Column: Times with Status & Category Badges -->
          <div class="timeline-card__time-col">
            <div class="time-col__times">
              <span class="time-col__start">${displayStart}</span>
              <span class="time-col__divider">to</span>
              <span class="time-col__end">${displayEnd}</span>
            </div>
            <div class="time-col__badges">
              <span class="timeline-card__status-pill ${isProposed ? 'timeline-card__status-pill--proposed-glow' : `timeline-card__status-pill--${block.status}`}" title="Status: ${statusLabel}">
                ${statusIconSvg}
                <span>${collapsedStatusLabel}</span>
              </span>
              <span class="timeline-card__category-badge timeline-card__category-badge--${block.category}">
                ${catInfo.icon}
                <span>${catInfo.badgeLabel || catInfo.label}</span>
              </span>
              ${
                isReel
                  ? `
                <button type="button" class="card-origin-badge card-origin-badge--reel card-origin-badge--time-col" data-preview-reel-id="${block.id}" title="Watch Reel Preview">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                  <span>Reel Pick</span>
                </button>
              `
                  : ''
              }
            </div>
          </div>

          <!-- Right Column: Title & Location -->
          <div class="timeline-card__body-col">
            <div class="timeline-card__title-row">
              <h3 class="timeline-card__title">${block.title}</h3>
              ${hasAdvisory ? `<span class="timeline-card__advisory-pill" title="Closed on Mondays: Tap to view fallback">⚠️ Closed Mondays</span>` : ''}
              ${weatherAlertActive && isPenangHill && block.status !== 'cancelled' ? `<button type="button" class="timeline-card__weather-pill" data-resolve-contingency="${block.id}" title="Heavy Monsoon Downpour: Tap to resolve contingency">🌧️ Monsoon Alert</button>` : ''}
            </div>
            ${
              block.location
                ? `
              <div class="timeline-card__location-row" title="${block.location}">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span class="timeline-card__location-text">${block.location}</span>
              </div>
            `
                : ''
            }
          </div>

          <!-- Right Edge Controls -->
          <div class="timeline-card__right-actions">
            <button type="button" class="timeline-card__chevron-btn" data-toggle-details="${block.id}" aria-label="Expand details">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <button type="button" class="timeline-card__thread-pill-btn" data-thread-btn="${block.id}" title="Open Activity Discussion">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              ${threadMsgCount > 0 ? `<span class="thread-badge-count">${threadMsgCount}</span>` : ''}
            </button>
          </div>
        </div>
        ${isProposed ? proposedActionsHtml : ''}
      </article>
    `;
  }

  // Expanded State
  return `
    <article class="timeline-card timeline-card--expanded timeline-card--${block.category} ${isProposed ? 'timeline-card--proposed' : ''} ${isCancelled ? 'timeline-card--cancelled' : ''} ${isReel ? 'timeline-card--has-reel' : ''}">
      <div class="timeline-card__expanded-inner">
        <!-- Header: Badges & Shift / Collapse Controls -->
        <div class="timeline-card__expanded-header">
          <div class="timeline-card__expanded-header-left">
            <div class="timeline-card__expanded-badges">
              <button type="button" class="status-pill-btn ${isProposed ? 'timeline-card__status-pill--proposed-glow' : statusClass}" data-status-btn="${block.id}" title="Tap to change status lifecycle">
                ${statusIconSvg}
                <span>${statusLabel}</span>
              </button>
              <span class="timeline-card__category-badge timeline-card__category-badge--${block.category}">
                ${catInfo.icon}
                <span>${catInfo.label}</span>
              </span>
              <span class="timeline-card__time-pill">
                ${displayStart} – ${displayEnd}
              </span>
            </div>
          </div>

          <!-- Shift Buttons and Collapse Chevron -->
          <div class="split-left__shift-controls" style="display: flex; align-items: center; gap: 4px;">
            <button type="button" class="shift-btn shift-up-btn" data-id="${block.id}" title="Shift event earlier" ${index === 0 ? 'disabled' : ''}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
            <button type="button" class="shift-btn shift-down-btn" data-id="${block.id}" title="Shift event later" ${index === totalBlocks - 1 ? 'disabled' : ''}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <button type="button" class="timeline-card__chevron-btn timeline-card__chevron-btn--active" data-toggle-details="${block.id}" aria-label="Collapse details">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
            </button>
          </div>
        </div>

        <!-- Showcase Hero Row: Venue Artwork Circle + Title + Reel Pick + Location -->
        <div class="timeline-card__showcase-row">
          <div class="detail-panel__photo-wrapper">
            ${getVenueThumbnail(block)}
          </div>
          <div class="timeline-card__showcase-info">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
              <h3 class="timeline-card__title timeline-card__title--expanded">${block.title}</h3>
              ${
                isReel
                  ? `
                <button type="button" class="card-origin-badge card-origin-badge--reel" data-preview-reel-id="${block.id}" title="Watch Reel Preview">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                  <span>Watch Reel</span>
                </button>
              `
                  : ''
              }
            </div>
            ${
              block.location
                ? `
              <div class="detail-panel__location" title="${block.location}">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>${block.location}</span>
              </div>
            `
                : ''
            }
          </div>
        </div>

        <!-- Details Content Strip -->
        <div class="timeline-card__details-content">
          ${weatherAlertBannerHtml}
          ${advisoryHtml}

          ${
            block.notes
              ? `
            <div class="detail-panel__notes">
              <p>${block.notes}</p>
            </div>
          `
              : ''
          }



          <!-- Requirements Checklist -->
          ${
            cleanReqs.length > 0
              ? `
            <div class="detail-panel__requirements">
              <div class="requirements-header">
                <span class="requirements-title">Checklist & Pre-Trip Prep</span>
                <span class="requirements-count">${completedCount}/${cleanReqs.length} Ready</span>
              </div>
              <div class="requirements-list">
                ${cleanReqs
                  .map((req, rIdx) => {
                    const reqKey = `${block.id}-${rIdx}`;
                    const isChecked = checkedRequirements.has(reqKey);
                    return `
                    <label class="requirement-item ${isChecked ? 'requirement-item--done' : ''}">
                      <input 
                        type="checkbox" 
                        class="requirement-checkbox" 
                        data-req-key="${reqKey}"
                        ${isChecked ? 'checked' : ''}
                      />
                      <span class="requirement-custom-box">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </span>
                      <span class="requirement-text">${req}</span>
                    </label>
                  `;
                  })
                  .join('')}
              </div>
            </div>
          `
              : ''
          }

          <!-- Contingency Fallback Notice (if configured) -->
          ${
            block.fallback
              ? `
            <div class="contingency-card">
              <div class="contingency-card__header">
                <span class="contingency-card__badge">Rain Contingency</span>
                <button type="button" class="contingency-card__swap-btn btn-swap-fallback" data-swap-fallback="${block.id}" title="Swap with indoor fallback activity">
                  <span>Swap to Fallback</span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
              </div>
              <div class="contingency-card__body">
                <span class="contingency-card__title">${block.fallback}</span>
              </div>
            </div>
          `
              : ''
          }

          <!-- Bottom Action Row: Thread, Edit, Delete, and Drag Handle -->
          <div class="detail-panel__bottom-row">
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <button type="button" class="btn-thread-badge btn-thread-badge--inline" data-thread-btn="${block.id}" title="Open Activity Chat Thread">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>Thread ${threadMsgCount > 0 ? `(${threadMsgCount})` : ''}</span>
              </button>

              <button type="button" class="btn-card-action btn-card-action--edit" data-edit-block="${block.id}" title="Edit activity details" aria-label="Edit activity">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                <span>Edit</span>
              </button>

              <button type="button" class="btn-card-action btn-card-action--delete btn-card-action--icon-only" data-delete-block="${block.id}" title="Delete block from schedule" aria-label="Delete block">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>

            <div class="drag-grip drag-grip--inline" data-id="${block.id}" title="Hold and drag to reorder schedule" aria-label="Drag handle">
              <svg width="12" height="14" viewBox="0 0 16 20" fill="currentColor" opacity="0.65">
                <circle cx="5" cy="4" r="1.5"/><circle cx="11" cy="4" r="1.5"/>
                <circle cx="5" cy="10" r="1.5"/><circle cx="11" cy="10" r="1.5"/>
                <circle cx="5" cy="16" r="1.5"/><circle cx="11" cy="16" r="1.5"/>
              </svg>
            </div>
          </div>
        </div>
        ${isProposed ? proposedActionsHtml : ''}
      </div>
    </article>
  `;
}
