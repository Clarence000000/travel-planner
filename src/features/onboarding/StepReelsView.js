/**
 * StepReelsView: Social video input, trending demo reels picker, and AI keyframe extraction animation.
 */

import { escapeHtml } from './onboardingPresets.js';

export function renderReelsView(reelUrl) {
  return `
    <div class="onboarding-header onboarding-header--with-back">
      <button type="button" class="onboarding-back-btn" id="btn-back-menu" aria-label="Go back">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
        <span>Back</span>
      </button>
      <div class="onboarding-step-indicator">Step 1 of 2 • Video Scan</div>
      <h2 class="onboarding-title">Import from Social Reels</h2>
      <p class="onboarding-subtitle">Paste an Instagram Reel, TikTok, or YouTube Short link:</p>
    </div>

    <div class="onboarding-form">
      <div class="onboarding-field">
        <label class="onboarding-field__label">Social Video Link</label>
        <div class="onboarding-input-wrap">
          <input 
            type="url" 
            class="onboarding-url-input" 
            id="reel-url-input" 
            value="${escapeHtml(reelUrl)}"
            placeholder="https://www.instagram.com/reel/..."
          />
        </div>
      </div>

      <div class="onboarding-field">
        <label class="onboarding-field__label">Or pick a trending demo video:</label>
        <div class="onboarding-demo-reels">
          <!-- Demo Reel 1: Penang Foodie 2 Anchors -->
          <button type="button" class="demo-reel-card demo-reel-card--hero" data-reel-key="penangfoodie" data-reel-url="https://www.instagram.com/reel/C8x9_penang_heritage">
            <div class="demo-reel-card__badge" style="background:#FEE2E2; color:#DC2626;">FEATURED REEL</div>
            <strong class="demo-reel-card__title">@penangfoodie: 5 Must-Visit Heritage Spots &amp; Sunset Lookouts</strong>
            <span class="demo-reel-card__meta">3.8M views • 2 anchors detected</span>
          </button>

          <!-- Demo Reel 2: Penang Vibes 3 Anchors -->
          <button type="button" class="demo-reel-card" data-reel-key="penangvibes" data-reel-url="https://www.instagram.com/reel/C8_georgetown_heritage">
            <div class="demo-reel-card__badge" style="background:#E0E7FF; color:#4338CA;">TRENDING</div>
            <strong class="demo-reel-card__title">@penangvibes: George Town Colonial Streets &amp; Street Art</strong>
            <span class="demo-reel-card__meta">1.9M views • 3 anchors detected</span>
          </button>
        </div>
      </div>

      <button type="button" class="btn btn--primary onboarding-submit-btn" id="btn-submit-reel">
        <span>Scan Video &amp; Extract Spots</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>
    </div>
  `;
}

export function renderExtractingView(currentSourceInfo, processingStep) {
  const isPenangVibes = currentSourceInfo.creator === '@penangvibes';
  const steps = isPenangVibes
    ? [
        'Scanning video keyframes & audio stream...',
        'Recognizing George Town colonial streets & Chew Jetty...',
        'Extracting Blue Mansion & Penang Hill coordinates...',
        '3 anchor spots verified & ready for scheduling!',
      ]
    : [
        'Scanning video keyframes & audio stream...',
        'Recognizing George Town heritage landmarks...',
        'Extracting geo-coordinates for Chew Jetty & Penang Hill...',
        'Anchor spots verified & ready for scheduling!',
      ];
  const progressPercent = Math.min(100, Math.round(((processingStep + 1) / steps.length) * 100));

  return `
    <div class="onboarding-extracting">
      <div class="extracting-pulse-ring">
        <div class="extracting-radar"></div>
        <div class="extracting-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EC4899" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
        </div>
      </div>
      <h3 class="extracting-title">AI is Extracting Keyframes</h3>
      <p class="extracting-subtitle">Scanning video frames and extracting verified geo-coordinates from reel.</p>

      <div class="extracting-progress-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em;">
        <span>Scanning Video Keyframes</span>
        <span style="color: #EC4899; font-family: monospace; font-size: 13px; font-weight: 800;">${progressPercent}%</span>
      </div>
      <div class="extracting-progress-bar-wrap" style="height: 8px; background: rgba(0, 0, 0, 0.08); border-radius: 9999px; overflow: hidden; margin-bottom: 20px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.08);">
        <div class="extracting-progress-bar" style="width: ${progressPercent}%; height: 100%; border-radius: 9999px; background: linear-gradient(90deg, #EC4899, var(--color-primary)); box-shadow: 0 0 10px rgba(236, 72, 153, 0.4); transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);"></div>
      </div>

      <div class="extracting-steps-list">
        ${steps
          .map((text, i) => {
            const isDone = i < processingStep;
            const isActive = i === processingStep;
            return `
            <div class="extracting-step-item ${isActive ? 'extracting-step-item--active' : ''} ${isDone ? 'extracting-step-item--done' : ''}">
              <span class="extracting-step-icon">
                ${
                  isDone
                    ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>`
                    : isActive
                    ? `<svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"></circle></svg>`
                    : `<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg>`
                }
              </span>
              <span>${text}</span>
            </div>
          `;
          })
          .join('')}
      </div>
    </div>
  `;
}
