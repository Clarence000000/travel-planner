# WanderSync — Collaborative Group Travel Planner

A mobile-first web application designed for friends and travel groups to co-create itineraries, coordinate transit buffers, vote on wishlist spots, and explore AI-powered schedule reshuffling.

---

## 🚀 Getting Started

```bash
npm install
npm run dev
```

---

## 📝 TODO

- [x] Fix repeating tags in itinerary
- [x] Fix itinerary after dragging so that it changes time
- [x] Improve itinerary readability and flow (currently difficult to follow)
- [x] Auto-scroll while dragging card down/up near viewport edges
- [x] Allow trip planner renaming (Integrated into Onboarding Destination & Header)
- [ ] Make assistant more coherent instead of random:
  - [ ] Show imported IG reels in assistant
  - [ ] Allow users to enter interests
  - [ ] Classify and recommend activities from chat threads
- [x] Organise chat threads so they are categorised (Food, Location, Hotel, etc.) instead of just a flat list
- [ ] Update Dashboard Day-of-Trip HUD so that it is only active on the actual day of the trip, with main focus activity only

### UI / UX & Quality Audit

#### Global Shell & Layout
- [x] AI: Fix undefined CSS variable for bottom navigation shadow (`--shadow-nav` missing in `tokens.css`, leaving bottom nav without elevation).
- [ ] AI: Fix missing background pattern assets causing network 404 errors across views (`bg-itinerary.png`, `bg-chat.png`, `bg-assistant.png`, `bg-dashboard.png` in `layout.css`).
- [ ] AI: Fix undersized touch targets on top header action buttons (38px × 38px, below 44px × 44px mobile touch guideline).
- [ ] AI: Fix header title text overflow on compact viewports (lacks truncation rules, causes wrapping and crowding on 320px–360px screens).
- [ ] AI: Fix double view re-render and DOM thrashing on bottom navigation clicks (`setActiveTab` invoked both directly and via `hashchange`, causing visual flicker and duplicate renders).
- [ ] AI: Fix undersized touch targets across interactive controls (<44px hit targets on quick thread close, carpool drawer close, QR modal close, chat send, HUD arrival sim, timeline shift arrows, sticky note delete, activity thread launcher).

#### Itinerary View (`#itinerary`)
- [x] AI: Fix inconsistent time formats producing negative transit buffer calculation errors (afternoon blocks using 12-hour values like `02:15` without AM/PM tags, parsed as 2:00 AM and causing erratic negative transit deficit warnings).
- [x] AI: Fix modal DOM accumulation on itinerary tab navigation (`initModals` repeatedly appends status and add block modals to `document.body` without cleanup).
- [x] AI: Fix unstyled drawer close buttons in Status and Add Block modals (`.drawer-close-btn` undefined in CSS, rendering unstyled browser button chrome).
- [x] AI: Fix full timeline re-render and scroll position reset on card detail toggle (expanding card details triggers full `render()` instead of toggling `.is-expanded`, resetting scroll).
- [x] AI: Fix drag-and-drop card reordering causing non-chronological time display (moving cards shifts array positions without updating `startTime`/`endTime`, leaving times out of order and breaking buffers).

#### Chat View (`#chat`)
- [ ] AI: Fix group poll consensus toast disappearing immediately upon render (`showPollToast` immediately overwritten by subsequent `render()` call in `GroupPolls.js`).
- [ ] AI: Fix chat input bar not adhering to mobile sticky layout standards (sits in normal document flow below messages instead of pinned above the bottom navigation bar).
- [x] AI: Fix missing activity metadata in newly created discussion threads (creates generic title and hardcoded "Tokyo" location, ignoring user input).

#### Assistant View (`#assistant`)
- [ ] AI: Relocate toast notice styles out of `ideas.css` into a shared stylesheet (`.toast-notice` used in `AssistantView.js` relies exclusively on `ideas.css`).
- [ ] AI: Fix assistant proposal button state resetting on view switches ("Reshuffle Applied" state reverts to unapplied upon tab re-navigation despite persisted schedule mutations).

#### Ideas & Whiteboard View (`#ideas`)
- [ ] AI: Fix initial whiteboard sticky notes clipping off-screen on mobile (`wn-2` and `wn-4` coordinates cause notes and delete buttons to overflow outside 320px–375px viewports).
- [ ] AI: Fix whiteboard canvas touch-action trapping mobile page scrolling (`touch-action: none` over 460px height blocks page scrolling when touching inside canvas on mobile).
- [ ] AI: Support 'sightseeing' category styling on itinerary promotion (promoted sightseeing items have no styles or icon mappings in `itinerary.css` or `ItineraryView.js`).
- [ ] AI: Add broken image fallback handling for external wishlist cards (external Unsplash URLs lack `onerror` handlers or placeholder fallbacks).

#### Dashboard View (`#dashboard`)
- [ ] AI: Fix dangling Escape key listeners when closing modals via backdrop or button (listeners on `document` only removed on Escape key press, leaking event listeners).
- [ ] AI: Prevent background page scrolling when opening Carpool drawer or QR pass (modals do not lock background scroll, allowing background page to bounce and scroll).
- [ ] AI: Add accessible label for HUD destination arrival simulation button (icon-only button with only `title` attribute, leaving touch users without a visible indication of action).
