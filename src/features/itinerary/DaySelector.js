/**
 * DaySelector: Day switching bar with dynamic days, ambient activity dot, and Add Day controls.
 */

import { formatDateRange, getTripSettings } from '../../models/tripSettings.js';

export function renderDaySelector({
  dayList,
  currentDay,
  day2HasActivity,
  day2SimulationState,
  onSelectDay,
  onAddDay,
  onRemoveDay,
}) {
  const container = document.createElement('div');
  container.className = 'itinerary-day-selector';

  const settings = getTripSettings();
  let baseDate = new Date();
  if (settings.startDate) {
    const parsed = new Date(settings.startDate);
    if (!isNaN(parsed.getTime())) baseDate = parsed;
  }

  const daysHtml = dayList
    .map((dayNum) => {
      const isActive = dayNum === currentDay;
      const dayDate = new Date(baseDate);
      dayDate.setDate(baseDate.getDate() + (dayNum - 1));
      const dateLabel = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Ambient simulation activity dot on Day 2
      const showActivityDot = dayNum === 2 && day2HasActivity;
      const activityCount = day2SimulationState?.count || 0;

      return `
        <div class="day-chip-wrapper" style="position: relative; display: inline-flex; align-items: center;">
          <button 
            type="button" 
            class="day-chip ${isActive ? 'day-chip--active' : ''}" 
            data-day="${dayNum}"
            aria-current="${isActive ? 'true' : 'false'}"
          >
            <span class="day-chip__label">Day ${dayNum}</span>
            <span class="day-chip__sep">•</span>
            <span class="day-chip__date">${dateLabel}</span>
            ${
              showActivityDot
                ? `
              <span class="day-activity-dot-pulse" title="${activityCount} collaboration activities incoming">
                <span class="pulse-ring"></span>
                <span class="pulse-core"></span>
              </span>
            `
                : ''
            }
          </button>
          ${
            dayList.length > 1 && isActive
              ? `
            <button 
              type="button" 
              class="btn-remove-day-mini" 
              data-remove-day="${dayNum}" 
              title="Remove Day ${dayNum}"
              aria-label="Remove Day ${dayNum}"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          `
              : ''
          }
        </div>
      `;
    })
    .join('');

  container.innerHTML = `
    <div class="day-chip-row day-selector-scroll">
      ${daysHtml}
      <button type="button" class="day-chip--add btn-add-day-pill" id="btn-add-day" title="Add a day to itinerary">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        <span>Add Day</span>
      </button>
    </div>
  `;

  // Attach event handlers
  container.querySelectorAll('.day-chip[data-day]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const day = parseInt(btn.dataset.day, 10);
      if (typeof onSelectDay === 'function') onSelectDay(day);
    });
  });

  const addBtn = container.querySelector('#btn-add-day');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      if (typeof onAddDay === 'function') onAddDay();
    });
  }

  container.querySelectorAll('.btn-remove-day-mini').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const day = parseInt(btn.dataset.removeDay, 10);
      if (typeof onRemoveDay === 'function') onRemoveDay(day);
    });
  });

  return container;
}
