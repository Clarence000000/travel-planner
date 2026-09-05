/**
 * View: AI Schedule Assistant
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
    badge: '💡 Weather Reshuffle',
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
          <span class="view-badge">Intelligent Trip Copilot</span>
          <p class="view-subtitle">Auto-reshuffles schedule stops based on budget constraints, travel pace, and unexpected delays</p>
        </div>
      </div>

      <!-- AI Prompt & Command Box -->
      <div class="ai-box">
        <div class="ai-box__header">
          <span class="ai-box__sparkle">✨</span>
          <span class="ai-box__label">Travel Copilot Assistant</span>
        </div>
        <div class="ai-input-wrapper">
          <input 
            type="text" 
            class="ai-input" 
            id="ai-prompt-input"
            placeholder="Ask anything or use commands (#rain, #pace, #delay)..." 
          />
          <button type="button" class="btn btn--primary btn--sm" id="btn-ai-generate">Reshuffle</button>
        </div>
        <div class="ai-commands-row">
          <button type="button" class="command-pill" data-cmd="#rain">🌧 #rain-delay</button>
          <button type="button" class="command-pill" data-cmd="#chill">☕ #chill-pace</button>
          <button type="button" class="command-pill" data-cmd="#turbo">⚡ #turbo-pace</button>
          <button type="button" class="command-pill" data-cmd="#delay">⏱ #delay-30m</button>
        </div>
      </div>

      <!-- Travel Pace Optimization -->
      <div class="pace-card">
        <h3 class="pace-card__title">Travel Pace Optimization</h3>
        <p class="pace-card__desc">Choose group intensity to recalibrate transit buffers and rest windows</p>
        <div class="pace-options">
          <button type="button" class="pace-btn ${currentPace === 'chill' ? 'pace-btn--active' : ''}" data-pace="chill">
            ☕ Chill & Relaxed
          </button>
          <button type="button" class="pace-btn ${currentPace === 'balanced' ? 'pace-btn--active' : ''}" data-pace="balanced">
            ⚖ Balanced Pace
          </button>
          <button type="button" class="pace-btn ${currentPace === 'turbo' ? 'pace-btn--active' : ''}" data-pace="turbo">
            ⚡ Turbo Explorer
          </button>
        </div>
      </div>

      <!-- AI Reshuffle Proposal Card -->
      <div class="proposal-card">
        <div class="proposal-card__header">
          <span class="status-pill status-pill--proposed">${activeProposal.badge}</span>
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
            ${activeProposal.applied ? '✓ Reshuffle Applied (View Schedule)' : '⚡ Apply Reshuffle'}
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
            badge: '☕ Pace Adjustment',
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
            badge: '⚡ Pace Adjustment',
            time: 'Just now',
            title: 'Turbo Pace: Compress Buffers for Maximum Sights',
            desc: 'Compressed transit cushions down to 10 minutes to make room for evening nightlife in Shinjuku.',
            diff: [
              { label: 'Time saved', change: '45 minutes freed up' },
              { label: 'Extra slot', change: 'Golden Gai Micro-Bars ready' },
            ],
            applied: false,
          };
        } else {
          activeProposal = {
            id: 'prop-balanced',
            strategy: 'rain-delay',
            badge: '⚖ Balanced Schedule',
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

    // Command pills
    container.querySelectorAll('.command-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        const cmd = pill.getAttribute('data-cmd');
        handleCommand(cmd);
      });
    });

    // AI Generate button
    const promptInput = container.querySelector('#ai-prompt-input');
    container.querySelector('#btn-ai-generate').addEventListener('click', () => {
      const val = promptInput.value.trim();
      handleCommand(val || '#rain');
    });

    // Apply Reshuffle
    container.querySelector('#btn-apply-reshuffle').addEventListener('click', () => {
      if (activeProposal.applied) {
        setActiveTab('itinerary');
        return;
      }
      applyReshuffle(activeProposal.strategy);
      activeProposal.applied = true;
      showToast('✨ Schedule reshuffled! Changes applied to Itinerary.');
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
        badge: '🌧 Rain Contingency',
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
        badge: '⏱ Delay Compensator',
        time: 'Just now',
        title: '30-Minute Transit Delay Absorbed',
        desc: 'Shifting afternoon activities forward by 30 minutes and clipping excess rest buffer so dinner reservation remains intact.',
        diff: [
          { label: 'Schedule shift', change: '+30m forwarded' },
          { label: 'Dinner reservation', change: 'Safe at 7:00 PM' },
        ],
        applied: false,
      };
    } else if (lower.includes('chill')) {
      currentPace = 'chill';
      activeProposal = {
        id: 'prop-chill',
        strategy: 'chill-pace',
        badge: '☕ Relaxed Pace',
        time: 'Just now',
        title: 'Extended Rest Windows & Pacing Buffer',
        desc: 'Added 20-minute rest cushions to prevent group exhaustion.',
        diff: [
          { label: 'Rest cushion', change: '+20m added' },
          { label: 'Buffer alerts', change: 'All cleared' },
        ],
        applied: false,
      };
    } else if (lower.includes('turbo')) {
      currentPace = 'turbo';
      activeProposal = {
        id: 'prop-turbo',
        strategy: 'turbo-pace',
        badge: '⚡ Turbo Explorer',
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
        badge: '✨ Custom Reshuffle',
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
    showToast('✨ AI generated new schedule proposal!');
  }

  // Initial render
  render();

  return {
    element: container,
  };
}
