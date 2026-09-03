/**
 * View: AI Schedule Assistant
 * Dynamic itinerary recalibration, pace tuning, and # command integration.
 */

export function createAssistantView() {
  const container = document.createElement('div');
  container.className = 'feature-view assistant-view';

  container.innerHTML = `
    <!-- /* FEATURE INJECTION POINT: AI SCHEDULE ASSISTANT */ -->
    <!-- Atmospheric Vertical Asset Banner -->
    <div class="view-banner" style="background-image: url('./src/assets/bg-assistant.png');">
      <div class="view-banner__scrim">
        <span class="view-banner__badge">✨ Smiling Copilot</span>
        <h2 class="view-banner__title">AI Schedule Assistant</h2>
      </div>
    </div>

    <div class="view-header">
      <div class="view-header__meta">
        <span class="view-badge">Intelligent Agent</span>
        <p class="view-subtitle">Auto-reshuffle stops based on pace, budget, and unexpected weather delays</p>
      </div>
    </div>

    <!-- AI Command Box -->
    <div class="ai-box">
      <div class="ai-box__header">
        <span class="ai-box__sparkle">✨</span>
        <span class="ai-box__label">AI Travel Copilot</span>
      </div>
      <div class="ai-input-wrapper">
        <input 
          type="text" 
          class="ai-input" 
          placeholder="Ask anything or type # for commands (e.g. #reshuffle, #poll)..." 
        />
        <button type="button" class="btn btn--primary btn--sm">Generate</button>
      </div>
      <div class="ai-commands-row">
        <button type="button" class="command-pill">#poll</button>
        <button type="button" class="command-pill">#optimize-buffers</button>
        <button type="button" class="command-pill">#dietary-check</button>
      </div>
    </div>

    <!-- Pace Selector Card -->
    <div class="pace-card">
      <h3 class="pace-card__title">Travel Pace Optimization</h3>
      <p class="pace-card__desc">Choose group intensity to recalculate rest windows</p>
      <div class="pace-options">
        <button type="button" class="pace-btn">☕ Chill & Relaxed</button>
        <button type="button" class="pace-btn pace-btn--active">⚖ Balanced Pace</button>
        <button type="button" class="pace-btn">⚡ Turbo Explorer</button>
      </div>
    </div>

    <!-- AI Reshuffle Proposal Card -->
    <div class="proposal-card">
      <div class="proposal-card__header">
        <span class="status-pill status-pill--proposed">💡 Suggested Adjustment</span>
        <span class="proposal-card__time">Just now</span>
      </div>
      <h4 class="proposal-card__title">Rain Expected at 3:00 PM — Move Bamboo Grove</h4>
      <p class="proposal-card__desc">
        Shifting outdoor Bamboo Grove walk to 10:00 AM and swapping indoor museum visit to 3:30 PM keeps everyone dry.
      </p>
      <div class="proposal-card__actions">
        <button type="button" class="btn btn--primary btn--sm">Apply Reshuffle</button>
        <button type="button" class="btn btn--secondary btn--sm">Dismiss</button>
      </div>
    </div>

    <!-- Sub-feature Injection Zone -->
    <div class="slot-injection-box">
      <span class="slot-injection-box__label">/* AI ENGINE & LLM PIPELINE MOUNT POINT */</span>
      <p class="slot-injection-box__text">
        Feature container ready for AI agent hooks, natural language prompt handler, and diagram output.
      </p>
    </div>
  `;

  return {
    element: container,
  };
}
