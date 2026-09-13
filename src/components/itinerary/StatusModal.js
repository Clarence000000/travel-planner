/**
 * Status Lifecycle Modal Component & 3-Way Contingency Resolution Sheet
 * 1. Standard Slot Status Lifecycle (Proposed, Confirmed, Weather Permitting, Cancelled)
 * 2. 3-Way Contingency Resolution Sheet (Apple iOS 26 Glass Sheet):
 *    - Option 1: [🌧️ Switch to Indoor Fallback] -> The Top Komtar Indoor Theme Park & Rainbow Skywalk
 *    - Option 2: [☕ Hold Free-Time Pocket] -> ChinaHouse Heritage Cafe (Beach Street)
 *    - Option 3: [⏩ Chronological Reflow] -> Pulls schedule forward by 90 minutes
 */

export function createStatusModal({ onSave, onResolveContingency }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'itinerary-modal-backdrop';
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');

  let currentBlock = null;
  let activeMode = 'lifecycle'; // 'lifecycle' | 'contingency'

  function renderLifecycleContent() {
    backdrop.innerHTML = `
      <div class="itinerary-modal-sheet">
        <div class="itinerary-modal-header">
          <div>
            <span style="font-size: 11px; font-weight: bold; color: var(--color-primary); text-transform: uppercase;">
              Slot Status Lifecycle
            </span>
            <h3 class="itinerary-modal-title" id="status-modal-title">Update Status: ${currentBlock ? currentBlock.title : ''}</h3>
          </div>
          <button type="button" class="drawer-close-btn" id="close-status-modal-btn" aria-label="Close modal">✕</button>
        </div>

        <form class="itinerary-form" id="status-form">
          <div class="lifecycle-options">
            <!-- Proposed (Yellow) -->
            <label class="lifecycle-option" id="option-proposed">
              <input type="radio" name="slotStatus" value="proposed" />
              <div class="lifecycle-option__text">
                <span class="lifecycle-option__name" style="color: #B45309; display: flex; align-items: center;">
                  <span class="status-dot status-dot--proposed"></span> Proposed
                </span>
                <span class="lifecycle-option__desc">An idea waiting for group feedback and voting.</span>
              </div>
            </label>

            <!-- Confirmed (Green) -->
            <label class="lifecycle-option" id="option-confirmed">
              <input type="radio" name="slotStatus" value="confirmed" />
              <div class="lifecycle-option__text">
                <span class="lifecycle-option__name" style="color: #2D6A2E; display: flex; align-items: center;">
                  <span class="status-dot status-dot--confirmed"></span> Confirmed
                </span>
                <span class="lifecycle-option__desc">Locked in with booking details, tickets, or general agreement.</span>
              </div>
            </label>

            <!-- Tentative / Weather Permitting (Orange) -->
            <label class="lifecycle-option" id="option-tentative">
              <input type="radio" name="slotStatus" value="tentative" />
              <div class="lifecycle-option__text">
                <span class="lifecycle-option__name" style="color: #C2410C; display: flex; align-items: center;">
                  <span class="status-dot status-dot--tentative"></span> Weather Permitting / Tentative
                </span>
                <span class="lifecycle-option__desc">Contingent outdoor plan with a built-in fallback attached.</span>
              </div>
            </label>

            <!-- Cancelled / Day-of Contingency (Slate/Muted) -->
            <label class="lifecycle-option" id="option-cancelled">
              <input type="radio" name="slotStatus" value="cancelled" />
              <div class="lifecycle-option__text">
                <span class="lifecycle-option__name" style="color: #64748B; display: flex; align-items: center;">
                  <span class="status-dot" style="background-color: #64748B;"></span> Cancelled (Day-of Execution)
                </span>
                <span class="lifecycle-option__desc">Unforeseen closure or change during live trip.</span>
              </div>
            </label>
          </div>

          <!-- Fallback Activity Input (Shown when Weather Permitting is selected) -->
          <div class="form-group" id="fallback-input-group" style="display: none;">
            <label class="form-label" for="fallback-input">Built-in Fallback Plan / Indoor Alternative</label>
            <input 
              type="text" 
              class="form-input" 
              id="fallback-input" 
              placeholder="e.g. The Top Komtar Indoor Theme Park & Glass Skywalk"
              value="${currentBlock && currentBlock.fallback ? currentBlock.fallback : ''}"
            />
          </div>

          <!-- Cancellation Resolution Options (Shown when Cancelled is selected) -->
          <div class="form-group" id="cancellation-mode-group" style="display: none; background: rgba(241, 245, 249, 0.7); padding: 12px; border-radius: 12px; border: 1px dashed #CBD5E1;">
            <label class="form-label" style="margin-bottom: 6px;">Day-of Cancellation Resolution:</label>
            <label style="display: flex; align-items: flex-start; gap: 8px; font-size: 12px; margin-bottom: 8px; cursor: pointer;">
              <input type="radio" name="cancelResolution" value="free-time" checked style="margin-top: 2px;" />
              <div>
                <strong>Hold as Free Time / Relax Pocket</strong>
                <div style="color: #64748B; font-size: 11px;">Keeps slot on timeline as open buffer; later dinner & bookings remain untouched.</div>
              </div>
            </label>
            <label style="display: flex; align-items: flex-start; gap: 8px; font-size: 12px; cursor: pointer;">
              <input type="radio" name="cancelResolution" value="reflow" style="margin-top: 2px;" />
              <div>
                <strong>Reflow Schedule Chronologically</strong>
                <div style="color: #64748B; font-size: 11px;">Deletes slot and snaps subsequent activities forward to eliminate gap.</div>
              </div>
            </label>
          </div>

          <!-- Quick link to 3-Way Contingency if relevant -->
          ${
            currentBlock && (currentBlock.fallback || (currentBlock.title && currentBlock.title.includes('Penang Hill')) || currentBlock.status === 'tentative')
              ? `
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(0,0,0,0.06);">
              <button type="button" class="btn btn--sm btn--outline" id="btn-switch-to-contingency-sheet" style="width: 100%; border-color: #D97706; color: #B45309;">
                🌧️ Open 3-Way Weather Contingency Sheet
              </button>
            </div>
          `
              : ''
          }

          <div style="display: flex; gap: 8px; margin-top: 8px;">
            <button type="submit" class="btn btn--primary" style="flex: 1;">Save Status</button>
            <button type="button" class="btn btn--secondary" id="cancel-status-btn">Cancel</button>
          </div>
        </form>
      </div>
    `;

    bindLifecycleEvents();
  }

  function renderContingencyContent() {
    const blockTitle = currentBlock ? currentBlock.title : 'Penang Hill Outdoor Station';

    backdrop.innerHTML = `
      <div class="itinerary-modal-sheet contingency-sheet">
        <div class="contingency-sheet__header">
          <div class="contingency-sheet__badge">
            <span class="contingency-pulse-icon">🌧️</span>
            <span>Live Weather Disruption Detected</span>
          </div>
          <h3 class="contingency-sheet__title">3-Way Contingency Resolution</h3>
          <p class="contingency-sheet__desc">
            Heavy monsoon downpour detected at <strong>${blockTitle}</strong>. Select an instant resolution strategy:
          </p>
          <button type="button" class="drawer-close-btn" id="close-contingency-modal-btn" aria-label="Close sheet">✕</button>
        </div>

        <div class="contingency-sheet__options">
          <!-- Option 1: Switch to Indoor Fallback -->
          <div class="contingency-option-card contingency-option-card--fallback" id="contingency-card-fallback" role="button" tabindex="0">
            <div class="contingency-option-card__badge-row">
              <span class="contingency-pill contingency-pill--recommended">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                Recommended · Seamless
              </span>
              <span class="contingency-transit-tag">15m GrabCar</span>
            </div>
            <div class="contingency-option-card__body">
              <div class="contingency-option-card__icon">🌧️</div>
              <div class="contingency-option-card__content">
                <h4 class="contingency-option-card__heading">Switch to Indoor Fallback</h4>
                <p class="contingency-option-card__target">
                  <strong>The Top Komtar Indoor Theme Park & Glass Rainbow Skywalk</strong>
                </p>
                <p class="contingency-option-card__subtext">
                  68th-floor fully indoor air-conditioned observatory, rainbow glass walk & tech boutique. Protects evening dinner slot without rescheduling.
                </p>
              </div>
            </div>
            <div class="contingency-option-card__footer">
              <button type="button" class="btn btn--sm btn--primary btn-opt-fallback" id="btn-opt-fallback" style="width: 100%;">
                🌧️ Switch to Indoor Fallback
              </button>
            </div>
          </div>

          <!-- Option 2: Hold Free-Time Pocket -->
          <div class="contingency-option-card contingency-option-card--freetime" id="contingency-card-freetime" role="button" tabindex="0">
            <div class="contingency-option-card__badge-row">
              <span class="contingency-pill contingency-pill--chill">
                ☕ Relax Window
              </span>
              <span class="contingency-transit-tag">Zero Dinner Shift</span>
            </div>
            <div class="contingency-option-card__body">
              <div class="contingency-option-card__icon">☕</div>
              <div class="contingency-option-card__content">
                <h4 class="contingency-option-card__heading">Hold Free-Time Pocket</h4>
                <p class="contingency-option-card__target">
                  <strong>ChinaHouse Heritage Cafe (Beach Street)</strong>
                </p>
                <p class="contingency-option-card__subtext">
                  Converts slot into a sheltered cafe rest pocket. Enjoy 30+ artisan cakes & acoustic courtyard without altering any downstream bookings.
                </p>
              </div>
            </div>
            <div class="contingency-option-card__footer">
              <button type="button" class="btn btn--sm btn--outline btn-opt-freetime" id="btn-opt-freetime" style="width: 100%;">
                ☕ Hold Free-Time Pocket
              </button>
            </div>
          </div>

          <!-- Option 3: Chronological Reflow -->
          <div class="contingency-option-card contingency-option-card--reflow" id="contingency-card-reflow" role="button" tabindex="0">
            <div class="contingency-option-card__badge-row">
              <span class="contingency-pill contingency-pill--reflow">
                ⏩ Schedule Reflow
              </span>
              <span class="contingency-transit-tag">Pull 90m Earlier</span>
            </div>
            <div class="contingency-option-card__body">
              <div class="contingency-option-card__icon">⏩</div>
              <div class="contingency-option-card__content">
                <h4 class="contingency-option-card__heading">Chronological Reflow</h4>
                <p class="contingency-option-card__target">
                  <strong>Snap Schedule Forward (90 Minutes)</strong>
                </p>
                <p class="contingency-option-card__subtext">
                  Deletes outdoor slot and pulls subsequent evening activities forward by 90 minutes. Eliminates dead downtime.
                </p>
              </div>
            </div>
            <div class="contingency-option-card__footer">
              <button type="button" class="btn btn--sm btn--ghost btn-opt-reflow" id="btn-opt-reflow" style="width: 100%;">
                ⏩ Chronological Reflow
              </button>
            </div>
          </div>
        </div>

        <div class="contingency-sheet__footer">
          <button type="button" class="btn btn--secondary btn--sm" id="btn-dismiss-contingency" style="width: 100%;">
            Keep Original Schedule & Dismiss
          </button>
        </div>
      </div>
    `;

    bindContingencyEvents();
  }

  function bindLifecycleEvents() {
    const closeBtn = backdrop.querySelector('#close-status-modal-btn');
    const cancelBtn = backdrop.querySelector('#cancel-status-btn');
    const form = backdrop.querySelector('#status-form');
    const fallbackGroup = backdrop.querySelector('#fallback-input-group');
    const fallbackInput = backdrop.querySelector('#fallback-input');
    const cancelModeGroup = backdrop.querySelector('#cancellation-mode-group');
    const switchToContingencyBtn = backdrop.querySelector('#btn-switch-to-contingency-sheet');

    const radioInputs = backdrop.querySelectorAll('input[name="slotStatus"]');
    const options = backdrop.querySelectorAll('.lifecycle-option');

    function updateSelectedStyles() {
      let selectedValue = 'confirmed';
      radioInputs.forEach((radio, idx) => {
        if (radio.checked) {
          selectedValue = radio.value;
          options[idx].classList.add('is-selected');
        } else {
          options[idx].classList.remove('is-selected');
        }
      });

      if (selectedValue === 'tentative') {
        fallbackGroup.style.display = 'flex';
        cancelModeGroup.style.display = 'none';
      } else if (selectedValue === 'cancelled') {
        fallbackGroup.style.display = 'none';
        cancelModeGroup.style.display = 'flex';
      } else {
        fallbackGroup.style.display = 'none';
        cancelModeGroup.style.display = 'none';
      }
    }

    radioInputs.forEach((radio) => {
      radio.addEventListener('change', updateSelectedStyles);
    });

    if (currentBlock) {
      radioInputs.forEach((radio) => {
        radio.checked = radio.value === currentBlock.status;
      });
      updateSelectedStyles();
    }

    if (switchToContingencyBtn) {
      switchToContingencyBtn.addEventListener('click', () => {
        activeMode = 'contingency';
        renderContingencyContent();
      });
    }

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (cancelBtn) cancelBtn.addEventListener('click', close);

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!currentBlock) return;

        const selectedRadio = backdrop.querySelector('input[name="slotStatus"]:checked');
        const newStatus = selectedRadio ? selectedRadio.value : currentBlock.status;
        const fallbackVal = fallbackInput ? fallbackInput.value.trim() : '';
        const cancelRes = backdrop.querySelector('input[name="cancelResolution"]:checked');
        const cancelMode = cancelRes ? cancelRes.value : 'free-time';

        if (typeof onSave === 'function') {
          onSave(currentBlock.id, newStatus, fallbackVal, cancelMode);
        }
        close();
      });
    }
  }

  function bindContingencyEvents() {
    const closeBtn = backdrop.querySelector('#close-contingency-modal-btn');
    const dismissBtn = backdrop.querySelector('#btn-dismiss-contingency');
    const optFallbackBtn = backdrop.querySelector('#btn-opt-fallback');
    const optFreetimeBtn = backdrop.querySelector('#btn-opt-freetime');
    const optReflowBtn = backdrop.querySelector('#btn-opt-reflow');

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (dismissBtn) dismissBtn.addEventListener('click', close);

    function triggerResolution(resolutionType) {
      if (!currentBlock) return;

      if (typeof onResolveContingency === 'function') {
        onResolveContingency(currentBlock.id, resolutionType);
      } else if (typeof onSave === 'function') {
        if (resolutionType === 'fallback') {
          onSave(currentBlock.id, 'confirmed', 'Penang Hill (Original)', 'fallback');
        } else if (resolutionType === 'freetime') {
          onSave(currentBlock.id, 'cancelled', null, 'free-time');
        } else if (resolutionType === 'reflow') {
          onSave(currentBlock.id, 'cancelled', null, 'reflow');
        }
      }
      close();
    }

    if (optFallbackBtn) {
      optFallbackBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerResolution('fallback');
      });
    }
    const cardFallback = backdrop.querySelector('#contingency-card-fallback');
    if (cardFallback) {
      cardFallback.addEventListener('click', () => triggerResolution('fallback'));
    }

    if (optFreetimeBtn) {
      optFreetimeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerResolution('freetime');
      });
    }
    const cardFreetime = backdrop.querySelector('#contingency-card-freetime');
    if (cardFreetime) {
      cardFreetime.addEventListener('click', () => triggerResolution('freetime'));
    }

    if (optReflowBtn) {
      optReflowBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerResolution('reflow');
      });
    }
    const cardReflow = backdrop.querySelector('#contingency-card-reflow');
    if (cardReflow) {
      cardReflow.addEventListener('click', () => triggerResolution('reflow'));
    }
  }

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  function open(block) {
    if (!document.body.contains(backdrop)) {
      document.body.appendChild(backdrop);
    }
    currentBlock = block;
    activeMode = 'lifecycle';
    renderLifecycleContent();
    backdrop.classList.add('is-open');
  }

  function openContingency(block) {
    if (!document.body.contains(backdrop)) {
      document.body.appendChild(backdrop);
    }
    currentBlock = block;
    activeMode = 'contingency';
    renderContingencyContent();
    backdrop.classList.add('is-open');
  }

  function close() {
    backdrop.classList.remove('is-open');
    currentBlock = null;
  }

  return {
    element: backdrop,
    open,
    openContingency,
    close,
  };
}
