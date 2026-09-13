/**
 * GhostCard: Frosted-glass dashed styling and interactive voting actions for proposed blocks.
 */

export function renderProposedActionsBar(block) {
  if (block.status !== 'proposed') return '';

  return `
    <div class="timeline-card__proposed-bar" data-proposed-actions="${block.id}">
      <div class="proposed-bar__info">
        <span class="proposed-bar__hint">
          <span class="proposed-bar__hint-dot"></span>
          <span>Awaiting team consensus</span>
        </span>
      </div>
      <div class="proposed-bar__actions">
        <button type="button" class="btn-card-vote" data-vote-proposed="${block.id}" title="Put to group consensus vote">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="m9 12 2 2 4-4"/>
            <path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z"/>
            <path d="M22 19H2"/>
          </svg>
          <span>Vote</span>
        </button>
      </div>
    </div>
  `;
}
