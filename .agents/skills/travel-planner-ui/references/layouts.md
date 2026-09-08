# Page Layouts — Apple iOS 26 "Liquid Glass"

This document defines the layout architecture and the 5 primary views of the
Travel Planner application: **Itinerary**, **Chat**, **Assistant**, **Ideas**, and **Dashboard**.

---

## Base HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="theme-color" content="#F5F0E8" />
  <title>WanderSync — Travel Planner</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="./src/styles/tokens.css" />
  <link rel="stylesheet" href="./src/styles/base.css" />
  <link rel="stylesheet" href="./src/styles/layout.css" />
  <link rel="stylesheet" href="./src/styles/components.css" />
  <link rel="stylesheet" href="./src/styles/itinerary.css" />
  <link rel="stylesheet" href="./src/styles/ideas.css" />
</head>
<body>
  <div id="app"></div>
  <script type="module" src="./src/app.js"></script>
</body>
</html>
```

---

## App Shell Layout Architecture

```
┌──────────────────────────────────────────────────────────┐  top: 0
│  .app-shell__top-guard (fixed, h: 14px, z: 39)           │  (Masks content bleeding above banner)
├──────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────┐  │  top: 12px
│  │ .view-banner (sticky, h: 124px, r: 28px, z: 40)    │  │  (Sticky cat photo banner + menu btn)
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  .main-content (window scroll container)                 │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Active View Body (Day chips, Feed, Cards)          │  │
│  │                                                    │  │
│  │                                                    │  │
│  │ .nav-spacer (h: nav-height + safe-area + 32px)     │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │  bottom: 12px
│  │ .bottom-nav (fixed dock, h: 66px, r: 32px, z: 100) │  │  (5-tab liquid glass dock)
│  └────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────┤
│  .app-shell__bottom-guard (fixed, h: 14px, z: 90)        │  bottom: 0
└──────────────────────────────────────────────────────────┘  (Masks content bleeding below dock)
```

### Dynamic Background Wallpapers

The `.app-shell` updates its background pattern dynamically via `data-active-tab`:

```css
.app-shell[data-active-tab="itinerary"] {
  background-image: 
    linear-gradient(180deg, rgba(245, 240, 232, 0.82) 0%, rgba(245, 240, 232, 0.92) 100%),
    url('../assets/bg-itinerary.png');
  background-repeat: repeat;
  background-size: 240px auto;
  background-position: top center;
  background-attachment: fixed;
}
```

The fixed occlusion guards (`.app-shell__top-guard`, `.app-shell__bottom-guard`) replicate these exact background declarations, ensuring that content scrolling behind them is occluded seamlessly without visual seams.

---

## 1. Itinerary View (Master Timeline)

- **Banner**: Contextual badge (`Tokyo • Day X of 3`) and clean view title (`Trip Itinerary`) over `bg-itinerary.png`.
- **Day Selector**: Horizontally scrollable chip row (Day 1 Tokyo, Day 2 Kyoto, Day 3 Shibuya).
- **Transit Buffer Alerts**: Displays warnings when consecutive blocks have deficit travel windows.
- **Timeline Feed**: Draggable cards connected by a vertical electric blue spine (`#2563EB`) with clear white node pins.
- **Card States**:
  - *Collapsed State*: Clean summary with time, category tag, title, and chevron.
  - *Expanded State*: Horizontal split layout with left summary strip and right detail panel containing circular venue illustration SVG, notes, cost, and drag grip.
- **Drag & Drop Auto-Scrolling**: Dragging cards near the top or bottom viewport edges triggers instant responsive auto-scrolling via `window.scrollBy`.

---

## 2. Chat View (Per-Activity Discussions)

- **Banner**: `📦 Boxed Buddies Chat` (`bg-chat.png`).
- **Threads Hub**: Filter chips (All Threads, Day 1, Day 2, Active Polls) with liquid glass thread summary cards.
- **Active Thread Conversation**: Back navigation button, member list, attached activity polls with interactive voting, message bubble feed, and floating glass message input bar.

---

## 3. Assistant View (AI Schedule Assistant)

- **Banner**: `✨ Smiling Copilot` (`bg-assistant.png`).
- **Schedule Diagnostics**: Real-time pace indicators (Relaxed, Balanced, Packed) and route optimization suggestions.
- **Interactive Proposals**: Glass scenario cards proposing buffer extensions or activity swaps, with one-click Accept/Reject actions.

---

## 4. Ideas View (Wishlist & Whiteboard)

- **Banner**: `💡 Creative Workshop` (`bg-chat.png`).
- **Segmented Control**: Floating glass dock toggling between **Wishlist Grid** and **Notes Whiteboard**.
- **Wishlist Cards**: High-priority user destination ideas with upvoting counters and tags.
- **Pastel Glass Sticky Notes**: Translucent notes (yellow, pink, green, blue) that float over the underlying cat wallpaper with subtle tilt angles.

---

## 5. Dashboard View (Now & Next Live HUD)

- **Banner**: `🐾 Cozy Live HUD` (`bg-dashboard.png`).
- **Now & Next Cards**: Real-time card showing current active stop, time remaining, and immediate next destination.
- **Live Transit Directions**: Step-by-step subway/walking guidance cards with line badges and countdowns.
- **Shift Toolbar**: Quick buttons to bump schedule forward/backward (+15m, +30m) with cascading recalculation.
- **Checklist**: Pre-departure preparation checklist with interactive checkboxes.
