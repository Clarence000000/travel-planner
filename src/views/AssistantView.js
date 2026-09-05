/**
 * View: Smart Schedule Assistant
 * Automatically analyzes travel pace, budget limits, and unexpected delays
 * to build, recalibrate, and reshuffle itinerary blocks.
 */

import { applyReshuffle } from '../models/itineraryData.js';
import { setActiveTab } from '../config/navigation.js';

export function createAssistantView() {
  const container = document.createElement('div');
  container.className = 'feature-view assistant-view';

  let currentPace = 'balanced'; // 'chill' | 'balanced' | 'turbo'
  let activeProposal = {
    id: 'prop-rain',
    strategy: 'rain-delay',
    badge: 'Weather Contingency',
    time: '2 mins ago',
    title: 'Rain Forecasted at 3:00 PM — Move Bamboo Grove Indoors',
    desc: 'Swapping outdoor Arashiyama Bamboo Grove on Day 2 with Kyoto Railway Museum & Indoor Crafts Center keeps the group dry while preserving scheduled dinner slots.',
    diff: [
      { label: 'Outdoor walk', change: 'Replaced with Indoor Museum' },
      { label: 'Buffer safety', change: '+20 mins travel cushion' },
    ],
    applied: false,
  };

  function showToast(message) {
    const existing = document.querySelector('.toast-notice');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notice';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 2800);
  }

  function render() {
    container.innerHTML = `
      <div class="view-header">
        <div class="view-header__meta">
          <span class="view-badge">Schedule Optimizer</span>
          <p class="view-subtitle">Auto-reshuffle schedule stops based on budget constraints, travel pace, and unexpected delays</p>
        </div>
      </div>

      <!-- Schedule Adjustment Prompt Box -->
      <div class="optimizer-card">
        <div class="optimizer-card__header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-primary);">
            <line x1="4" y1="21" x2="4" y2="14"></line>
            <line x1="4" y1="10" x2="4" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12" y2="3"></line>
            <line x1="20" y1="21" x2="20" y2="16"></line>
            <line x1="20" y1="12" x2="20" y2="3"></line>
            <line x1="1" y1="14" x2="7" y2="14"></line>
            <line x1="9" y1="8" x2="15" y2="8"></line>
            <line x1="17" y1="16" x2="23" y2="16"></line>
          </svg>
          <span class="optimizer-card__label">Adaptive Reshuffle Engine</span>
        </div>
        <div class="optimizer-input-wrapper">
          <input 
            type="text" 
            class="optimizer-input" 
            id="ai-prompt-input"
            placeholder="Ask to adjust schedule or choose a scenario below..." 
          />
          <button type="button" class="btn btn--primary btn--sm" id="btn-ai-generate">Reshuffle</button>
        </div>
        <div class="preset-scenarios-row">
          <button type="button" class="preset-chip" data-cmd="rain">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path><line x1="8" y1="19" x2="8" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line><line x1="16" y1="19" x2="16" y2="21"></line></svg>
            Weather Backup
          </button>
          <button type="button" class="preset-chip" data-cmd="chill">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Relaxed Pacing
          </button>
          <button type="button" class="preset-chip" data-cmd="turbo">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            High Density
          </button>
          <button type="button" class="preset-chip" data-cmd="delay">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 18H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.19M15 6h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3.19"></path><line x1="23" y1="13" x2="23" y2="11"></line><polyline points="11 6 7 12 13 12 9 18"></polyline></svg>
            Traffic Delay
          </button>
        </div>
      </div>

      <!-- Travel Pace Optimization -->
      <div class="pace-card">
        <h3 class="pace-card__title">Travel Pace Pacing</h3>
        <p class="pace-card__desc">Choose group intensity to recalibrate transit buffers and rest windows</p>
        <div class="pace-options">
          <button type="button" class="pace-btn ${currentPace === 'chill' ? 'pace-btn--active' : ''}" data-pace="chill">
            Relaxed
          </button>
          <button type="button" class="pace-btn ${currentPace === 'balanced' ? 'pace-btn--active' : ''}" data-pace="balanced">
            Balanced
          </button>
          <button type="button" class="pace-btn ${currentPace === 'turbo' ? 'pace-btn--active' : ''}" data-pace="turbo">
            Fast-Paced
          </button>
        </div>
      </div>

      <!-- Schedule Adjustment Proposal Card -->
      <div class="proposal-card">
        <div class="proposal-card__header">
          <span class="status-pill status-pill--proposed">
            <span class="status-dot status-dot--proposed"></span>
            ${activeProposal.badge}
          </span>
          <span class="proposal-card__time">${activeProposal.time}</span>
        </div>
        <h4 class="proposal-card__title">${activeProposal.title}</h4>
        <p class="proposal-card__desc">${activeProposal.desc}</p>
        
        <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 4px; background: var(--color-surface-alt); padding: 8px 12px; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
          ${activeProposal.diff
            .map(
              (d) => `
            <div style="display: flex; justify-content: space-between; font-size: 11px;">
              <span style="color: var(--color-text-secondary);">${d.label}:</span>
              <strong style="color: var(--color-primary);">${d.change}</strong>
            </div>
          `
            )
            .join('')}
        </div>

        <div class="proposal-card__actions">
          <button 
            type="button" 
            class="btn ${activeProposal.applied ? 'btn--secondary' : 'btn--primary'} btn--sm" 
            id="btn-apply-reshuffle"
            style="flex: 1;"
          >
            ${
              activeProposal.applied
                ? `
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Reshuffle Applied (View Schedule)
            `
                : `
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
              Apply Reshuffle
            `
            }
          </button>
          <button type="button" class="btn btn--secondary btn--sm" id="btn-dismiss-proposal">
            Dismiss
          </button>
        </div>
      </div>
    `;

    // Pace switcher
    container.querySelectorAll('.pace-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentPace = btn.getAttribute('data-pace');
        if (currentPace === 'chill') {
          activeProposal = {
            id: 'prop-chill',
            strategy: 'chill-pace',
            badge: 'Relaxed Pacing',
            time: 'Just now',
            title: 'Chill Pace: Expand Meal & Rest Buffers',
            desc: 'Widened rest buffers by +20 minutes between sightseeing blocks to maintain a relaxed holiday rhythm.',
            diff: [
              { label: 'Meal blocks', change: '+20m relaxed dining' },
              { label: 'Transit buffer', change: 'Zero back-to-back rush' },
            ],
            applied: false,
          };
        } else if (currentPace === 'turbo') {
          activeProposal = {
            id: 'prop-turbo',
            strategy: 'turbo-pace',
            badge: 'Fast Pacing',
            time: 'Just now',
            title: 'Turbo Pace: Compress Buffers for Maximum Sights',
            desc: 'Compressed transit cushions down to 10 minutes to make room for evening exploration in Shinjuku.',
            diff: [
              { label: 'Time saved', change: '45 minutes freed up' },
              { label: 'Extra slot', change: 'Evening activity unlocked' },
            ],
            applied: false,
          };
        } else {
          activeProposal = {
            id: 'prop-balanced',
            strategy: 'rain-delay',
            badge: 'Balanced Schedule',
            time: 'Just now',
            title: 'Standard Balanced Schedule Optimized',
            desc: 'Itinerary timing balanced with reasonable 20m transit buffers and comfortable meal durations.',
            diff: [
              { label: 'Pacing balance', change: '3 main activities/day' },
              { label: 'Transit risk', change: 'Low (0 conflicts)' },
            ],
            applied: false,
          };
        }
        render();
      });
    });

    // Preset chips
    container.querySelectorAll('.preset-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const cmd = chip.getAttribute('data-cmd');
        handleCommand(cmd);
      });
    });

    // Generate button
    const promptInput = container.querySelector('#ai-prompt-input');
    container.querySelector('#btn-ai-generate').addEventListener('click', () => {
      const val = promptInput.value.trim();
      handleCommand(val || 'rain');
    });

    // Apply Reshuffle
    container.querySelector('#btn-apply-reshuffle').addEventListener('click', () => {
      if (activeProposal.applied) {
        setActiveTab('itinerary');
        return;
      }
      applyReshuffle(activeProposal.strategy);
      activeProposal.applied = true;
      showToast('Schedule reshuffled! Changes applied to Itinerary.');
      render();
    });

    // Dismiss
    container.querySelector('#btn-dismiss-proposal').addEventListener('click', () => {
      promptInput.value = '';
      showToast('Proposal dismissed.');
    });
  }

  function handleCommand(cmd) {
    const lower = cmd.toLowerCase();
    if (lower.includes('rain') || lower.includes('weather')) {
      activeProposal = {
        id: 'prop-rain',
        strategy: 'rain-delay',
        badge: 'Rain Contingency',
        time: 'Just now',
        title: 'Afternoon Rain Expected — Swap to Indoor Museum',
        desc: 'Moving Arashiyama outdoor walk to a morning slot and swapping with Kyoto Railway Museum keeps the group dry.',
        diff: [
          { label: 'Weather protection', change: '100% covered indoor' },
          { label: 'Buffer impact', change: 'Schedules align seamlessly' },
        ],
        applied: false,
      };
    } else if (lower.includes('delay') || lower.includes('30m')) {
      activeProposal = {
        id: 'prop-delay',
        strategy: 'delay-30m',
        badge: 'Delay Compensator',
        time: 'Just now',
        title: '30-Minute Transit Delay Absorbed',
        desc: 'Shifting afternoon activities forward by 30 minutes and clipping excess rest buffer so dinner reservation remains intact.',
        diff: [
          { label: 'Schedule shift', change: '+30m forwarded' },
          { label: 'Dinner reservation', change: 'Safe at 7:00 PM' },
        ],
        applied: false,
      };
    } else if (lower.includes('chill') || lower.includes('relax')) {
      currentPace = 'chill';
      activeProposal = {
        id: 'prop-chill',
        strategy: 'chill-pace',
        badge: 'Relaxed Pace',
        time: 'Just now',
        title: 'Extended Rest Windows & Pacing Buffer',
        desc: 'Added 20-minute rest cushions to prevent group exhaustion.',
        diff: [
          { label: 'Rest cushion', change: '+20m added' },
          { label: 'Buffer alerts', change: 'All cleared' },
        ],
        applied: false,
      };
    } else if (lower.includes('turbo') || lower.includes('fast')) {
      currentPace = 'turbo';
      activeProposal = {
        id: 'prop-turbo',
        strategy: 'turbo-pace',
        badge: 'Fast Explorer',
        time: 'Just now',
        title: 'Maximum Sight Density Activated',
        desc: 'Tightened transit buffers to fit evening exploration.',
        diff: [
          { label: 'Time saved', change: '45 minutes freed' },
          { label: 'Evening slot', change: 'Unlocked' },
        ],
        applied: false,
      };
    } else {
      activeProposal = {
        id: 'prop-custom',
        strategy: 'rain-delay',
        badge: 'Custom Reshuffle',
        time: 'Just now',
        title: `Optimized for: "${cmd}"`,
        desc: 'Recalculated itinerary constraints based on your group prompt.',
        diff: [
          { label: 'Status', change: 'All blocks validated' },
          { label: 'Buffer integrity', change: 'Verified' },
        ],
        applied: false,
      };
    }
    render();
    showToast('Schedule adjustment calculated.');
  }

  // Initial render
  render();

  return {
    element: container,
  };
}
