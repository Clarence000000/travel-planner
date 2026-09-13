/**
 * StepCustomizeView: Review detected venues, configure trip dates, and drag to prioritize anchors.
 */

import { formatDateRange } from '../../models/tripSettings.js';
import { escapeHtml } from './onboardingPresets.js';

export function renderAnchorCard(anchor, index, totalDays = 3, extractedCount = 2) {
  let dayOptions = '';
  for (let d = 1; d <= totalDays; d++) {
    dayOptions += `<option value="${d}" ${anchor.day === d ? 'selected' : ''}>Day ${d} ▾</option>`;
  }

  return `
    <div 
      class="customize-anchor-card" 
      draggable="true" 
      data-anchor-id="${anchor.id}" 
      data-index="${index}"
      tabindex="0"
      role="listitem"
    >
      <div style="display: flex; align-items: center; gap: 4px;">
        <div 
          class="drag-grip drag-grip--inline customize-drag-handle" 
          data-action="reorder"
          data-index="${index}"
          title="Hold and drag to reorder schedule" 
          aria-label="Drag handle"
        >
          <svg width="12" height="14" viewBox="0 0 16 20" fill="currentColor" opacity="0.65">
            <circle cx="5" cy="4" r="1.5"/><circle cx="11" cy="4" r="1.5"/>
            <circle cx="5" cy="10" r="1.5"/><circle cx="11" cy="10" r="1.5"/>
            <circle cx="5" cy="16" r="1.5"/><circle cx="11" cy="16" r="1.5"/>
          </svg>
        </div>
        <div class="customize-reorder-actions">
          ${index > 0 ? `<button type="button" class="btn-reorder-move" data-move="up" data-index="${index}" title="Move up" aria-label="Move up">▲</button>` : ''}
          ${index < extractedCount - 1 ? `<button type="button" class="btn-reorder-move" data-move="down" data-index="${index}" title="Move down" aria-label="Move down">▼</button>` : ''}
        </div>
      </div>

      <div class="customize-anchor-content">
        <h4 class="customize-anchor-title">${escapeHtml(anchor.title)}</h4>
        <div class="customize-anchor-loc-row">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="customize-anchor-loc-icon">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span class="customize-anchor-loc-text">${escapeHtml(anchor.location)}</span>
        </div>
        <div class="customize-anchor-time-row">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="customize-anchor-time-icon">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span class="customize-anchor-time-text">${escapeHtml(anchor.timeSlot)}</span>
        </div>
      </div>

      <div class="customize-day-select-wrap">
        <select 
          class="customize-day-select" 
          data-anchor-id="${anchor.id}"
          aria-label="Assigned day for ${escapeHtml(anchor.title)}"
        >
          ${dayOptions}
        </select>
      </div>
    </div>
  `;
}

export function renderCustomizeView(survey, currentSourceInfo, extractedAnchors) {
  const rangeLabel = formatDateRange(survey.startDate, survey.endDate, survey.duration);

  return `
    <div class="onboarding-header onboarding-header--with-back">
      <button type="button" class="onboarding-back-btn" id="btn-back-reels" aria-label="Go back">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
        <span>Back</span>
      </button>
      <div class="onboarding-step-indicator">Step 2 of 2 • Customize Schedule</div>
      <h2 class="onboarding-title">Customize Extracted Schedule</h2>
      <p class="onboarding-subtitle">Review detected venues, configure trip dates, and drag to prioritize.</p>
    </div>

    <div class="onboarding-form customize-form">
      <!-- Source Reel Callout Card -->
      <div class="customize-source-card">
        <div class="customize-source-card__icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
        </div>
        <div class="customize-source-card__info">
          <div class="customize-source-card__creator">${escapeHtml(currentSourceInfo.creator || '@penangfoodie')}</div>
          <div class="customize-source-card__title">${escapeHtml(currentSourceInfo.title || 'Extracted Social Video Highlights')}</div>
        </div>
        <span class="customize-source-card__tag">${escapeHtml(currentSourceInfo.tag || 'Verified Scan')}</span>
      </div>

      <!-- Date Range Configuration -->
      <div class="onboarding-field">
        <div class="onboarding-field__split-header">
          <label class="onboarding-field__label">Trip Dates</label>
          <span class="onboarding-duration-badge" id="customize-range-display-label">${rangeLabel}</span>
        </div>

        <div class="onboarding-dates-row">
          <div class="onboarding-date-box">
            <label class="onboarding-date-label">Start Date</label>
            <input 
              type="date" 
              class="onboarding-date-input" 
              id="customize-start-date" 
              value="${survey.startDate}" 
            />
          </div>
          <div class="onboarding-date-arrow">→</div>
          <div class="onboarding-date-box">
            <label class="onboarding-date-label">End Date</label>
            <input 
              type="date" 
              class="onboarding-date-input" 
              id="customize-end-date" 
              value="${survey.endDate}" 
            />
          </div>
        </div>

        <!-- Quick Duration Stepper -->
        <div class="onboarding-stepper-row">
          <span class="onboarding-stepper-label">Duration Quick Stepper:</span>
          <div class="onboarding-stepper">
            <button type="button" class="onboarding-stepper-btn" id="btn-cust-duration-minus" aria-label="Decrease days">−</button>
            <span class="onboarding-stepper-val" id="cust-stepper-duration-val">${survey.duration} Days</span>
            <button type="button" class="onboarding-stepper-btn" id="btn-cust-duration-plus" aria-label="Increase days">+</button>
          </div>
        </div>
      </div>

      <!-- Section 2: Draggable & Tap-Reorder Anchors -->
      <div class="onboarding-field customize-anchors-section">
        <div class="customize-section-header">
          <label class="onboarding-field__label" style="margin-bottom: 0;">Extracted Anchors (${extractedAnchors.length})</label>
          <span class="customize-drag-hint">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="7 8 12 3 17 8"></polyline><polyline points="7 16 12 21 17 16"></polyline><line x1="12" y1="3" x2="12" y2="21"></line></svg>
            <span>Drag or use arrows to reorder</span>
          </span>
        </div>

        <div class="customize-anchors-list" id="customize-anchors-list" role="list">
          ${extractedAnchors.map((anchor, index) => renderAnchorCard(anchor, index, survey.duration || 3, extractedAnchors.length)).join('')}
        </div>
      </div>

      <!-- Proceed to Processing / Reveal -->
      <button type="button" class="btn btn--primary onboarding-submit-btn" id="btn-build-itinerary">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
        <span>Build Itinerary</span>
      </button>
    </div>
  `;
}
