/**
 * Interactive Drag-and-Drop Itinerary View
 * Conforms to IDEA.pdf specs:
 * 1. Drag-and-Drop Time Blocks (Activities, Meals, Transit, Rest)
 * 2. Automatic Transit Buffer Recalculation & Warning Alerts
 * 3. Slot Status Lifecycle (Proposed, Confirmed, Weather Permitting with Fallback)
 * 4. Per-Slot Requirements (What to bring, dress code, tickets)
 */

import {
  getItineraryData,
  saveItineraryData,
  resetItineraryData,
} from '../models/itineraryData.js';
import { calculateItineraryBuffers } from '../utils/bufferEngine.js';
import { createStatusModal } from '../components/itinerary/StatusModal.js';
import { createAddBlockModal } from '../components/itinerary/AddBlockModal.js';
import { getThreadById, addMessageToThread } from '../models/chatData.js';
import { setActiveTab } from '../config/navigation.js';

export function createItineraryView() {
  const container = document.createElement('div');
  container.className = 'feature-view itinerary-view';

  let itineraryList = getItineraryData();
  let currentDay = 1;
  let expandedCardIds = new Set(['d1-2', 'd1-3']); // Default expand first couple for showcase

  // Modals
  let statusModal;
  let addBlockModal;

  function initModals() {
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
        itineraryList.push(newBlock);
        saveItineraryData(itineraryList);
        render();
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
      <div class="view-header">
        <div class="view-header__meta">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="view-badge">Interactive Timeline</span>
            <span class="itinerary-count-badge">${rawBlocks.length} Scheduled Stops</span>
          </div>
          <p class="view-subtitle">
            Drag or use arrows to shift blocks. Buffer times recalculate automatically.
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

      <!-- Transit Buffer Warning Banner (if any warning active on this day) -->
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
            <strong>Transit Buffer Alert:</strong> ${activeWarnings.length} route(s) have insufficient travel windows! Shifting blocks will recalculate times.
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

      <!-- Draggable Timeline Blocks Container -->
      <div class="timeline-feed" id="timeline-feed-target">
        ${renderTimelineItems(blocksWithBuffers)}
      </div>
    `;

    attachEvents(rawBlocks);
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

    return blocks
      .map((block, index) => {
        const isExpanded = expandedCardIds.has(block.id);
        const buffer = block.transitBuffer;

        // Status styling and label
        let statusClass = 'status-pill-btn--proposed';
        let statusDotClass = 'status-dot--proposed';
        let statusLabel = 'Proposed';
        if (block.status === 'confirmed') {
          statusClass = 'status-pill-btn--confirmed';
          statusDotClass = 'status-dot--confirmed';
          statusLabel = 'Confirmed';
        } else if (block.status === 'tentative') {
          statusClass = 'status-pill-btn--tentative';
          statusDotClass = 'status-dot--tentative';
          statusLabel = 'Weather Permitting';
        }

        // Category info
        const categoryMap = {
          activity: { label: 'Activity' },
          meal: { label: 'Meal' },
          transit: { label: 'Transit' },
          rest: { label: 'Check-in / Rest' },
        };
        const catInfo = categoryMap[block.category] || categoryMap.activity;

        return `
        <div 
          class="timeline-item-wrapper" 
          data-block-id="${block.id}" 
          data-index="${index}"
          draggable="true"
        >
          <!-- Main Card -->
          <article class="timeline-card timeline-card--${block.category}">
            <div class="timeline-card__main">
              <!-- Top Row: Time, Status Pill & Controls -->
              <div class="timeline-card__top">
                <div class="timeline-card__time-badge">
                  <span>${block.startTime} – ${block.endTime}</span>
                  <span class="category-tag">${catInfo.label}</span>
                </div>

                <div class="timeline-card__controls">
                  <!-- Per-Activity Chat Thread Button -->
                  <button type="button" class="btn-thread-badge" data-thread-btn="${block.id}" title="Open Activity Chat Thread">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <span>Thread</span>
                  </button>

                  <!-- Quick Shift Up / Down Arrow buttons -->
                  ${
                    index > 0
                      ? `<button type="button" class="shift-arrow-btn shift-up-btn" data-id="${block.id}" title="Move earlier" aria-label="Move earlier">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                        </button>`
                      : ''
                  }
                  ${
                    index < blocks.length - 1
                      ? `<button type="button" class="shift-arrow-btn shift-down-btn" data-id="${block.id}" title="Move later" aria-label="Move later">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>`
                      : ''
                  }

                  <!-- Touch & Mouse Grip Handle -->
                  <div class="drag-grip" title="Hold & drag to reorder" data-id="${block.id}" aria-label="Drag handle">
                    <svg width="10" height="14" viewBox="0 0 16 20" fill="currentColor" opacity="0.6">
                      <circle cx="5" cy="4" r="1.5"/><circle cx="11" cy="4" r="1.5"/>
                      <circle cx="5" cy="10" r="1.5"/><circle cx="11" cy="10" r="1.5"/>
                      <circle cx="5" cy="16" r="1.5"/><circle cx="11" cy="16" r="1.5"/>
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Title, Status & Location -->
              <div class="timeline-card__heading">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                  <h3 class="timeline-card__title">${block.title}</h3>
                  <button type="button" class="status-pill-btn ${statusClass}" data-status-btn="${block.id}" title="Click to change status lifecycle">
                    <span class="status-dot ${statusDotClass}"></span>
                    <span>${statusLabel}</span>
                  </button>
                </div>
                <p class="timeline-card__location">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: -1px; margin-right: 4px; color: var(--color-text-secondary);">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  ${block.location}
                </p>
              </div>

              <!-- Toggle Row -->
              <div class="timeline-card__toggle-row">
                <div class="details-badge-row">
                  ${
                    block.requirements && block.requirements.length > 0
                      ? `<span class="req-tag">${block.requirements[0]}</span>`
                      : ''
                  }
                  ${
                    block.fallback
                      ? `<span class="req-tag" style="background: var(--color-surface-alt); color: #C2410C; border: 1px solid #FED7AA;">Fallback Plan</span>`
                      : ''
                  }
                </div>
                <button type="button" class="timeline-card__expand-btn" data-toggle-details="${block.id}">
                  ${isExpanded ? 'Hide Details' : 'Details'}
                </button>
              </div>
            </div>

            <!-- Expandable Per-Slot Details & Requirements -->
            <div class="timeline-card__details ${isExpanded ? 'is-expanded' : ''}" id="details-${block.id}">
              ${
                block.dressCode
                  ? `
                <div>
                  <span class="detail-chip detail-chip--dress">Dress Code: ${block.dressCode}</span>
                </div>
              `
                  : ''
              }

              <!-- What to bring / Requirements Tags -->
              <div>
                <strong style="font-size: 11px; color: var(--color-text-primary);">Requirements & Tags:</strong>
                <div class="details-badge-row" style="margin-top: 4px;">
                  ${(block.requirements || [])
                    .map((r) => `<span class="detail-chip">${r}</span>`)
                    .join('')}
                </div>
              </div>

              <!-- Built-in Fallback for Weather Permitting slots -->
              ${
                block.fallback
                  ? `
                <div class="fallback-box">
                  <span class="fallback-box__label">Built-in Fallback Plan:</span>
                  <span>${block.fallback}</span>
                </div>
              `
                  : ''
              }

              ${
                block.notes
                  ? `<p style="font-size: 11px; color: var(--color-text-secondary); margin-top: 2px;"><em>Note: ${block.notes}</em></p>`
                  : ''
              }
            </div>
          </article>

          <!-- Transit Buffer Connector to next event -->
          ${
            buffer
              ? `
            <div class="transit-connector ${buffer.isDeficit ? 'transit-connector--warning' : ''}">
              <div class="transit-connector__info">
                ${
                  buffer.isDeficit
                    ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #DC2626;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
                    : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-secondary);"><polyline points="9 18 15 12 9 6"></polyline></svg>`
                }
                <span class="transit-connector__badge">${Math.max(0, buffer.availableMinutes)}m buffer</span>
                <span>• ${buffer.transitMode}</span>
              </div>
              ${
                buffer.isDeficit
                  ? `<span class="transit-warning-pill">${buffer.requiredMinutes}m Needed</span>`
                  : `<span style="font-size: 10px; color: var(--color-secondary); display: inline-flex; align-items: center; gap: 3px;">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      Safe Buffer
                    </span>`
              }
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

    // 5. Expand / Collapse Details
    container.querySelectorAll('[data-toggle-details]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const blockId = btn.getAttribute('data-toggle-details');
        if (expandedCardIds.has(blockId)) {
          expandedCardIds.delete(blockId);
        } else {
          expandedCardIds.add(blockId);
        }
        render();
      });
    });

    // 6. Accessible Shift Up / Shift Down Buttons
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

    // 7. Drag-and-Drop Reordering Engine (Touch & Mouse)
    attachDragAndDropHandlers();
  }

  function moveItem(blockId, direction) {
    const rawBlocks = getDayBlocks();
    const index = rawBlocks.findIndex((b) => b.id === blockId);
    if (index === -1) return;

    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= rawBlocks.length) return;

    // Swap items
    const temp = rawBlocks[index];
    rawBlocks[index] = rawBlocks[targetIndex];
    rawBlocks[targetIndex] = temp;

    setDayBlocks(rawBlocks);
    render();
  }

  function attachDragAndDropHandlers() {
    const feed = container.querySelector('#timeline-feed-target');
    if (!feed) return;

    let draggedWrapper = null;
    let draggedId = null;

    // ── Desktop Drag & Drop (HTML5) ──
    const wrappers = feed.querySelectorAll('.timeline-item-wrapper');

    wrappers.forEach((wrapper) => {
      wrapper.addEventListener('dragstart', (e) => {
        draggedWrapper = wrapper;
        draggedId = wrapper.getAttribute('data-block-id');
        wrapper.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedId);
      });

      wrapper.addEventListener('dragend', () => {
        wrapper.classList.remove('is-dragging');
        clearOverClasses();
        draggedWrapper = null;
        draggedId = null;
      });

      wrapper.addEventListener('dragover', (e) => {
        e.preventDefault();
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
        if (!draggedId || draggedWrapper === wrapper) return;

        const targetId = wrapper.getAttribute('data-block-id');
        const rect = wrapper.getBoundingClientRect();
        const isAbove = e.clientY < rect.top + rect.height / 2;

        executeReorder(draggedId, targetId, isAbove);
      });
    });

    // ── Mobile Touch Drag Gesture on .drag-grip ──
    feed.querySelectorAll('.drag-grip').forEach((grip) => {
      let touchStartY = 0;
      let targetWrapper = null;
      let isTouchDragging = false;

      grip.addEventListener(
        'touchstart',
        (e) => {
          const touch = e.touches[0];
          touchStartY = touch.clientY;
          targetWrapper = grip.closest('.timeline-item-wrapper');
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

          // Element currently under touch point
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

      grip.addEventListener('touchend', (e) => {
        if (!isTouchDragging || !targetWrapper) return;
        isTouchDragging = false;
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
      });
    });

    function clearOverClasses() {
      feed.querySelectorAll('.drag-over-above, .drag-over-below').forEach((el) => {
        el.classList.remove('drag-over-above', 'drag-over-below');
      });
    }

    function executeReorder(sourceId, targetId, placeAbove) {
      const rawBlocks = getDayBlocks();
      const fromIndex = rawBlocks.findIndex((b) => b.id === sourceId);
      const toIndex = rawBlocks.findIndex((b) => b.id === targetId);

      if (fromIndex === -1 || toIndex === -1) return;

      const [removed] = rawBlocks.splice(fromIndex, 1);
      let insertionIndex = rawBlocks.findIndex((b) => b.id === targetId);
      if (!placeAbove) insertionIndex += 1;

      rawBlocks.splice(insertionIndex, 0, removed);
      setDayBlocks(rawBlocks);
      render();
    }
  }

  function openQuickThreadDrawer(blockId) {
    const thread = getThreadById(blockId) || {
      blockId,
      title: 'Activity Discussion',
      eventTitle: 'Itinerary Stop',
      messages: [],
    };

    const backdrop = document.createElement('div');
    backdrop.className = 'quick-thread-backdrop';

    function renderThreadContent() {
      backdrop.innerHTML = `
        <div class="quick-thread-sheet" role="dialog" aria-labelledby="qt-title">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-divider); padding-bottom: 8px;">
            <div>
              <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: var(--color-primary);">Per-Activity Thread</span>
              <h3 id="qt-title" style="font-size: var(--text-sm); font-weight: bold; color: var(--color-text-primary); margin: 0;">${thread.eventTitle || thread.title}</h3>
            </div>
            <button type="button" class="btn btn--secondary btn--sm" id="btn-close-qt" style="width: 28px; height: 28px; padding: 0; border-radius: 50%;">✕</button>
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
