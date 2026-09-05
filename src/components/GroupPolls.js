/**
 * Component: Quick Group Polls (群投票联动日程)
 * An inline, state-driven poll card that looks like an undecided schedule slot.
 * Features:
 *   1. Schedule-inline form — displays as a "pending decision" itinerary card
 *   2. Click-to-vote with animated progress bars + fake voter avatars
 *   3. "End Poll & Apply" converts the winning option into a Confirmed schedule item
 *
 * Pure client-side state — no server calls.
 */

// ── Fake Voter Avatars ──────────────────────────────────────────────────
const VOTER_POOL = [
  { initials: 'HR', name: 'Haru' },
  { initials: 'MC', name: 'Mochi' },
  { initials: 'SK', name: 'Sakura' },
  { initials: 'YK', name: 'Yuki' },
  { initials: 'RN', name: 'Ren' },
  { initials: 'KT', name: 'Kitsune' },
];

// ── Default Poll Data ───────────────────────────────────────────────────
const DEFAULT_POLLS = [
  {
    id: 'poll-lunch',
    question: 'Lunch Location Decision',
    subtitle: 'Day 1 • 12:30 PM Slot • Undecided',
    timeSlot: '12:30 PM – 01:30 PM',
    options: [
      {
        id: 'opt-a',
        label: 'Ichiran Ramen',
        location: 'Shibuya, Tokyo',
        votes: [VOTER_POOL[0], VOTER_POOL[2]],
      },
      {
        id: 'opt-b',
        label: 'Tsukiji Sushi Market',
        location: 'Chuo City, Tokyo',
        votes: [VOTER_POOL[1]],
      },
    ],
    myVote: null, // user hasn't voted yet
    ended: false,
    winnerId: null,
  },
  {
    id: 'poll-evening',
    question: 'Evening Activity Choice',
    subtitle: 'Day 1 • 06:00 PM Slot • Undecided',
    timeSlot: '06:00 PM – 08:00 PM',
    options: [
      {
        id: 'opt-c',
        label: 'Robot Restaurant Experience',
        location: 'Shinjuku, Tokyo',
        votes: [VOTER_POOL[3]],
      },
      {
        id: 'opt-d',
        label: 'Golden Gai Bar Hopping',
        location: 'Kabukicho, Shinjuku',
        votes: [VOTER_POOL[4], VOTER_POOL[5]],
      },
    ],
    myVote: null,
    ended: false,
    winnerId: null,
  },
];

/**
 * Creates the Quick Group Polls component.
 * @returns {{ element: HTMLElement }} The component wrapper.
 */
export function createGroupPolls() {
  const wrapper = document.createElement('div');
  wrapper.className = 'group-polls';

  // ── Deep-clone state ──────────────────────────────────────────────────
  const polls = JSON.parse(JSON.stringify(DEFAULT_POLLS));

  // ── Render ────────────────────────────────────────────────────────────
  function render() {
    wrapper.innerHTML = `
      <div class="group-polls__header">
        <h3 class="group-polls__title" style="display: flex; align-items: center; gap: 6px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
          <span>Group Polls</span>
        </h3>
        <span class="group-polls__subtitle">${polls.filter(p => !p.ended).length} active poll(s)</span>
      </div>
      ${polls.map(renderPollCard).join('')}
    `;
    bindEvents();
  }

  function renderPollCard(poll) {
    const totalVotes = poll.options.reduce((sum, o) => sum + o.votes.length, 0);

    // Determine winner
    const sorted = [...poll.options].sort((a, b) => b.votes.length - a.votes.length);
    const winner = sorted[0];
    const isTie = sorted.length > 1 && sorted[0].votes.length === sorted[1].votes.length;

    if (poll.ended) {
      return renderConfirmedCard(poll, winner);
    }

    return `
      <div class="gpoll-card" data-poll-id="${poll.id}">
        <!-- Schedule Context Badge Row -->
        <div class="gpoll-card__badge-row">
          <span class="gpoll-card__schedule-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:-1px; margin-right:3px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            ${poll.timeSlot}
          </span>
          <span class="gpoll-card__status-pill gpoll-card__status-pill--voting" style="display: flex; align-items: center; gap: 4px;">
            <span class="status-dot status-dot--proposed"></span> Voting Open
          </span>
        </div>

        <!-- Question -->
        <h4 class="gpoll-card__question">${poll.question}</h4>
        <p class="gpoll-card__context">${poll.subtitle}</p>

        <!-- Options -->
        <div class="gpoll-options">
          ${poll.options.map((opt) => renderOption(poll, opt, totalVotes)).join('')}
        </div>

        <!-- Action Bar -->
        <div class="gpoll-card__actions">
          <div class="gpoll-card__vote-summary">
            <span class="gpoll-card__total-votes">${totalVotes} vote${totalVotes !== 1 ? 's' : ''} cast</span>
            ${poll.myVote
              ? `<span class="gpoll-card__my-vote">✓ You voted</span>`
              : `<span class="gpoll-card__tap-hint">Tap an option to vote</span>`
            }
          </div>
          <button
            type="button"
            class="btn btn--primary btn--sm gpoll-end-btn"
            data-end-poll="${poll.id}"
            ${!poll.myVote ? 'disabled' : ''}
            title="${!poll.myVote ? 'Vote first before ending' : isTie ? 'Tie! Winner picked by first voted' : `Winner: ${winner.label}`}"
          >
            <span>End Poll & Apply</span>
          </button>
        </div>
      </div>
    `;
  }

  function renderOption(poll, opt, totalVotes) {
    const pct = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
    const isSelected = poll.myVote === opt.id;
    const isLeading = totalVotes > 0 &&
      opt.votes.length === Math.max(...poll.options.map(o => o.votes.length)) &&
      opt.votes.length > 0;

    const avatarHTML = opt.votes
      .slice(0, 5)
      .map(
        (v, i) => `<span class="gpoll-avatar" style="z-index:${5 - i}; font-size: 9px; font-weight: bold;" title="${v.name}">${v.initials}</span>`
      )
      .join('');

    return `
      <button
        type="button"
        class="gpoll-option ${isSelected ? 'gpoll-option--selected' : ''} ${isLeading ? 'gpoll-option--leading' : ''}"
        data-poll-id="${poll.id}"
        data-option-id="${opt.id}"
      >
        <div class="gpoll-option__bar" style="width: ${pct}%;"></div>
        <div class="gpoll-option__content">
          <div class="gpoll-option__label-row">
            <div class="gpoll-option__text">
              <span class="gpoll-option__name">${opt.label}</span>
              <span class="gpoll-option__location">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:-1px; margin-right:2px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                ${opt.location}
              </span>
            </div>
          </div>
          <div class="gpoll-option__stats">
            <div class="gpoll-avatar-stack">${avatarHTML}</div>
            <span class="gpoll-option__pct">${pct}%</span>
          </div>
        </div>
        ${isSelected ? '<span class="gpoll-option__check">✓</span>' : ''}
      </button>
    `;
  }

  function renderConfirmedCard(poll, winner) {
    return `
      <div class="gpoll-card gpoll-card--confirmed" data-poll-id="${poll.id}">
        <div class="gpoll-card__badge-row">
          <span class="gpoll-card__schedule-badge gpoll-card__schedule-badge--confirmed">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:-1px; margin-right:3px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            ${poll.timeSlot}
          </span>
          <span class="gpoll-card__status-pill gpoll-card__status-pill--confirmed" style="display: flex; align-items: center; gap: 4px;">
            <span class="status-dot status-dot--confirmed"></span> Confirmed
          </span>
        </div>

        <div class="gpoll-confirmed-body">
          <div class="gpoll-confirmed-info">
            <h4 class="gpoll-confirmed-title">${winner.label}</h4>
            <p class="gpoll-confirmed-location">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:-1px; margin-right:2px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              ${winner.location}
            </p>
          </div>
        </div>

        <div class="gpoll-confirmed-footer">
          <span class="gpoll-confirmed-result">
            Decided by poll • ${winner.votes.length} vote${winner.votes.length !== 1 ? 's' : ''}
          </span>
          <div class="gpoll-avatar-stack gpoll-avatar-stack--confirmed">
            ${winner.votes
              .map(
                (v, i) => `<span class="gpoll-avatar" style="z-index:${5 - i}; font-size: 9px; font-weight: bold;" title="${v.name}">${v.initials}</span>`
              )
              .join('')}
          </div>
        </div>
      </div>
    `;
  }

  // ── Event Binding ─────────────────────────────────────────────────────
  function bindEvents() {
    // Option voting
    wrapper.querySelectorAll('.gpoll-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pollId = btn.dataset.pollId;
        const optionId = btn.dataset.optionId;
        handleVote(pollId, optionId);
      });
    });

    // End poll
    wrapper.querySelectorAll('.gpoll-end-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pollId = btn.dataset.endPoll;
        handleEndPoll(pollId);
      });
    });
  }

  // ── State Mutations ───────────────────────────────────────────────────
  function handleVote(pollId, optionId) {
    const poll = polls.find((p) => p.id === pollId);
    if (!poll || poll.ended) return;

    const meVoter = { emoji: '🧑', name: 'You' };

    // Remove previous vote if exists
    if (poll.myVote) {
      const prevOpt = poll.options.find((o) => o.id === poll.myVote);
      if (prevOpt) {
        prevOpt.votes = prevOpt.votes.filter((v) => v.name !== 'You');
      }
    }

    // Apply new vote
    const targetOpt = poll.options.find((o) => o.id === optionId);
    if (!targetOpt) return;

    // Toggle off if clicking same option
    if (poll.myVote === optionId) {
      poll.myVote = null;
    } else {
      targetOpt.votes.push(meVoter);
      poll.myVote = optionId;

      // Simulate another user voting after a short delay (demo juice)
      setTimeout(() => {
        if (poll.ended) return;
        const randomOpt = poll.options[Math.floor(Math.random() * poll.options.length)];
        const unusedVoters = VOTER_POOL.filter(
          (v) => !poll.options.some((o) => o.votes.some((vv) => vv.name === v.name))
        );
        if (unusedVoters.length > 0) {
          const randomVoter = unusedVoters[Math.floor(Math.random() * unusedVoters.length)];
          randomOpt.votes.push(randomVoter);
          render();
        }
      }, 800);
    }

    render();
  }

  function handleEndPoll(pollId) {
    const poll = polls.find((p) => p.id === pollId);
    if (!poll || poll.ended) return;

    // Determine winner
    const sorted = [...poll.options].sort((a, b) => b.votes.length - a.votes.length);
    poll.winnerId = sorted[0].id;
    poll.ended = true;

    // Show toast (emit custom event for parent to catch, or use simple built-in)
    showPollToast(wrapper, `✅ "${sorted[0].label}" locked in as Confirmed!`);

    render();
  }

  // ── Simple Toast ──────────────────────────────────────────────────────
  function showPollToast(container, message) {
    const existing = container.querySelector('.gpoll-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'gpoll-toast';
    toast.innerHTML = `<span>${message}</span>`;
    container.insertBefore(toast, container.firstChild);

    requestAnimationFrame(() => toast.classList.add('gpoll-toast--visible'));

    setTimeout(() => {
      toast.classList.remove('gpoll-toast--visible');
      toast.classList.add('gpoll-toast--exit');
      setTimeout(() => toast.remove(), 350);
    }, 3000);
  }

  // ── Init ──────────────────────────────────────────────────────────────
  render();

  return { element: wrapper };
}
