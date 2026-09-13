/**
 * ScheduleAdvisory: Apple iOS 26 anti-slop alert for closed venue warnings (e.g. Siam Road CKT on Mondays).
 */

export function renderScheduleAdvisory(block) {
  const hasAdvisory =
    !block.advisoryDismissed &&
    (block.advisory ||
      (block.title && (block.title.includes('Siam Road') || block.title.includes('Char Koay Teow'))) ||
      block.id === 'd1-siam-ckt');

  if (!hasAdvisory) return '';

  const advisoryText =
    (block.advisory && typeof block.advisory === 'object' ? block.advisory.text : block.advisory) ||
    'Siam Road Char Koay Teow is closed on Mondays. Consider swapping with Day 3.';

  return `
    <div class="timeline-card__advisory" id="advisory-${block.id}">
      <div class="timeline-card__advisory-top">
        <div class="timeline-card__advisory-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
            <line x1="10" y1="14" x2="14" y2="18"></line>
            <line x1="14" y1="14" x2="10" y2="18"></line>
          </svg>
        </div>
        <div class="timeline-card__advisory-text">
          <strong>Schedule Advisory:</strong> ${advisoryText}
        </div>
      </div>
      <div class="timeline-card__advisory-actions">
        <button type="button" class="btn-shift-day3" data-shift-day3="${block.id}">
          Shift to Day 3 · Wed
        </button>
        <button type="button" class="btn-keep-advisory" data-keep-advisory="${block.id}">
          Keep Anyway
        </button>
      </div>
    </div>
  `;
}
