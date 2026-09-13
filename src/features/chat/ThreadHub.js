/**
 * ThreadHub: Hub thread cards, categorised groupings, and empty states.
 */

import {
  THREAD_CATEGORIES,
  normalizeCategory,
  getThreadDay,
  getCategoryIconSvg,
  getDayCalendarIconSvg,
  getPollsIconSvg,
} from '../../models/chatData.js';
import { escapeHtml } from './ToastNotice.js';

export function renderThreadCardHTML(t) {
  const lastMsg = t.messages.length > 0 ? t.messages[t.messages.length - 1] : null;
  const normCat = normalizeCategory(t.category);
  const day = getThreadDay(t);
  const dayLabel = day ? `Day ${day}` : 'Trip-Wide';

  return `
    <div class="thread-item-card" data-thread-id="${t.blockId}" role="button" tabindex="0" aria-label="Open discussion: ${escapeHtml(t.title)}">
      <div class="thread-item-card__icon thread-item-card__icon--${normCat}" aria-hidden="true">
        ${getCategoryIconSvg(normCat, 18)}
      </div>
      <div class="thread-item-card__content">
        <div class="thread-item-card__top">
          <h3 class="thread-item-card__title">${escapeHtml(t.title)}</h3>
          <span class="thread-item-card__time">${lastMsg ? lastMsg.time : ''}</span>
        </div>
        <p class="thread-item-card__snippet">
          ${lastMsg ? `<strong>${escapeHtml(lastMsg.sender.split(' ')[0])}:</strong> ${escapeHtml(lastMsg.text)}` : 'No messages yet. Tap to start discussion.'}
        </p>
        <div class="thread-item-card__footer">
          <span class="thread-day-pill">
            ${getDayCalendarIconSvg(10)}
            <span>${dayLabel}</span>
          </span>
          ${
            t.poll
              ? `
            <span class="thread-item-card__badge thread-item-card__badge--poll" title="Group Decision Poll Active" aria-label="Group Decision Poll Active">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            </span>`
              : ''
          }
        </div>
      </div>
      <div class="thread-item-card__arrow" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </div>
    </div>
  `;
}

export function renderEmptyState(message) {
  return `
    <div class="threads-empty-state" style="text-align: center; padding: 40px 20px; background: var(--color-surface); border-radius: var(--radius-xl); border: 1px solid var(--color-border); margin: var(--space-3) 0;">
      <div style="width: 48px; height: 48px; margin: 0 auto var(--space-2); border-radius: 50%; background: var(--color-surface-alt); display: flex; align-items: center; justify-content: center; color: var(--color-text-secondary);">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
      </div>
      <p style="font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-3);">${message}</p>
      <button type="button" class="btn btn--secondary btn--sm" id="btn-reset-filter">Reset Filters</button>
    </div>
  `;
}

export function renderCategorisedSectionsHTML(scopedThreads, filter, hubDayFilter) {
  if (scopedThreads.length === 0 && filter === 'all') {
    const dayText = hubDayFilter === 'all' ? '' : hubDayFilter === 'trip' ? 'Trip-Wide ' : `Day ${hubDayFilter} `;
    return renderEmptyState(`No ${dayText}discussions match your active filter.`);
  }

  if (filter === 'polls') {
    const pollThreads = scopedThreads.filter((t) => Boolean(t.poll));
    if (pollThreads.length === 0) {
      return renderEmptyState('No threads currently have active consensus polls in this view.');
    }
    return `
      <section class="thread-category-group" data-category="polls">
        <div class="thread-category-header">
          <div class="thread-category-header__left">
            <div class="thread-category-header__icon thread-category-header__icon--polls">
              ${getPollsIconSvg(16)}
            </div>
            <h2 class="thread-category-header__name">Active Consensus Polls</h2>
          </div>
          <span class="thread-category-header__count">${pollThreads.length} ${pollThreads.length === 1 ? 'poll' : 'polls'}</span>
        </div>
        <div class="threads-list">
          ${pollThreads.map(renderThreadCardHTML).join('')}
        </div>
      </section>
    `;
  }

  const categoriesToRender = filter === 'all' ? THREAD_CATEGORIES : THREAD_CATEGORIES.filter((c) => c.id === filter);

  let renderedAny = false;
  let html = '';

  categoriesToRender.forEach((cat) => {
    const catThreads = scopedThreads.filter((t) => normalizeCategory(t.category) === cat.id);
    if (catThreads.length === 0 && filter === 'all') {
      return;
    }

    renderedAny = true;
    html += `
      <section class="thread-category-group" data-category="${cat.id}">
        <div class="thread-category-header">
          <div class="thread-category-header__left">
            <div class="thread-category-header__icon thread-category-header__icon--${cat.id}">
              ${cat.iconSvg}
            </div>
            <h2 class="thread-category-header__name">${cat.name}</h2>
          </div>
          <span class="thread-category-header__count">${catThreads.length} ${catThreads.length === 1 ? 'thread' : 'threads'}</span>
        </div>

        <div class="threads-list">
          ${
            catThreads.length > 0
              ? catThreads.map(renderThreadCardHTML).join('')
              : `<div class="thread-empty-category">
                  <p>No discussions in ${cat.label} yet.</p>
                  <button type="button" class="btn btn--secondary btn--sm btn-create-in-cat" data-category="${cat.id}">+ Start ${cat.label} Thread</button>
                 </div>`
          }
        </div>
      </section>
    `;
  });

  if (!renderedAny) {
    return renderEmptyState(`No discussions found in this category.`);
  }

  return html;
}
