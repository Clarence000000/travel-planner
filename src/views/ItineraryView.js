/**
 * Interactive Drag-and-Drop Itinerary View
 * Conforms to .agents/skills/travel-planner-ui specifications & Penang Edition Demo Flow:
 * 1. Vertical timeline spine connecting chronological time blocks.
 * 2. High-performance auto-scroll engine when dragging cards near screen edges.
 * 3. Automatic schedule time recalculation preserving activity durations and transit buffers.
 * 4. Deduplicated requirements and non-repeating tags.
 * 5. In-place card details expansion preserving scroll position.
 * 6. Slot status lifecycle (Proposed Draft, Confirmed, Weather Permitting, and Day-of Cancellation).
 * 7. Active Dotted Timeline Gap Indicator (>2h free pockets, e.g. Chew Jetty ➔ Penang Hill).
 * 8. Frosted Glass Dashed Ghost Cards for Proposed draft status with [✓ Confirm] & [🗳 Vote].
 * 9. Apple iOS 26-Style Anti-Slop Schedule Advisories (Monday closure warnings, spring exit to Day 3).
 * 10. Ambient Day 2 tab activity indicator dot (●).
 * 11. Live Tropical Monsoon Weather Alert banner & 3-Way Contingency Resolution Sheet.
 * 12. Dynamic days with "+ Add Day" and empty day canvases.
 * 13. Social Reels spotlight and interactive preview modal.
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
  minutesTo24,
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
  let expandedCardIds = new Set(['d1-2']); // Default expanded
  const checkedRequirements = new Set();

  // Ambient & Simulation State
  let day2HasActivity = false;
  let weatherAlertActive = false;

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
    }, 2500);
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
      onResolveContingency: (blockId, optionType) => {
        resolveContingencyOption(blockId, optionType);
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

  // ──────────────── Direct Action Helpers ────────────────

  function confirmProposedBlock(blockId) {
    itineraryList = getItineraryData();
    const block = itineraryList.find((b) => b.id === blockId);
    if (!block) return;

    itineraryList = itineraryList.map((b) => {
      if (b.id === blockId) {
        return {
          ...b,
          status: 'confirmed',
          transitToNextMinutes: 25,
          transitMode: 'GrabCar / Transit to Penang Hill',
        };
      }
      // If predecessor is Chew Jetty, ensure 12 min GrabCar transit buffer
      if (b.day === block.day && (b.id === 'd1-chew-jetty' || (b.title && b.title.includes('Chew Jetty')))) {
        return {
          ...b,
          transitToNextMinutes: 12,
          transitMode: 'GrabCar (12 min)',
        };
      }
      return b;
    });

    saveItineraryData(itineraryList);
    render();
    showScheduleToast('✓ Confirmed! Transit buffers calculated (GrabCar 12 min, Penang Hill 25 min)');

    try {
      const channel = new BroadcastChannel('wandersync_simulation');
      channel.postMessage({ type: 'BLOCK_CONFIRMED', blockId });
    } catch (e) {}
  }

  function triggerConsensusVote(blockId, cardEl) {
    if (!cardEl) return;
    const actionsContainer = cardEl.querySelector(`[data-proposed-actions="${blockId}"]`);
    if (!actionsContainer) return;

    actionsContainer.innerHTML = `
      <div class="card-vote-progress-panel">
        <div class="card-vote-progress-header">
          <span>🗳 Group Consensus Polling</span>
          <span class="vote-ratio" id="vote-ratio-${blockId}">1/3 Votes (33%)</span>
        </div>
        <div class="card-vote-progress-bar">
          <div class="card-vote-progress-fill" id="vote-fill-${blockId}" style="width: 33%;"></div>
        </div>
        <div id="vote-status-text-${blockId}" style="font-size: 11px; color: #78350F; font-weight: 500;">
          Tony voted YES • Waiting for Wei Gang & Presenter...
        </div>
      </div>
    `;

    // Step 1: Wei Gang votes YES after 650ms
    setTimeout(() => {
      const ratioEl = cardEl.querySelector(`#vote-ratio-${blockId}`);
      const fillEl = cardEl.querySelector(`#vote-fill-${blockId}`);
      const textEl = cardEl.querySelector(`#vote-status-text-${blockId}`);
      if (ratioEl) ratioEl.textContent = '2/3 Votes (66%)';
      if (fillEl) fillEl.style.width = '66%';
      if (textEl) textEl.textContent = 'Wei Gang voted YES • Final presenter consensus approved...';
    }, 650);

    // Step 2: 100% consensus reached after 1350ms
    setTimeout(() => {
      const ratioEl = cardEl.querySelector(`#vote-ratio-${blockId}`);
      const fillEl = cardEl.querySelector(`#vote-fill-${blockId}`);
      const textEl = cardEl.querySelector(`#vote-status-text-${blockId}`);
      if (ratioEl) ratioEl.textContent = '3/3 Votes • 100% Consensus!';
      if (fillEl) {
        fillEl.style.width = '100%';
        fillEl.style.background = '#16A34A';
      }
      if (textEl) textEl.innerHTML = '<strong style="color: #15803D;">✓ Consensus Reached! Auto-confirming slot...</strong>';
    }, 1350);

    // Step 3: Morphs to solid confirmed after 1800ms
    setTimeout(() => {
      confirmProposedBlock(blockId);
    }, 1800);
  }

  function shiftBlockToDay3(blockId) {
    const cardWrapper = container.querySelector(`.timeline-item-wrapper[data-block-id="${blockId}"]`);
    if (cardWrapper) {
      cardWrapper.classList.add('card-ios-spring-exit');
    }

    setTimeout(() => {
      let list = getItineraryData();
      const target = list.find((b) => b.id === blockId);
      if (!target) return;

      target.day = 3;
      target.advisoryDismissed = true;
      target.startTime = '18:30';
      target.endTime = '19:45';

      const day1Blocks = list.filter((b) => b.day === 1 && b.id !== blockId);
      const day3Blocks = list.filter((b) => b.day === 3 || b.id === blockId);
      const otherBlocks = list.filter((b) => b.day !== 1 && b.day !== 3);

      const recomputedDay1 = recalculateDaySchedule(day1Blocks);
      const recomputedDay3 = recalculateDaySchedule(day3Blocks);

      list = [...otherBlocks, ...recomputedDay1, ...recomputedDay3];
      saveItineraryData(list);
      render();
      showScheduleToast('Shifted Siam Road Char Koay Teow to Day 3 · Wed');

      try {
        const channel = new BroadcastChannel('wandersync_simulation');
        channel.postMessage({ type: 'BLOCK_SHIFTED_DAY3', blockId });
      } catch (e) {}
    }, 350);
  }

  function resolveContingencyOption(blockId, optionType) {
    let list = getItineraryData();
    const block = list.find((b) => b.id === blockId);
    if (!block) return;

    if (optionType === 'fallback') {
      // 1. [🌧️ Switch to Indoor Fallback]: The Top Komtar Indoor Theme Park & Glass Rainbow Skywalk
      list = list.map((b) => {
        if (b.id === blockId) {
          return {
            ...b,
            title: 'The Top Komtar Indoor Theme Park & Glass Rainbow Skywalk',
            location: 'Komtar Tower, 1 Jalan Penang, George Town',
            category: 'activity',
            status: 'confirmed',
            transitToNextMinutes: 15,
            transitMode: 'GrabCar (15 min to George Town)',
            notes: 'Swapped from Penang Hill due to afternoon tropical monsoon downpour. Fully indoor climate-controlled Rainbow Skywalk & heritage gallery.',
            requirements: ['E-Tickets Ready', 'Indoor Footwear'],
            fallback: 'Penang Hill Outdoor Station',
            fallbackReason: 'weather',
          };
        }
        return b;
      });
      weatherAlertActive = false;
      saveItineraryData(list);
      render();
      showScheduleToast('Swapped to Indoor Fallback: The Top Komtar & Rainbow Skywalk');
    } else if (optionType === 'freetime') {
      // 2. [☕ Hold Free-Time Pocket]: ChinaHouse Heritage Cafe (Beach Street) rest pocket
      list = list.map((b) => {
        if (b.id === blockId) {
          return {
            ...b,
            title: 'ChinaHouse Heritage Cafe (Beach Street) Rest Pocket',
            location: '153 Beach Street, George Town',
            category: 'rest',
            status: 'cancelled',
            notes: 'Slot converted into relaxing cafe shelter during tropical downpour without shifting dinner reservations.',
            requirements: [],
            fallback: null,
          };
        }
        return b;
      });
      weatherAlertActive = false;
      saveItineraryData(list);
      render();
      showScheduleToast('Held free-time pocket: ChinaHouse Heritage Cafe');
    } else if (optionType === 'reflow') {
      // 3. [⏩ Chronological Reflow]: Pulls schedule forward by 90 minutes
      const day = block.day;
      const blockEndMins = timeToMinutes(block.endTime);
      list = list.filter((b) => b.id !== blockId);
      list = list.map((b) => {
        if (b.day === day && timeToMinutes(b.startTime) >= blockEndMins) {
          const newStart = Math.max(0, timeToMinutes(b.startTime) - 90);
          const duration = timeToMinutes(b.endTime) - timeToMinutes(b.startTime);
          return {
            ...b,
            startTime: minutesTo24(newStart),
            endTime: minutesTo24(newStart + duration),
          };
        }
        return b;
      });
      const dayBlocks = list.filter((b) => b.day === day);
      const otherDays = list.filter((b) => b.day !== day);
      const recomputed = recalculateDaySchedule(dayBlocks);
      list = [...otherDays, ...recomputed];

      weatherAlertActive = false;
      saveItineraryData(list);
      render();
      showScheduleToast('Chronological reflow applied: Schedule pulled forward by 90 minutes');
    }

    try {
      const channel = new BroadcastChannel('wandersync_simulation');
      channel.postMessage({ type: 'CONTINGENCY_RESOLVED', option: optionType, blockId });
    } catch (e) {}
  }

  function insertChendulSlot() {
    let list = getItineraryData();
    if (list.some((b) => b.id === 'd1-chendul' || (b.title && b.title.includes('Chendul')))) {
      showScheduleToast('Lebuh Keng Kwee Chendul is already proposed on Day 1');
      return;
    }
    const chendul = {
      id: 'd1-chendul',
      day: 1,
      startTime: '12:30',
      endTime: '13:45',
      category: 'meal',
      status: 'proposed',
      title: 'Penang Road Famous Teochew Chendul & Asam Laksa',
      location: '27 & 29 Lebuh Keng Kwee, George Town',
      transitToNextMinutes: 25,
      transitMode: 'GrabCar to Penang Hill',
      requirements: ['Cash Ready (RM 5-10)', 'Napkins / Wet Wipes'],
      fallback: 'Joo Hooi Cafe Indoor Seating',
      fallbackReason: 'weather',
      notes: 'Iconic shaved ice with pandan green jelly noodles, red beans, and gula melaka. High turnover stall.',
      rating: 4.8,
    };
    list.push(chendul);
    saveItineraryData(list);
    expandedCardIds.add('d1-chendul');
    render();
    showScheduleToast('Inserted Lebuh Keng Kwee Chendul as Proposed Draft');
  }

  function insertSiamRoadSlot() {
    let list = getItineraryData();
    if (list.some((b) => b.id === 'd1-siam-ckt' || (b.title && b.title.includes('Siam Road')))) {
      return;
    }
    const ckt = {
      id: 'd1-siam-ckt',
      day: 1,
      startTime: '19:00',
      endTime: '20:15',
      category: 'meal',
      status: 'proposed',
      title: 'Siam Road Char Koay Teow',
      location: '82 Siam Road, George Town',
      transitToNextMinutes: 15,
      transitMode: 'GrabCar (15 min)',
      requirements: ['Cash Only', 'Expect 30-45m Queue'],
      advisory: 'Siam Road Char Koay Teow is closed on Mondays. Consider swapping with Day 3.',
      notes: 'Michelin Bib Gourmand charcoal-fried char koay teow with duck egg and cockles.',
      rating: 4.9,
    };
    list.push(ckt);
    saveItineraryData(list);
    render();
  }

  // ──────────────── Render Cycle ────────────────

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
    const cityTitle = (settings.destination || settings.title || 'Penang').split(',')[0].trim();

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
              Day ${d}${d === 2 && day2HasActivity && currentDay !== 2 ? '<span class="day-chip__dot">●</span>' : ''}
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

      <!-- Timeline Feed or Empty Day Canvas -->
      ${
        rawBlocks.length === 0
          ? `
        <div class="timeline-feed" id="timeline-feed-target">
          <div class="timeline-item-wrapper timeline-item-wrapper--empty" id="btn-empty-propose-slot" role="button" tabindex="0" title="Click to propose an event">
            <div class="timeline-node-pin timeline-node-pin--time">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-label="Time">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>

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
          ${
            dayList.length > 1
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

  // ──────────────── Venue Illustration Icons ────────────────

  function getVenueThumbnail(block) {
    const idSuffix = block.id || Math.random().toString(36).slice(2, 6);
    const title = (block.title || '').toLowerCase();

    // 1. Clan Jetties / Chew Jetty (Stilt houses over sea water)
    if (title.includes('chew jetty') || title.includes('clan jetties') || block.id === 'd1-chew-jetty') {
      return `
        <svg class="venue-circle-svg" viewBox="0 0 64 64" width="36" height="36" xmlns="http://www.w3.org/2000/svg" aria-label="Chew Jetty">
          <defs>
            <linearGradient id="jettySky-${idSuffix}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#0284C7"/>
              <stop offset="60%" stop-color="#7DD3FC"/>
              <stop offset="100%" stop-color="#E0F2FE"/>
            </linearGradient>
            <linearGradient id="jettySea-${idSuffix}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#0284C7"/>
              <stop offset="100%" stop-color="#0369A1"/>
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill="url(#jettySky-${idSuffix})"/>
          <rect x="0" y="42" width="64" height="22" fill="url(#jettySea-${idSuffix})"/>
          <!-- Wooden Stilt House -->
          <polygon points="12,24 32,10 52,24" fill="#92400E"/>
          <rect x="16" y="24" width="32" height="18" fill="#B45309"/>
          <rect x="22" y="28" width="6" height="8" fill="#FEF3C7"/>
          <rect x="36" y="28" width="6" height="8" fill="#FEF3C7"/>
          <!-- Wooden Stilts & Boardwalk Planks -->
          <line x1="20" y1="42" x2="20" y2="56" stroke="#78350F" stroke-width="2.5"/>
          <line x1="32" y1="42" x2="32" y2="58" stroke="#78350F" stroke-width="2.5"/>
          <line x1="44" y1="42" x2="44" y2="56" stroke="#78350F" stroke-width="2.5"/>
          <rect x="6" y="40" width="52" height="3" fill="#D97706" rx="1"/>
        </svg>
      `;
    }

    // 2. Penang Hill & Funicular Railway (Lush mountain canopy & tram)
    if (title.includes('penang hill') || title.includes('the habitat') || title.includes('funicular') || block.id === 'd1-penang-hill') {
      return `
        <svg class="venue-circle-svg" viewBox="0 0 64 64" width="36" height="36" xmlns="http://www.w3.org/2000/svg" aria-label="Penang Hill">
          <defs>
            <linearGradient id="hillSky-${idSuffix}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#38BDF8"/>
              <stop offset="70%" stop-color="#BAE6FD"/>
            </linearGradient>
            <linearGradient id="hillGrad-${idSuffix}" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#16A34A"/>
              <stop offset="100%" stop-color="#15803D"/>
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill="url(#hillSky-${idSuffix})"/>
          <!-- Tropical Mountain Slope -->
          <path d="M0,64 L0,30 Q30,16 64,42 L64,64 Z" fill="url(#hillGrad-${idSuffix})"/>
          <!-- Cable Line -->
          <line x1="4" y1="36" x2="60" y2="48" stroke="#F1F5F9" stroke-width="1.5" stroke-dasharray="2,2"/>
          <!-- Red Funicular Railway Tram -->
          <g transform="translate(24, 32) rotate(12)">
            <rect x="0" y="0" width="18" height="10" rx="2" fill="#DC2626"/>
            <rect x="2" y="2" width="4" height="4" fill="#FEF08A" rx="0.5"/>
            <rect x="7" y="2" width="4" height="4" fill="#FEF08A" rx="0.5"/>
            <rect x="12" y="2" width="4" height="4" fill="#FEF08A" rx="0.5"/>
          </g>
          <circle cx="50" cy="18" r="7" fill="#FDE047" opacity="0.9"/>
        </svg>
      `;
    }

    // 3. Teochew Chendul & Street Food / Hawker Fare
    if (title.includes('chendul') || title.includes('laksa') || title.includes('char koay teow') || title.includes('hawker') || title.includes('street food')) {
      return `
        <svg class="venue-circle-svg" viewBox="0 0 64 64" width="36" height="36" xmlns="http://www.w3.org/2000/svg" aria-label="Penang Hawker Food">
          <defs>
            <linearGradient id="chendulBg-${idSuffix}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#FEF3C7"/>
              <stop offset="100%" stop-color="#FDE68A"/>
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill="url(#chendulBg-${idSuffix})"/>
          <!-- Hawker Shaved Ice Bowl -->
          <ellipse cx="32" cy="46" rx="20" ry="11" fill="#D97706"/>
          <ellipse cx="32" cy="43" rx="17" ry="8" fill="#FFFBEB"/>
          <!-- Green Pandan Jelly & Red Beans -->
          <path d="M22,38 Q26,34 30,39" stroke="#16A34A" stroke-width="3" stroke-linecap="round" fill="none"/>
          <path d="M32,36 Q36,32 40,37" stroke="#16A34A" stroke-width="3" stroke-linecap="round" fill="none"/>
          <circle cx="25" cy="42" r="3.5" fill="#991B1B"/>
          <circle cx="38" cy="42" r="3" fill="#991B1B"/>
          <!-- Gula Melaka Coconut Drizzle -->
          <path d="M28,26 Q32,32 30,38" stroke="#78350F" stroke-width="2.5" stroke-linecap="round" fill="none"/>
          <circle cx="44" cy="22" r="3" fill="#EA580C"/>
        </svg>
      `;
    }

    // 4. The Top Komtar & Rainbow Skywalk (Modern Skyscraper)
    if (title.includes('komtar') || title.includes('skywalk') || title.includes('the top')) {
      return `
        <svg class="venue-circle-svg" viewBox="0 0 64 64" width="36" height="36" xmlns="http://www.w3.org/2000/svg" aria-label="Komtar Tower">
          <defs>
            <linearGradient id="komtarBg-${idSuffix}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#1E293B"/>
              <stop offset="100%" stop-color="#0F172A"/>
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill="url(#komtarBg-${idSuffix})"/>
          <!-- Cylindrical Tower -->
          <rect x="22" y="10" width="20" height="54" fill="#38BDF8" opacity="0.85" rx="2"/>
          <rect x="26" y="14" width="12" height="50" fill="#0284C7" rx="1"/>
          <!-- Cantilever Rainbow Skywalk Curve -->
          <path d="M20,18 Q32,8 44,18" stroke="#F59E0B" stroke-width="3" fill="none"/>
          <path d="M22,19 Q32,11 42,19" stroke="#10B981" stroke-width="1.5" fill="none"/>
          <circle cx="32" cy="12" r="2.5" fill="#FFFFFF"/>
        </svg>
      `;
    }

    // 5. ChinaHouse Cafe / Heritage Rest Pocket
    if (title.includes('chinahouse') || block.category === 'rest' || title.includes('cafe')) {
      return `
        <svg class="venue-circle-svg" viewBox="0 0 64 64" width="36" height="36" xmlns="http://www.w3.org/2000/svg" aria-label="Heritage Cafe">
          <defs>
            <linearGradient id="cafeBg-${idSuffix}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#FEF3C7"/>
              <stop offset="100%" stop-color="#FED7AA"/>
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill="url(#cafeBg-${idSuffix})"/>
          <!-- Heritage George Town Shophouse Facade -->
          <rect x="14" y="16" width="36" height="48" fill="#78350F" rx="2"/>
          <path d="M12,18 L32,6 L52,18 Z" fill="#991B1B"/>
          <!-- Timber Windows & Arched Doorway -->
          <rect x="20" y="24" width="8" height="10" fill="#FEF3C7" rx="4"/>
          <rect x="36" y="24" width="8" height="10" fill="#FEF3C7" rx="4"/>
          <path d="M26,44 A6,6 0 0 1 38,44 L38,64 L26,64 Z" fill="#FEF3C7"/>
          <!-- Steaming Coffee Cup -->
          <path d="M46,38 Q48,34 46,30" stroke="#EA580C" stroke-width="1.5" fill="none"/>
        </svg>
      `;
    }

    // 6. Nature / Entopia / Batu Ferringhi Beach
    if (title.includes('entopia') || title.includes('batu ferringhi') || title.includes('beach')) {
      return `
        <svg class="venue-circle-svg" viewBox="0 0 64 64" width="36" height="36" xmlns="http://www.w3.org/2000/svg" aria-label="Penang Nature">
          <defs>
            <linearGradient id="beachGrad-${idSuffix}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#F97316"/>
              <stop offset="50%" stop-color="#FDE047"/>
              <stop offset="100%" stop-color="#0284C7"/>
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill="url(#beachGrad-${idSuffix})"/>
          <!-- Palm Tree Silhouette -->
          <path d="M14,64 Q24,42 28,32" stroke="#78350F" stroke-width="3" fill="none"/>
          <path d="M28,32 Q20,26 12,30" stroke="#15803D" stroke-width="2.5" fill="none"/>
          <path d="M28,32 Q36,24 44,28" stroke="#15803D" stroke-width="2.5" fill="none"/>
          <path d="M28,32 Q30,20 28,16" stroke="#15803D" stroke-width="2.5" fill="none"/>
          <!-- Sun & Wave -->
          <circle cx="48" cy="22" r="8" fill="#FEF08A"/>
          <path d="M0,54 Q16,50 32,54 T64,54" stroke="#FFFFFF" stroke-width="2" fill="none"/>
        </svg>
      `;
    }

    // Default Fallback
    return `
      <svg class="venue-circle-svg" viewBox="0 0 64 64" width="36" height="36" xmlns="http://www.w3.org/2000/svg" aria-label="Landmark">
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

  // ──────────────── Timeline Item & Ghost Card Rendering ────────────────

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
        const isProposed = block.status === 'proposed';
        const isReel = block.source === 'reel' || block.reelUrl;

        // Formatted times
        const displayStart = formatDisplayTime(block.startTime);
        const displayEnd = formatDisplayTime(block.endTime);

        // Status styling and label
        let statusClass = 'status-pill-btn--proposed';
        let statusLabel = 'Proposed Draft';
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
          statusIconSvg = '<span class="status-dot-pulse">●</span>';
        }

        const collapsedStatusLabel = isCancelled
          ? 'Free Time'
          : block.status === 'tentative'
          ? 'Weather'
          : block.status === 'confirmed'
          ? 'Confirmed'
          : 'PROPOSED DRAFT';

        // 1. Proposed Draft Actions Row
        const proposedActionsHtml = isProposed
          ? `
          <div class="timeline-card__proposed-actions" data-proposed-actions="${block.id}">
            <button type="button" class="btn-card-confirm" data-confirm-proposed="${block.id}" title="Confirm this slot">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span>✓ Confirm</span>
            </button>
            <button type="button" class="btn-card-vote" data-vote-proposed="${block.id}" title="Put to group consensus vote">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m9 12 2 2 4-4"/>
                <path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z"/>
                <path d="M22 19H2"/>
              </svg>
              <span>🗳 Vote</span>
            </button>
          </div>
        `
          : '';

        // 2. Anti-Slop Schedule Advisory
        const hasAdvisory =
          !block.advisoryDismissed &&
          (block.advisory ||
            (block.title && (block.title.includes('Siam Road') || block.title.includes('Char Koay Teow'))) ||
            block.id === 'd1-siam-ckt');

        const advisoryHtml = hasAdvisory
          ? `
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
                <strong>Schedule Advisory:</strong> ${(typeof block.advisory === 'object' ? block.advisory.text : block.advisory) || 'Siam Road Char Koay Teow is closed on Mondays. Consider swapping with Day 3.'}
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
        `
          : '';

        // 3. Weather Alert Banner on Penang Hill
        const isPenangHill =
          block.id === 'd1-penang-hill' ||
          block.id === 'penang-hill-canopy' ||
          (block.title && block.title.includes('Penang Hill')) ||
          (block.id === 'd1-2' && block.title && block.title.includes('Penang'));

        const weatherAlertBannerHtml =
          weatherAlertActive && isPenangHill && block.status !== 'cancelled'
            ? `
            <div class="weather-alert-banner">
              <div class="weather-alert-banner__content">
                <span style="font-size: 15px;">🌧️</span>
                <div>
                  <strong>Weather Alert:</strong> Heavy Monsoon Downpour at Penang Hill Outdoor Station
                </div>
              </div>
              <button type="button" class="btn-resolve-contingency" data-resolve-contingency="${block.id}">
                Resolve Contingency ▾
              </button>
            </div>
          `
            : '';

        let cardContent = '';

        if (!isExpanded) {
          // Collapsed State
          cardContent = `
            <article class="timeline-card timeline-card--collapsed timeline-card--${block.category} ${isProposed ? 'timeline-card--proposed' : ''} ${isCancelled ? 'timeline-card--cancelled' : ''} ${isReel ? 'timeline-card--has-reel' : ''}">
              <div class="timeline-card__collapsed-split" data-toggle-details="${block.id}" role="button" tabindex="0" aria-expanded="false">
                <!-- Left Column: Times with Status & Category Badges -->
                <div class="timeline-card__time-col">
                  <div class="time-col__times">
                    <span class="time-col__start">${displayStart}</span>
                    <span class="time-col__divider">to</span>
                    <span class="time-col__end">${displayEnd}</span>
                  </div>
                  <div class="time-col__badges">
                    <span class="timeline-card__status-pill ${isProposed ? 'timeline-card__status-pill--proposed-glow' : `timeline-card__status-pill--${block.status}`}" title="Status: ${statusLabel}">
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
                    ${
                      isReel
                        ? `
                      <button type="button" class="card-origin-badge card-origin-badge--reel" data-preview-reel-id="${block.id}" title="Watch Reel Preview">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                        <span>Reel Pick</span>
                      </button>
                    `
                        : ''
                    }
                  </div>
                  ${
                    block.location
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

                  ${weatherAlertBannerHtml}
                  ${advisoryHtml}
                  ${proposedActionsHtml}
                </div>

                <!-- Right Edge Controls -->
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
            <article class="timeline-card timeline-card--expanded timeline-card--${block.category} ${isProposed ? 'timeline-card--proposed' : ''} ${isCancelled ? 'timeline-card--cancelled' : ''} ${isReel ? 'timeline-card--has-reel' : ''}">
              <div class="timeline-card__expanded-inner">
                <!-- Header: Badges & Shift / Collapse Controls -->
                <div class="timeline-card__expanded-header">
                  <div class="timeline-card__expanded-header-left">
                    <div class="timeline-card__expanded-badges">
                      <button type="button" class="status-pill-btn ${isProposed ? 'timeline-card__status-pill--proposed-glow' : statusClass}" data-status-btn="${block.id}" title="Tap to change status lifecycle">
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
                      ${
                        isReel
                          ? `
                        <button type="button" class="card-origin-badge card-origin-badge--reel" data-preview-reel-id="${block.id}" title="Watch Reel Preview">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                          <span>Watch Reel</span>
                        </button>
                      `
                          : ''
                      }
                    </div>
                    ${
                      block.location
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
                  ${weatherAlertBannerHtml}
                  ${advisoryHtml}
                  ${proposedActionsHtml}

                  ${
                    block.transitToNextMinutes > 0
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

                  ${
                    block.dressCode && block.dressCode.toLowerCase() !== 'none' && block.dressCode.trim() !== ''
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

                  ${
                    cleanReqs.length > 0
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

                  ${
                    block.fallback
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

                  <!-- Bottom Action Row: Thread, Edit, Delete, and Drag Handle -->
                  <div class="detail-panel__bottom-row">
                    <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                      <button type="button" class="btn-thread-badge btn-thread-badge--inline" data-thread-btn="${block.id}" title="Open Activity Chat Thread">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span>Thread ${threadMsgCount > 0 ? `(${threadMsgCount})` : ''}</span>
                      </button>

                      <button type="button" class="btn-card-action btn-card-action--edit" data-edit-block="${block.id}" title="Edit activity details" aria-label="Edit activity">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        <span>Edit</span>
                      </button>

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

        // 4. Timeline Gap Indicator Card Detection (> 2 hours between consecutive blocks)
        let gapCardHtml = '';
        const nextBlock = blocks[index + 1];
        if (nextBlock) {
          const gapMinutes = timeToMinutes(nextBlock.startTime) - timeToMinutes(block.endTime);
          if (gapMinutes >= 120) {
            const gapHours = Math.max(1, Math.round(gapMinutes / 60));
            const fromShort = block.title.split('(')[0].split('&')[0].trim();
            const toShort = nextBlock.title.split('(')[0].split('&')[0].trim();
            const isChewToPenang =
              (block.title.includes('Chew Jetty') || block.id === 'd1-chew-jetty') &&
              (nextBlock.title.includes('Penang Hill') || nextBlock.id === 'd1-penang-hill');

            const gapText = isChewToPenang
              ? '⚡ 4h Free Pocket: Chew Jetty ➔ Penang Hill. Need a lunch recommendation or Grab transit link?'
              : `⚡ ${gapHours}h Free Pocket: ${fromShort} ➔ ${toShort}. Need a lunch recommendation or Grab transit link?`;

            gapCardHtml = `
              <div class="timeline-gap-card" data-gap-from="${block.id}" data-gap-to="${nextBlock.id}">
                <div class="timeline-gap-card__spine-dot">
                  <span class="timeline-gap-card__lightning">⚡</span>
                </div>
                <div class="timeline-gap-card__content">
                  <div class="timeline-gap-card__info">
                    <span class="timeline-gap-card__badge">
                      <span class="timeline-gap-card__lightning">⚡</span>
                      <span>${gapHours}h Free Pocket: ${fromShort} ➔ ${toShort}</span>
                    </span>
                    <p class="timeline-gap-card__text">${gapText}</p>
                  </div>
                  <div class="timeline-gap-card__actions">
                    <button type="button" class="timeline-gap-card__btn" id="btn-gap-ask-wanderbot" data-gap-from="${block.id}" data-gap-to="${nextBlock.id}">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>
                        <rect x="4" y="8" width="16" height="12" rx="4"/>
                        <circle cx="9" cy="13" r="1"/>
                        <circle cx="15" cy="13" r="1"/>
                        <line x1="9" y1="17" x2="15" y2="17"/>
                      </svg>
                      <span>+ Ask WanderBot / Suggest Lunch</span>
                    </button>
                  </div>
                </div>
              </div>
            `;
          }
        }

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
            ${
              buffer
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
          ${gapCardHtml}
        `;
      })
      .join('');
  }

  // ──────────────── Event Binding & Handlers ────────────────

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
          if (currentDay === 2) {
            day2HasActivity = false; // Clear activity dot when visiting Day 2
          }
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

    // 3. Status Lifecycle Modal Trigger
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

    // 4. Proposed Card Actions: [✓ Confirm]
    container.querySelectorAll('[data-confirm-proposed]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const blockId = btn.getAttribute('data-confirm-proposed');
        if (blockId) confirmProposedBlock(blockId);
      });
    });

    // 4B. Proposed Card Actions: [🗳 Vote] (Consensus polling flow)
    container.querySelectorAll('[data-vote-proposed]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const blockId = btn.getAttribute('data-vote-proposed');
        const cardEl = btn.closest('.timeline-card');
        if (blockId && cardEl) triggerConsensusVote(blockId, cardEl);
      });
    });

    // 5. Anti-Slop Schedule Advisory: [Shift to Day 3 · Wed]
    container.querySelectorAll('[data-shift-day3]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const blockId = btn.getAttribute('data-shift-day3');
        if (blockId) shiftBlockToDay3(blockId);
      });
    });

    // 5B. Anti-Slop Schedule Advisory: [Keep Anyway]
    container.querySelectorAll('[data-keep-advisory]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const blockId = btn.getAttribute('data-keep-advisory');
        if (blockId) {
          itineraryList = itineraryList.map((b) =>
            b.id === blockId ? { ...b, advisoryDismissed: true } : b
          );
          saveItineraryData(itineraryList);
          render();
          showScheduleToast('Schedule advisory dismissed');
        }
      });
    });

    // 6. Timeline Gap Card Button: [+ Ask WanderBot / Suggest Lunch]
    container.querySelectorAll('#btn-gap-ask-wanderbot, .timeline-gap-card__btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const gapFrom = btn.getAttribute('data-gap-from') || 'd1-chew-jetty';
        const gapTo = btn.getAttribute('data-gap-to') || 'd1-penang-hill';

        try {
          setActiveTab('chat');
        } catch (err) {}

        window.dispatchEvent(
          new CustomEvent('wandersync:ask_lunch', {
            detail: { gapFrom, gapTo },
          })
        );

        try {
          const channel = new BroadcastChannel('wandersync_simulation');
          channel.postMessage({ type: 'ASK_LUNCH_GAP', from: gapFrom, to: gapTo });
        } catch (err) {}

        showScheduleToast('Navigating to Chat for WanderBot lunch recommendations...');
      });
    });

    // 7. Weather Alert: [Resolve Contingency ▾]
    container.querySelectorAll('[data-resolve-contingency]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const blockId = btn.getAttribute('data-resolve-contingency');
        const block = itineraryList.find((b) => b.id === blockId);
        if (block && statusModal) {
          statusModal.openContingency(block);
        }
      });
    });

    // 8. Card Edit Button
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

    // 9. Card Delete Button (Planning phase)
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

    // 10. Reel Preview Modal Trigger
    container.querySelectorAll('[data-preview-reel-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const blockId = btn.getAttribute('data-preview-reel-id');
        const block = itineraryList.find((b) => b.id === blockId) || {};
        openReelPreviewModal(block);
      });
    });

    // Contingency Swap Button (legacy block fallback)
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
        // Prevent toggle if clicking buttons inside actions
        if (e.target.closest('button') || e.target.closest('.timeline-card__proposed-actions') || e.target.closest('.timeline-card__advisory')) {
          return;
        }
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

    const creator = block.reelCreator || '@penangfoodie';
    const spotTitle = block.title || 'Penang Hill Canopy Walk';

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
                <span class="reel-sound-tag">♬ Penang Vibes • Trending Heritage Audio</span>
                <h4 style="margin: 4px 0 2px; font-size: 13px; color: #FFFFFF;">Top 5 Secret Heritage Spots & Sunset Lookouts</h4>
                <p style="margin: 0; font-size: 11px; opacity: 0.85;">Viral Reel • 3.8M Views • AI extracted 2 anchor locations</p>
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
                <span>Penang Road Famous Teochew Chendul (Suggested Gap Fill)</span>
              </div>
              <div class="reel-spot-tag">
                <span class="reel-spot-bullet">+</span>
                <span>ChinaHouse Heritage Cafe (Saved to Wishlist)</span>
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
        location: block.location || 'George Town, Penang',
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
            ${
              thread.messages.length === 0
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

  // ──────────────── Listeners & Inter-Subagent Simulation ────────────────

  // Subscribe to itinerary changes
  const unsubscribe = onItineraryChange(() => {
    render();
  });

  // Global methods for TravelApp
  if (!window.TravelApp) window.TravelApp = {};
  window.TravelApp.openProposeActivity = (day) => {
    if (addBlockModal) addBlockModal.open(day || currentDay);
  };
  window.TravelApp.insertChendulSlot = insertChendulSlot;
  window.TravelApp.insertSiamRoadSlot = insertSiamRoadSlot;
  window.TravelApp.confirmProposedBlock = confirmProposedBlock;
  window.TravelApp.shiftBlockToDay3 = shiftBlockToDay3;
  window.TravelApp.triggerWeatherAlert = () => {
    weatherAlertActive = true;
    render();
    showScheduleToast('🌧️ Monsoon Weather Alert triggered on Penang Hill');
  };

  // Custom Window Event Listeners
  const handleOpenPropose = (e) => {
    const targetDay = (e && e.detail && e.detail.day) || currentDay;
    if (addBlockModal) addBlockModal.open(targetDay);
  };
  window.addEventListener('open-propose-activity', handleOpenPropose);

  const handleSettingsUpdate = () => {
    render();
  };
  window.addEventListener('trip-settings-updated', handleSettingsUpdate);

  const handleDay2Activity = () => {
    day2HasActivity = true;
    render();
  };
  window.addEventListener('wandersync:day2_activity', handleDay2Activity);

  const handleWeatherAlert = () => {
    weatherAlertActive = true;
    render();
    showScheduleToast('🌧️ Monsoon Weather Alert triggered on Penang Hill');
  };
  window.addEventListener('wandersync:weather_alert', handleWeatherAlert);
  window.addEventListener('wandersync:monsoon_alert', handleWeatherAlert);
  window.addEventListener('wandersync:contingency_rain', handleWeatherAlert);
  window.addEventListener('wandersync:contingency_1', () => {
    const list = getItineraryData();
    const target = list.find(b => b.id === 'd1-penang-hill' || b.id === 'penang-hill-canopy' || (b.title && b.title.includes('Penang Hill')));
    if (target) handleContingencyOption(target.id, 'fallback');
  });
  window.addEventListener('wandersync:contingency_2', () => {
    const list = getItineraryData();
    const target = list.find(b => b.id === 'd1-penang-hill' || b.id === 'penang-hill-canopy' || (b.title && b.title.includes('Penang Hill')));
    if (target) handleContingencyOption(target.id, 'freetime');
  });
  window.addEventListener('wandersync:contingency_3', () => {
    const list = getItineraryData();
    const target = list.find(b => b.id === 'd1-penang-hill' || b.id === 'penang-hill-canopy' || (b.title && b.title.includes('Penang Hill')));
    if (target) handleContingencyOption(target.id, 'reflow');
  });
  window.addEventListener('wandersync:siam_road_advisory', () => {
    insertSiamRoadSlot();
  });

  const handleClearWeather = () => {
    weatherAlertActive = false;
    render();
  };
  window.addEventListener('wandersync:clear_weather', handleClearWeather);

  const handleInsertChendul = () => {
    insertChendulSlot();
  };
  window.addEventListener('wandersync:insert_chendul', handleInsertChendul);

  const handleInsertSiamRoad = () => {
    insertSiamRoadSlot();
  };
  window.addEventListener('wandersync:insert_siam_road', handleInsertSiamRoad);

  // Secret Hotkey Ctrl+Alt+R for Weather Contingency
  const handleKeydown = (e) => {
    if (e.ctrlKey && e.altKey && (e.key === 'r' || e.key === 'R')) {
      e.preventDefault();
      weatherAlertActive = !weatherAlertActive;
      render();
      showScheduleToast(
        weatherAlertActive
          ? '🌧️ Monsoon Weather Alert triggered on Penang Hill'
          : 'Monsoon Weather Alert cleared'
      );
    }
  };
  window.addEventListener('keydown', handleKeydown);

  // Cross-Tab & Remote Synchronization Channel
  let channel = null;
  try {
    channel = new BroadcastChannel('wandersync_simulation');
    channel.onmessage = (e) => {
      const data = e.data;
      if (!data) return;
      if (
        data.type === 'WEATHER_ALERT' ||
        data.type === 'TRIGGER_CONTINGENCY' ||
        data.type === 'RAIN_DISRUPTION' ||
        data.type === 'TRIGGER_MONSOON' ||
        data.type === 'CONTINGENCY_RAIN'
      ) {
        weatherAlertActive = true;
        render();
        showScheduleToast('⚠️ Remote: Monsoon Weather Alert triggered on Penang Hill');
      } else if (data.type === 'CLEAR_WEATHER') {
        weatherAlertActive = false;
        render();
      } else if (data.type === 'DAY2_ACTIVITY' || data.type === 'AUTONOMOUS_ADD') {
        day2HasActivity = true;
        render();
      } else if (data.type === 'INSERT_CHENDUL' || data.type === 'PROPOSE_CHENDUL') {
        insertChendulSlot();
      } else if (data.type === 'VOTE_CONFIRMED' && data.blockId) {
        confirmProposedBlock(data.blockId);
      } else if (data.type === 'SHIFT_TO_DAY3' && data.blockId) {
        shiftBlockToDay3(data.blockId);
      } else if (data.type === 'CONTINGENCY_1') {
        const list = getItineraryData();
        const target = list.find(b => b.id === 'd1-penang-hill' || b.id === 'penang-hill-canopy' || (b.title && b.title.includes('Penang Hill')));
        if (target) handleContingencyOption(target.id, 'fallback');
      } else if (data.type === 'CONTINGENCY_2') {
        const list = getItineraryData();
        const target = list.find(b => b.id === 'd1-penang-hill' || b.id === 'penang-hill-canopy' || (b.title && b.title.includes('Penang Hill')));
        if (target) handleContingencyOption(target.id, 'freetime');
      } else if (data.type === 'CONTINGENCY_3') {
        const list = getItineraryData();
        const target = list.find(b => b.id === 'd1-penang-hill' || b.id === 'penang-hill-canopy' || (b.title && b.title.includes('Penang Hill')));
        if (target) handleContingencyOption(target.id, 'reflow');
      } else if (data.type === 'TRIGGER_SIAM_ROAD_ADVISORY') {
        insertSiamRoadSlot();
      }
    };
  } catch (err) {
    console.warn('[Itinerary] BroadcastChannel not supported:', err);
  }

  // Initialize and return
  initModals();
  render();

  return {
    element: container,
    render,
    setDay: (day) => {
      currentDay = day;
      if (currentDay === 2) day2HasActivity = false;
      render();
    },
    destroy: () => {
      unsubscribe();
      window.removeEventListener('open-propose-activity', handleOpenPropose);
      window.removeEventListener('trip-settings-updated', handleSettingsUpdate);
      window.removeEventListener('wandersync:day2_activity', handleDay2Activity);
      window.removeEventListener('wandersync:weather_alert', handleWeatherAlert);
      window.removeEventListener('wandersync:clear_weather', handleClearWeather);
      window.removeEventListener('wandersync:insert_chendul', handleInsertChendul);
      window.removeEventListener('wandersync:insert_siam_road', handleInsertSiamRoad);
      window.removeEventListener('keydown', handleKeydown);
      if (channel) {
        try {
          channel.close();
        } catch (e) {}
      }
    },
  };
}
