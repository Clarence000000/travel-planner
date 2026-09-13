/**
 * Hashtag Commands Registry and AI mock response generator for Chat.
 */

import { getThreadDay, normalizeCategory } from '../../models/chatData.js';

export const HASHTAG_COMMANDS = [
  {
    id: 'find-food',
    label: '#find-food',
    name: 'Find Nearby Food',
    desc: 'Discover top-rated eateries near this location',
    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>`,
    color: '#D97706',
    bg: '#FEF3C7',
  },
  {
    id: 'find-indoor',
    label: '#find-indoor',
    name: 'Find Indoor Spots',
    desc: 'Indoor alternatives for rainy weather',
    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
    color: '#4F46E5',
    bg: '#EEF2FF',
  },
  {
    id: 'optimize-buffers',
    label: '#optimize-buffers',
    name: 'Optimize Buffers',
    desc: 'Analyze and tighten transit time gaps',
    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
    color: '#0284C7',
    bg: '#E0F2FE',
  },
  {
    id: 'check-weather',
    label: '#check-weather',
    name: 'Check Weather',
    desc: 'Weather forecast and advisory for today',
    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>`,
    color: '#0369A1',
    bg: '#E0F2FE',
  },
  {
    id: 'split-cost',
    label: '#split-cost',
    name: 'Split Group Costs',
    desc: 'Calculate per-person cost breakdown',
    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
    color: '#059669',
    bg: '#D1FAE5',
  },
  {
    id: 'vote',
    label: '#vote',
    name: 'Start Quick Poll',
    desc: 'Create an inline consensus poll',
    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
    color: '#7C3AED',
    bg: '#EDE9FE',
  },
  {
    id: 'summarize',
    label: '#summarize',
    name: 'Summarize Thread',
    desc: 'AI summary of key discussion points',
    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="17" y1="18" x2="3" y2="18"></line></svg>`,
    color: '#E8621A',
    bg: '#FFF3EB',
  },
  {
    id: 'add-to-itinerary',
    label: '#add-to-itinerary',
    name: 'Add to Itinerary',
    desc: 'Propose this spot for the schedule',
    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><line x1="12" y1="14" x2="12" y2="18"></line><line x1="10" y1="16" x2="14" y2="16"></line></svg>`,
    color: '#D85822',
    bg: '#FFF3EB',
  },
];

export function getHashtagCommandResponse(cmdId, thread) {
  const location = thread.location || 'George Town, Penang';
  const day = getThreadDay(thread);
  const dayLabel = day ? `Day ${day}` : 'Trip-Wide';
  const title = thread.title || 'this activity';
  const normCat = normalizeCategory(thread.category);

  const responses = {
    'find-food': {
      title: 'Nearby Food Recommendations',
      badge: 'AI Food Scout',
      text: `Scanning top-rated eateries within 10 minutes of ${location}. Here are 3 picks based on your group's preferences:`,
      items: [
        { name: "Sister Yao's Curry Mee", detail: '4.7★ · RM 8/pax · 5 min walk', tag: 'Michelin Guide' },
        { name: 'Ah Leng Char Koay Teow', detail: '4.5★ · RM 10/pax · 8 min walk', tag: 'Local Favourite' },
        { name: 'Joo Hooi Café Prawn Mee', detail: '4.6★ · RM 9/pax · 3 min Grab', tag: 'Heritage Stall' },
      ],
    },
    'find-indoor': {
      title: 'Indoor Alternatives',
      badge: 'Rain Plan',
      text: `Rain contingency options near ${location} to keep ${dayLabel} on track:`,
      items: [
        { name: 'Penang State Museum', detail: 'Free entry · 1.2 km · Air-conditioned', tag: 'Culture' },
        { name: 'The TOP Penang (Komtar)', detail: 'RM 68/pax · 2 km · Rainbow Skywalk', tag: 'Experience' },
        { name: 'Chowrasta Market Indoor', detail: 'Free · 800m · Local crafts & snacks', tag: 'Shopping' },
      ],
    },
    'optimize-buffers': {
      title: 'Buffer Optimization Report',
      badge: 'Schedule AI',
      text: `Analyzed ${dayLabel} transit gaps around "${title}". Found 2 optimization opportunities:`,
      items: [
        { name: 'Reduce transit buffer', detail: 'Chew Jetty → Chendul: 8 min (was 25 min)', tag: '−17 min saved' },
        { name: 'Compress evening gap', detail: 'Penang Hill → Dinner: 15 min (was 30 min)', tag: '−15 min saved' },
      ],
    },
    'check-weather': {
      title: 'Weather Advisory',
      badge: 'Forecast',
      text: `Weather outlook for ${dayLabel} in Penang:`,
      items: [
        { name: 'Morning (8 AM – 12 PM)', detail: 'Sunny, 31°C · Humidity 72%', tag: 'Clear' },
        { name: 'Afternoon (12 PM – 5 PM)', detail: 'Partly Cloudy, 33°C · 40% rain chance', tag: 'Caution' },
        { name: 'Evening (5 PM – 10 PM)', detail: 'Scattered showers, 28°C', tag: 'Umbrella' },
      ],
    },
    'split-cost': {
      title: 'Group Cost Split',
      badge: 'Budget AI',
      text: `Estimated cost breakdown for "${title}" with 3 travellers:`,
      items: [
        { name: 'Food & Beverages', detail: 'RM 36 total → RM 12 / person', tag: 'RM 12' },
        { name: 'Transport (Grab)', detail: 'RM 15 total → RM 5 / person', tag: 'RM 5' },
        { name: 'Entry Tickets', detail: 'RM 0 (free admission)', tag: 'Free' },
      ],
    },
    'vote': {
      title: 'Quick Poll Created',
      badge: 'Consensus',
      text: `Poll started for the group! Vote on the best option for "${title}":`,
      items: [
        { name: 'Option A — Keep original plan', detail: 'Stick with the current schedule', tag: '0 votes' },
        { name: 'Option B — Swap activity', detail: 'Replace with the AI suggestion', tag: '0 votes' },
        { name: 'Option C — Modify timing', detail: 'Keep activity but shift time slot', tag: '0 votes' },
      ],
    },
    'summarize': {
      title: 'Thread Summary',
      badge: 'AI Summary',
      text: `Key takeaways from the "${title}" discussion:`,
      items: [
        { name: 'Group consensus', detail: 'Everyone prefers a casual dining spot within walking distance', tag: 'Agreed' },
        { name: 'Open question', detail: 'Reservation timing not yet confirmed — needs group vote', tag: 'Pending' },
        { name: 'Action item', detail: 'Clarence to check Grab availability for evening transit', tag: 'To-Do' },
      ],
    },
    'add-to-itinerary': {
      title: 'Itinerary Proposal',
      badge: 'Schedule Insert',
      text: `Ready to add "${title}" to your ${dayLabel} schedule:`,
      items: [
        { name: 'Proposed time slot', detail: day ? `Day ${day}, 12:30 PM – 1:30 PM` : 'Flexible timing', tag: 'Proposed' },
        { name: 'Location', detail: location, tag: normCat },
        { name: 'Status', detail: 'Awaiting group approval (2 votes needed)', tag: 'Pending' },
      ],
    },
  };

  return responses[cmdId] || responses['summarize'];
}
