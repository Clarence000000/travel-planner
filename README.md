# WanderSync — Mobile Travel Planner Prototype

A mobile-only web application prototype built for the Travel Planner platform, strictly following the design system tokens defined in `.agents/skills/travel-planner-ui`.

---

## 📱 Mobile Architecture & Layout

- **Strictly Mobile-Only Layout**: Centered mobile viewport container (max `430px`), optimized for mobile devices (`375px`, `390px`, `430px` viewports) with safe area inset padding (`env(safe-area-inset-bottom)`).
- **Sticky Top Bar**: Brand logo, trip subtitle, and notification badge.
- **Fixed Bottom Tab Navigation**: Persistent 4-tab bottom navigation with active burnt orange (`#E8621A`) indicator.
- **Dynamic View Switcher**: Instant switching between the 4 core feature tabs with hash synchronization (`#itinerary`, `#chat`, `#assistant`, `#dashboard`).

---

## 🧭 Core Feature Navigation Tabs

### 1. 📅 Itinerary (Drag-and-Drop Itinerary)
- Chronological time block cards categorized into **Activities**, **Meals**, **Transit**, and **Rest**.
- **Slot Status Lifecycle**:
  - 🟢 **Confirmed**: Booked or locked in.
  - 🟡 **Proposed**: Awaiting consensus.
  - 🟠 **Weather Permitting**: Contingent with fallback options.
- **Transit Buffer Alerts**: Visual warnings when allocated transit time is unrealistic.
- Per-slot requirement tags (e.g. passport check, dress codes).

### 2. 💬 Chat (Per-Activity Chat Threads)
- **Topic-Focused Contextual Threading**: Dedicated discussion threads anchored directly to individual itinerary events.
- **Native Mini-Polls**: Quick voting blocks (e.g., choice between lunch spots) with real-time percentage indicators.
- Thread selector chips for switching between active event discussions.

### 3. ✨ Assistant (AI Schedule Assistant)
- **AI Copilot Box**: Natural language input with hashtag (`#`) commands (`#poll`, `#optimize-buffers`, `#dietary-check`).
- **Pace Optimizer**: Intensity selectors (Chill & Relaxed, Balanced Pace, Turbo Explorer).
- **Reshuffle Proposal Card**: Auto-adjusts outdoor activities based on weather forecasts and pace.

### 4. ⚡ Dashboard ("Now & Next" Live Dashboard)
- **"NOW" Active Spot HUD**: Current location, remaining time countdown, and quick links to maps and QR ticket passes.
- **"NEXT" Upcoming Card**: Next-up transit step with train line, route duration, and countdown.
- **1-Tap Schedule Shift**: Delay entire schedule by `+30 Mins` or `+1 Hour` with automatic non-fixed activity adjustment.
- **Daily Preparation Checklist**: Pre-departure essentials checklist (power bank, local cash, walking shoes).

### 5. 🌟 Onboarding & Multi-Step Trip Synthesis
- **Step 1: Destination & Duration**: Autocomplete search + quick city chips (Tokyo, Seoul, Taipei, Paris, Rome) and duration presets (3D Weekend, 5D Standard, 7D Week). Trip renaming propagates live to the app header.
- **Step 2: Vibe, Pace & Group Wishlist Anchoring**: Primary focus (Food, Shrines/Culture, Modern City, Scenic Trails), pace selectors (Chill, Balanced, High Energy), party chips, and a native **Wishlist Anchor toggle** pulling top-voted ideas as core schedule stops.
- **Alternative: Reels / TikTok Import**: Extracts detected spots from social media video URLs, scheduling the hero venue in Day 1 and saving candidate secondary spots to the Trip Wishlist.
- **Step 3: Trip Reveal Summary Sheet**: Presents a synthesis overview featuring Trip DNA tags, 3-day snapshots, anchored highlight badges, and immediate *Explore Full Itinerary* or *Adjust Preferences* actions.
- **Post-Generation Ecosystem Propagation**:
  - **Itinerary**: Slots top-voted wishlist and reel spots with clean SVG origin badges (`Wishlist Anchor (X votes)`, `From Social Reel`).
  - **Wishlist**: Tracks scheduled status (`Scheduled Day X`) with direct links to the timeline.
  - **Visual Standards**: Pure inline SVGs throughout all badges, chips, and modals (zero emojis).

---

## 📁 File Structure

```
travel-planner/
├── index.html                 # Mobile-only HTML shell
├── package.json               # Dev server configuration
├── README.md                  # Prototype documentation
└── src/
    ├── app.js                 # Mobile shell controller & tab router
    ├── config/
    │   └── navigation.js      # Tab definitions & state management
    ├── components/
    │   ├── Header.js          # Mobile sticky top header
    │   └── BottomNav.js       # Fixed 4-tab bottom navigation bar
    ├── views/
    │   ├── ItineraryView.js   # Drag-and-drop itinerary time blocks & buffer alert
    │   ├── ChatView.js        # Per-activity chat threads & mini-polls
    │   ├── AssistantView.js   # AI copilot & pace adjuster
    │   └── DashboardView.js   # Now & Next live HUD & 1-tap schedule shift
    └── styles/
        ├── tokens.css         # Design tokens from travel-planner-ui
        ├── base.css           # Global reset & accessibility
        ├── layout.css         # Mobile-only container & fixed tab bar styles
        └── components.css     # Timeline blocks, chat cards, and HUD styling
```

---

## 🚀 Running the Prototype

### Option A: Static Web Browser (Zero Tooling)
Open `index.html` with VS Code Live Server or any static HTTP server.

### Option B: Local Dev Server (Vite)
```bash
npm install
npm run dev
```

---

## 📝 TODO

- [ ] Fix repeating tags in itinerary
- [ ] Fix itinerary after dragging so that it changes time
- [ ] Improve itinerary readability and flow (currently difficult to follow)
- [x] Allow trip planner renaming (Integrated into Onboarding Destination & Header)
- [ ] Make assistant more coherent instead of random:
  - [ ] Show imported IG reels in assistant
  - [ ] Allow users to enter interests
  - [ ] Classify and recommend activities from chat threads
- [ ] Organise chat threads so they are categorised (Food, Location, Hotel, etc.) instead of just a flat list
- [ ] Update Dashboard Day-of-Trip HUD so that it is only active on the actual day of the trip, with main focus activity only

### UI / UX & Quality Audit

#### Global Shell & Layout
- [ ] AI: Fix undefined CSS variable for bottom navigation shadow (`--shadow-nav` missing in `tokens.css`, leaving bottom nav without elevation).
- [ ] AI: Fix missing background pattern assets causing network 404 errors across views (`bg-itinerary.png`, `bg-chat.png`, `bg-assistant.png`, `bg-dashboard.png` in `layout.css`).
- [ ] AI: Fix undersized touch targets on top header action buttons (38px × 38px, below 44px × 44px mobile touch guideline).
- [ ] AI: Fix header title text overflow on compact viewports (lacks truncation rules, causes wrapping and crowding on 320px–360px screens).
- [ ] AI: Fix double view re-render and DOM thrashing on bottom navigation clicks (`setActiveTab` invoked both directly and via `hashchange`, causing visual flicker and duplicate renders).
- [ ] AI: Fix undersized touch targets across interactive controls (<44px hit targets on quick thread close, carpool drawer close, QR modal close, chat send, HUD arrival sim, timeline shift arrows, sticky note delete, activity thread launcher).

#### Itinerary View (`#itinerary`)
- [ ] AI: Fix inconsistent time formats producing negative transit buffer calculation errors (afternoon blocks using 12-hour values like `02:15` without AM/PM tags, parsed as 2:00 AM and causing erratic negative transit deficit warnings).
- [ ] AI: Fix modal DOM accumulation on itinerary tab navigation (`initModals` repeatedly appends status and add block modals to `document.body` without cleanup).
- [ ] AI: Fix unstyled drawer close buttons in Status and Add Block modals (`.drawer-close-btn` undefined in CSS, rendering unstyled browser button chrome).
- [ ] AI: Fix full timeline re-render and scroll position reset on card detail toggle (expanding card details triggers full `render()` instead of toggling `.is-expanded`, resetting scroll).
- [ ] AI: Fix drag-and-drop card reordering causing non-chronological time display (moving cards shifts array positions without updating `startTime`/`endTime`, leaving times out of order and breaking buffers).

#### Chat View (`#chat`)
- [ ] AI: Fix group poll consensus toast disappearing immediately upon render (`showPollToast` immediately overwritten by subsequent `render()` call in `GroupPolls.js`).
- [ ] AI: Fix chat input bar not adhering to mobile sticky layout standards (sits in normal document flow below messages instead of pinned above the bottom navigation bar).
- [ ] AI: Fix missing activity metadata in newly created discussion threads (creates generic title and hardcoded "Tokyo" location, ignoring user input).

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

