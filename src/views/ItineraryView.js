/**
 * Interactive Drag-and-Drop Itinerary View
 * Conforms to .agents/skills/travel-planner-ui specifications:
 * 1. Vertical timeline spine connecting chronological time blocks.
 * 2. High-performance auto-scroll engine when dragging cards near screen edges.
 * 3. Automatic schedule time recalculation preserving activity durations and transit buffers.
 * 4. Deduplicated requirements and non-repeating tags.
 * 5. In-place card details expansion preserving scroll position.
 * 6. Slot status lifecycle (Proposed, Confirmed, Weather Permitting with Fallback).
 * 7. Transit buffer recalculation and warning alerts.
 */

import {
  getItineraryData,
  saveItineraryData,
  resetItineraryData,
} from '../models/itineraryData.js';
import {
  calculateItineraryBuffers,
  recalculateDaySchedule,
  formatDisplayTime,
  formatDuration,
  timeToMinutes,
} from '../utils/bufferEngine.js';
import { createStatusModal } from '../components/itinerary/StatusModal.js';
import { createAddBlockModal } from '../components/itinerary/AddBlockModal.js';
import { getThreadById, addMessageToThread, getCategoryIconSvg, getDayCalendarIconSvg } from '../models/chatData.js';
import { setActiveTab } from '../config/navigation.js';
import { enableDragScroll } from '../utils/dragScroll.js';

export function createItineraryView() {
  const container = document.createElement('div');
  container.className = 'feature-view itinerary-view';

  let itineraryList = getItineraryData();
  let currentDay = 1;
  let expandedCardIds = new Set(['d1-2']); // Card 1 (Hotel) collapsed, Card 2 (Senso-ji) expanded by default

  // Modals
  let statusModal;
  let addBlockModal;

  // Auto-scroll controller for drag-and-drop
  let autoScrollRaf = null;
  let autoScrollDelta = 0;
  let savedScrollBehavior = '';

  function startDragSession() {
    savedScrollBehavior = document.documentElement.style.scrollBehavior || '';
    // Disable smooth-scrolling during drag so window.scrollBy updates instantly without 60fps throttling
    document.documentElement.style.scrollBehavior = 'auto';
  }

  function endDragSession() {
    stopAutoScroll();
    document.documentElement.style.scrollBehavior = savedScrollBehavior;
  }

  function updateAutoScroll(pointerY) {
    const vh = window.innerHeight;
    const topThreshold = 150; // 150px from viewport top (covers header + chips)
    const bottomThreshold = vh - 130; // 130px from viewport bottom (~64px bottom nav + 66px zone)

    if (pointerY > bottomThreshold) {
      // Near bottom edge -> scroll down briskly
      const distanceIntoZone = pointerY - bottomThreshold;
      const ratio = Math.min(1.8, Math.max(0, distanceIntoZone / 80));
      // Responsive speed: starts at 12px/frame, ramps up smoothly to 40px/frame (~720px/s to 2400px/s)
      autoScrollDelta = Math.round(12 + Math.pow(ratio, 1.1) * 28);
    } else if (pointerY < topThreshold) {
      // Near top edge -> scroll up briskly
      const distanceIntoZone = topThreshold - pointerY;
      const ratio = Math.min(1.8, Math.max(0, distanceIntoZone / 80));
      autoScrollDelta = -Math.round(12 + Math.pow(ratio, 1.1) * 28);
    } else {
      autoScrollDelta = 0;
    }

    if (autoScrollDelta !== 0 && !autoScrollRaf) {
      const loop = () => {
        if (autoScrollDelta !== 0) {
          // Instant behavior ensures each frame advances immediately without waiting on CSS animations
          window.scrollBy({ top: autoScrollDelta, left: 0, behavior: 'instant' });
          autoScrollRaf = requestAnimationFrame(loop);
        } else {
          autoScrollRaf = null;
        }
      };
      autoScrollRaf = requestAnimationFrame(loop);
    } else if (autoScrollDelta === 0 && autoScrollRaf) {
      cancelAnimationFrame(autoScrollRaf);
      autoScrollRaf = null;
    }
  }

  function stopAutoScroll() {
    autoScrollDelta = 0;
    if (autoScrollRaf) {
      cancelAnimationFrame(autoScrollRaf);
      autoScrollRaf = null;
    }
  }

  function showScheduleToast(message) {
    let toast = document.querySelector('.schedule-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'schedule-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #4ADE80;"><polyline points="20 6 9 17 4 12"/></svg>
      <span>${message}</span>
    `;
    toast.classList.add('is-visible');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 2400);
  }

  function initModals() {
    // Prevent DOM accumulation by removing existing itinerary modals
    document.querySelectorAll('.itinerary-modal-backdrop').forEach((el) => el.remove());

    statusModal = createStatusModal({
      onSave: (blockId, newStatus, newFallback) => {
        itineraryList = itineraryList.map((b) => {
          if (b.id === blockId) {
            return {
              ...b,
              status: newStatus,
              fallback: newFallback !== undefined ? newFallback : b.fallback,
            };
          }
          return b;
        });
        saveItineraryData(itineraryList);
        render();
      },
    });

    addBlockModal = createAddBlockModal({
      onAdd: (newBlock) => {
        const dayBlocks = getDayBlocks();
        dayBlocks.push(newBlock);
        // Automatically calculate chronological times
        const recomputed = recalculateDaySchedule(dayBlocks);
        setDayBlocks(recomputed);
        render();
        showScheduleToast('New activity added & schedule recomputed.');
      },
    });

    document.body.appendChild(statusModal.element);
    document.body.appendChild(addBlockModal.element);
  }

  function getDayBlocks() {
    return itineraryList.filter((b) => b.day === currentDay);
  }

  function setDayBlocks(updatedDayBlocks) {
    const otherDays = itineraryList.filter((b) => b.day !== currentDay);
    itineraryList = [...otherDays, ...updatedDayBlocks];
    saveItineraryData(itineraryList);
  }

  function render() {
    const rawBlocks = getDayBlocks();
    const blocksWithBuffers = calculateItineraryBuffers(rawBlocks);

    // Check if any buffer warnings exist on this day
    const activeWarnings = blocksWithBuffers.filter(
      (b) => b.transitBuffer && b.transitBuffer.isDeficit
    );

    container.innerHTML = `
      <!-- Atmospheric Vertical Asset Banner (Sticky Cat Photo Header) -->
      <div class="view-banner" style="background-image: url('./src/assets/bg-itinerary.png');">
        <button type="button" class="view-banner__menu-btn" id="btn-open-sidebar" aria-label="Open Trip Menu" title="Open Menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div class="view-banner__scrim">
          <span class="view-banner__badge"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> Interactive Master Timeline</span>
          <h2 class="view-banner__title">Drag-and-Drop Itinerary</h2>
        </div>
      </div>

      <div class="view-header">
        <div class="view-header__meta">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="view-badge">Interactive Timeline</span>
            <span class="itinerary-count-badge">${rawBlocks.length} Scheduled Stops</span>
          </div>
          <p class="view-subtitle">
            Drag or use arrows to reorder. Schedule times & buffers recalculate automatically.
          </p>
        </div>
        
        <!-- Day Selector Chips -->
        <div class="day-chip-row" role="tablist" aria-label="Trip Days">
          <button type="button" class="day-chip ${currentDay === 1 ? 'day-chip--active' : ''}" data-day="1">
            Day 1 • Tokyo Arrival
          </button>
          <button type="button" class="day-chip ${currentDay === 2 ? 'day-chip--active' : ''}" data-day="2">
            Day 2 • Kyoto Heritage
          </button>
          <button type="button" class="day-chip ${currentDay === 3 ? 'day-chip--active' : ''}" data-day="3">
            Day 3 • Modern Shibuya
          </button>
        </div>
      </div>

      <!-- Transit Buffer Warning Banner (if any buffer deficit exists) -->
      ${
        activeWarnings.length > 0
          ? `
        <div class="alert-banner alert-banner--warning">
          <div class="alert-banner__icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div class="alert-banner__content">
            <strong>Transit Buffer Alert:</strong> ${activeWarnings.length} stop(s) have tight transit windows! Shifting blocks will auto-recalculate times.
          </div>
        </div>
      `
          : ''
      }

      <!-- Action Toolbar -->
      <div class="itinerary-actions-bar">
        <button type="button" class="btn btn--primary btn--sm" id="propose-block-btn">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <span>Propose Activity</span>
        </button>
        <button type="button" class="btn btn--secondary btn--sm" id="reset-itinerary-btn" title="Reset to default schedule">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
          <span>Reset Trip</span>
        </button>
      </div>

      <!-- Draggable Timeline Blocks Container with Vertical Spine -->
      <div class="timeline-feed" id="timeline-feed-target">
        ${renderTimelineItems(blocksWithBuffers)}
      </div>
    `;

    attachEvents(rawBlocks);
  }

  function getVenueThumbnail(block) {
    const idSuffix = block.id || Math.random().toString(36).slice(2, 6);

    // 1. Senso-ji Temple Gate (Iconic Kaminarimon with curved eaves, red pillars, giant red lantern)
    if (block.id === 'd1-2' || (block.title && (block.title.includes('Senso-ji') || block.title.includes('Shrine')))) {
      return `
        <svg class="venue-circle-svg" viewBox="0 0 64 64" width="36" height="36" xmlns="http://www.w3.org/2000/svg" aria-label="Traditional Shrine">
          <defs>
            <linearGradient id="skyGrad-${idSuffix}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#3B82F6"/>
              <stop offset="55%" stop-color="#93C5FD"/>
              <stop offset="100%" stop-color="#EFF6FF"/>
            </linearGradient>
            <linearGradient id="lanternGrad-${idSuffix}" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#EF4444"/>
              <stop offset="45%" stop-color="#DC2626"/>
              <stop offset="100%" stop-color="#991B1B"/>
            </linearGradient>
            <linearGradient id="roofGrad-${idSuffix}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#374151"/>
              <stop offset="100%" stop-color="#111827"/>
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill="url(#skyGrad-${idSuffix})"/>
          <ellipse cx="48" cy="18" rx="10" ry="4" fill="#FFFFFF" opacity="0.6"/>
          <ellipse cx="16" cy="16" rx="8" ry="3" fill="#FFFFFF" opacity="0.5"/>
          <path d="M4 22 C18 16 46 16 60 22 L57 26 L7 26 Z" fill="url(#roofGrad-${idSuffix})"/>
          <path d="M8 23 C20 18 44 18 56 23" stroke="#F59E0B" stroke-width="1.5" fill="none"/>
          <rect x="10" y="26" width="44" height="5" fill="#991B1B"/>
          <rect x="12" y="30" width="5" height="34" fill="#DC2626"/>
          <rect x="47" y="30" width="5" height="34" fill="#DC2626"/>
          <ellipse cx="32" cy="39" rx="11" ry="13" fill="url(#lanternGrad-${idSuffix})"/>
          <line x1="32" y1="26" x2="32" y2="30" stroke="#111827" stroke-width="2.5"/>
          <rect x="25" y="29" width="14" height="3" fill="#111827" rx="1"/>
          <rect x="25" y="48" width="14" height="3" fill="#111827" rx="1"/>
          <circle cx="32" cy="39" r="5.5" fill="#FBBF24" opacity="0.9"/>
          <text x="32" y="42" font-size="6.5" font-family="'Inter', sans-serif" font-weight="900" fill="#111827" text-anchor="middle">雷</text>
          <rect x="0" y="56" width="64" height="8" fill="#E2E8F0"/>
        </svg>
      `;
    }

    // 2. Hotel Check-in / Rest
    if (block.category === 'rest') {
      return `
        <svg class="venue-circle-svg" viewBox="0 0 64 64" width="36" height="36" xmlns="http://www.w3.org/2000/svg" aria-label="Hotel Lobby">
          <defs>
            <linearGradient id="hotelGrad-${idSuffix}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#EEF2FF"/>
              <stop offset="100%" stop-color="#C7D2FE"/>
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill="url(#hotelGrad-${idSuffix})"/>
          <rect x="18" y="16" width="28" height="48" fill="#4338CA" rx="3"/>
          <rect x="23" y="21" width="5" height="5" fill="#FEF08A" rx="1"/>
          <rect x="36" y="21" width="5" height="5" fill="#FEF08A" rx="1"/>
          <rect x="23" y="30" width="5" height="5" fill="#FEF08A" rx="1"/>
          <rect x="36" y="30" width="5" height="5" fill="#FEF08A" rx="1"/>
          <rect x="23" y="39" width="5" height="5" fill="#FEF08A" rx="1"/>
          <rect x="36" y="39" width="5" height="5" fill="#FEF08A" rx="1"/>
          <polygon points="16,50 48,50 44,55 20,55" fill="#E8621A"/>
        </svg>
      `;
    }

    // 3. Meals & Street Food
    if (block.category === 'meal') {
      return `
        <svg class="venue-circle-svg" viewBox="0 0 64 64" width="36" height="36" xmlns="http://www.w3.org/2000/svg" aria-label="Street Food & Matcha">
          <defs>
            <linearGradient id="mealBg-${idSuffix}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#FEF3C7"/>
              <stop offset="100%" stop-color="#FDE68A"/>
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill="url(#mealBg-${idSuffix})"/>
          <ellipse cx="32" cy="42" rx="18" ry="11" fill="#065F46"/>
          <ellipse cx="32" cy="40" rx="15" ry="8" fill="#10B981"/>
          <line x1="16" y1="20" x2="48" y2="20" stroke="#78350F" stroke-width="2.5"/>
          <circle cx="24" cy="20" r="4.5" fill="#F472B6"/>
          <circle cx="33" cy="20" r="4.5" fill="#FFFFFF"/>
          <circle cx="42" cy="20" r="4.5" fill="#34D399"/>
        </svg>
      `;
    }

    // 4. Transit / Shinkansen Bullet Train
    if (block.category === 'transit' || (block.title && block.title.includes('Shinkansen'))) {
      return `
        <svg class="venue-circle-svg" viewBox="0 0 64 64" width="36" height="36" xmlns="http://www.w3.org/2000/svg" aria-label="Bullet Train">
          <defs>
            <linearGradient id="trainBg-${idSuffix}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#E0F2FE"/>
              <stop offset="100%" stop-color="#BAE6FD"/>
            </linearGradient>
            <linearGradient id="trainNose-${idSuffix}" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#FFFFFF"/>
              <stop offset="100%" stop-color="#F1F5F9"/>
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill="url(#trainBg-${idSuffix})"/>
          <path d="M12 40 C16 26 32 24 54 24 L54 44 L12 44 Z" fill="url(#trainNose-${idSuffix})"/>
          <path d="M14 36 C24 33 36 32 54 32 L54 35 C36 35 24 36 14 39 Z" fill="#0284C7"/>
          <path d="M22 28 C28 26 34 26 38 28 L36 31 C32 30 28 30 24 31 Z" fill="#1E293B"/>
          <line x1="8" y1="46" x2="56" y2="46" stroke="#64748B" stroke-width="2"/>
          <line x1="12" y1="49" x2="52" y2="49" stroke="#94A3B8" stroke-width="1.5" stroke-dasharray="3,2"/>
        </svg>
      `;
    }

    // 5. Digital Art Museum & Sightseeing
    return `
      <svg class="venue-circle-svg" viewBox="0 0 64 64" width="36" height="36" xmlns="http://www.w3.org/2000/svg" aria-label="Sightseeing Landmark">
        <defs>
          <linearGradient id="artBg-${idSuffix}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#3B82F6"/>
            <stop offset="100%" stop-color="#8B5CF6"/>
          </linearGradient>
        </defs>
        <rect width="64" height="64" fill="url(#artBg-${idSuffix})"/>
        <polygon points="32,14 46,32 32,50 18,32" fill="#FFFFFF" opacity="0.85"/>
        <circle cx="32" cy="32" r="6" fill="#FBBF24"/>
      </svg>
    `;
  }

    function renderTimelineItems(blocks) {
    if (blocks.length === 0) {
      return `
        <div style="text-align: center; padding: 40px 20px; background: var(--color-surface); border-radius: var(--radius-xl); border: 1px dashed var(--color-border);">
          <p style="font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: 12px;">No activities scheduled for this day yet.</p>
          <button type="button" class="btn btn--primary btn--sm" id="empty-add-btn">Propose First Activity</button>
        </div>
      `;
    }

    const categoryMap = {
      activity: {
        label: 'Activity',
        badgeLabel: 'ACTIVITY',
        icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
      },
      meal: {
        label: 'Meal',
        badgeLabel: 'MEAL',
        icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path></svg>`,
      },
      transit: {
        label: 'Transit',
        badgeLabel: 'TRANSIT',
        icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="4" y="3" width="16" height="16" rx="2"></rect><path d="M4 11h16"></path><path d="M12 3v8"></path></svg>`,
      },
      rest: {
        label: 'Check-in / Rest',
        badgeLabel: 'CHECK-IN / REST',
        icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
      },
    };

    return blocks
      .map((block, index) => {
        const isExpanded = expandedCardIds.has(block.id);
        const buffer = block.transitBuffer;

        // Formatted times
        const displayStart = formatDisplayTime(block.startTime);
        const displayEnd = formatDisplayTime(block.endTime);

        // Status styling and label
        let statusClass = 'status-pill-btn--proposed';
        let statusLabel = 'Proposed';
        if (block.status === 'confirmed') {
          statusClass = 'status-pill-btn--confirmed';
          statusLabel = 'Confirmed';
        } else if (block.status === 'tentative') {
          statusClass = 'status-pill-btn--tentative';
          statusLabel = 'Weather Permitting';
        }

        const catInfo = categoryMap[block.category] || categoryMap.activity;

        // Deduplicate requirements array
        const rawReqs = Array.isArray(block.requirements) ? block.requirements : [];
        const cleanReqs = Array.from(new Set(rawReqs.filter(Boolean)));

        // Discussion thread message count
        const thread = getThreadById(block.id);
        const threadMsgCount = thread && thread.messages ? thread.messages.length : 0;

        // Inline Status Vector Icon
        let statusIconSvg = '';
        if (block.status === 'confirmed') {
          statusIconSvg = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        } else if (block.status === 'tentative') {
          statusIconSvg = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
        } else {
          statusIconSvg = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
        }

        let cardContent = '';

        if (!isExpanded) {
          // Collapsed State: Clean 2-Row Layout with Inline Status Icon and Quick Activity Thread
          cardContent = `
            <article class="timeline-card timeline-card--collapsed timeline-card--${block.category}">
              <div class="timeline-card__collapsed-split" data-toggle-details="${block.id}" role="button" tabindex="0" aria-expanded="false">
                <!-- Left Column: Fixed-width Clean Stacked Times -->
                <div class="timeline-card__time-col">
                  <span class="time-col__start">${displayStart}</span>
                  <span class="time-col__divider">to</span>
                  <span class="time-col__end">${displayEnd}</span>
                </div>

                <!-- Right Column: Predictable 2-row layout -->
                <div class="timeline-card__body-col">
                  <h3 class="timeline-card__title" title="${block.title}">${block.title}</h3>
                  <div class="timeline-card__sub-row">
                    <span class="timeline-card__category-badge timeline-card__category-badge--${block.category}">
                      ${catInfo.icon}
                      <span>${catInfo.label}</span>
                    </span>

                    <!-- Inline Status Vector Icon beside Category Badge -->
                    <span class="timeline-status-icon timeline-status-icon--${block.status}" title="Status: ${statusLabel}">
                      ${statusIconSvg}
                    </span>

                    ${block.location ? `
                      <span class="timeline-card__loc-snippet" title="${block.location}">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        <span>${block.location}</span>
                      </span>
                    ` : ''}
                  </div>
                </div>

                <!-- Far Right: Thread Pill Button & Chevron Expand Button -->
                <div class="timeline-card__right-actions">
                  <button type="button" class="timeline-card__thread-pill-btn" data-thread-btn="${block.id}" title="Open activity thread" aria-label="Activity thread">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <span>${threadMsgCount}</span>
                  </button>

                  <button type="button" class="timeline-card__chevron-btn" data-toggle-details="${block.id}" aria-label="Expand details">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                </div>
              </div>
            </article>
          `;
        } else {
          // OPTION A: Expanded State (Integrated Full-Width Card):
          // Full-width card with no awkward left strip.
          // Top row: time range, category pill, confirmed status badge, and chevron.
          // Showcase row: Venue artwork circle, title, full un-truncated location, origin badge.
          // Single-line dress code, deduplicated checklist, fallback card, and bottom actions.
          cardContent = `
            <article class="timeline-card timeline-card--expanded timeline-card--${block.category}">
              <div class="timeline-card__expanded-inner">
                <!-- Top Row: Time Range, Category Pill, Status Badge & Collapse Chevron -->
                <div class="timeline-card__expanded-header">
                  <div class="timeline-card__expanded-header-left">
                    <span class="timeline-card__time-pill">${displayStart} – ${displayEnd}</span>
                    <span class="timeline-card__category-badge timeline-card__category-badge--${block.category}">
                      ${catInfo.icon}
                      <span>${catInfo.label}</span>
                    </span>
                    <button type="button" class="status-pill-btn ${statusClass}" data-status-btn="${block.id}" title="Click to update status lifecycle">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <span>${statusLabel}</span>
                    </button>
                  </div>

                  <button type="button" class="timeline-card__chevron-btn timeline-card__chevron-btn--active" data-toggle-details="${block.id}" aria-label="Collapse details">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                  </button>
                </div>

                <!-- Venue Showcase Row: Full Title & Complete Location -->
                <div class="timeline-card__showcase-row">
                  <div class="timeline-card__showcase-info">
                    <h3 class="timeline-card__title timeline-card__title--expanded">${block.title}</h3>
                    <div class="detail-panel__location">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <span>${block.location}</span>
                    </div>

                    ${
                      block.source === 'wishlist'
                        ? `<div class="card-origin-badge card-origin-badge--wishlist">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                            <span>Wishlist Anchor (${block.sourceVotes || 4} votes)</span>
                          </div>`
                        : block.source === 'reel'
                        ? `<div class="card-origin-badge card-origin-badge--reel">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                            <span>From Social Reel</span>
                          </div>`
                        : ''
                    }
                  </div>
                </div>

                <!-- Structured Details: Single-line Dress Code, Requirements Checklist, Contingency -->
                <div class="timeline-card__details-content">
                  ${
                    block.dressCode
                      ? `<div class="detail-panel__note-tag">
                          <span class="detail-panel__note-label">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"></path></svg>
                            Dress Code:
                          </span>
                          <span>${block.dressCode}</span>
                        </div>`
                      : ''
                  }

                  ${
                    cleanReqs.length > 0
                      ? `<div class="detail-panel__checklist-section">
                          <div class="checklist-section__header">
                            <span class="req-label-badge">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              <span>${cleanReqs.length === 1 ? cleanReqs[0] : `${cleanReqs.length} Requirements`}</span>
                            </span>
                          </div>
                          <div class="detail-panel__checklist">
                            ${cleanReqs
                              .map(
                                (r) => `
                              <span class="checklist-bullet">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                                ${r}
                              </span>
                            `
                              )
                              .join('')}
                          </div>
                        </div>`
                      : ''
                  }

                  ${
                    block.fallback
                      ? `<div class="fallback-pill-inline">
                          <span style="font-weight: 700; color: #EA580C; display: inline-flex; align-items: center; gap: 4px;">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                            Contingency:
                          </span>
                          <span>${block.fallback}</span>
                        </div>`
                      : ''
                  }

                  <!-- Bottom Action Row: Activity Chat Thread + Drag Grip -->
                  <div class="detail-panel__bottom-row">
                    <button type="button" class="btn-thread-badge btn-thread-badge--inline" data-thread-btn="${block.id}" title="Open Activity Chat Thread">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                      <span>Activity Thread ${threadMsgCount > 0 ? `(${threadMsgCount})` : ''}</span>
                    </button>

                    <div class="drag-grip drag-grip--inline" data-id="${block.id}" title="Hold and drag to reorder schedule" aria-label="Drag handle">
                      <svg width="12" height="14" viewBox="0 0 16 20" fill="currentColor" opacity="0.65">
                        <circle cx="5" cy="4" r="1.5"/><circle cx="11" cy="4" r="1.5"/>
                        <circle cx="5" cy="10" r="1.5"/><circle cx="11" cy="10" r="1.5"/>
                        <circle cx="5" cy="16" r="1.5"/><circle cx="11" cy="16" r="1.5"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          `;
        }

        const isLast = index === blocks.length - 1;
        return `
        <div 
          class="timeline-item-wrapper"  
          data-block-id="${block.id}" 
          data-index="${index}"
          draggable="true"
        >
          <!-- Illustrated Venue SVG Milestone Node on Vertical Spine -->
          <div class="timeline-node-pin" title="${block.title}">
            ${getVenueThumbnail(block)}
          </div>

          <!-- Continuous Vertical Spine Segment (Terminates strictly at the final circle node) -->
          ${!isLast ? '<div class="timeline-spine-connector" aria-hidden="true"></div>' : ''}

          <!-- Timeline Card (Collapsed or Expanded) -->
          ${cardContent}

          <!-- Thin vertical buffer line beneath the card -->
          ${
            buffer
              ? `
            <div class="timeline-buffer-connector">
              <div class="timeline-buffer-line"></div>
              <div class="timeline-buffer-tag ${buffer.isDeficit ? 'timeline-buffer-tag--warning' : ''}">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>${buffer.requiredMinutes}m ${buffer.transitMode || 'Transit'}</span>
                ${buffer.isDeficit ? `<span class="buffer-tight-label">• Tight Buffer</span>` : ''}
              </div>
            </div>
          `
              : ''
          }
        </div>
      `;
      })
      .join('');
  }

  function attachEvents(currentRawBlocks) {
    // 0. Enable horizontal drag scroll on Day selector
    enableDragScroll(container.querySelector('.day-chip-row'));

    // 1. Day Selector Switching
    container.querySelectorAll('.day-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentDay = parseInt(btn.getAttribute('data-day'), 10) || 1;
        render();
      });
    });

    // 2. Propose Block Buttons
    const addBtn = container.querySelector('#propose-block-btn');
    const emptyAddBtn = container.querySelector('#empty-add-btn');
    if (addBtn) addBtn.addEventListener('click', () => addBlockModal.open(currentDay));
    if (emptyAddBtn) emptyAddBtn.addEventListener('click', () => addBlockModal.open(currentDay));

    // 3. Reset Button
    const resetBtn = container.querySelector('#reset-itinerary-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset itinerary back to default schedule?')) {
          itineraryList = resetItineraryData();
          render();
          showScheduleToast('Schedule reset to default.');
        }
      });
    }

    // 4. Status Lifecycle Pill Click
    container.querySelectorAll('[data-status-btn]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const blockId = btn.getAttribute('data-status-btn');
        const block = itineraryList.find((b) => b.id === blockId);
        if (block) statusModal.open(block);
      });
    });

    // 4b. Open Per-Activity Chat Thread
    container.querySelectorAll('[data-thread-btn]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const blockId = btn.getAttribute('data-thread-btn');
        openQuickThreadDrawer(blockId);
      });
    });

    // 5. Expand / Collapse Card (Toggle between Collapsed and Horizontal Split Expanded state)
    container.querySelectorAll('[data-toggle-details]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const blockId = btn.getAttribute('data-toggle-details');
        if (!blockId) return;
        if (expandedCardIds.has(blockId)) {
          expandedCardIds.delete(blockId);
        } else {
          expandedCardIds.add(blockId);
        }
        render();
      });
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          const blockId = btn.getAttribute('data-toggle-details');
          if (!blockId) return;
          if (expandedCardIds.has(blockId)) {
            expandedCardIds.delete(blockId);
          } else {
            expandedCardIds.add(blockId);
          }
          render();
        }
      });
    });

    // 6. Accessible Shift Up / Shift Down Buttons (With Sequential Auto-Recalculation)
    container.querySelectorAll('.shift-up-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const blockId = btn.getAttribute('data-id');
        moveItem(blockId, -1);
      });
    });

    container.querySelectorAll('.shift-down-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const blockId = btn.getAttribute('data-id');
        moveItem(blockId, 1);
      });
    });

    // 7. Drag-and-Drop Reordering Engine with Auto-Scroll & Time Recalculation
    attachDragAndDropHandlers();
  }

  function moveItem(blockId, direction) {
    let rawBlocks = getDayBlocks();
    const index = rawBlocks.findIndex((b) => b.id === blockId);
    if (index === -1) return;

    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= rawBlocks.length) return;

    // Swap items
    const temp = rawBlocks[index];
    rawBlocks[index] = rawBlocks[targetIndex];
    rawBlocks[targetIndex] = temp;

    // Automatically recalculate times sequentially to keep schedule strictly chronological
    rawBlocks = recalculateDaySchedule(rawBlocks);
    setDayBlocks(rawBlocks);
    render();
    showScheduleToast('Schedule updated · Times recalculated');
  }

  function attachDragAndDropHandlers() {
    const feed = container.querySelector('#timeline-feed-target');
    if (!feed) return;

    let draggedWrapper = null;
    let draggedId = null;

    function clearOverClasses() {
      feed.querySelectorAll('.drag-over-above, .drag-over-below').forEach((el) => {
        el.classList.remove('drag-over-above', 'drag-over-below');
      });
    }

    // ── Desktop Drag & Drop (HTML5) with Viewport Auto-Scroll ──
    const wrappers = feed.querySelectorAll('.timeline-item-wrapper');

    wrappers.forEach((wrapper) => {
      wrapper.addEventListener('dragstart', (e) => {
        startDragSession();
        draggedWrapper = wrapper;
        draggedId = wrapper.getAttribute('data-block-id');
        wrapper.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedId);
      });

      wrapper.addEventListener('dragend', () => {
        endDragSession();
        wrapper.classList.remove('is-dragging');
        clearOverClasses();
        draggedWrapper = null;
        draggedId = null;
      });

      wrapper.addEventListener('dragover', (e) => {
        e.preventDefault();
        // Auto-scroll when mouse drags near top/bottom screen edges
        updateAutoScroll(e.clientY);

        if (!draggedWrapper || draggedWrapper === wrapper) return;

        const rect = wrapper.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;

        clearOverClasses();
        if (e.clientY < midY) {
          wrapper.classList.add('drag-over-above');
        } else {
          wrapper.classList.add('drag-over-below');
        }
      });

      wrapper.addEventListener('drop', (e) => {
        e.preventDefault();
        endDragSession();
        if (!draggedId || draggedWrapper === wrapper) return;

        const targetId = wrapper.getAttribute('data-block-id');
        const rect = wrapper.getBoundingClientRect();
        const isAbove = e.clientY < rect.top + rect.height / 2;

        executeReorder(draggedId, targetId, isAbove);
      });
    });

    // Window dragover listener to ensure auto-scroll continues if cursor moves beyond feed
    window.addEventListener('dragover', (e) => {
      if (draggedWrapper) {
        updateAutoScroll(e.clientY);
      }
    });

    // ── Mobile Touch Drag Gesture on .drag-grip with Viewport Auto-Scroll ──
    feed.querySelectorAll('.drag-grip').forEach((grip) => {
      let targetWrapper = null;
      let isTouchDragging = false;

      grip.addEventListener(
        'touchstart',
        (e) => {
          startDragSession();
          targetWrapper = grip.closest('.timeline-item-wrapper');
          if (!targetWrapper) return;
          draggedId = grip.getAttribute('data-id');
          isTouchDragging = true;
          targetWrapper.classList.add('is-dragging');
        },
        { passive: true }
      );

      grip.addEventListener(
        'touchmove',
        (e) => {
          if (!isTouchDragging || !targetWrapper) return;
          const touch = e.touches[0];

          // Auto-scroll when finger drags near top/bottom screen edges
          updateAutoScroll(touch.clientY);

          // Find element under finger
          const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
          const hoverWrapper = elemBelow ? elemBelow.closest('.timeline-item-wrapper') : null;

          clearOverClasses();
          if (hoverWrapper && hoverWrapper !== targetWrapper) {
            const rect = hoverWrapper.getBoundingClientRect();
            if (touch.clientY < rect.top + rect.height / 2) {
              hoverWrapper.classList.add('drag-over-above');
            } else {
              hoverWrapper.classList.add('drag-over-below');
            }
          }
        },
        { passive: true }
      );

      const handleTouchEnd = (e) => {
        if (!isTouchDragging || !targetWrapper) return;
        isTouchDragging = false;
        endDragSession();
        targetWrapper.classList.remove('is-dragging');

        const touch = e.changedTouches[0];
        const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        const hoverWrapper = elemBelow ? elemBelow.closest('.timeline-item-wrapper') : null;

        if (hoverWrapper && hoverWrapper !== targetWrapper) {
          const targetId = hoverWrapper.getAttribute('data-block-id');
          const rect = hoverWrapper.getBoundingClientRect();
          const isAbove = touch.clientY < rect.top + rect.height / 2;
          executeReorder(draggedId, targetId, isAbove);
        } else {
          clearOverClasses();
        }
      };

      grip.addEventListener('touchend', handleTouchEnd);
      grip.addEventListener('touchcancel', () => {
        isTouchDragging = false;
        endDragSession();
        clearOverClasses();
        if (targetWrapper) targetWrapper.classList.remove('is-dragging');
      });
    });

    function executeReorder(sourceId, targetId, placeAbove) {
      let rawBlocks = getDayBlocks();
      const fromIndex = rawBlocks.findIndex((b) => b.id === sourceId);
      const toIndex = rawBlocks.findIndex((b) => b.id === targetId);

      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        clearOverClasses();
        return;
      }

      const [removed] = rawBlocks.splice(fromIndex, 1);
      let insertionIndex = rawBlocks.findIndex((b) => b.id === targetId);
      if (!placeAbove) insertionIndex += 1;

      rawBlocks.splice(insertionIndex, 0, removed);

      // Automatically recalculate schedule times sequentially to keep schedule strictly chronological
      rawBlocks = recalculateDaySchedule(rawBlocks);
      setDayBlocks(rawBlocks);
      render();
      showScheduleToast('Schedule reordered · Times updated chronologically');
    }
  }

  function openQuickThreadDrawer(blockId) {
    const block = itineraryList.find((b) => b.id === blockId) || {};
    const thread = getThreadById(blockId) || {
      blockId,
      title: 'Activity Discussion',
      eventTitle: 'Itinerary Stop',
      category: 'location',
      location: 'Tokyo & Kyoto',
      messages: [],
    };

    const backdrop = document.createElement('div');
    backdrop.className = 'quick-thread-backdrop';

    function renderThreadContent() {
      const catClass = thread.category || 'location';
      const catLabel = catClass.charAt(0).toUpperCase() + catClass.slice(1);

      backdrop.innerHTML = `
        <div class="quick-thread-sheet" role="dialog" aria-labelledby="qt-title">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-divider); padding-bottom: 8px;">
            <div>
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px;">
                <span class="thread-day-pill">${getDayCalendarIconSvg(10)} <span>Day ${block.day || currentDay}</span></span>
              </div>
              <h3 id="qt-title" style="font-size: var(--text-sm); font-weight: bold; color: var(--color-text-primary); margin: 0;">${thread.eventTitle || thread.title}</h3>
            </div>
            <button type="button" class="drawer-close-btn" id="btn-close-qt" aria-label="Close activity thread" style="min-width: 44px; min-height: 44px;">✕</button>
          </div>

          <div class="chat-feed" style="max-height: 250px; overflow-y: auto; padding-right: 4px;">
            ${
              thread.messages.length === 0
                ? `<p style="font-size: 11px; color: var(--color-text-secondary); text-align: center; padding: 18px 0;">No messages in this activity thread yet. Start the discussion below!</p>`
                : thread.messages
                    .map(
                      (m) => `
              <div class="chat-message ${m.isCurrentUser ? 'chat-message--outgoing' : 'chat-message--incoming'}">
                ${!m.isCurrentUser ? `<div class="user-avatar-initials" style="width: 26px; height: 26px; font-size: 10px;">${m.avatar || m.sender.slice(0, 2).toUpperCase()}</div>` : ''}
                <div class="chat-message__bubble">
                  ${!m.isCurrentUser ? `<div class="chat-message__sender">${m.sender}</div>` : ''}
                  <p class="chat-message__text">${m.text}</p>
                  <span class="chat-message__time">${m.time}</span>
                </div>
              </div>
            `
                    )
                    .join('')
            }
          </div>

          <div style="display: flex; gap: 8px; align-items: center;">
            <input 
              type="text" 
              class="chat-input" 
              id="qt-input" 
              placeholder="Discuss this block..." 
              style="flex: 1; padding: 8px 14px; background: var(--color-surface-alt); border-radius: var(--radius-pill); border: 1px solid var(--color-border); font-size: 12px;" 
            />
            <button type="button" class="btn btn--primary btn--sm" id="btn-qt-send">Send</button>
          </div>

          <div style="text-align: center; margin-top: 2px;">
            <button type="button" class="btn btn--secondary btn--sm" id="btn-qt-go-full" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <span>Open in Central Chat Hub</span>
            </button>
          </div>
        </div>
      `;

      backdrop.querySelector('#btn-close-qt').addEventListener('click', () => backdrop.remove());
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) backdrop.remove();
      });

      const input = backdrop.querySelector('#qt-input');
      const sendBtn = backdrop.querySelector('#btn-qt-send');

      function sendMsg() {
        const txt = input.value.trim();
        if (!txt) return;
        addMessageToThread(blockId, txt);
        thread.messages = (getThreadById(blockId) || thread).messages;
        renderThreadContent();
      }

      sendBtn.addEventListener('click', sendMsg);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          sendMsg();
        }
      });

      backdrop.querySelector('#btn-qt-go-full').addEventListener('click', () => {
        backdrop.remove();
        sessionStorage.setItem('travel_pending_thread', blockId);
        setActiveTab('chat');
      });
    }

    renderThreadContent();
    document.body.appendChild(backdrop);
  }

  // Initial setup and render
  initModals();
  render();

  return {
    element: container,
  };
}
