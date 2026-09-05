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
- [ ] Allow trip planner renaming
- [ ] Make assistant more coherent instead of random:
  - [ ] Show imported IG reels in assistant
  - [ ] Allow users to enter interests
  - [ ] Classify and recommend activities from chat threads
- [ ] Organise chat threads so they are categorised (Food, Location, Hotel, etc.) instead of just a flat list
- [ ] Update Dashboard Day-of-Trip HUD so that it is only active on the actual day of the trip, with main focus activity only
