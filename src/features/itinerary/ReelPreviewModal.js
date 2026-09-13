/**
 * ReelPreviewModal: Social media reels preview sheet with creator badge, simulated video player, and location tag.
 */

export function openReelPreviewModal(block) {
  const existing = document.querySelector('.reel-preview-backdrop');
  if (existing) existing.remove();

  const backdrop = document.createElement('div');
  backdrop.className = 'reel-preview-backdrop';

  const title = block.title || 'Penang Highlight';
  const location = block.location || 'George Town, Penang';
  const creator = block.creator || '@penangfoodie';
  const views = block.reelViews || '284K views';

  backdrop.innerHTML = `
    <div class="reel-preview-sheet" role="dialog" aria-modal="true" aria-labelledby="reel-preview-title">
      <div class="reel-preview-sheet__header">
        <div class="reel-preview-sheet__creator">
          <div class="reel-creator-avatar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
          </div>
          <div class="reel-creator-meta">
            <span class="reel-creator-name">${creator}</span>
            <span class="reel-creator-badge">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Verified Creator</span>
            </span>
          </div>
        </div>
        <button type="button" class="drawer-close-btn" id="btn-close-reel-preview" aria-label="Close reel preview">✕</button>
      </div>

      <div class="reel-video-mockup">
        <div class="reel-video-overlay">
          <div class="reel-play-btn-circle">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFFFFF"><polygon points="6 3 20 12 6 21 6 3"/></svg>
          </div>
          <span class="reel-duration-badge">0:45</span>
        </div>
        <div class="reel-mockup-scrim">
          <div class="reel-stats-row">
            <span class="reel-stat-chip">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <span>42.8K</span>
            </span>
            <span class="reel-stat-chip">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span>1.2K</span>
            </span>
            <span class="reel-stat-chip">${views}</span>
          </div>
        </div>
      </div>

      <div class="reel-preview-sheet__details">
        <div class="reel-source-tag">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
          <span>Instagram Reel · Extracted via WanderSync Genesis</span>
        </div>
        <h4 id="reel-preview-title" class="reel-preview-spot-title">${title}</h4>
        <p class="reel-preview-spot-location">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>${location}</span>
        </p>
      </div>

      <div class="reel-preview-sheet__actions">
        <button type="button" class="btn btn--primary" id="btn-close-reel-action" style="width: 100%; border-radius: 9999px; padding: 12px; font-weight: 700;">
          Back to Itinerary
        </button>
      </div>
    </div>
  `;

  const closeBtn = backdrop.querySelector('#btn-close-reel-preview');
  const actionCloseBtn = backdrop.querySelector('#btn-close-reel-action');

  const close = () => {
    backdrop.classList.remove('is-open');
    setTimeout(() => backdrop.remove(), 250);
  };

  if (closeBtn) closeBtn.addEventListener('click', close);
  if (actionCloseBtn) actionCloseBtn.addEventListener('click', close);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  document.body.appendChild(backdrop);
  requestAnimationFrame(() => backdrop.classList.add('is-open'));
}
