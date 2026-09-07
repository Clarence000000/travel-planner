/**
 * Status Lifecycle Modal Component
 * Allows travelers to switch a block's status between Proposed, Confirmed,
 * and Tentative/Weather Permitting (with an attached fallback plan).
 */

export function createStatusModal({ onSave }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'itinerary-modal-backdrop';
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');

  backdrop.innerHTML = `
    <div class="itinerary-modal-sheet">
      <div class="itinerary-modal-header">
        <div>
          <span style="font-size: 11px; font-weight: bold; color: var(--color-primary); text-transform: uppercase;">
            Slot Status Lifecycle
          </span>
          <h3 class="itinerary-modal-title" id="status-modal-title">Update Status</h3>
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
        </div>

        <!-- Fallback Activity Input (Shown when Weather Permitting is selected) -->
        <div class="form-group" id="fallback-input-group" style="display: none;">
          <label class="form-label" for="fallback-input">Built-in Fallback Plan / Indoor Alternative</label>
          <input 
            type="text" 
            class="form-input" 
            id="fallback-input" 
            placeholder="e.g. Indoor Asakusa Underground Ramen Arcade"
          />
        </div>

        <div style="display: flex; gap: 8px; margin-top: 8px;">
          <button type="submit" class="btn btn--primary" style="flex: 1;">Save Status</button>
          <button type="button" class="btn btn--secondary" id="cancel-status-btn">Cancel</button>
        </div>
      </form>
    </div>
  `;

  let currentBlock = null;

  const closeBtn = backdrop.querySelector('#close-status-modal-btn');
  const cancelBtn = backdrop.querySelector('#cancel-status-btn');
  const form = backdrop.querySelector('#status-form');
  const titleEl = backdrop.querySelector('#status-modal-title');
  const fallbackGroup = backdrop.querySelector('#fallback-input-group');
  const fallbackInput = backdrop.querySelector('#fallback-input');

  const radioInputs = backdrop.querySelectorAll('input[name="slotStatus"]');
  const options = backdrop.querySelectorAll('.lifecycle-option');

  function updateSelectedStyles() {
    radioInputs.forEach((radio, idx) => {
      if (radio.checked) {
        options[idx].classList.add('is-selected');
        if (radio.value === 'tentative') {
          fallbackGroup.style.display = 'flex';
        } else {
          fallbackGroup.style.display = 'none';
        }
      } else {
        options[idx].classList.remove('is-selected');
      }
    });
  }

  radioInputs.forEach((radio) => {
    radio.addEventListener('change', updateSelectedStyles);
  });

  function open(block) {
    currentBlock = block;
    titleEl.textContent = `Status: ${block.title}`;
    fallbackInput.value = block.fallback || '';

    radioInputs.forEach((radio) => {
      radio.checked = radio.value === block.status;
    });

    updateSelectedStyles();
    backdrop.classList.add('is-open');
  }

  function close() {
    backdrop.classList.remove('is-open');
    currentBlock = null;
  }

  closeBtn.addEventListener('click', close);
  cancelBtn.addEventListener('click', close);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentBlock) return;

    const selectedRadio = backdrop.querySelector('input[name="slotStatus"]:checked');
    const newStatus = selectedRadio ? selectedRadio.value : currentBlock.status;
    const fallbackVal = fallbackInput.value.trim();

    if (onSave) {
      onSave(currentBlock.id, newStatus, newStatus === 'tentative' ? fallbackVal : null);
    }
    close();
  });

  return {
    element: backdrop,
    open,
    close,
  };
}
