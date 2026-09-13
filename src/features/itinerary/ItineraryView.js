/**
 * Interactive Drag-and-Drop Itinerary View (Modularized Feature Orchestrator)
 * Apple iOS 26 Liquid Glass Timeline with full Penang Demo Flow support.
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
} from '../../models/itineraryData.js';
import {
  calculateItineraryBuffers,
  recalculateDaySchedule,
  swapBlockTimeSlots,
  formatDuration,
  timeToMinutes,
} from '../../utils/bufferEngine.js';
import { getTripSettings, formatDateRange } from '../../models/tripSettings.js';
import { createStatusModal } from '../../components/itinerary/StatusModal.js';
import { createAddBlockModal } from '../../components/itinerary/AddBlockModal.js';
import { getThreadById, addMessageToThread, prepareConsensusVoteThread } from '../../models/chatData.js';
import { setActiveTab } from '../../config/navigation.js';
import { enableDragScroll } from '../../utils/dragScroll.js';
import { setTargetChatThread } from '../chat/ChatView.js';

import { getVenueThumbnail } from './venueIcons.js';
import { renderDaySelector } from './DaySelector.js';
import { renderTimelineCard } from './TimelineCard.js';
import { renderTimelineGap } from './TimelineGapIndicator.js';
import { openQuickThreadDrawer } from './QuickThreadDrawer.js';
import { openReelPreviewModal } from './ReelPreviewModal.js';
import { createDragScrollController } from './dragScrollController.js';

let persistentWeatherAlertActive = false;
let persistentDay2HasActivity = false;
let persistentDay2SimulationState = { active: false, step: 0, count: 0, text: '' };
let persistentCurrentDay = 1;

window.addEventListener("itinerary:set_day", (e) => {
  if (e && e.detail && e.detail.day) {
    persistentCurrentDay = Number(e.detail.day);
  }
});

function showScheduleToast(message) {
  let toast = document.getElementById('schedule-toast-notice');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'schedule-toast-notice';
    toast.className = 'schedule-toast-notice';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('schedule-toast-notice--visible');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('schedule-toast-notice--visible');
  }, 2600);
}

export function createItineraryView() {
  const container = document.createElement('div');
  container.className = 'feature-view itinerary-view';

  let currentDay = persistentCurrentDay || 1;
  let itineraryList = getItineraryData();
  let expandedCardIds = new Set();
  let checkedRequirements = new Set();
  let weatherAlertActive = persistentWeatherAlertActive;
  let day2HasActivity = persistentDay2HasActivity;
  let day2SimulationState = persistentDay2SimulationState;

  let statusModal = null;
  let addBlockModal = null;

  const dragScroller = createDragScrollController(container);

  function initModals() {
    statusModal = createStatusModal({
      onUpdateStatus: (blockId, newStatus) => {
        if (newStatus === 'cancelled') {
          itineraryList = cancelItineraryBlock(blockId);
        } else {
          itineraryList = updateItineraryBlock(blockId, { status: newStatus });
        }
        showScheduleToast(`Block marked as ${newStatus}`);
        render();
      },
      onContingencyAction: (blockId, optionType) => {
        resolveContingencyOption(blockId, optionType);
      },
    });

    addBlockModal = createAddBlockModal({
      onSave: (blockData, isEditMode) => {
        if (isEditMode) {
          itineraryList = updateItineraryBlock(blockData.id, blockData);
          showScheduleToast('Activity block updated');
        } else {
          itineraryList.push(blockData);
          saveItineraryData(itineraryList);
          showScheduleToast('New stop added to itinerary');
        }
        const dayBlocks = getDayBlocks();
        const recomputed = recalculateDaySchedule(dayBlocks);
        setDayBlocks(recomputed);
        render();
      },
    });
  }

  function getDayBlocks() {
    return itineraryList
      .filter((item) => (item.day || 1) === currentDay)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  }

  function setDayBlocks(updatedBlocks) {
    const otherBlocks = itineraryList.filter((item) => (item.day || 1) !== currentDay);
    itineraryList = [...otherBlocks, ...updatedBlocks];
    saveItineraryData(itineraryList);
  }

  function confirmProposedBlock(blockId) {
    itineraryList = itineraryList.map((b) => {
      if (
        b.id === blockId ||
        (blockId && blockId.includes('chendul') && b.id.includes('chendul')) ||
        (blockId && blockId.includes('borabora') && b.id.includes('borabora'))
      ) {
        return { ...b, status: 'confirmed' };
      }
      return b;
    });
    saveItineraryData(itineraryList);
    showScheduleToast('Proposed slot confirmed into schedule!');
    render();
  }

  function triggerConsensusVote(blockId, cardEl) {
    const block = itineraryList.find((b) => b.id === blockId) || getItineraryData().find((b) => b.id === blockId);
    const title = block ? block.title : 'Activity';

    if (cardEl) {
      const voteBtn = cardEl.querySelector(`[data-vote-proposed="${blockId}"]`);
      if (voteBtn) {
        voteBtn.disabled = true;
        voteBtn.innerHTML = `
          <svg class="spin-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"/></svg>
          <span>Opening Poll...</span>
        `;
      }
    }

    showScheduleToast(`Opening consensus poll for "${title}"`);

    // Prepare thread and active poll (2/3 pre-voted in favor)
    const thread = prepareConsensusVoteThread(block);
    const targetThreadId = thread ? thread.blockId : blockId;

    // Set target thread in ChatView so mounting directly opens the discussion
    setTargetChatThread(targetThreadId);

    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('wandersync:proposal_inserted', {
          detail: { blockId: targetThreadId, autoOpenPoll: true },
        })
      );
      window.dispatchEvent(
        new CustomEvent('chat:open_thread', {
          detail: { threadId: targetThreadId },
        })
      );
      setActiveTab('chat');
    }, 400);
  }

  function shiftBlockToDay3(blockId) {
    const cardEl = container.querySelector(`[data-block-id="${blockId}"]`);
    if (cardEl) {
      cardEl.classList.add('timeline-card--spring-exit');
    }

    setTimeout(() => {
      itineraryList = itineraryList.map((b) => {
        if (b.id === blockId) {
          return {
            ...b,
            day: 3,
            startTime: '12:30',
            endTime: '13:45',
            advisory: null,
            advisoryDismissed: true,
          };
        }
        return b;
      });
      saveItineraryData(itineraryList);

      const day1Blocks = itineraryList.filter((b) => (b.day || 1) === 1);
      const recomputedDay1 = recalculateDaySchedule(day1Blocks);
      const day3Blocks = itineraryList.filter((b) => (b.day || 1) === 3);
      const recomputedDay3 = recalculateDaySchedule(day3Blocks);

      itineraryList = [
        ...itineraryList.filter((b) => (b.day || 1) !== 1 && (b.day || 1) !== 3),
        ...recomputedDay1,
        ...recomputedDay3,
      ];
      saveItineraryData(itineraryList);

      showScheduleToast('Moved Siam Road Char Koay Teow to Day 3 (Wed)');
      render();
    }, 450);
  }

  function resolveContingencyOption(blockId, optionType) {
    if (statusModal) statusModal.close();

    if (optionType === 'indoor') {
      itineraryList = itineraryList.map((b) => {
        if (b.id === blockId || (b.title && b.title.includes('Penang Hill'))) {
          return {
            ...b,
            title: 'The Top Komtar Indoor Theme Park & Rainbow Skywalk',
            location: '1, Jalan Penang, George Town',
            category: 'activity',
            cost: 'RM 68 / pax',
            notes: 'Swapped from outdoor Penang Hill due to tropical monsoon rain advisory.',
            status: 'confirmed',
          };
        }
        return b;
      });
      saveItineraryData(itineraryList);
      weatherAlertActive = false;
      persistentWeatherAlertActive = false;
      showScheduleToast('Swapped Penang Hill to Indoor Fallback (The Top Komtar)!');
      render();
    } else if (optionType === 'free-time') {
      itineraryList = itineraryList.map((b) => {
        if (b.id === blockId || (b.title && b.title.includes('Penang Hill'))) {
          return {
            ...b,
            title: 'Free-Time Coffee & Art Pocket at ChinaHouse Cafe',
            location: '183B Lebuh Pantai, George Town',
            category: 'rest',
            cost: 'Free / Pay per order',
            notes: 'Held as shelter & dessert pocket at Beach Street shophouse cafe.',
            status: 'tentative',
          };
        }
        return b;
      });
      saveItineraryData(itineraryList);
      weatherAlertActive = false;
      persistentWeatherAlertActive = false;
      showScheduleToast('Window held as Free-Time Pocket at ChinaHouse Cafe.');
      render();
    } else if (optionType === 'reflow') {
      itineraryList = itineraryList.filter((b) => b.id !== blockId && !(b.title && b.title.includes('Penang Hill')));
      const day1 = itineraryList.filter((b) => (b.day || 1) === 1);
      const reflowed = recalculateDaySchedule(day1);
      itineraryList = [...itineraryList.filter((b) => (b.day || 1) !== 1), ...reflowed];
      saveItineraryData(itineraryList);
      weatherAlertActive = false;
      persistentWeatherAlertActive = false;
      showScheduleToast('Cancelled block and reflowed schedule chronologically.');
      render();
    }
  }

  function insertChendulSlot() {
    const items = getItineraryData();
    if (items.some((i) => i.id === 'd1-chendul')) return;

    itineraryList.push({
      id: 'd1-chendul',
      day: 1,
      startTime: '12:30',
      endTime: '13:30',
      title: 'Penang Road Famous Teochew Chendul & Asam Laksa',
      location: '492, Lebuh Keng Kwee, George Town',
      category: 'meal',
      cost: 'RM 12 / pax',
      status: 'proposed',
      notes: 'Iconic shaved ice dessert with pandan jelly, coconut milk, and gula melaka.',
      grabTime: '8 min Grab from Chew Jetty',
      transitToNextMinutes: 25,
      transitMode: 'Transit (25 min) to Penang Hill',
      requirements: ['Bring small RM cash', 'Peak lunchtime queue'],
    });

    saveItineraryData(itineraryList);
    showScheduleToast('WanderBot lunch proposal placed on Day 1 timeline!');
    render();
  }

  function insertSiamRoadSlot() {
    const items = getItineraryData();
    if (items.some((i) => i.id === 'd1-siam-ckt')) return;

    itineraryList.push({
      id: 'd1-siam-ckt',
      day: 1,
      startTime: '13:00',
      endTime: '14:15',
      title: 'Siam Road Charcoal Char Koay Teow',
      location: '82, Jalan Siam, George Town',
      category: 'meal',
      cost: 'RM 10 / plate',
      status: 'confirmed',
      notes: 'Famous wok hei street food fried by Uncle Tan over charcoal.',
      advisory: 'Siam Road Char Koay Teow is closed on Mondays. Consider swapping with Day 3.',
      advisoryDismissed: false,
    });

    saveItineraryData(itineraryList);
    render();
  }

  function renderTimelineItems(blocks) {
    return blocks
      .map((block, index) => {
        const isExpanded = expandedCardIds.has(block.id);
        const buffer = block.transitBuffer;
        const isLastItem = index === blocks.length - 1;
        const nextBlock = blocks[index + 1];

        const cardHtml = renderTimelineCard({
          block,
          index,
          totalBlocks: blocks.length,
          isExpanded,
          checkedRequirements,
          weatherAlertActive,
        });

        const gapHtml = renderTimelineGap(block, nextBlock, blocks);

        const bufferHtml = buffer
          ? `
          <div class="timeline-transit-connector ${buffer.isDeficit ? 'timeline-transit-connector--warning' : ''}">
            <div class="transit-connector-pill">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>${buffer.isDeficit ? '⚠️ ' : ''}${formatDuration(buffer.availableMinutes ?? buffer.actualMinutes)} transit buffer (${formatDuration(buffer.requiredMinutes)} needed)</span>${buffer.isDeficit ? `<span class="buffer-tight-label">-${formatDuration(buffer.deficitMinutes)}</span>` : ''}
            </div>
          </div>
        `
          : '';

        return `
          <div class="timeline-item-wrapper" data-block-id="${block.id}" draggable="true">
            <div class="timeline-node-pin" data-category="${block.category}">
              ${getVenueThumbnail(block)}
            </div>
            ${!isLastItem ? '<div class="timeline-spine-connector" aria-hidden="true"></div>' : ''}
            ${cardHtml}
            ${bufferHtml}
          </div>
          ${gapHtml}
        `;
      })
      .join('');
  }

  function render() {
    const settings = getTripSettings();
    const dayList = getItineraryDayList();

    if (!dayList.includes(currentDay)) {
      currentDay = dayList[0] || 1;
    }

    const rawBlocks = getDayBlocks();
    const blocksWithBuffers = calculateItineraryBuffers(rawBlocks);

    const DEFAULT_PENANG_COVER = 'https://image-tc.galaxy.tf/wijpeg-9j3ux7drhby0iny1evej1e38j/sunset-at-penang-bridge.jpg?width=1920';
    const coverBg = (!settings.coverImage || settings.coverImage.includes('hero-banner.jpg') || settings.coverImage.includes('bg-itinerary.png'))
      ? DEFAULT_PENANG_COVER
      : settings.coverImage;
    const cityTitle = (settings.destination || settings.title || 'Penang').split(',')[0].trim();

    container.innerHTML = `
      <div class="view-banner" style="background-image: url('${coverBg}');">
        <button type="button" class="view-banner__menu-btn" id="btn-open-sidebar" aria-label="Open Trip Menu" title="Open Menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div class="view-banner__scrim">
          <span class="view-banner__badge">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            ${settings.destination || 'Penang, Malaysia'} Expedition
          </span>
          <h2 class="view-banner__title">Master Timeline</h2>
        </div>
      </div>

      <div class="itinerary-header-bar">
        <div class="itinerary-header-title">
          <span class="itinerary-date-range">${formatDateRange(settings.startDate, settings.endDate, settings.totalDays)}</span>
          <h3 class="itinerary-main-heading">Trip Schedule</h3>
        </div>
        <button type="button" class="btn-propose-fab" id="btn-add-activity" aria-label="Add stop" title="Propose new stop">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <span>Add Stop</span>
        </button>
      </div>

      <div id="day-selector-slot"></div>

      <div class="timeline-container timeline-feed" id="timeline-container">
        ${
          blocksWithBuffers.length === 0
            ? `
          <div class="empty-day-card">
            <div class="empty-day-card__icon-orb">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
                <line x1="12" y1="14" x2="12" y2="18"></line>
                <line x1="10" y1="16" x2="14" y2="16"></line>
              </svg>
            </div>
            <span class="empty-day-card__badge">Day ${currentDay} Schedule</span>
            <h3 class="empty-day-card__title">No activities planned yet</h3>
            <p class="empty-day-card__desc">Propose a spot or ask WanderBot AI in chat to build an optimized itinerary slot.</p>
            <button type="button" class="btn-add-stop-empty" id="btn-empty-add-activity">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              <span>Propose First Stop</span>
            </button>
          </div>
        `
            : renderTimelineItems(blocksWithBuffers)
        }
      </div>
    `;

    // Insert DaySelector
    const slot = container.querySelector('#day-selector-slot');
    if (slot) {
      const daySelectorEl = renderDaySelector({
        dayList,
        currentDay,
        day2HasActivity,
        day2SimulationState,
        onSelectDay: (day) => {
          currentDay = day;
          persistentCurrentDay = day;
          if (day === 2) {
            day2HasActivity = false;
            persistentDay2HasActivity = false;
          }
          render();
        },
        onAddDay: () => {
          addItineraryDay();
          const list = getItineraryDayList();
          currentDay = list[list.length - 1];
          persistentCurrentDay = currentDay;
          showScheduleToast(`Day ${currentDay} added to itinerary`);
          render();
        },
        onRemoveDay: (day) => {
          if (dayList.length <= 1) {
            showScheduleToast('Trip must have at least 1 day');
            return;
          }
          removeItineraryDay(day);
          const list = getItineraryDayList();
          currentDay = list[0] || 1;
          persistentCurrentDay = currentDay;
          showScheduleToast(`Day ${day} removed`);
          render();
        },
      });
      slot.appendChild(daySelectorEl);
    }

    attachEventListeners();
  }

  function attachEventListeners() {
    const openSidebarBtn = container.querySelector('#btn-open-sidebar');
    if (openSidebarBtn) {
      openSidebarBtn.addEventListener('click', () => {
        if (window.TravelApp?.sidebar?.open) {
          window.TravelApp.sidebar.open();
        } else if (window.TravelApp?.openSidebar) {
          window.TravelApp.openSidebar();
        }
      });
    }

    const addBtn = container.querySelector('#btn-add-activity');
    if (addBtn) addBtn.addEventListener('click', () => addBlockModal?.open(currentDay));

    const emptyAddBtn = container.querySelector('#btn-empty-add-activity');
    if (emptyAddBtn) emptyAddBtn.addEventListener('click', () => addBlockModal?.open(currentDay));

    // Card Details Accordion
    container.querySelectorAll('.timeline-card').forEach((card) => {
      card.querySelectorAll('[data-toggle-details]').forEach((trigger) => {
        trigger.addEventListener('click', (e) => {
          const clickedBtn = e.target.closest('button');
          if (clickedBtn && !clickedBtn.matches('[data-toggle-details]')) return;

          e.stopPropagation();
          const blockId = trigger.getAttribute('data-toggle-details');
          if (expandedCardIds.has(blockId)) {
            expandedCardIds.delete(blockId);
          } else {
            expandedCardIds.add(blockId);
          }
          render();
        });
      });
    });

    // Edit Block Modal Trigger
    container.querySelectorAll('[data-edit-block]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const blockId = btn.getAttribute('data-edit-block');
        const block = itineraryList.find((b) => b.id === blockId);
        if (block && addBlockModal) {
          addBlockModal.open(currentDay, {}, block);
        }
      });
    });

    // Requirements Checklist Checkboxes
    container.querySelectorAll('.requirement-checkbox').forEach((box) => {
      box.addEventListener('change', (e) => {
        const key = box.getAttribute('data-req-key');
        if (box.checked) {
          checkedRequirements.add(key);
        } else {
          checkedRequirements.delete(key);
        }
        const item = box.closest('.requirement-item');
        if (item) item.classList.toggle('requirement-item--done', box.checked);
      });
    });

    // Status Modal Trigger
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

    // Contingency Resolution Triggers
    container.querySelectorAll('[data-resolve-contingency]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const blockId = btn.getAttribute('data-resolve-contingency');
        const block = itineraryList.find((b) => b.id === blockId);
        if (block && statusModal) {
          statusModal.open(block, 'contingency');
        }
      });
    });

    // Shift to Day 3 Trigger
    container.querySelectorAll('[data-shift-day3]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const blockId = btn.getAttribute('data-shift-day3');
        shiftBlockToDay3(blockId);
      });
    });

    // Keep Advisory
    container.querySelectorAll('[data-keep-advisory]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const blockId = btn.getAttribute('data-keep-advisory');
        itineraryList = itineraryList.map((b) => {
          if (b.id === blockId) return { ...b, advisoryDismissed: true };
          return b;
        });
        saveItineraryData(itineraryList);
        render();
      });
    });

    // Reel Preview Modal Trigger
    container.querySelectorAll('[data-preview-reel-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const blockId = btn.getAttribute('data-preview-reel-id');
        const block = itineraryList.find((b) => b.id === blockId);
        if (block) openReelPreviewModal(block);
      });
    });

    // Thread Button Trigger
    container.querySelectorAll('[data-thread-btn]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const blockId = btn.getAttribute('data-thread-btn');
        const block = itineraryList.find((b) => b.id === blockId);
        if (block) {
          openQuickThreadDrawer(block, currentDay, () => render());
        }
      });
    });

    // Ask WanderBot Gap Button
    const gapBtn = container.querySelector('#btn-gap-ask-wanderbot');
    if (gapBtn) {
      gapBtn.addEventListener('click', () => {
        insertChendulSlot();
      });
    }

    // Proposed Vote Trigger
    container.querySelectorAll('[data-vote-proposed]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const blockId = btn.getAttribute('data-vote-proposed');
        const cardEl = btn.closest('.timeline-card');
        triggerConsensusVote(blockId, cardEl);
      });
    });

    // Delete Block Trigger
    container.querySelectorAll('[data-delete-block]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const blockId = btn.getAttribute('data-delete-block');
        itineraryList = deleteItineraryBlock(blockId);
        const dayBlocks = getDayBlocks();
        const recomputed = recalculateDaySchedule(dayBlocks);
        setDayBlocks(recomputed);
        showScheduleToast('Activity deleted from schedule');
        render();
      });
    });

    // Shift Up / Down Controls
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

    attachDragAndDropHandlers();
  }

  function moveItem(blockId, direction) {
    const dayBlocks = getDayBlocks();
    const idx = dayBlocks.findIndex((b) => b.id === blockId);
    if (idx === -1) return;

    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= dayBlocks.length) return;

    const [moved] = dayBlocks.splice(idx, 1);
    dayBlocks.splice(targetIdx, 0, moved);

    const recomputed = recalculateDaySchedule(dayBlocks);
    setDayBlocks(recomputed);
    render();
  }

  function attachDragAndDropHandlers() {
    const items = container.querySelectorAll('.timeline-item-wrapper[draggable="true"]');
    let draggedId = null;

    items.forEach((item) => {
      item.addEventListener('dragstart', (e) => {
        if (e.target.closest('button, input, select, textarea, [data-toggle-details], .timeline-card__right-actions, .timeline-card__body-col, .timeline-card__time-col, .requirements-checklist, .detail-panel')) {
          e.preventDefault();
          return false;
        }
        draggedId = item.dataset.blockId;
        e.dataTransfer.setData('text/plain', draggedId);
        item.classList.add('is-dragging');
        dragScroller.startDragSession();
      });

      item.addEventListener('drag', (e) => {
        if (e.clientY) dragScroller.updateAutoScroll(e.clientY);
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('is-dragging');
        dragScroller.endDragSession();
        container.querySelectorAll('.drag-over-above, .drag-over-below').forEach((el) => {
          el.classList.remove('drag-over-above', 'drag-over-below');
        });
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        const rect = item.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        item.classList.remove('drag-over-above', 'drag-over-below');
        if (e.clientY < midY) {
          item.classList.add('drag-over-above');
        } else {
          item.classList.add('drag-over-below');
        }
      });

      item.addEventListener('dragleave', () => {
        item.classList.remove('drag-over-above', 'drag-over-below');
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetId = item.dataset.blockId;
        const rect = item.getBoundingClientRect();
        const placeAbove = e.clientY < rect.top + rect.height / 2;

        item.classList.remove('drag-over-above', 'drag-over-below');
        if (!draggedId || draggedId === targetId) return;

        executeReorder(draggedId, targetId, placeAbove);
      });
    });
  }

  function executeReorder(sourceId, targetId, placeAbove) {
    const dayBlocks = getDayBlocks();
    const sIdx = dayBlocks.findIndex((b) => b.id === sourceId);
    const tIdx = dayBlocks.findIndex((b) => b.id === targetId);
    if (sIdx === -1 || tIdx === -1) return;

    const [moved] = dayBlocks.splice(sIdx, 1);
    const newTargetIdx = dayBlocks.findIndex((b) => b.id === targetId);
    const insertIdx = placeAbove ? newTargetIdx : newTargetIdx + 1;
    dayBlocks.splice(insertIdx, 0, moved);

    const recomputed = recalculateDaySchedule(dayBlocks);
    setDayBlocks(recomputed);
    render();
  }

  // Simulation & Custom Event Listeners
  const handleProposalInserted = (e) => {
    itineraryList = getItineraryData();
    render();
  };
  window.addEventListener('wandersync:proposal_inserted', handleProposalInserted);

  const handleProposalConfirmed = () => {
    itineraryList = getItineraryData();
    render();
  };
  window.addEventListener('itinerary:confirmed', handleProposalConfirmed);
  window.addEventListener('wandersync:vote_consensus', handleProposalConfirmed);

  const handleMonsoonAlert = () => {
    weatherAlertActive = true;
    persistentWeatherAlertActive = true;
    render();
  };
  window.addEventListener('wandersync:monsoon_alert', handleMonsoonAlert);

  const handleDay2Activity = (e) => {
    day2HasActivity = true;
    persistentDay2HasActivity = true;
    if (e && e.detail) {
      day2SimulationState = { ...day2SimulationState, ...e.detail };
      persistentDay2SimulationState = day2SimulationState;
    }
    render();
  };
  window.addEventListener('wandersync:day2_activity', handleDay2Activity);

  const handleSiamRoadAdvisory = () => {
    insertSiamRoadSlot();
  };
  window.addEventListener('wandersync:siam_road_advisory', handleSiamRoadAdvisory);

  const handleContingency1 = () => resolveContingencyOption('d1-penang-hill', 'indoor');
  const handleContingency2 = () => resolveContingencyOption('d1-penang-hill', 'free-time');
  const handleContingency3 = () => resolveContingencyOption('d1-penang-hill', 'reflow');

  window.addEventListener('wandersync:contingency_1', handleContingency1);
  window.addEventListener('wandersync:contingency_2', handleContingency2);
  window.addEventListener('wandersync:contingency_3', handleContingency3);

  const handleResetAll = () => {
    weatherAlertActive = false;
    persistentWeatherAlertActive = false;
    day2HasActivity = false;
    persistentDay2HasActivity = false;
    currentDay = 1;
    itineraryList = getItineraryData();
    render();
  };
  window.addEventListener('wandersync:reset_all', handleResetAll);
  const handleSetDay = (e) => {
    if (e && e.detail && e.detail.day) {
      currentDay = Number(e.detail.day);
      persistentCurrentDay = currentDay;
      render();
    }
  };
  window.addEventListener("itinerary:set_day", handleSetDay);

  const handleOpenAddModal = (e) => {
    const day = (e && e.detail && e.detail.day) ? e.detail.day : currentDay;
    addBlockModal?.open(day);
  };
  window.addEventListener('itinerary:open-add-modal', handleOpenAddModal);

  // Global window helpers for headless controller compatibility
  if (!window.TravelApp) window.TravelApp = {};
  window.TravelApp.insertChendulSlot = insertChendulSlot;
  window.TravelApp.insertSiamRoadSlot = insertSiamRoadSlot;
  window.TravelApp.confirmProposedBlock = confirmProposedBlock;
  window.TravelApp.shiftBlockToDay3 = shiftBlockToDay3;
  window.TravelApp.openAddBlockModal = (day) => {
    addBlockModal?.open(day || currentDay);
  };

  initModals();
  render();

  return {
    element: container,
    destroy() {
      dragScroller.destroy();
      window.removeEventListener('itinerary:open-add-modal', handleOpenAddModal);
      window.removeEventListener('wandersync:proposal_inserted', handleProposalInserted);
      window.removeEventListener('itinerary:confirmed', handleProposalConfirmed);
      window.removeEventListener('wandersync:vote_consensus', handleProposalConfirmed);
      window.removeEventListener('wandersync:monsoon_alert', handleMonsoonAlert);
      window.removeEventListener('wandersync:day2_activity', handleDay2Activity);
      window.removeEventListener('wandersync:siam_road_advisory', handleSiamRoadAdvisory);
      window.removeEventListener('wandersync:contingency_1', handleContingency1);
      window.removeEventListener('wandersync:contingency_2', handleContingency2);
      window.removeEventListener('wandersync:contingency_3', handleContingency3);
      window.removeEventListener('wandersync:reset_all', handleResetAll);
      window.removeEventListener("itinerary:set_day", handleSetDay);
      if (statusModal?.element?.parentElement) statusModal.element.remove();
      if (addBlockModal?.element?.parentElement) addBlockModal.element.remove();
      if (container.parentElement) container.remove();
    },
  };
}
