1/**
 * Interactive Drag-and-Drop Itinerary View
 * Conforms to .agents/skills/travel-planner-ui specifications:
 * 1. Vertical timeline spine connecting chronological time blocks.
 * 2. High-performance auto-scroll engine when dragging cards near screen edges.
 * 3. Automatic schedule time recalculation preserving activity durations and transit buffers.
 * 4. Deduplicated requirements and non-repeating tags.
 * 5. In-place card details expansion preserving scroll position.
 * 6. Slot status lifecycle (Proposed, Confirmed, Weather Permitting, and Day-of Cancellation).
 * 7. Dynamic days with "+ Add Day" and empty day canvases.
 * 8. Social Reels spotlight and interactive preview modal.
 * 9. Planning delete vs Day-of cancellation (Free-time pocket vs Chronological reflow).
 */

import {
  getItineraryData,
  saveItineraryData,
  resetItineraryData,
  getItineraryDayList,
  addItineraryDay,
  removeItineraryDay,
  deleteItineraryBlock,
  cancelItineraryBlock,
  updateItineraryBlock,
  onItineraryChange,
} from '../models/itineraryData.js';
import {
  calculateItineraryBuffers,
  recalculateDaySchedule,
  swapBlockTimeSlots,
  formatDisplayTime,
  formatDuration,
  timeToMinutes,
} from '../utils/bufferEngine.js';
import { getTripSettings, formatDateRange } from '../models/tripSettings.js';
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
  const checkedRequirements = new Set();

  // Modals
  let statusModal;
  let addBlockModal;

  // Auto-scroll controller for drag-and-drop
  let autoScrollRaf = null;
  let autoScrollDelta = 0;
  let savedScrollBehavior = '';

  function startDragSession() {
    savedScrollBehavior = document.documentElement.style.scrollBehavior || '';
    document.documentElement.style.scrollBehavior = 'auto';
  }

  function endDragSession() {
    stopAutoScroll();
    document.documentElement.style.scrollBehavior = savedScrollBehavior;
  }

  function updateAutoScroll(pointerY) {
    const vh = window.innerHeight;
    const topThreshold = 150;
    const bottomThreshold = vh - 130;

    if (pointerY > bottomThreshold) {
      const distanceIntoZone = pointerY - bottomThreshold;
      const ratio = Math.min(1.8, Math.max(0, distanceIntoZone / 80));
      autoScrollDelta = Math.round(12 + Math.pow(ratio, 1.1) * 28);
    } else if (pointerY < topThreshold) {
      const distanceIntoZone = topThreshold - pointerY;
      const ratio = Math.min(1.8, Math.max(0, distanceIntoZone / 80));
      autoScrollDelta = -Math.round(12 + Math.pow(ratio, 1.1) * 28);
    } else {
      autoScrollDelta = 0;
    }

    if (autoScrollDelta !== 0 && !autoScrollRaf) {
      const loop = () => {
        if (autoScrollDelta !== 0) {
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
    document.querySelectorAll('.itinerary-modal-backdrop').forEach((el) => el.remove());

    statusModal = createStatusModal({
      onSave: (blockId, newStatus, newFallback, cancelMode) => {
        if (newStatus === 'cancelled') {
          itineraryList = cancelItineraryBlock(blockId, cancelMode);
          showScheduleToast(
            cancelMode === 'free-time'
              ? 'Event cancelled • Window held as free time'
              : 'Event cancelled • Schedule reflowed forward'
          );
        } else {
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
          showScheduleToast(`Status updated to ${newStatus}`);
        }
        render();
      },
    });

    addBlockModal = createAddBlockModal({
      onAdd: (newBlock) => {
        const dayBlocks = getDayBlocks();
        dayBlocks.push(newBlock);
        const recomputed = recalculateDaySchedule(dayBlocks);
        setDayBlocks(recomputed);
        expandedCardIds.add(newBlock.id);
        render();
        showScheduleToast('Activity added to timeline');
      },
      onUpdate: (updatedBlock) => {
        updateItineraryBlock(updatedBlock);
        itineraryList = getItineraryData();
        expandedCardIds.add(updatedBlock.id);
        render();
        showScheduleToast('Activity details updated');
      },
    });

    document.body.appendChild(statusModal.element);
    document.body.appendChild(addBlockModal.element);
  }

  function getDayBlocks() {
    itineraryList = getItineraryData();
    return itineraryList
      .filter((b) => b.day === currentDay)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  }

  function setDayBlocks(updatedBlocks) {
    const otherDays = itineraryList.filter((b) => b.day !== currentDay);
    itineraryList = [...otherDays, ...updatedBlocks];
    saveItineraryData(itineraryList);
  }

  function render() {
    const rawBlocks = getDayBlocks();
    const blocksWithBuffers = calculateItineraryBuffers(rawBlocks);
    const dayList = getItineraryDayList();
    const settings = getTripSettings();

    // Check if any buffer warnings exist on this day
    const activeWarnings = blocksWithBuffers.filter(
      (b) => b.transitBuffer && b.transitBuffer.isDeficit
    );

    const bannerImg = settings.coverImage || './src/assets/bg-itinerary.png';
    const cityTitle = (settings.destination || settings.title || 'Tokyo').split(',')[0].trim();

    container.innerHTML = `
      <!-- Atmospheric Vertical Asset Banner -->
      <div class="view-banner" style="background-image: url('${bannerImg}');">
        <button type="button" class="view-banner__menu-btn" id="btn-open-sidebar" aria-label="Open Trip Menu" title="Open Menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div class="view-banner__scrim">
          <span class="view-banner__badge" id="itinerary-banner-badge">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            ${cityTitle} • Day ${currentDay} of ${dayList.length} • ${rawBlocks.length} Stops
          </span>
          <h2 class="view-banner__title">${settings.title || 'Trip Itinerary'}</h2>
        </div>
      </div>

      <div class="view-header">
        <!-- Day Selector Chips Row with dynamic Add Day button -->
        <div class="day-chip-row" role="tablist" aria-label="Trip Days">
          ${dayList
        .map(
          (d) => `
            <button type="button" class="day-chip ${currentDay === d ? 'day-chip--active' : ''}" data-day="${d}">
              Day ${d}
            </button>
          `
        )
        .join('')}
          <button type="button" class="day-chip day-chip--add" id="btn-add-day" title="Add next trip day">
            + Add Day
          </button>
        </div>
      </div>



      <!-- Transit Buffer Warning Banner (if any buffer deficit exists) -->
      ${activeWarnings.length > 0
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

      <!-- Timeline Feed or Empty Day Canvas -->
      ${rawBlocks.length === 0
        ? `
        <div class="timeline-feed" id="timeline-feed-target">
          <div class="timeline-item-wrapper timeline-item-wrapper--empty" id="btn-empty-propose-slot" role="button" tabindex="0" title="Click to propose an event">
            <!-- Retain original blue timeline node pin with SVG icon of time -->
            <div class="timeline-node-pin timeline-node-pin--time">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-label="Time">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>

            <!-- Single greyed out dashed event card -->
            <article class="timeline-card timeline-card--empty-dashed">
              <div class="timeline-card__empty-dashed-content">
                <div class="timeline-card__empty-icon-wrap">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </div>
                <div class="timeline-card__empty-text-wrap">
                  <h4 class="timeline-card__empty-title">Propose an event</h4>
                  <p class="timeline-card__empty-desc">Tap to add your first stop or activity to Day ${currentDay}</p>
                </div>
              </div>
            </article>
          </div>
          ${dayList.length > 1
          ? `
            <div class="timeline-empty-remove-wrap">
              <button type="button" class="btn-empty-remove-day" id="btn-empty-remove-day">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                <span>Remove Day ${currentDay}</span>
              </button>
            </div>
          `
          : ''
        }
        </div>
      `
        : `
<!-- Draggable Timeline Blocks Container with Vertical Spine -->
        <div class="timeline-feed" id="timeline-feed-target">
          ${renderTimelineItems(blocksWithBuffers)}
        </div>
      `
      }
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
    const categoryMap = {
      activity: {
        label: 'Sightseeing',
        badgeLabel: 'Sightseeing',
        icon: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
      },
      meal: {
        label: 'Dining',
        badgeLabel: 'Dining',
        icon: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>`,
      },
      transit: {
        label: 'Transit',
        badgeLabel: 'Transit',
        icon: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="4" y="3" width="16" height="16" rx="2"></rect><path d="M4 11h16"></path><path d="M12 3v8"></path></svg>`,
      },
      rest: {
        label: 'Check-in / Rest',
        badgeLabel: 'Check-in',
        icon: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
      },
    };

    return blocks
      .map((block, index) => {
        const isExpanded = expandedCardIds.has(block.id);
        const buffer = block.transitBuffer;
        const isCancelled = block.status === 'cancelled';
        const isReel = block.source === 'reel' || block.reelUrl;

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
        } else if (isCancelled) {
          statusClass = 'status-pill-btn--cancelled';
          statusLabel = 'Free Time / Relax';
        }

        const catInfo = categoryMap[block.category] || categoryMap.activity;

        // Deduplicate requirements array & count completed
        const rawReqs = Array.isArray(block.requirements) ? block.requirements : [];
        const cleanReqs = Array.from(new Set(rawReqs.filter(Boolean)));
        const completedCount = cleanReqs.filter((_, idx) => checkedRequirements.has(`${block.id}-${idx}`)).length;

        // Discussion thread message count
        const thread = getThreadById(block.id);
        const threadMsgCount = thread && thread.messages ? thread.messages.length : 0;

        // Status Vector Icon
        let statusIconSvg = '';
        if (block.status === 'confirmed') {
          statusIconSvg = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        } else if (block.status === 'tentative') {
          statusIconSvg = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/></svg>';
        } else if (isCancelled) {
          statusIconSvg = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>';
        } else {
          statusIconSvg = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
        }

        const collapsedStatusLabel = isCancelled
          ? 'Free Time'
          : block.status === 'tentative'
            ? 'Weather'
            : block.status === 'confirmed'
              ? 'Confirmed'
              : 'Proposed';

        let cardContent = '';

        if (!isExpanded) {
          // Collapsed State
          cardContent = `
            <article class="timeline-card timeline-card--collapsed timeline-card--${block.category} ${isCancelled ? 'timeline-card--cancelled' : ''} ${isReel ? 'timeline-card--has-reel' : ''}">
              <div class="timeline-card__collapsed-split" data-toggle-details="${block.id}" role="button" tabindex="0" aria-expanded="false">
                <!-- Left Column: Times with Status & Category Badges -->
                <div class="timeline-card__time-col">
                  <div class="time-col__times">
                    <span class="time-col__start">${displayStart}</span>
                    <span class="time-col__divider">to</span>
                    <span class="time-col__end">${displayEnd}</span>
                  </div>
                  <div class="time-col__badges">
                    <span class="timeline-card__status-pill timeline-card__status-pill--${block.status}" title="Status: ${statusLabel}">
                      ${statusIconSvg}
                      <span>${collapsedStatusLabel}</span>
                    </span>
                    <span class="timeline-card__category-badge timeline-card__category-badge--${block.category}">
                      ${catInfo.icon}
                      <span>${catInfo.badgeLabel || catInfo.label}</span>
                    </span>
                  </div>
                </div>

                <!-- Right Column: Title & Location -->
                <div class="timeline-card__body-col">
                  <div class="timeline-card__title-row">
                    <h3 class="timeline-card__title">${block.title}</h3>
                    ${isReel
              ? `
                      <button type="button" class="card-origin-badge card-origin-badge--reel" data-preview-reel-id="${block.id}" title="Watch Reel Preview">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                        <span>Reel Pick</span>
                      </button>
                    `
              : ''
            }
                  </div>
                  ${block.location
              ? `
                    <div class="timeline-card__location-row" title="${block.location}">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <span class="timeline-card__location-text">${block.location}</span>
                    </div>
                  `
              : ''
            }
                </div>

                <!-- Right Edge Controls (inside 3-column split layout) -->
                <div class="timeline-card__right-actions">
                  <button type="button" class="timeline-card__chevron-btn" data-toggle-details="${block.id}" aria-label="Expand details">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                  <button type="button" class="timeline-card__thread-pill-btn" data-thread-btn="${block.id}" title="Open Activity Discussion">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    ${threadMsgCount > 0 ? `<span class="thread-badge-count">${threadMsgCount}</span>` : ''}
                  </button>
                </div>
              </div>
            </article>
          `;
        } else {
          // Expanded State
          cardContent = `
            <article class="timeline-card timeline-card--expanded timeline-card--${block.category} ${isCancelled ? 'timeline-card--cancelled' : ''} ${isReel ? 'timeline-card--has-reel' : ''}">
              <div class="timeline-card__expanded-inner">
                <!-- Header: Badges & Shift / Collapse Controls -->
                <div class="timeline-card__expanded-header">
                  <div class="timeline-card__expanded-header-left">
                    <div class="timeline-card__expanded-badges">
                      <button type="button" class="status-pill-btn ${statusClass}" data-status-btn="${block.id}" title="Tap to change status lifecycle">
                        ${statusIconSvg}
                        <span>${statusLabel}</span>
                      </button>
                      <span class="timeline-card__category-badge timeline-card__category-badge--${block.category}">
                        ${catInfo.icon}
                        <span>${catInfo.label}</span>
                      </span>
                      <span class="timeline-card__time-pill">
                        ${displayStart} – ${displayEnd}
                      </span>
                    </div>
                  </div>

                  <!-- Shift Buttons and Collapse Chevron -->
                  <div class="split-left__shift-controls" style="display: flex; align-items: center; gap: 4px;">
                    <button type="button" class="shift-btn shift-up-btn" data-id="${block.id}" title="Shift event earlier" ${index === 0 ? 'disabled' : ''}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                    </button>
                    <button type="button" class="shift-btn shift-down-btn" data-id="${block.id}" title="Shift event later" ${index === blocks.length - 1 ? 'disabled' : ''}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    <button type="button" class="timeline-card__chevron-btn timeline-card__chevron-btn--active" data-toggle-details="${block.id}" aria-label="Collapse details">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="18 15 12 9 6 15"></polyline>
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Showcase Hero Row: Venue Artwork Circle + Title + Reel Pick + Location -->
                <div class="timeline-card__showcase-row">
                  <div class="detail-panel__photo-wrapper">
                    ${getVenueThumbnail(block)}
                  </div>
                  <div class="timeline-card__showcase-info">
                    <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
                      <h3 class="timeline-card__title timeline-card__title--expanded">${block.title}</h3>
                      ${isReel
              ? `
                        <button type="button" class="card-origin-badge card-origin-badge--reel" data-preview-reel-id="${block.id}" title="Watch Reel Preview">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                          <span>Watch Reel</span>
                        </button>
                      `
              : ''
            }
                    </div>
                    ${block.location
              ? `
                      <div class="detail-panel__location" title="${block.location}">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>${block.location}</span>
                      </div>
                    `
              : ''
            }
                  </div>
                </div>

                <!-- Details Content Strip -->
                <div class="timeline-card__details-content">
                  ${block.transitToNextMinutes > 0
              ? `
                    <div class="detail-panel__note-tag">
                      <span class="detail-panel__note-label">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="4" y="3" width="16" height="16" rx="2"></rect><path d="M4 11h16"></path><path d="M12 3v8"></path></svg>
                        <span>Transit:</span>
                      </span>
                      <span>${block.transitToNextMinutes}m (${block.transitMode || 'Metro'})</span>
                    </div>
                  `
              : ''
            }

                  ${block.dressCode && block.dressCode.toLowerCase() !== 'none' && block.dressCode.trim() !== ''
              ? `
                    <div class="detail-panel__note-tag">
                      <span class="detail-panel__note-label">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>
                        <span>Dress Code:</span>
                      </span>
                      <span>${block.dressCode}</span>
                    </div>
                  `
              : ''
            }

                  ${block.notes ? `<p class="detail-panel__notes">${block.notes}</p>` : ''}

                  ${cleanReqs.length > 0
              ? `
                    <div class="detail-panel__checklist-section">
                      <div class="checklist-section__header">
                        <span class="checklist-section__title">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 11l3 3L22 4"/>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                          </svg>
                          <span>Requirements (${completedCount}/${cleanReqs.length})</span>
                        </span>
                      </div>
                      <div class="detail-panel__checklist">
                        ${cleanReqs
                .map((r, idx) => {
                  const isChecked = checkedRequirements.has(`${block.id}-${idx}`);
                  return `
                            <div class="checklist-item ${isChecked ? 'checklist-item--checked' : ''}" data-req-toggle="${block.id}" data-req-idx="${idx}" role="checkbox" aria-checked="${isChecked}" tabindex="0">
                              <span class="checklist-checkbox ${isChecked ? 'checklist-checkbox--checked' : ''}">
                                ${isChecked ? '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
                              </span>
                              <span class="checklist-item__text">${r}</span>
                            </div>
                          `;
                })
                .join('')}
                      </div>
                    </div>
                  `
              : ''
            }

                  ${block.fallback
              ? (() => {
                let reasonLabel = 'Backup Option';
                let reasonIcon = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
                if (block.fallbackReason === 'weather') {
                  reasonLabel = 'Rain / Inclement Weather';
                  reasonIcon = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/><path d="M8 19v2"/><path d="M8 13v2"/><path d="M12 21v2"/><path d="M12 15v2"/><path d="M16 19v2"/><path d="M16 13v2"/></svg>';
                } else if (block.fallbackReason === 'crowd') {
                  reasonLabel = 'Crowded / Long Queue';
                  reasonIcon = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>';
                } else if (block.fallbackReason === 'closed') {
                  reasonLabel = 'Closed / Sold Out';
                  reasonIcon = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>';
                }

                return `
                          <div class="contingency-card">
                            <div class="contingency-card__header">
                              <span class="contingency-card__badge contingency-card__badge--${block.fallbackReason || 'default'}">
                                ${reasonIcon}
                                <span>${reasonLabel}</span>
                              </span>
                              <button type="button" class="contingency-card__swap-btn" data-swap-fallback="${block.id}" title="Swap active event with this backup">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                                <span>Swap to Backup</span>
                              </button>
                            </div>
                            <div class="contingency-card__body">
                              <span class="contingency-card__title">${block.fallback}</span>
                            </div>
                          </div>
                        `;
              })()
              : ''
            }

                  <!-- Bottom Action Row: Thread, Cancel Event, Delete, and Drag Handle -->
                  <div class="detail-panel__bottom-row">
                    <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                      <button type="button" class="btn-thread-badge btn-thread-badge--inline" data-thread-btn="${block.id}" title="Open Activity Chat Thread">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span>Thread ${threadMsgCount > 0 ? `(${threadMsgCount})` : ''}</span>
                      </button>

                      <!-- Edit Block Action -->
                      <button type="button" class="btn-card-action btn-card-action--edit" data-edit-block="${block.id}" title="Edit activity details" aria-label="Edit activity">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        <span>Edit</span>
                      </button>

                      <!-- Delete Block (Planning Phase) -->
                      <button type="button" class="btn-card-action btn-card-action--delete btn-card-action--icon-only" data-delete-block="${block.id}" title="Delete block from schedule" aria-label="Delete block">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>

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

        const isLastItem = index === blocks.length - 1;

        return `
          <div 
            class="timeline-item-wrapper" 
            data-block-id="${block.id}" 
            draggable="true"
          >
            <!-- Timeline Pin & Illustrated SVG Venue Pin -->
            <div class="timeline-node-pin" data-category="${block.category}">
              ${getVenueThumbnail(block)}
            </div>

            <!-- Vertical Spine Connector (terminates at final node) -->
            ${!isLastItem ? '<div class="timeline-spine-connector" aria-hidden="true"></div>' : ''}

            <!-- Card Body -->
            ${cardContent}

            <!-- Transit Buffer Connector Pill -->
            ${buffer
            ? `
              <div class="timeline-transit-connector ${buffer.isDeficit ? 'timeline-transit-connector--warning' : ''}">
                <div class="transit-connector-pill">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>${formatDuration(buffer.actualMinutes)} transit buffer (${formatDuration(buffer.requiredMinutes)} needed)</span>
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

  function attachEvents(rawBlocks) {
    // 1. Open Sidebar
    const openSidebarBtn = container.querySelector('#btn-open-sidebar');
    if (openSidebarBtn) {
      openSidebarBtn.addEventListener('click', () => {
        if (window.TravelApp && window.TravelApp.sidebar) {
          window.TravelApp.sidebar.open();
        }
      });
    }

    // 2. Enable horizontal drag & wheel scrolling on Day selector chips
    enableDragScroll(container.querySelector('.day-chip-row'));

    // Day selector chips
    container.querySelectorAll('.day-chip[data-day]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const day = parseInt(btn.getAttribute('data-day'), 10);
        if (day && day !== currentDay) {
          currentDay = day;
          render();
        }
      });
    });

    // 2B. Add Day Button
    const addDayBtn = container.querySelector('#btn-add-day');
    if (addDayBtn) {
      addDayBtn.addEventListener('click', () => {
        const newDay = addItineraryDay();
        currentDay = newDay;
        render();
        showScheduleToast(`Added Day ${newDay} to itinerary!`);
      });
    }

    // 2B. Propose Event Button in header


    // 2C. Empty Day Actions
    const emptyProposeSlot = container.querySelector('#btn-empty-propose-slot');
    if (emptyProposeSlot) {
      const handlePropose = () => {
        if (addBlockModal) addBlockModal.open(currentDay);
      };
      emptyProposeSlot.addEventListener('click', handlePropose);
      emptyProposeSlot.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handlePropose();
        }
      });
    }

    const emptyRemove = container.querySelector('#btn-empty-remove-day');
    if (emptyRemove) {
      emptyRemove.addEventListener('click', () => {
        const remaining = removeItineraryDay(currentDay);
        currentDay = Math.min(currentDay, remaining);
        render();
        showScheduleToast('Day removed from itinerary.');
      });
    }



    // Reset Itinerary Button
    const resetBtn = container.querySelector('#reset-itinerary-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset entire itinerary back to initial 3-day defaults?')) {
          itineraryList = resetItineraryData();
          currentDay = 1;
          render();
          showScheduleToast('Itinerary reset to defaults');
        }
      });
    }

    // 4. Status Lifecycle Modal Trigger
    container.querySelectorAll('[data-status-btn]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const blockId = btn.getAttribute('data-status-btn');
        const block = itineraryList.find((b) => b.id === blockId);
        if (block && statusModal) {
          statusModal.open(block);
        }
      });
    });

    // 4B. Card Cancel Button (Day-of execution)
    container.querySelectorAll('[data-cancel-block]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const blockId = btn.getAttribute('data-cancel-block');
        const block = itineraryList.find((b) => b.id === blockId);
        if (block && statusModal) {
          statusModal.open(block);
        }
      });
    });

    // 4B2. Card Edit Button
    container.querySelectorAll('[data-edit-block]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const blockId = btn.getAttribute('data-edit-block');
        const block = itineraryList.find((b) => b.id === blockId);
        if (block && addBlockModal) {
          addBlockModal.open(block.day || currentDay, {}, block);
        }
      });
    });

    // 4C. Card Delete Button (Planning phase)
    container.querySelectorAll('[data-delete-block]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const blockId = btn.getAttribute('data-delete-block');
        if (blockId) {
          itineraryList = deleteItineraryBlock(blockId);
          render();
          showScheduleToast('Activity removed from schedule');
        }
      });
    });

    // 4D. Reel Preview Modal Trigger
    container.querySelectorAll('[data-preview-reel-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const blockId = btn.getAttribute('data-preview-reel-id');
        const block = itineraryList.find((b) => b.id === blockId) || {};
        openReelPreviewModal(block);
      });
    });

    // Contingency Swap Button
    container.querySelectorAll('[data-swap-fallback]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const blockId = btn.getAttribute('data-swap-fallback');
        swapFallbackEvent(blockId);
      });
    });

    // Requirements Checklist Item Toggle
    container.querySelectorAll('[data-req-toggle]').forEach((item) => {
      const toggle = (e) => {
        e.stopPropagation();
        const blockId = item.getAttribute('data-req-toggle');
        const idx = item.getAttribute('data-req-idx');
        const key = `${blockId}-${idx}`;

        if (checkedRequirements.has(key)) {
          checkedRequirements.delete(key);
        } else {
          checkedRequirements.add(key);
        }
        render();
      };
      item.addEventListener('click', toggle);
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle(e);
        }
      });
    });

    // Discussion Thread Button
    container.querySelectorAll('[data-thread-btn]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const blockId = btn.getAttribute('data-thread-btn');
        if (blockId) openQuickThreadDrawer(blockId);
      });
    });

    // Expand / Collapse Card
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

    // Shift Up / Down
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

    // Drag-and-Drop
    attachDragAndDropHandlers();
  }

  function moveItem(blockId, direction) {
    let rawBlocks = getDayBlocks();
    const index = rawBlocks.findIndex((b) => b.id === blockId);
    if (index === -1) return;

    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= rawBlocks.length) return;

    const temp = rawBlocks[index];
    rawBlocks[index] = rawBlocks[targetIndex];
    rawBlocks[targetIndex] = temp;

    rawBlocks = recalculateDaySchedule(rawBlocks);
    setDayBlocks(rawBlocks);
    render();
    showScheduleToast('Schedule updated • Times recalculated');
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

    // Desktop Drag & Drop
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

    window.addEventListener('dragover', (e) => {
      if (draggedWrapper) {
        updateAutoScroll(e.clientY);
      }
    });

    // Mobile Touch Drag
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
          updateAutoScroll(touch.clientY);

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

      const sourceBlock = rawBlocks[fromIndex];
      const targetBlock = rawBlocks[toIndex];

      rawBlocks = swapBlockTimeSlots(rawBlocks, sourceId, targetId);
      setDayBlocks(rawBlocks);
      clearOverClasses();
      render();
      showScheduleToast(`Swapped: ${sourceBlock.title} ⇄ ${targetBlock.title}`);
    }
  }

  function swapFallbackEvent(blockId) {
    itineraryList = itineraryList.map((b) => {
      if (b.id === blockId && b.fallback) {
        const oldTitle = b.title;
        const newTitle = b.fallback;
        return {
          ...b,
          title: newTitle,
          fallback: oldTitle,
          fallbackReason: 'general',
          notes: (b.notes ? b.notes + ' ' : '') + `[Swapped contingency on ${new Date().toLocaleDateString()}]`,
        };
      }
      return b;
    });

    saveItineraryData(itineraryList);
    render();
    showScheduleToast('Swapped to backup option');
  }

  function openReelPreviewModal(block) {
    let modal = document.querySelector('#reel-preview-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'reel-preview-modal';
      modal.className = 'itinerary-modal-backdrop';
      document.body.appendChild(modal);
    }

    const creator = block.reelCreator || '@tokyofoodie';
    const spotTitle = block.title || 'Shibuya Sky Observatory';

    modal.innerHTML = `
      <div class="itinerary-modal-sheet reel-preview-sheet">
        <div class="itinerary-modal-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="reel-preview-avatar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </div>
            <div>
              <strong style="font-size: 13px; color: #0F172A;">${creator}</strong>
              <div style="font-size: 11px; color: #64748B;">Trending Travel Reel</div>
            </div>
          </div>
          <button type="button" class="drawer-close-btn" id="btn-close-reel-modal" aria-label="Close">✕</button>
        </div>

        <div class="reel-preview-body">
          <div class="reel-mockup-frame">
            <div class="reel-mockup-overlay">
              <div class="reel-play-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              </div>
              <div class="reel-mockup-caption">
                <span class="reel-sound-tag">♫ Tokyo Beat • Trending Sound</span>
                <h4 style="margin: 4px 0 2px; font-size: 13px; color: #FFFFFF;">Top 5 Secret Alley Spots & Rooftop Views</h4>
                <p style="margin: 0; font-size: 11px; opacity: 0.85;">Viral Reel • 4.2M Views • AI extracted 3 locations</p>
              </div>
            </div>
          </div>

          <div class="reel-detected-spots">
            <span class="reel-detected-title">AI Extracted Spots:</span>
            <div class="reel-spots-list">
              <div class="reel-spot-tag reel-spot-tag--scheduled">
                <span class="reel-spot-bullet">✓</span>
                <span><strong>${spotTitle}</strong> (Scheduled on Day ${block.day || currentDay})</span>
              </div>
              <div class="reel-spot-tag">
                <span class="reel-spot-bullet">+</span>
                <span>Uobei Conveyor Belt Sushi (Saved to Wishlist)</span>
              </div>
              <div class="reel-spot-tag">
                <span class="reel-spot-bullet">+</span>
                <span>Nonbei Yokocho Micro-Izakayas (Saved to Wishlist)</span>
              </div>
            </div>
          </div>
        </div>

        <div class="reel-preview-footer">
          <button type="button" class="btn btn--primary" style="width: 100%;" id="btn-dismiss-reel-modal">Done</button>
        </div>
      </div>
    `;

    modal.classList.add('is-open');

    const close = () => modal.classList.remove('is-open');
    const closeBtn = modal.querySelector('#btn-close-reel-modal');
    const dismissBtn = modal.querySelector('#btn-dismiss-reel-modal');

    if (closeBtn) closeBtn.onclick = close;
    if (dismissBtn) dismissBtn.onclick = close;
    modal.onclick = (e) => {
      if (e.target === modal) close();
    };
  }

  function openQuickThreadDrawer(blockId) {
    const block = itineraryList.find((b) => b.id === blockId) || {};
    const backdrop = document.createElement('div');
    backdrop.className = 'quick-thread-backdrop';

    function closeDrawer() {
      backdrop.classList.remove('is-open');
      setTimeout(() => {
        backdrop.remove();
      }, 250);
    }

    function renderThreadContent() {
      const thread = getThreadById(blockId) || {
        blockId,
        title: block.title || 'Activity Discussion',
        eventTitle: block.title || 'Itinerary Stop',
        category: block.category || 'general',
        location: block.location || 'Tokyo & Kyoto',
        day: block.day || currentDay,
        messages: [],
      };
      backdrop.innerHTML = `
        <div class="quick-thread-sheet" role="dialog" aria-labelledby="qt-title">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(15, 23, 42, 0.08); padding-bottom: 10px;">
            <div>
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px;">
                <span class="thread-day-pill">${getDayCalendarIconSvg(10)} <span>Day ${block.day || currentDay}</span></span>
              </div>
              <h3 id="qt-title" style="font-size: 14px; font-weight: 800; color: #0F172A; margin: 0;">${thread.eventTitle || thread.title || block.title}</h3>
            </div>
            <button type="button" class="drawer-close-btn" id="btn-close-qt" aria-label="Close activity thread" style="min-width: 36px; min-height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(15, 23, 42, 0.05); border: none; cursor: pointer; font-size: 14px;">✕</button>
          </div>

          <div class="chat-feed" style="max-height: 250px; overflow-y: auto; padding-right: 4px; display: flex; flex-direction: column; gap: 8px;">
            ${thread.messages.length === 0
          ? `<p style="font-size: 12px; color: #64748B; text-align: center; padding: 24px 0;">No messages in this activity thread yet. Start the discussion below!</p>`
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
              placeholder="Discuss this stop..." 
              style="flex: 1; padding: 9px 14px; background: #F8FAFC; border-radius: 9999px; border: 1px solid #CBD5E1; font-size: 13px; outline: none;" 
            />
            <button type="button" class="btn btn--primary btn--sm" id="btn-qt-send" style="padding: 8px 16px; border-radius: 9999px; background: #0F172A; color: #FFFFFF; font-weight: 700; font-size: 12px; border: none; cursor: pointer;">Send</button>
          </div>

          <div style="text-align: center; margin-top: 2px;">
            <button type="button" class="btn btn--secondary btn--sm" id="btn-qt-go-full" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px; border-radius: 12px; background: rgba(15, 23, 42, 0.04); border: 1px solid rgba(15, 23, 42, 0.08); font-size: 12px; font-weight: 700; color: #334155; cursor: pointer;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <span>Open in Central Chat Hub</span>
            </button>
          </div>
        </div>
      `;

      const input = backdrop.querySelector('#qt-input');
      const sendBtn = backdrop.querySelector('#btn-qt-send');
      const closeBtn = backdrop.querySelector('#btn-close-qt');
      const goFullBtn = backdrop.querySelector('#btn-qt-go-full');

      if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

      if (goFullBtn) {
        goFullBtn.addEventListener('click', () => {
          closeDrawer();
          setActiveTab('chat');
        });
      }

      const feed = backdrop.querySelector('.chat-feed');
      if (feed) feed.scrollTop = feed.scrollHeight;

      const handleSend = () => {
        const text = input.value.trim();
        if (!text) return;
        addMessageToThread(blockId, text, {
          title: block.title,
          category: block.category,
          location: block.location,
          day: block.day || currentDay,
        });
        input.value = '';
        renderThreadContent();
        render(); // Update count badge on card
      };

      if (sendBtn) sendBtn.addEventListener('click', handleSend);
      if (input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') handleSend();
        });
      }
    }

    renderThreadContent();
    document.body.appendChild(backdrop);
    requestAnimationFrame(() => backdrop.classList.add('is-open'));

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeDrawer();
    });
  }

  // Subscribe to itinerary changes
  const unsubscribe = onItineraryChange(() => {
    render();
  });

  // Global listener for opening propose activity modal
  if (!window.TravelApp) window.TravelApp = {};
  window.TravelApp.openProposeActivity = (day) => {
    if (addBlockModal) addBlockModal.open(day || currentDay);
  };

  const handleOpenPropose = (e) => {
    const targetDay = (e && e.detail && e.detail.day) || currentDay;
    if (addBlockModal) addBlockModal.open(targetDay);
  };
  window.addEventListener('open-propose-activity', handleOpenPropose);

  // Update header and timeline whenever trip settings update
  const handleSettingsUpdate = () => {
    render();
  };
  window.addEventListener('trip-settings-updated', handleSettingsUpdate);

  // Initialize and return
  initModals();
  render();

  return {
    element: container,
    render,
    setDay: (day) => {
      currentDay = day;
      render();
    },
    destroy: () => {
      unsubscribe();
      window.removeEventListener('open-propose-activity', handleOpenPropose);
      window.removeEventListener('trip-settings-updated', handleSettingsUpdate);
    },
  };
}
