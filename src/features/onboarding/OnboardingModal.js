/**
 * OnboardingModal: Multi-step Welcome & Reel/Survey Genesis Orchestrator.
 */

import {
  saveItineraryData,
  getItineraryData,
  initPenangSparseDay1,
  SAMPLE_ITINERARY,
} from '../../models/itineraryData.js';
import { startBackgroundTripBanter } from '../../models/chatData.js';
import { addWishlistItem } from '../../models/wishlistData.js';
import { setActiveTab } from '../../config/navigation.js';
import {
  getTripSettings,
  saveTripSettings,
  calculateDaysBetween,
  formatDateRange,
} from '../../models/tripSettings.js';
import {
  getActiveTrip,
  setActiveTripId,
  createTrip,
  updateTrip,
} from '../../models/tripsModel.js';

import { REEL_PRESETS, addDaysToDate, escapeHtml } from './onboardingPresets.js';
import { renderMenuView } from './StepMenuView.js';
import { renderDestinationView, renderQuestionsView } from './StepSurveyViews.js';
import { renderReelsView, renderExtractingView } from './StepReelsView.js';
import { renderCustomizeView, renderAnchorCard } from './StepCustomizeView.js';
import { renderProcessingView, renderRevealView } from './StepRevealView.js';

export function createOnboardingModal(options = {}) {
  const { onComplete } = options;

  const overlay = document.createElement('div');
  overlay.className = 'onboarding-overlay';
  overlay.id = 'onboarding-modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'onboarding-title');
  overlay.style.display = 'none';

  let currentStep = 'menu';
  let previousStep = 'menu';
  let processingType = 'questions';
  let processingStep = 0;
  let isNewTripFlow = false;
  let timerInterval = null;

  const initialSettings = getTripSettings();
  const survey = {
    destination: initialSettings.destination || 'Penang, Malaysia',
    title: initialSettings.title || 'Penang Food & Heritage Exploration',
    startDate: initialSettings.startDate || '2026-10-12',
    endDate: initialSettings.endDate || '2026-10-14',
    duration: initialSettings.totalDays || 3,
    vibe: initialSettings.vibe || 'food',
    pace: initialSettings.pace || 'balanced',
    travelers: 'squad',
    anchorWishlist: true,
  };

  let reelUrl = 'https://www.instagram.com/reel/C8x9_penang_heritage';
  let currentSourceInfo = { ...REEL_PRESETS.penangfoodie };
  let extractedAnchors = JSON.parse(JSON.stringify(REEL_PRESETS.penangfoodie.anchors));

  function getCityName() {
    return (survey.destination || 'Penang').split(',')[0].trim();
  }

  function render() {
    overlay.innerHTML = `
      <div class="onboarding-card">
        <button type="button" class="onboarding-close-btn" id="btn-close-onboarding" aria-label="Close modal">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        ${renderStepContent()}
      </div>
    `;

    bindEvents();
  }

  function renderStepContent() {
    switch (currentStep) {
      case 'destination':
        return renderDestinationView(survey);
      case 'questions':
        return renderQuestionsView(survey);
      case 'reels':
        return renderReelsView(reelUrl);
      case 'extracting':
        return renderExtractingView(currentSourceInfo, processingStep);
      case 'customize':
        return renderCustomizeView(survey, currentSourceInfo, extractedAnchors);
      case 'processing':
        return renderProcessingView(processingType, survey, extractedAnchors, processingStep);
      case 'reveal':
        return renderRevealView(survey, processingType, extractedAnchors);
      case 'menu':
      default:
        return renderMenuView();
    }
  }

  function bindEvents() {
    const closeBtn = overlay.querySelector('#btn-close-onboarding');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    const skipBtn = overlay.querySelector('#btn-skip-onboarding');
    if (skipBtn) skipBtn.addEventListener('click', closeModal);

    const selectQuestions = overlay.querySelector('#btn-select-questions');
    if (selectQuestions) {
      selectQuestions.addEventListener('click', () => {
        currentStep = 'destination';
        render();
      });
    }

    const selectReels = overlay.querySelector('#btn-select-reels');
    if (selectReels) {
      selectReels.addEventListener('click', () => {
        currentStep = 'reels';
        render();
      });
    }

    const backMenuBtn = overlay.querySelector('#btn-back-menu');
    if (backMenuBtn) {
      backMenuBtn.addEventListener('click', () => {
        currentStep = 'menu';
        render();
      });
    }

    const destInput = overlay.querySelector('#dest-search-input');
    if (destInput) {
      destInput.addEventListener('input', (e) => {
        survey.destination = e.target.value;
      });
    }

    overlay.querySelectorAll('.onboarding-quick-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        const d = btn.getAttribute('data-dest');
        if (d) {
          survey.destination = d;
          render();
        }
      });
    });

    // Date Pickers
    const startDateInput = overlay.querySelector('#trip-start-date');
    const endDateInput = overlay.querySelector('#trip-end-date');
    const rangeDisplay = overlay.querySelector('#range-display-label');
    const stepperVal = overlay.querySelector('#stepper-duration-val');

    function syncDates() {
      if (startDateInput && endDateInput) {
        if (startDateInput.value) survey.startDate = startDateInput.value;
        if (endDateInput.value) {
          if (endDateInput.value < survey.startDate) {
            survey.endDate = survey.startDate;
            endDateInput.value = survey.startDate;
          } else {
            survey.endDate = endDateInput.value;
          }
        }
        survey.duration = calculateDaysBetween(survey.startDate, survey.endDate);
        if (stepperVal) stepperVal.textContent = `${survey.duration} Days`;
        if (rangeDisplay) rangeDisplay.textContent = formatDateRange(survey.startDate, survey.endDate, survey.duration);
      }
    }

    if (startDateInput) {
      startDateInput.addEventListener('change', () => {
        if (startDateInput.value) {
          survey.startDate = startDateInput.value;
          survey.endDate = addDaysToDate(survey.startDate, survey.duration - 1);
          if (endDateInput) endDateInput.value = survey.endDate;
          syncDates();
        }
      });
    }
    if (endDateInput) {
      endDateInput.addEventListener('change', syncDates);
    }

    const btnMinus = overlay.querySelector('#btn-duration-minus');
    const btnPlus = overlay.querySelector('#btn-duration-plus');

    if (btnMinus) {
      btnMinus.addEventListener('click', () => {
        if (survey.duration > 1) {
          survey.duration--;
          survey.endDate = addDaysToDate(survey.startDate, survey.duration - 1);
          if (endDateInput) endDateInput.value = survey.endDate;
          syncDates();
        }
      });
    }

    if (btnPlus) {
      btnPlus.addEventListener('click', () => {
        if (survey.duration < 14) {
          survey.duration++;
          survey.endDate = addDaysToDate(survey.startDate, survey.duration - 1);
          if (endDateInput) endDateInput.value = survey.endDate;
          syncDates();
        }
      });
    }

    const nextPrefBtn = overlay.querySelector('#btn-next-preferences');
    if (nextPrefBtn) {
      nextPrefBtn.addEventListener('click', () => {
        currentStep = 'questions';
        render();
      });
    }

    const backDestBtn = overlay.querySelector('#btn-back-destination');
    if (backDestBtn) {
      backDestBtn.addEventListener('click', () => {
        currentStep = 'destination';
        render();
      });
    }

    overlay.querySelectorAll('[data-vibe]').forEach((chip) => {
      chip.addEventListener('click', () => {
        survey.vibe = chip.getAttribute('data-vibe');
        render();
      });
    });

    overlay.querySelectorAll('[data-pace]').forEach((chip) => {
      chip.addEventListener('click', () => {
        survey.pace = chip.getAttribute('data-pace');
        render();
      });
    });

    const anchorToggle = overlay.querySelector('#toggle-anchor-wishlist');
    if (anchorToggle) {
      anchorToggle.addEventListener('change', (e) => {
        survey.anchorWishlist = e.target.checked;
        render();
      });
    }

    const submitQuestions = overlay.querySelector('#btn-submit-questions');
    if (submitQuestions) {
      submitQuestions.addEventListener('click', () => {
        previousStep = 'questions';
        processingType = 'questions';
        startProcessing('questions');
      });
    }

    // Reels Card Click
    overlay.querySelectorAll('.demo-reel-card').forEach((card) => {
      card.addEventListener('click', () => {
        const key = card.getAttribute('data-reel-key');
        const url = card.getAttribute('data-reel-url');
        if (key && REEL_PRESETS[key]) {
          currentSourceInfo = { ...REEL_PRESETS[key] };
          extractedAnchors = JSON.parse(JSON.stringify(REEL_PRESETS[key].anchors));
          reelUrl = url;
        }
        startReelExtraction();
      });
    });

    const submitReel = overlay.querySelector('#btn-submit-reel');
    if (submitReel) {
      submitReel.addEventListener('click', () => {
        const input = overlay.querySelector('#reel-url-input');
        if (input && input.value.trim()) {
          reelUrl = input.value.trim();
          if (reelUrl.includes('georgetown') || reelUrl.includes('penangvibes')) {
            currentSourceInfo = { ...REEL_PRESETS.penangvibes };
            extractedAnchors = JSON.parse(JSON.stringify(REEL_PRESETS.penangvibes.anchors));
          } else {
            currentSourceInfo = { ...REEL_PRESETS.penangfoodie };
            extractedAnchors = JSON.parse(JSON.stringify(REEL_PRESETS.penangfoodie.anchors));
            if (reelUrl.includes('tiktok.com')) {
              currentSourceInfo.creator = '@tiktok_traveler';
              currentSourceInfo.title = 'Viral Penang Heritage & Food Spots';
              currentSourceInfo.tag = 'TikTok Scan';
            } else if (reelUrl.includes('youtube.com') || reelUrl.includes('youtu.be')) {
              currentSourceInfo.creator = '@youtube_shorts';
              currentSourceInfo.title = 'Penang Historic Highlights & Night Eats';
              currentSourceInfo.tag = 'YouTube Shorts Scan';
            }
          }
        }
        startReelExtraction();
      });
    }

    if (currentStep === 'customize') {
      bindCustomizeStepEvents();
    }

    if (currentStep === 'reveal') {
      const copyLinkBtn = overlay.querySelector('#btn-onboarding-copy-link');
      if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', async () => {
          const input = overlay.querySelector('#onboarding-share-link');
          const textSpan = overlay.querySelector('#copy-btn-text');
          if (input) {
            try {
              await navigator.clipboard.writeText(input.value);
            } catch (err) {
              input.select();
              document.execCommand('copy');
            }
            if (textSpan) {
              textSpan.textContent = '✓ Copied!';
              setTimeout(() => {
                if (textSpan) textSpan.textContent = 'Copy Link';
              }, 2000);
            }
          }
        });
      }

      const qrBtn = overlay.querySelector('#btn-toggle-qr');
      const qrContainer = overlay.querySelector('#onboarding-qr-container');
      if (qrBtn && qrContainer) {
        qrBtn.addEventListener('click', () => {
          const isHidden = qrContainer.style.display === 'none';
          qrContainer.style.display = isHidden ? 'block' : 'none';
        });
      }

      const confirmReveal = overlay.querySelector('#btn-reveal-confirm');
      if (confirmReveal) {
        confirmReveal.addEventListener('click', () => {
          finishOnboarding(processingType);
        });
      }

      const adjustReveal = overlay.querySelector('#btn-reveal-adjust');
      if (adjustReveal) {
        adjustReveal.addEventListener('click', () => {
          currentStep = processingType === 'reels' ? 'customize' : 'questions';
          render();
        });
      }
    }
  }

  function bindCustomizeStepEvents() {
    const backReelsBtn = overlay.querySelector('#btn-back-reels');
    if (backReelsBtn) {
      backReelsBtn.addEventListener('click', () => {
        currentStep = 'reels';
        render();
      });
    }

    const startDateInput = overlay.querySelector('#customize-start-date');
    const endDateInput = overlay.querySelector('#customize-end-date');
    const rangeDisplay = overlay.querySelector('#customize-range-display-label');
    const stepperVal = overlay.querySelector('#cust-stepper-duration-val');

    function syncCustomizeDates() {
      if (startDateInput && endDateInput) {
        if (startDateInput.value) survey.startDate = startDateInput.value;
        if (endDateInput.value) {
          if (endDateInput.value < survey.startDate) {
            survey.endDate = survey.startDate;
            endDateInput.value = survey.startDate;
          } else {
            survey.endDate = endDateInput.value;
          }
        }
        survey.duration = calculateDaysBetween(survey.startDate, survey.endDate);
        if (stepperVal) stepperVal.textContent = `${survey.duration} Days`;
        if (rangeDisplay) rangeDisplay.textContent = formatDateRange(survey.startDate, survey.endDate, survey.duration);

        overlay.querySelectorAll('.customize-day-select').forEach((sel) => {
          const curVal = Number(sel.value) || 1;
          let opts = '';
          for (let d = 1; d <= survey.duration; d++) {
            opts += `<option value="${d}" ${curVal === d ? 'selected' : ''}>Day ${d} ▾</option>`;
          }
          sel.innerHTML = opts;
        });
      }
    }

    if (startDateInput) {
      startDateInput.addEventListener('change', () => {
        if (startDateInput.value) {
          survey.startDate = startDateInput.value;
          survey.endDate = addDaysToDate(survey.startDate, survey.duration - 1);
          if (endDateInput) endDateInput.value = survey.endDate;
          syncCustomizeDates();
        }
      });
    }

    if (endDateInput) {
      endDateInput.addEventListener('change', syncCustomizeDates);
    }

    const btnCustMinus = overlay.querySelector('#btn-cust-duration-minus');
    const btnCustPlus = overlay.querySelector('#btn-cust-duration-plus');

    if (btnCustMinus) {
      btnCustMinus.addEventListener('click', () => {
        if (survey.duration > 1) {
          survey.duration--;
          survey.endDate = addDaysToDate(survey.startDate, survey.duration - 1);
          if (endDateInput) endDateInput.value = survey.endDate;
          syncCustomizeDates();
        }
      });
    }

    if (btnCustPlus) {
      btnCustPlus.addEventListener('click', () => {
        if (survey.duration < 14) {
          survey.duration++;
          survey.endDate = addDaysToDate(survey.startDate, survey.duration - 1);
          if (endDateInput) endDateInput.value = survey.endDate;
          syncCustomizeDates();
        }
      });
    }

    bindDragAndReorderEvents();

    const btnBuild = overlay.querySelector('#btn-build-itinerary');
    if (btnBuild) {
      btnBuild.addEventListener('click', () => {
        previousStep = 'customize';
        processingType = 'reels';
        startProcessing('reels');
      });
    }
  }

  function bindDragAndReorderEvents() {
    const listEl = overlay.querySelector('#customize-anchors-list');
    if (!listEl) return;

    let draggedIdx = null;
    const cards = listEl.querySelectorAll('.customize-anchor-card');

    cards.forEach((card) => {
      card.addEventListener('dragstart', (e) => {
        draggedIdx = Number(card.getAttribute('data-index'));
        card.classList.add('is-dragging');
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', String(draggedIdx));
        }
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('is-dragging');
        cards.forEach((c) => c.classList.remove('is-drag-over'));
        draggedIdx = null;
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
        card.classList.add('is-drag-over');
      });

      card.addEventListener('dragleave', () => {
        card.classList.remove('is-drag-over');
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('is-drag-over');
        const targetIdx = Number(card.getAttribute('data-index'));
        if (draggedIdx !== null && draggedIdx !== targetIdx) {
          moveAnchor(draggedIdx, targetIdx);
        }
      });

      const handleBtn = card.querySelector('.customize-drag-handle');
      if (handleBtn) {
        handleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const currIdx = Number(card.getAttribute('data-index'));
          const nextIdx = currIdx === 0 ? 1 : currIdx - 1;
          moveAnchor(currIdx, nextIdx);
        });
      }

      card.querySelectorAll('.btn-reorder-move').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const direction = btn.getAttribute('data-move');
          const currIdx = Number(btn.getAttribute('data-index'));
          const targetIdx = direction === 'up' ? currIdx - 1 : currIdx + 1;
          moveAnchor(currIdx, targetIdx);
        });
      });

      const daySelect = card.querySelector('.customize-day-select');
      if (daySelect) {
        daySelect.addEventListener('change', (e) => {
          const id = daySelect.getAttribute('data-anchor-id');
          const found = extractedAnchors.find((a) => a.id === id);
          if (found) {
            found.day = Number(e.target.value);
          }
        });
      }
    });
  }

  function moveAnchor(fromIdx, toIdx) {
    if (
      fromIdx < 0 ||
      toIdx < 0 ||
      fromIdx >= extractedAnchors.length ||
      toIdx >= extractedAnchors.length
    ) {
      return;
    }

    const item = extractedAnchors.splice(fromIdx, 1)[0];
    extractedAnchors.splice(toIdx, 0, item);

    const timeSlots = [
      { start: '09:30', end: '11:00', slot: '09:30 – 11:00' },
      { start: '11:30', end: '13:00', slot: '11:30 – 13:00' },
      { start: '16:30', end: '19:00', slot: '16:30 – 19:00' },
      { start: '19:30', end: '21:00', slot: '19:30 – 21:00' },
    ];

    extractedAnchors.forEach((anchor, idx) => {
      const slot = timeSlots[idx] || timeSlots[timeSlots.length - 1];
      anchor.startTime = slot.start;
      anchor.endTime = slot.end;
      anchor.timeSlot = slot.slot;
    });

    const listEl = overlay.querySelector('#customize-anchors-list');
    if (listEl) {
      listEl.innerHTML = extractedAnchors
        .map((anchor, index) => renderAnchorCard(anchor, index, survey.duration || 3, extractedAnchors.length))
        .join('');
      bindDragAndReorderEvents();
    }
  }

  function startReelExtraction() {
    currentStep = 'extracting';
    processingStep = 0;
    render();

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      processingStep++;
      if (processingStep < 4) {
        render();
      } else {
        clearInterval(timerInterval);
        currentStep = 'customize';
        render();
      }
    }, 450);
  }

  function startProcessing(type) {
    processingType = type;
    currentStep = 'processing';
    processingStep = 0;
    render();

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      processingStep++;
      if (processingStep < 4) {
        render();
      } else {
        clearInterval(timerInterval);
        currentStep = 'reveal';
        render();
      }
    }, 500);
  }

  function finishOnboarding(type) {
    const isReel = type === 'reels';
    const isTokyo = survey.destination && survey.destination.toLowerCase().includes('tokyo');
    const cityName = getCityName();
    const activeSquad = ['Clarence', 'Tony', 'Wei Gang'];
    const coverImage = 'https://image-tc.galaxy.tf/wijpeg-9j3ux7drhby0iny1evej1e38j/sunset-at-penang-bridge.jpg?width=1920';

    let activeTrip = getActiveTrip();
    if (!activeTrip || isNewTripFlow) {
      activeTrip = createTrip({
        title: `${cityName} Food & Heritage Expedition`,
        destination: survey.destination || 'Penang, Malaysia',
        startDate: survey.startDate || '2026-10-12',
        endDate: survey.endDate || '2026-10-14',
        totalDays: survey.duration || 3,
        coverImage,
        members: activeSquad,
      });
    } else {
      activeTrip = updateTrip(activeTrip.id, {
        title: `${cityName} Food & Heritage Expedition`,
        destination: survey.destination || 'Penang, Malaysia',
        startDate: survey.startDate || '2026-10-12',
        endDate: survey.endDate || '2026-10-14',
        totalDays: survey.duration || 3,
        coverImage,
        members: activeSquad,
      });
    }

    setActiveTripId(activeTrip.id);
    saveTripSettings({
      title: activeTrip.title,
      destination: activeTrip.destination,
      startDate: activeTrip.startDate,
      endDate: activeTrip.endDate,
      totalDays: activeTrip.totalDays,
      coverImage: activeTrip.coverImage,
      pace: survey.pace,
      vibe: survey.vibe,
    });

    let tripBlocks = [];

    if (isReel) {
      tripBlocks = extractedAnchors.map((anchor, idx) => {
        const isChew = anchor.title.toLowerCase().includes('chew') || anchor.title.toLowerCase().includes('jetty');
        const isBlueMansion = anchor.title.toLowerCase().includes('blue mansion') || anchor.title.toLowerCase().includes('cheong fatt tze');

        return {
          id: isChew ? 'd1-chew-jetty' : isBlueMansion ? 'd1-blue-mansion' : 'd1-penang-hill',
          day: Number(anchor.day) || 1,
          startTime: anchor.startTime || (idx === 0 ? '09:30' : '16:30'),
          endTime: anchor.endTime || (idx === 0 ? '11:00' : '19:00'),
          category: 'activity',
          status: 'confirmed',
          title: anchor.title,
          location: anchor.location,
          transitToNextMinutes: isChew ? 15 : 20,
          transitMode: 'GrabCar (15 mins)',
          requirements: isChew
            ? ['Morning Sunscreen', 'Modest Heritage Attire']
            : isBlueMansion
            ? ['Heritage Tour Reservation', 'Smart Casual Attire']
            : ['Funicular Fast Lane Ticket', 'Light Windbreaker'],
          fallback: isChew ? null : 'The Top Komtar Indoor Theme Park & Glass Rainbow Skywalk',
          fallbackReason: isChew ? null : 'weather',
          notes: anchor.notes || `Extracted anchor from ${currentSourceInfo.creator || '@penangfoodie'} video stream.`,
          dressCode: isChew ? 'Light cotton & sunscreen' : 'Comfortable walking gear',
          source: 'reel',
          reelUrl: reelUrl || 'https://www.instagram.com/reel/C8x9_penang_heritage',
          reelCreator: currentSourceInfo.creator || '@penangfoodie',
          rating: 4.8,
        };
      });
    } else if (isTokyo) {
      tripBlocks = JSON.parse(JSON.stringify(SAMPLE_ITINERARY));
    } else {
      tripBlocks = initPenangSparseDay1();
    }

    saveItineraryData(tripBlocks);
    try {
      localStorage.setItem(`travel_planner_itinerary_${activeTrip.id}`, JSON.stringify(tripBlocks));
      localStorage.setItem('travel_planner_itinerary_v3', JSON.stringify(tripBlocks));
    } catch (e) {}

    if (isTokyo) {
      addWishlistItem({
        title: 'Tsukiji Outer Market Fresh Uni & Wagyu Skewers',
        category: 'food',
        description: 'Bustling morning seafood market with freshly torched scallops and wagyu.',
        estimatedCost: '¥2,500 (~$17)',
        votes: 4,
        addedBy: 'Tony',
        source: 'wishlist',
      });
      addWishlistItem({
        title: 'Ghibli Museum Mitaka',
        category: 'activity',
        description: 'Whimsical studio museum celebrating Hayao Miyazaki animation classics.',
        estimatedCost: '¥1,000 (~$7)',
        votes: 3,
        addedBy: 'Sakura',
        source: 'wishlist',
      });
    } else {
      addWishlistItem({
        title: 'Lebuh Keng Kwee Famous Teochew Chendul',
        category: 'food',
        description: 'Heritage street dessert stall known for shaved ice with fresh coconut milk and pandan jelly noodles.',
        imageUrl: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=600&q=80',
        estimatedCost: 'RM 5 (~$1.10)',
        votes: 4,
        addedBy: isReel ? 'IG Reel Import' : 'Tony',
        source: isReel ? 'reel' : 'wishlist',
      });
      addWishlistItem({
        title: 'Siam Road Charcoal Char Koay Teow',
        category: 'food',
        description: 'Legendary charcoal-fired wok hei flat rice noodles with cockles and lap cheong.',
        imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
        estimatedCost: 'RM 9 (~$2.00)',
        votes: 3,
        addedBy: isReel ? 'IG Reel Import' : 'Wei Gang',
        source: isReel ? 'reel' : 'wishlist',
      });
    }

    localStorage.setItem('travel_planner_onboarded_v1', 'true');
    closeModal();

    const detail = {
      trip: activeTrip,
      tripId: activeTrip.id,
      destination: activeTrip.destination,
      title: activeTrip.title,
      startDate: survey.startDate,
      endDate: survey.endDate,
      totalDays: survey.duration,
      coverImage: activeTrip.coverImage,
      blocks: tripBlocks,
      anchors: extractedAnchors,
      reelUrl,
      members: activeSquad,
    };

    window.dispatchEvent(new CustomEvent('trip:created', { detail, bubbles: true }));
    document.dispatchEvent(new CustomEvent('trip:created', { detail, bubbles: true }));

    try {
      const bc = new BroadcastChannel('wandersync_remote_sync');
      bc.postMessage({
        type: 'TRIGGER_PHASE',
        phase: 'ACT_1_GENESIS',
        tripId: activeTrip.id,
        payload: detail,
      });
    } catch (e) {}

    if (window.RemoteSync && typeof window.RemoteSync.send === 'function') {
      try {
        window.RemoteSync.send('TRIGGER_PHASE', { phase: 'ACT_1_GENESIS', tripId: activeTrip.id });
      } catch (e) {}
    }
    if (window.DemoScript && typeof window.DemoScript.startDay2Simulation === 'function') {
      try {
        window.DemoScript.startDay2Simulation();
      } catch (e) {}
    }
    if (window.DemoScript && typeof window.DemoScript.onTripCreated === 'function') {
      try {
        window.DemoScript.onTripCreated(activeTrip);
      } catch (e) {}
    }

    startBackgroundTripBanter();

    window.location.hash = '#itinerary';
    setActiveTab('itinerary');
    showToastNotice(`Collaborative trip live! ${activeSquad.join(', ')} connected.`);

    if (typeof onComplete === 'function') {
      onComplete(type, survey, activeTrip);
    }
  }

  function showToastNotice(msg) {
    const toast = document.createElement('div');
    toast.className = 'dash-toast dash-toast--success dash-toast--visible';
    toast.innerHTML = `
      <span class="dash-toast__icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </span>
      <span class="dash-toast__msg">${msg}</span>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('dash-toast--visible');
      toast.classList.add('dash-toast--exit');
      setTimeout(() => toast.remove(), 350);
    }, 3500);
  }

  function openModal(step = 'menu', options = {}) {
    isNewTripFlow = Boolean(options.newTrip);
    currentStep = step;
    previousStep = step;
    processingStep = 0;
    overlay.style.display = 'flex';
    render();
  }

  function closeModal() {
    overlay.style.display = 'none';
    if (timerInterval) clearInterval(timerInterval);
  }

  return {
    element: overlay,
    open: openModal,
    close: closeModal,
    startReelExtraction,
    startProcessing,
    setReelUrl(url) {
      reelUrl = url;
    },
    destroy() {
      if (timerInterval) clearInterval(timerInterval);
      if (overlay.parentElement) overlay.remove();
    },
  };
}
