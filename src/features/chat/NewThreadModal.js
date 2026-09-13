/**
 * NewThreadModal: Category & Day chip picker modal for creating a new discussion thread.
 */

import { THREAD_CATEGORIES, createChatThread } from '../../models/chatData.js';
import { getTripSettings } from '../../models/tripSettings.js';

export function openNewThreadModal(defaultCategory = 'general', hubDayFilter = 'all', onThreadCreated) {
  const backdrop = document.createElement('div');
  backdrop.className = 'new-thread-backdrop';

  backdrop.innerHTML = `
    <div class="new-thread-sheet" role="dialog" aria-labelledby="modal-new-thread-title">
      <div class="new-thread-sheet__header">
        <div>
          <span class="view-badge">New Discussion</span>
          <h2 id="modal-new-thread-title" style="margin: 4px 0 0; font-size: var(--text-base); font-weight: var(--font-bold); color: var(--color-text-primary);">
            Start Topic Thread
          </h2>
        </div>
        <button type="button" class="drawer-close-btn" id="btn-close-new-thread" aria-label="Close modal" style="min-width: 44px; min-height: 44px;">✕</button>
      </div>

      <form id="form-new-thread">
        <!-- Category Selector -->
        <div class="form-group">
          <label class="form-label" style="display: block; font-size: var(--text-xs); font-weight: var(--font-bold); color: var(--color-text-secondary); margin-bottom: 6px;">
            Select Category
          </label>
          <div class="new-thread-category-chips">
            ${THREAD_CATEGORIES.map(
              (c) => `
              <button 
                type="button" 
                class="new-thread-cat-chip ${c.id === defaultCategory ? 'new-thread-cat-chip--active' : ''} new-thread-cat-chip--${c.id}" 
                data-cat="${c.id}"
              >
                <span class="new-thread-cat-chip__icon">${c.iconSvg}</span>
                <span>${c.label}</span>
              </button>
            `
            ).join('')}
          </div>
          <input type="hidden" id="input-thread-category" value="${defaultCategory}" />
        </div>

        <!-- Trip Day Schedule -->
        <div class="form-group" style="margin-top: var(--space-3);">
          <label class="form-label" style="display: block; font-size: var(--text-xs); font-weight: var(--font-bold); color: var(--color-text-secondary); margin-bottom: 6px;">
            Trip Day Schedule
          </label>
          <div class="new-thread-day-chips" id="modal-day-selector-group">
            <button type="button" class="new-thread-day-chip ${hubDayFilter === 'all' || hubDayFilter === 'trip' ? 'new-thread-day-chip--active' : ''}" data-day="all">Trip-Wide / All</button>
            ${Array.from({ length: getTripSettings().totalDays || 3 }, (_, i) => i + 1)
              .map((dayNum) => {
                const isActive = hubDayFilter === dayNum || hubDayFilter === String(dayNum);
                return `<button type="button" class="new-thread-day-chip ${isActive ? 'new-thread-day-chip--active' : ''}" data-day="${dayNum}">Day ${dayNum}</button>`;
              })
              .join('')}
          </div>
          <input type="hidden" id="input-thread-day" value="${hubDayFilter !== 'all' ? hubDayFilter : 'all'}" />
        </div>

        <!-- Topic / Title -->
        <div class="form-group" style="margin-top: var(--space-3);">
          <label for="input-thread-title" class="form-label" style="display: block; font-size: var(--text-xs); font-weight: var(--font-bold); color: var(--color-text-secondary); margin-bottom: 4px;">
            Topic / Place Name <span style="color: var(--color-primary);">*</span>
          </label>
          <input 
            type="text" 
            id="input-thread-title" 
            class="form-input" 
            placeholder="e.g. Lunch at Gurney Drive Hawker Centre" 
            required
            style="width: 100%; padding: 10px 14px; border-radius: var(--radius-lg); border: 1px solid var(--color-border); font-size: var(--text-sm); background: var(--color-surface-alt);"
          />
        </div>

        <!-- Location -->
        <div class="form-group" style="margin-top: var(--space-3);">
          <label for="input-thread-location" class="form-label" style="display: block; font-size: var(--text-xs); font-weight: var(--font-bold); color: var(--color-text-secondary); margin-bottom: 4px;">
            Location / Area
          </label>
          <input 
            type="text" 
            id="input-thread-location" 
            class="form-input" 
            placeholder="e.g. George Town, Penang" 
            style="width: 100%; padding: 10px 14px; border-radius: var(--radius-lg); border: 1px solid var(--color-border); font-size: var(--text-sm); background: var(--color-surface-alt);"
          />
        </div>

        <!-- Initial Message -->
        <div class="form-group" style="margin-top: var(--space-3);">
          <label for="input-thread-msg" class="form-label" style="display: block; font-size: var(--text-xs); font-weight: var(--font-bold); color: var(--color-text-secondary); margin-bottom: 4px;">
            Initial Message <span style="color: var(--color-primary);">*</span>
          </label>
          <textarea 
            id="input-thread-msg" 
            class="form-textarea" 
            rows="3" 
            placeholder="What would you like to discuss with the travel group?" 
            required
            style="width: 100%; padding: 10px 14px; border-radius: var(--radius-lg); border: 1px solid var(--color-border); font-size: var(--text-sm); background: var(--color-surface-alt); font-family: inherit; resize: none;"
          ></textarea>
        </div>

        <div style="margin-top: var(--space-4); display: flex; gap: var(--space-2);">
          <button type="button" class="btn btn--secondary" id="btn-cancel-new-thread" style="flex: 1;">Cancel</button>
          <button type="submit" class="btn btn--primary" id="btn-submit-new-thread" style="flex: 2;">Create & Open Thread</button>
        </div>
      </form>
    </div>
  `;

  const catInput = backdrop.querySelector('#input-thread-category');
  backdrop.querySelectorAll('.new-thread-cat-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      backdrop.querySelectorAll('.new-thread-cat-chip').forEach((c) => c.classList.remove('new-thread-cat-chip--active'));
      chip.classList.add('new-thread-cat-chip--active');
      catInput.value = chip.getAttribute('data-cat');
    });
  });

  const dayInput = backdrop.querySelector('#input-thread-day');
  backdrop.querySelectorAll('#modal-day-selector-group .new-thread-day-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      backdrop.querySelectorAll('#modal-day-selector-group .new-thread-day-chip').forEach((c) => c.classList.remove('new-thread-day-chip--active'));
      chip.classList.add('new-thread-day-chip--active');
      dayInput.value = chip.getAttribute('data-day');
    });
  });

  const closeModal = () => backdrop.remove();

  backdrop.querySelector('#btn-close-new-thread').addEventListener('click', closeModal);
  backdrop.querySelector('#btn-cancel-new-thread').addEventListener('click', closeModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });

  const form = backdrop.querySelector('#form-new-thread');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = backdrop.querySelector('#input-thread-title').value.trim();
    const category = catInput.value;
    const dayVal = dayInput.value;
    const location = backdrop.querySelector('#input-thread-location').value.trim() || 'George Town, Penang';
    const initialMessage = backdrop.querySelector('#input-thread-msg').value.trim();

    if (!title || !initialMessage) return;

    const created = createChatThread({
      title,
      category,
      day: dayVal === 'all' ? null : parseInt(dayVal, 10),
      location,
      initialMessage,
    });

    closeModal();
    if (typeof onThreadCreated === 'function') onThreadCreated(created);
  });

  document.body.appendChild(backdrop);
}
