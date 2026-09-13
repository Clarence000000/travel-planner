/**
 * StepRevealView: Synthesis loading progress and final Trip Reveal Summary Sheet with Squad Share.
 */

import { escapeHtml } from './onboardingPresets.js';

export function renderProcessingView(processingType, survey, extractedAnchors, processingStep) {
  const isReel = processingType === 'reels';
  const cityName = (survey.destination || 'Penang').split(',')[0].trim();
  const steps = isReel
    ? [
        `Calibrating GrabCar transit buffers between anchors...`,
        `Locking customized timeslots into Day 1 & Day 2...`,
        `Injecting authentic foodie wishlist stops...`,
        `Finalizing collaborative timeline DNA with travel squad...`,
      ]
    : [
        `Weaving group wishlists & ${survey.vibe} travel preferences...`,
        `Calculating multi-stop transit matrix for ${cityName}...`,
        `Reserving authentic lunch window for squad voting...`,
        `Finalizing collaborative timeline DNA with travel squad...`,
      ];
  const progressPercent = Math.min(100, Math.round(((processingStep + 1) / steps.length) * 100));

  return `
    <div class="onboarding-extracting">
      <div class="extracting-pulse-ring">
        <div class="extracting-radar"></div>
        <div class="extracting-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
        </div>
      </div>
      <h3 class="extracting-title">${isReel ? 'AI is Building Your Itinerary' : 'AI is Assembling Your Trip'}</h3>
      <p class="extracting-subtitle">${isReel ? `Synthesizing ${extractedAnchors.length} detected spots into an optimized Day 1 schedule with GrabCar transit buffers.` : 'Balancing transit buffer guards, schedule slots, and squad synchronization.'}</p>

      <div class="extracting-progress-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em;">
        <span>${isReel ? 'Assembling Reel Itinerary' : 'Synthesizing Custom Itinerary'}</span>
        <span style="color: var(--color-primary); font-family: monospace; font-size: 13px; font-weight: 800;">${progressPercent}%</span>
      </div>
      <div class="extracting-progress-bar-wrap" style="height: 8px; background: rgba(0, 0, 0, 0.08); border-radius: 9999px; overflow: hidden; margin-bottom: 20px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.08);">
        <div class="extracting-progress-bar" style="width: ${progressPercent}%; height: 100%; border-radius: 9999px; background: linear-gradient(90deg, #F59E0B, var(--color-primary)); box-shadow: 0 0 10px rgba(232, 98, 26, 0.4); transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);"></div>
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

export function renderRevealView(survey, processingType, extractedAnchors) {
  const isReel = processingType === 'reels';
  const isTokyo = survey.destination && survey.destination.toLowerCase().includes('tokyo');
  const cityName = (survey.destination || 'Penang').split(',')[0].trim();
  const destLower = (survey.destination || 'penang').toLowerCase();
  const citySlug = destLower.includes('tokyo') ? 'tokyo' : destLower.includes('seoul') ? 'seoul' : destLower.includes('taipei') ? 'taipei' : 'penang';
  const activeSquad = ['Clarence', 'Tony', 'Wei Gang'];
  const shareLink = `https://wandersync.app/join/${citySlug}-squad-842`;

  const daySnapshots = isTokyo
    ? [
        { title: 'Senso-ji Temple & Traditional Street Walk', meta: 'Subway buffers • Open Asakusa lunch window' },
        { title: 'Nozomi Shinkansen to Kyoto & Arashiyama Bamboo', meta: 'Bullet train reserved • SmartEX sync' },
        { title: 'Modern Akihabara Tech Crawl & Shinjuku Night', meta: '2 activities • Evening panoramic view' },
      ]
    : [
        { title: 'Historic Waterfront, Open Lunch Gap & Penang Hill', meta: '2 scheduled anchors • 4-hour lunch window reserved' },
        { title: 'Teluk Bahang Rainforest & Batu Ferringhi Sunset', meta: 'Autonomous squad research armed in background' },
        { title: 'Michelin Hawker Enclave & Street Art Farewell', meta: 'Hawker route calculated • Airport transit cushion' },
      ];

  const anchorChips = isReel
    ? extractedAnchors.map((a) => `${a.title.split('(')[0].trim()} (${a.startTime || '09:30'})`)
    : isTokyo
    ? ['Senso-ji Temple Walk (10:45 AM)', 'Arashiyama Bamboo Grove (10:05 AM)', 'Tsukiji Fresh Eats (Saved to Wishlist)']
    : ['Clan Jetties Heritage Walk (09:30 AM)', 'Penang Hill Canopy Walk (16:30 PM)', 'Chendul & Siam Road (Saved to Wishlist)'];

  return `
    <div class="onboarding-reveal">
      <div class="reveal-hero">
        <span class="reveal-hero__badge">Trip Synthesis Ready</span>
        <h2 class="reveal-hero__title">${escapeHtml(survey.destination || 'Penang, Malaysia')}</h2>
        
        <div class="reveal-dna-bar">
          <span class="reveal-dna-pill">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span>${survey.duration} Days</span>
          </span>
          <span class="reveal-dna-pill">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span>${survey.pace.charAt(0).toUpperCase() + survey.pace.slice(1)} Pace</span>
          </span>
          <span class="reveal-dna-pill">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>Transit Buffer Safe</span>
          </span>
          <span class="reveal-dna-pill" style="color: #059669; background: rgba(16, 185, 129, 0.12); border-color: rgba(16, 185, 129, 0.25);">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="7" r="4"></circle><path d="M5.5 21a8.38 8.38 0 0 1 13 0"></path></svg>
            <span>${activeSquad.length} Squad Members</span>
          </span>
        </div>
      </div>

      <div class="reveal-days-list">
        <div class="reveal-day-card">
          <div class="reveal-day-num">D1</div>
          <div class="reveal-day-info">
            <h4 class="reveal-day-title">${escapeHtml(daySnapshots[0].title)}</h4>
            <span class="reveal-day-meta">${escapeHtml(daySnapshots[0].meta)}</span>
          </div>
        </div>

        <div class="reveal-day-card">
          <div class="reveal-day-num">D2</div>
          <div class="reveal-day-info">
            <h4 class="reveal-day-title">${escapeHtml(daySnapshots[1].title)}</h4>
            <span class="reveal-day-meta">${escapeHtml(daySnapshots[1].meta)}</span>
          </div>
        </div>

        ${
          survey.duration >= 3
            ? `
          <div class="reveal-day-card">
            <div class="reveal-day-num">D3</div>
            <div class="reveal-day-info">
              <h4 class="reveal-day-title">${escapeHtml(daySnapshots[2].title)}</h4>
              <span class="reveal-day-meta">${escapeHtml(daySnapshots[2].meta)}</span>
            </div>
          </div>
        `
            : ''
        }
      </div>

      <div class="reveal-anchors-box">
        <span class="reveal-anchors-title">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          <span>${isReel ? 'Extracted Anchors Arranged' : 'Curated Anchors Scheduled'}</span>
        </span>
        <div class="reveal-anchors-chips">
          ${anchorChips.map((chip) => `<span class="reveal-anchor-tag">${escapeHtml(chip)}</span>`).join('')}
        </div>
      </div>

      <div class="onboarding-field" style="margin-top: 4px;">
        <div class="onboarding-field__split-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <label class="onboarding-field__label" style="margin-bottom: 0;">Traveling Squad &amp; Live Sync</label>
          <span style="font-size: 10px; padding: 2px 8px; border-radius: 9999px; background: rgba(16, 185, 129, 0.12); color: #059669; font-weight: 700;">● Live Sync Ready</span>
        </div>

        <div class="share-link-row">
          <input type="text" class="share-link-input" id="onboarding-share-link" value="${shareLink}" readonly />
          <button type="button" class="btn btn--secondary btn-copy-invite" id="btn-onboarding-copy-link">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <span id="copy-btn-text">Copy Link</span>
          </button>
          <button type="button" class="btn btn--secondary btn-qr-toggle" id="btn-toggle-qr" title="Show QR Code">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          </button>
        </div>

        <div id="onboarding-qr-container" style="display: none; margin-top: 8px; text-align: center; padding: 10px; background: rgba(255,255,255,0.9); border-radius: 12px; border: 1px solid rgba(0,0,0,0.08);">
          <div style="font-size: 11px; font-weight: 600; color: #64748B; margin-bottom: 6px;">Scan with phone camera to join ${escapeHtml(cityName)} squad</div>
          <svg width="84" height="84" viewBox="0 0 100 100" fill="none">
            <rect width="100" height="100" fill="white" rx="8"/>
            <rect x="10" y="10" width="26" height="26" fill="#0F172A" rx="3"/>
            <rect x="14" y="14" width="18" height="18" fill="white" rx="2"/>
            <rect x="18" y="18" width="10" height="10" fill="#0F172A" rx="1"/>
            <rect x="64" y="10" width="26" height="26" fill="#0F172A" rx="3"/>
            <rect x="68" y="14" width="18" height="18" fill="white" rx="2"/>
            <rect x="72" y="18" width="10" height="10" fill="#0F172A" rx="1"/>
            <rect x="10" y="64" width="26" height="26" fill="#0F172A" rx="3"/>
            <rect x="14" y="68" width="18" height="18" fill="white" rx="2"/>
            <rect x="18" y="72" width="10" height="10" fill="#0F172A" rx="1"/>
            <rect x="42" y="12" width="6" height="6" fill="#0F172A"/>
            <rect x="52" y="18" width="6" height="6" fill="#0F172A"/>
            <rect x="44" y="28" width="6" height="6" fill="#0F172A"/>
            <rect x="12" y="44" width="6" height="6" fill="#0F172A"/>
            <rect x="24" y="52" width="6" height="6" fill="#0F172A"/>
            <rect x="42" y="42" width="16" height="16" fill="#E8621A" rx="2"/>
            <rect x="64" y="44" width="6" height="6" fill="#0F172A"/>
            <rect x="76" y="52" width="6" height="6" fill="#0F172A"/>
            <rect x="44" y="66" width="6" height="6" fill="#0F172A"/>
            <rect x="56" y="72" width="6" height="6" fill="#0F172A"/>
            <rect x="72" y="72" width="6" height="6" fill="#0F172A"/>
          </svg>
        </div>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: rgba(255, 255, 255, 0.75); border-radius: 12px; border: 1px solid rgba(0, 0, 0, 0.08); margin-top: 4px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="display: flex; margin-left: 4px;">
            <span class="member-avatar member-avatar--cl" style="border: 2px solid #fff; margin-left: -4px;">CL</span>
            <span class="member-avatar member-avatar--tn" style="border: 2px solid #fff; margin-left: -6px;">TN</span>
            <span class="member-avatar member-avatar--wg" style="border: 2px solid #fff; margin-left: -6px;">WG</span>
          </div>
          <span style="font-size: 11px; font-weight: 600; color: #334155;">Clarence, Tony, Wei Gang</span>
        </div>
        <span style="font-size: 10px; color: #059669; font-weight: 700;">● Connected</span>
      </div>

      <div class="reveal-actions" style="margin-top: 10px;">
        <button type="button" class="btn btn--primary onboarding-submit-btn" id="btn-reveal-confirm">
          <span>Launch Trip Canvas</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-left: 6px;"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
        <button type="button" class="reveal-btn-reedit" id="btn-reveal-adjust">
          ← Adjust Settings
        </button>
      </div>
    </div>
  `;
}
