# WanderSync — Project Task & Implementation Backlog

This document consolidates all current, prioritized development tasks for WanderSync, omitting obsolete internal audit checklists.

---

## 🚀 High Priority (Demo Flow & User Experience)

- [ ] **Dynamic Date Range & Day Management**
  - Replace rigid `3 / 5 / 7 Days` duration presets in Onboarding with flexible calendar start & end date pickers.
  - Support arbitrary trip lengths (e.g. 2, 4, 6 days) and provide an easy `+ Add Day` / `✕ Remove Day` control directly on the Itinerary day switcher.
- [ ] **Interactive Demo Simulation Engine (`DEMO_FLOW.md`)**
  - Implement a progressive demo mode starting from a clean zero-state.
  - Simulate incoming collaboration: friends joining, shared reels incoming, live group chat messages, and poll resolution.
  - Provide a subtle demo controller (Next Step / Reset) for flawless presentation delivery.
- [ ] **Event Cancellation & Schedule Reflow**
  - Add `Cancel Event` option inside the Status Lifecycle Modal and expanded card actions.
  - Provide dual cancellation handling:
    1. *Free-Time Pocket*: Mark card as cancelled/strikethrough without shifting later reservations.
    2. *Schedule Reflow*: Remove the block and smoothly shift subsequent blocks forward while recalculating transit buffers.
- [ ] **Social Media / Reels Spotlight on Itinerary & Wishlist**
  - Display distinctive gradient "Imported from Reel" badge on both Wishlist items and scheduled Itinerary blocks.
  - Add quick "Watch Reel Preview" modal showing video thumbnail and creator handle.
- [ ] **Dedicated "Live Day HUD" Mode**
  - Accessible via Sidebar or Day 1 header action.
  - Strips away planning clutter to present a hyper-focused execution HUD: Current Venue countdown, Next Transit line, 1-tap QR Pass, and Quick Delay Shifts (`+30m` / `+1h`).
- [ ] **Sidebar Decluttering & Reorganization**
  - Remove duplicate bottom-tab navigation chips from the sidebar drawer.
  - Add **Trip Appearance**: Curated cover presets (*Tokyo Neon*, *Kyoto Bamboo*, *Mount Fuji Sunrise*) and custom image URL support.
  - Add **AI Preferences & Reshuffle**: Relocate pacing slider and weather contingency reshuffling into a streamlined drawer.
  - Add **Threads Hub**: Quick access to all contextual discussions and mini-polls.

---

## 🎨 Visual & Interaction Polish

- [ ] **Pill & Chip Hover Contrast**: Fix hovered state on highlighted orange/amber status pills so text remains readable (currently turning white on white).
- [ ] **Contextual Card Discussion Trigger**: Ensure every itinerary card and wishlist item has an intuitive `💬 Chat` action opening its specific thread drawer.
- [ ] **Responsive Padding & Safe Areas**: Ensure top header and bottom controls maintain 44px+ touch targets and respect mobile device home indicators.

---

## 🔮 Future Backlog (Post-Hackathon)

- [ ] Real-time WebSocket sync via Supabase Realtime / Firebase.
- [ ] Shared group bill splitter with debt simplification.
- [ ] Interactive offline mode with ServiceWorker caching for transit passes.
- [ ] Multi-platform export (Google Calendar sync and Apple Wallet passes).
