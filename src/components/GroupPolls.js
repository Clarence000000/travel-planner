/**
 * Component: Group Polls & Consensus Voting Engine
 * Features:
 * 1. 2-step simulated voting animation:
 *    0/2 Votes (0%) -> Wei Gang votes (50%) -> Tony votes (100% consensus, "Consensus Reached!")
 * 2. Morph animation from dashed amber proposed card to solid confirmed card with glass shine sweep
 * 3. Transit buffer recalculation notice:
 *    - GrabCar (12 min) from Chew Jetty
 *    - Transit (25 min) to Penang Hill
 * 4. BroadcastChannel remote controller integration (START_MINI_POLL, VOTE_CONSENSUS, TRIGGER_SIAM_ROAD_ADVISORY)
 */

import { remoteSync } from '../utils/remoteSync.js';
import {
  getItineraryData,
  updateItineraryBlock,
  saveItineraryData,
} from '../models/itineraryData.js';
import { showDashToast } from '../views/ChatView.js';

const VOTER_POOL = [
  { initials: 'CL', name: 'Clarence (You)' },
  { initials: 'WG', name: 'Wei Gang' },
  { initials: 'TN', name: 'Tony' },
  { initials: 'SK', name: 'Sakura' },
];

const DEFAULT_POLLS = [
  {
    id: 'poll-chendul',
    blockId: 'd1-chendul',
    question: 'Lock in Penang Road Teochew Chendul & Asam Laksa?',
    subtitle: 'Day 1 • 12:30 PM Slot • Proposed Slot',
    timeSlot: '12:30 PM – 01:30 PM',
    options: [
      {
        id: 'opt-chendul-yes',
        label: 'Penang Road Famous Teochew Chendul & Asam Laksa',
        location: '492, Lebuh Keng Kwee, George Town',
        votes: [],
      },
      {
        id: 'opt-chendul-alt',
        label: 'Explore alternative cafe / hawker near Lebuh Campbell',
        location: 'George Town, Penang',
        votes: [],
      },
    ],
    myVote: null,
    ended: false,
    winnerId: null,
    totalEligible: 2,
    consensusReached: false,
  },
  {
    id: 'poll-evening-penang',
    blockId: 'd1-penang-hill',
    question: 'Penang Hill Evening Experience',
    subtitle: 'Day 1 • 06:00 PM Slot • Proposed Slot',
    timeSlot: '06:00 PM – 08:30 PM',
    options: [
      {
        id: 'opt-hill-sunset',
        label: 'Funicular Railway to The Habitat & Sunset Walk',
        location: 'Penang Hill, Bukit Bendera',
        votes: [VOTER_POOL[1]],
      },
      {
        id: 'opt-hill-dinner',
        label: 'David Brown's Restaurant & Tea Terrace',
        location: 'Strawberry Hill, Penang Hill',
        votes: [VOTER_POOL[2]],
      },
    ],
    myVote: null,
    ended: false,
    winnerId: null,
    totalEligible: 2,
    consensusReached: false,
  },
];

export function createGroupPolls() {
  const wrapper = document.createElement('div');
  wrapper.className = 'group-polls';

  let polls = JSON.parse(JSON.stringify(DEFAULT_POLLS));

  function render() {
    wrapper.innerHTML = `
      <div class="group-polls__header">
        <h3 class="group-polls__title" style="display: flex; align-items: center; gap: 6px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
          <span>Group Consensus Polls</span>
        </h3>
        <span class="group-polls__subtitle">${polls.filter(p => !p.ended).length} active poll(s)</span>
      </div>
      <div class="group-polls__list">
        ${polls.map(renderPollCard).join('')}
      </div>
    `;
    bindEvents();
  }

  function renderPollCard(poll) {
    const totalVotes = poll.options.reduce((sum, o) => sum + o.votes.length, 0);
    const targetVotes = poll.totalEligible || 2;
    const progressPct = Math.min(100, Math.round((totalVotes / targetVotes) * 100));

    if (poll.ended) {
      const winner = poll.options.find(o => o.id === poll.winnerId) || poll.options[0];
      return renderConfirmedCard(poll, winner);
    }

    return `
      <div class="gpoll-card consensus-morph-card consensus-morph-card--proposed" id="poll-card-${poll.id}" data-poll-id="${poll.id}">
        <!-- Schedule Context Badge Row -->
        <div class="gpoll-card__badge-row">
          <span class="gpoll-card__schedule-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:-1px; margin-right:3px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            ${poll.timeSlot}
          </span>
          <span class="gpoll-card__status-pill gpoll-card__status-pill--voting" id="status-pill-${poll.id}" style="display: flex; align-items: center; gap: 4px;">
            <span class="status-dot status-dot--proposed"></span> Proposed Slot
          </span>
        </div>

        <!-- Question -->
        <h4 class="gpoll-card__question">${poll.question}</h4>
        <p class="gpoll-card__context">${poll.subtitle}</p>

        <!-- Consensus Voting Progress Bar -->
        <div class="vote-progress-wrapper" id="progress-wrapper-${poll.id}">
          <div class="vote-progress-header">
            <span id="vote-count-label-${poll.id}">${totalVotes}/${targetVotes} Votes (${progressPct}%)</span>
            <span id="vote-consensus-label-${poll.id}" style="color: ${totalVotes >= targetVotes ? '#10B981' : '#F59E0B'}; font-weight: 700;">
              ${totalVotes >= targetVotes ? 'Consensus Reached!' : 'Pending Group Votes'}
            </span>
          </div>
          <div class="vote-progress-track">
            <div class="vote-progress-fill" id="progress-fill-${poll.id}" style="width: ${progressPct}%;"></div>
          </div>
          <div class="voter-avatars-row" id="voters-row-${poll.id}">
            ${poll.options.flatMap(o => o.votes).map(v => `
              <span class="voter-chip">
                <span class="voter-chip__avatar voter-chip__avatar--${v.initials.toLowerCase()}">${v.initials}</span>
                <span>${v.name}</span>
              </span>
            `).join('')}
          </div>
        </div>

        <!-- Options -->
        <div class="gpoll-options">
          ${poll.options.map((opt) => renderOption(poll, opt, totalVotes)).join('')}
        </div>

        <!-- Action Bar -->
        <div class="gpoll-card__actions" style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 12px;">
          <button
            type="button"
            class="btn btn--secondary btn--sm btn-simulate-poll"
            data-simulate-poll="${poll.id}"
            title="Simulate 2-step voting animation"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            <span>Simulate Vote</span>
          </button>
          <button
            type="button"
            class="btn btn--primary btn--sm gpoll-end-btn"
            data-end-poll="${poll.id}"
            title="Lock in winner and recalculate transit buffers"
          >
            <span>Confirm & Lock In</span>
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
            <span class="gpoll-option__pct">${pct}%</span>
          </div>
        </div>
        ${isSelected ? '<span class="gpoll-option__check">✓</span>' : ''}
      </button>
    `;
  }

  function renderConfirmedCard(poll, winner) {
    return `
      <div class="gpoll-card consensus-morph-card consensus-morph-card--confirmed" data-poll-id="${poll.id}">
        <div class="gpoll-card__badge-row">
          <span class="gpoll-card__schedule-badge gpoll-card__schedule-badge--confirmed">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:-1px; margin-right:3px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            ${poll.timeSlot}
          </span>
          <span class="gpoll-card__status-pill gpoll-card__status-pill--confirmed" style="display: flex; align-items: center; gap: 4px;">
            <span class="status-dot status-dot--confirmed"></span> Confirmed (Consensus)
          </span>
        </div>

        <div class="gpoll-confirmed-body" style="margin: 10px 0;">
          <div class="gpoll-confirmed-info">
            <h4 class="gpoll-confirmed-title" style="font-size: 15px; font-weight: 700; color: #1E293B; margin: 0 0 4px;">${winner.label}</h4>
            <p class="gpoll-confirmed-location" style="font-size: 12px; color: #64748B; margin: 0; display: flex; align-items: center; gap: 4px;">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              ${winner.location}
            </p>
          </div>
        </div>

        <!-- Recalculated Buffer Notice -->
        <div class="buffer-recalculation-notice">
          <div class="buffer-notice-title">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span>Buffers Recalculated</span>
          </div>
          <div class="buffer-notice-details">
            <div class="buffer-notice-item">
              <span>🚗</span>
              <strong>GrabCar (12 min)</strong> from Chew Jetty
            </div>
            <div class="buffer-notice-item">
              <span>🚠</span>
              <strong>Transit (25 min)</strong> to Penang Hill
            </div>
          </div>
        </div>

        <div class="gpoll-confirmed-footer" style="display: flex; align-items: center; justify-content: space-between; margin-top: 10px; font-size: 11.5px; color: #64748B;">
          <span>100% Consensus Reached • 2/2 Votes Locked</span>
          <div class="voter-avatars-row">
            <span class="voter-chip"><span class="voter-chip__avatar voter-chip__avatar--wg">WG</span> Wei Gang</span>
            <span class="voter-chip"><span class="voter-chip__avatar voter-chip__avatar--tn">TN</span> Tony</span>
          </div>
        </div>
      </div>
    `;
  }

  function bindEvents() {
    // Option vote click
    wrapper.querySelectorAll('.gpoll-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pollId = btn.dataset.pollId;
        const optionId = btn.dataset.optionId;
        const poll = polls.find(p => p.id === pollId);
        if (!poll || poll.ended) return;

        const targetOpt = poll.options.find(o => o.id === optionId);
        if (!targetOpt) return;

        if (!targetOpt.votes.some(v => v.initials === 'CL')) {
          targetOpt.votes.push(VOTER_POOL[0]);
          poll.myVote = optionId;
          render();
        }
      });
    });

    // Simulate 2-step voting button
    wrapper.querySelectorAll('.btn-simulate-poll').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pollId = btn.dataset.simulatePoll;
        runSimulatedVotingSequence(pollId);
      });
    });

    // Confirm & Lock In button
    wrapper.querySelectorAll('.gpoll-end-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pollId = btn.dataset.endPoll;
        finalizePoll(pollId);
      });
    });
  }

  // ──────────────── 2-Step Voting & Morph Animation ────────────────

  function runSimulatedVotingSequence(pollId) {
    const poll = polls.find(p => p.id === pollId);
    if (!poll) return;

    const card = wrapper.querySelector(`#poll-card-${pollId}`);
    const progressFill = wrapper.querySelector(`#progress-fill-${pollId}`);
    const countLabel = wrapper.querySelector(`#vote-count-label-${pollId}`);
    const consensusLabel = wrapper.querySelector(`#vote-consensus-label-${pollId}`);
    const votersRow = wrapper.querySelector(`#voters-row-${pollId}`);

    // Step 0: Clear previous votes on option 0
    poll.options[0].votes = [];
    if (progressFill) progressFill.style.width = '0%';
    if (countLabel) countLabel.textContent = '0/2 Votes (0%)';
    if (consensusLabel) {
      consensusLabel.textContent = 'Pending Group Votes';
      consensusLabel.style.color = '#F59E0B';
    }
    if (votersRow) votersRow.innerHTML = '';

    // Step 1: Wei Gang votes (50%)
    setTimeout(() => {
      poll.options[0].votes.push(VOTER_POOL[1]); // Wei Gang
      if (progressFill) progressFill.style.width = '50%';
      if (countLabel) countLabel.textContent = '1/2 Votes (50%)';
      if (consensusLabel) consensusLabel.textContent = 'Wei Gang voted (50%)';
      if (votersRow) {
        votersRow.innerHTML = `
          <span class="voter-chip">
            <span class="voter-chip__avatar voter-chip__avatar--wg">WG</span>
            <span>Wei Gang</span>
          </span>
        `;
      }
      showDashToast('Wei Gang voted for Teochew Chendul (50%)', 'info');

      // Step 2: Tony votes (100% consensus)
      setTimeout(() => {
        poll.options[0].votes.push(VOTER_POOL[2]); // Tony
        if (progressFill) progressFill.style.width = '100%';
        if (countLabel) countLabel.textContent = '2/2 Votes (100%)';
        if (consensusLabel) {
          consensusLabel.textContent = 'Consensus Reached! (100%)';
          consensusLabel.style.color = '#10B981';
        }
        if (votersRow) {
          votersRow.innerHTML += `
            <span class="voter-chip">
              <span class="voter-chip__avatar voter-chip__avatar--tn">TN</span>
              <span>Tony</span>
            </span>
          `;
        }
        showDashToast('Tony voted for Teochew Chendul. Consensus Reached!', 'success');

        // Step 3: Morph Animation (Proposed dashed -> Confirmed solid)
        setTimeout(() => {
          if (card) {
            card.classList.add('consensus-morph-card--morphing');
          }
          setTimeout(() => {
            finalizePoll(pollId);
          }, 600);
        }, 800);
      }, 900);
    }, 700);
  }

  function finalizePoll(pollId) {
    const poll = polls.find(p => p.id === pollId);
    if (!poll) return;

    poll.ended = true;
    poll.winnerId = poll.options[0].id;
    poll.consensusReached = true;

    // Update block in itinerary
    if (poll.blockId) {
      const items = getItineraryData();
      const targetBlock = items.find(b => b.id === poll.blockId);
      if (targetBlock) {
        targetBlock.status = 'confirmed';
        targetBlock.voteCount = 2;
        targetBlock.totalVotes = 2;
        targetBlock.transitToNextMinutes = 25;
        targetBlock.transitMode = 'Transit (25 min) to Penang Hill';
        updateItineraryBlock(targetBlock);
      }
    }

    render();

    showDashToast('Consensus Reached! Penang Road Teochew Chendul locked as Confirmed', 'success');

    remoteSync.broadcast('VOTE_CONSENSUS_COMPLETE', {
      pollId,
      blockId: poll.blockId,
      winner: poll.options[0].label,
      transitNotice: 'GrabCar (12 min) from Chew Jetty, Transit (25 min) to Penang Hill',
    });

    window.dispatchEvent(
      new CustomEvent('wandersync:vote_consensus', {
        detail: {
          pollId,
          blockId: poll.blockId,
          winner: poll.options[0].label,
        },
      })
    );
  }

  // ──────────────── BroadcastChannel Subscriptions ────────────────

  const unsubs = [
    remoteSync.subscribe('START_MINI_POLL', () => {
      runSimulatedVotingSequence('poll-chendul');
    }),
    remoteSync.subscribe('VOTE_CONSENSUS', () => {
      runSimulatedVotingSequence('poll-chendul');
    }),
    remoteSync.subscribe('TRIGGER_SIAM_ROAD_ADVISORY', () => {
      showDashToast('⚠️ Schedule Conflict Advisory: Siam Road Char Koay Teow is closed Mondays!', 'info');
    }),
  ];

  render();
  return {
    element: wrapper,
    runSimulatedVotingSequence,
    destroy: () => {
      unsubs.forEach(u => u && u());
    },
  };
}

/**
 * Standalone helper: trigger simulated 2-step voting directly on an itinerary slot card
 */
export function simulateVotingOnSlot(slotElement, blockId, onComplete) {
  if (!slotElement) return;

  slotElement.classList.add('consensus-morph-card', 'consensus-morph-card--proposed');

  // Insert progress bar if not present
  let animContainer = slotElement.querySelector('.vote-progress-wrapper');
  if (!animContainer) {
    animContainer = document.createElement('div');
    animContainer.className = 'vote-progress-wrapper';
    animContainer.innerHTML = `
      <div class="vote-progress-header">
        <span class="slot-vote-count">0/2 Votes (0%)</span>
        <span class="slot-consensus-status" style="color: #F59E0B; font-weight: 700;">Pending Group Votes</span>
      </div>
      <div class="vote-progress-track">
        <div class="vote-progress-fill slot-vote-fill" style="width: 0%;"></div>
      </div>
      <div class="voter-avatars-row slot-voters-row"></div>
    `;
    slotElement.appendChild(animContainer);
  }

  const fill = animContainer.querySelector('.slot-vote-fill');
  const count = animContainer.querySelector('.slot-vote-count');
  const status = animContainer.querySelector('.slot-consensus-status');
  const voters = animContainer.querySelector('.slot-voters-row');

  // Step 1: Wei Gang votes (50%)
  setTimeout(() => {
    if (fill) fill.style.width = '50%';
    if (count) count.textContent = '1/2 Votes (50%)';
    if (status) status.textContent = 'Wei Gang voted';
    if (voters) {
      voters.innerHTML = `
        <span class="voter-chip"><span class="voter-chip__avatar voter-chip__avatar--wg">WG</span> Wei Gang</span>
      `;
    }
    showDashToast('Wei Gang voted for Teochew Chendul (50%)', 'info');

    // Step 2: Tony votes (100%)
    setTimeout(() => {
      if (fill) fill.style.width = '100%';
      if (count) count.textContent = '2/2 Votes (100%)';
      if (status) {
        status.textContent = 'Consensus Reached!';
        status.style.color = '#10B981';
      }
      if (voters) {
        voters.innerHTML += `
          <span class="voter-chip"><span class="voter-chip__avatar voter-chip__avatar--tn">TN</span> Tony</span>
        `;
      }
      showDashToast('Tony voted for Teochew Chendul. Consensus Reached!', 'success');

      // Step 3: Morph card animation
      setTimeout(() => {
        slotElement.classList.remove('consensus-morph-card--proposed');
        slotElement.classList.add('consensus-morph-card--morphing', 'consensus-morph-card--confirmed');

        // Append buffer notice
        const bufferNotice = document.createElement('div');
        bufferNotice.className = 'buffer-recalculation-notice';
        bufferNotice.innerHTML = `
          <div class="buffer-notice-title">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span>Buffers Recalculated</span>
          </div>
          <div class="buffer-notice-details">
            <div class="buffer-notice-item"><span>🚗</span> <strong>GrabCar (12 min)</strong> from Chew Jetty</div>
            <div class="buffer-notice-item"><span>🚠</span> <strong>Transit (25 min)</strong> to Penang Hill</div>
          </div>
        `;
        slotElement.appendChild(bufferNotice);

        // Update block in storage
        const list = getItineraryData();
        const b = list.find(item => item.id === blockId);
        if (b) {
          b.status = 'confirmed';
          b.voteCount = 2;
          b.totalVotes = 2;
          b.transitToNextMinutes = 25;
          b.transitMode = 'Transit (25 min) to Penang Hill';
          updateItineraryBlock(b);
        }

        remoteSync.broadcast('VOTE_CONSENSUS_COMPLETE', { blockId });
        window.dispatchEvent(new CustomEvent('wandersync:vote_consensus', { detail: { blockId } }));
        if (onComplete) onComplete();
      }, 800);
    }, 900);
  }, 700);
}
