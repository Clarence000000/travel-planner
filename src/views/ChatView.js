/**
 * View: Per-Activity Chat Threads
 * Contextual discussions anchored strictly to individual itinerary blocks,
 * plus Wishlist scratchpad and native mini-polls.
 */

export function createChatView() {
  const container = document.createElement('div');
  container.className = 'feature-view chat-view';

  container.innerHTML = `
    <!-- /* FEATURE INJECTION POINT: PER-ACTIVITY CHAT THREADS */ -->
    <!-- Atmospheric Vertical Asset Banner -->
    <div class="view-banner" style="background-image: url('./src/assets/bg-chat.png');">
      <div class="view-banner__scrim">
        <span class="view-banner__badge">📦 Boxed Buddies Chat</span>
        <h2 class="view-banner__title">Per-Activity Chat</h2>
      </div>
    </div>

    <div class="view-header">
      <div class="view-header__meta">
        <span class="view-badge">Topic-Focused Messaging</span>
        <p class="view-subtitle">Discussions stay tied to specific timeline blocks to prevent main chat chaos</p>
      </div>

      <!-- Thread Anchor Selector -->
      <div class="thread-selector-chips" role="tablist">
        <button class="thread-chip thread-chip--active" role="tab">📍 Asakusa Visit</button>
        <button class="thread-chip" role="tab">🍜 Dinner @ Shibuya</button>
        <button class="thread-chip" role="tab">💡 Wishlist Ideas</button>
      </div>
    </div>

    <!-- Active Thread Context Header -->
    <div class="active-thread-card">
      <div class="active-thread-card__info">
        <span class="active-thread-card__event">Event: Rooftop Matcha & Street Food</span>
        <span class="active-thread-card__count">3 active participants</span>
      </div>
    </div>

    <!-- Native Mini-Poll Card -->
    <div class="poll-card">
      <div class="poll-card__header">
        <span class="poll-card__badge">📊 Native Mini-Poll</span>
        <span class="poll-card__status">Voting Active</span>
      </div>
      <h3 class="poll-card__question">Which lunch spot should we lock in?</h3>
      <div class="poll-options">
        <button type="button" class="poll-option poll-option--selected">
          <div class="poll-option__row">
            <span>A: Traditional Soba Noodles</span>
            <span class="poll-option__percent">67% (4 votes)</span>
          </div>
          <div class="poll-option__bar" style="width: 67%;"></div>
        </button>
        <button type="button" class="poll-option">
          <div class="poll-option__row">
            <span>B: Tsukiji Fresh Seafood Bowl</span>
            <span class="poll-option__percent">33% (2 votes)</span>
          </div>
          <div class="poll-option__bar" style="width: 33%;"></div>
        </button>
      </div>
    </div>

    <!-- Chat Message Feed -->
    <div class="chat-feed" id="chat-messages-target">
      <div class="chat-message chat-message--incoming">
        <div class="chat-message__avatar">🍙</div>
        <div class="chat-message__bubble">
          <div class="chat-message__sender">Traveler 1</div>
          <p class="chat-message__text">The soba place has vegetarian options which fits everyone’s diet matrix!</p>
          <span class="chat-message__time">10:14 AM</span>
        </div>
      </div>

      <div class="chat-message chat-message--outgoing">
        <div class="chat-message__bubble">
          <p class="chat-message__text">Agreed! Let's vote Option A so the schedule auto-updates.</p>
          <span class="chat-message__time">10:16 AM</span>
        </div>
      </div>
    </div>

    <!-- Message Input Bar -->
    <div class="chat-input-bar">
      <input type="text" class="chat-input" placeholder="Type a message or use #poll..." />
      <button type="button" class="chat-send-btn" aria-label="Send message">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      </button>
    </div>

    <!-- Sub-feature Injection Zone -->
    <div class="slot-injection-box">
      <span class="slot-injection-box__label">/* CHAT & WEBSOCKET MOUNT POINT */</span>
      <p class="slot-injection-box__text">
        Feature container ready for real-time messaging, thread switching, and voting sync.
      </p>
    </div>
  `;

  return {
    element: container,
  };
}
