# Component Library — Apple iOS 26 "Liquid Glass"

This document contains all reusable UI components for the Travel Planner app.
Every component is styled with Apple's iOS 26 **"Liquid Glass"** design language:
frosted glass surfaces, light-refractive borders, top specular highlights, and squircle corner curvature.

---

## Table of Contents

1. [App Shell & Viewport Occlusion Guards](#1-app-shell--viewport-occlusion-guards)
2. [Atmospheric Sticky Cat Photo Header Banner](#2-atmospheric-sticky-cat-photo-header-banner)
3. [Slide-Out Liquid Glass Sidebar Drawer](#3-slide-out-liquid-glass-sidebar-drawer)
4. [Floating Liquid Glass Bottom Dock Bar](#4-floating-liquid-glass-bottom-dock-bar)
5. [Itinerary Timeline Cards (Collapsed & Expanded)](#5-itinerary-timeline-cards-collapsed--expanded)
6. [Transit Buffer Connectors & Node Pins](#6-transit-buffer-connectors--node-pins)
7. [Per-Activity Chat Threads & Glass Bubbles](#7-per-activity-chat-threads--glass-bubbles)
8. [AI Schedule Assistant Optimizer Cards](#8-ai-schedule-assistant-optimizer-cards)
9. [Ideas Wishlist & Pastel Glass Sticky Notes](#9-ideas-wishlist--pastel-glass-sticky-notes)
10. [Live HUD Dashboard Cards & Transit Steps](#10-live-hud-dashboard-cards--transit-steps)
11. [Liquid Glass Modals & Sheets](#11-liquid-glass-modals--sheets)
12. [Buttons, Chips & Form Controls](#12-buttons-chips--form-controls)

---

## 1. App Shell & Viewport Occlusion Guards

The root container centers the mobile experience (`max-width: 430px`) and renders page-specific cat wallpapers with fixed background attachments. Fixed top and bottom occlusion guards prevent scrolled content from bleeding into the margins above the cat photo banner or below the floating navigation dock.

```html
<div class="app-shell" data-active-tab="itinerary">
  <!-- Fixed Occlusion Guards -->
  <div class="app-shell__top-guard" aria-hidden="true"></div>
  <div class="app-shell__bottom-guard" aria-hidden="true"></div>

  <!-- Main Content Feed -->
  <main class="main-content" id="main-content" role="main">
    <div id="active-view-container">
      <!-- Active Tab View (renders .view-banner + feed) -->
    </div>
    <div class="nav-spacer"></div>
  </main>

  <!-- Floating Bottom Dock Bar -->
  <nav class="bottom-nav">...</nav>
</div>
```

```css
.app-shell {
  width: 100%;
  max-width: var(--mobile-max-width);
  min-height: 100dvh;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background);
  position: relative;
  box-shadow: 0 0 36px rgba(0, 0, 0, 0.08);
  transition: background-image var(--transition-base);
}

/* Fixed Viewport Guards */
.app-shell__top-guard,
.app-shell__bottom-guard {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: var(--mobile-max-width);
  pointer-events: none;
  background-color: var(--color-background);
  background-repeat: repeat;
  background-position: top center;
  background-attachment: fixed;
  transition: background-image var(--transition-base);
}

.app-shell__top-guard {
  top: 0;
  height: 14px;
  z-index: 39;
}

.app-shell__bottom-guard {
  bottom: 0;
  height: 14px;
  z-index: 90;
}

.nav-spacer {
  height: calc(var(--nav-height) + env(safe-area-inset-bottom, 0px) + var(--space-8));
  width: 100%;
  flex-shrink: 0;
}
```

---

## 2. Atmospheric Sticky Cat Photo Header Banner

A floating card sticky at `top: 12px` that features the page's cat artwork, an overlay scrim, a luminous badge, and a frosted glass circular menu button.

```html
<div class="view-banner" style="background-image: url('./src/assets/bg-itinerary.png');">
  <button type="button" class="view-banner__menu-btn" id="btn-open-sidebar" aria-label="Open Trip Menu">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  </button>
  <div class="view-banner__scrim">
    <span class="view-banner__badge">🐱 Interactive Master Timeline</span>
    <h2 class="view-banner__title">Drag-and-Drop Itinerary</h2>
  </div>
</div>
```

```css
.view-banner {
  width: calc(100% + 16px);
  margin-left: -8px;
  margin-right: -8px;
  height: 124px;
  border-radius: 28px;
  background-size: cover;
  background-position: center;
  overflow: hidden;
  position: sticky;
  top: 12px;
  z-index: 40;
  box-shadow: 
    0 14px 36px rgba(15, 23, 42, 0.13),
    inset 0 1px 1.5px rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.88);
  background-color: #FAF5EE;
  margin-bottom: var(--space-4);
}

.view-banner__menu-btn {
  position: absolute;
  top: 10px;
  left: 12px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.92);
  color: #1E293B;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(18px) saturate(180%);
  -webkit-backdrop-filter: blur(18px) saturate(180%);
  z-index: 10;
}
```

---

## 3. Slide-Out Liquid Glass Sidebar Drawer

Translucent frosted glass drawer panel with 32px blur and soft depth-backdrop. Houses Trip Management links, quick view chips, and notification glass cards.

```html
<div class="sidebar-container" id="sidebar-container">
  <div class="sidebar-backdrop" id="sidebar-backdrop"></div>
  <aside class="sidebar-drawer">
    <div class="sidebar-header">
      <div>
        <span class="sidebar-header__badge">TOKYO 2026</span>
        <h2 class="sidebar-header__title">Summer Tour</h2>
        <span class="sidebar-header__subtitle">Aug 14 – Aug 20 • 6 Days</span>
      </div>
      <button class="sidebar-close-btn" id="sidebar-close-btn">✕</button>
    </div>
    <div class="sidebar-body">
      <!-- Continuous Squircle Card Item -->
      <button class="sidebar-item">
        <div class="sidebar-item__icon sidebar-item__icon--primary">⚙️</div>
        <div class="sidebar-item__text">
          <span class="sidebar-item__title">Trip Setup & Import</span>
          <span class="sidebar-item__desc">Configure schedule, dates, flights</span>
        </div>
      </button>
    </div>
  </aside>
</div>
```

```css
.sidebar-drawer {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 320px;
  max-width: 86vw;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.74) 0%,
    rgba(255, 255, 255, 0.54) 50%,
    rgba(255, 255, 255, 0.70) 100%
  );
  backdrop-filter: blur(32px) saturate(200%) contrast(96%);
  -webkit-backdrop-filter: blur(32px) saturate(200%) contrast(96%);
  border-top-right-radius: 28px;
  border-bottom-right-radius: 28px;
  border-right: 1px solid rgba(255, 255, 255, 0.88);
  box-shadow: 
    16px 0 48px rgba(15, 23, 42, 0.14),
    inset 0 1px 1.5px rgba(255, 255, 255, 1);
  transform: translateX(-100%);
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

---

## 4. Floating Liquid Glass Bottom Dock Bar

Positioned at `bottom: 12px`, featuring 5 tabs. Active tab glows in an illuminated frosted glass capsule.

```html
<nav class="bottom-nav">
  <button class="bottom-nav__tab bottom-nav__tab--active">
    <div class="bottom-nav__icon"><svg>...</svg></div>
    <span class="bottom-nav__label">Itinerary</span>
  </button>
  <button class="bottom-nav__tab">
    <div class="bottom-nav__icon"><svg>...</svg></div>
    <span class="bottom-nav__label">Chat</span>
  </button>
  <!-- Assistant, Ideas, Dashboard tabs -->
</nav>
```

```css
.bottom-nav {
  position: fixed;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 24px);
  max-width: calc(var(--mobile-max-width) - 24px);
  height: 66px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.70) 0%,
    rgba(255, 255, 255, 0.46) 50%,
    rgba(255, 255, 255, 0.65) 100%
  );
  backdrop-filter: blur(28px) saturate(210%) contrast(96%);
  -webkit-backdrop-filter: blur(28px) saturate(210%) contrast(96%);
  border: 1px solid rgba(255, 255, 255, 0.92);
  border-radius: 32px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: var(--z-nav);
  box-shadow: 
    0 16px 40px rgba(15, 23, 42, 0.14),
    inset 0 1.5px 2px rgba(255, 255, 255, 1);
}

.bottom-nav__tab--active {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 247, 237, 0.75) 100%);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 14px rgba(232, 98, 26, 0.16), inset 0 1px 1.5px #FFFFFF;
  color: var(--color-primary);
}
```

---

## 5. Itinerary Timeline Cards (Collapsed & Expanded)

Features both collapsed summary mode and expanded horizontal split view with circular venue illustration art.

```html
<article class="timeline-card timeline-card--horizontal-split">
  <!-- Left Strip: Time, category tag, chevron, chat badge -->
  <div class="timeline-card__strip">
    <span class="timeline-time">8:45 PM – 9:45 PM</span>
    <span class="category-tag category-tag--rest">REST</span>
    <button class="timeline-card__chevron-btn" aria-label="Toggle details">
      <svg class="chevron-icon rotate-180">...</svg>
    </button>
  </div>

  <!-- Right Detail Panel: Title, circular venue icon, cost, drag grip -->
  <div class="timeline-card__detail-panel">
    <div class="detail-panel__header">
      <div class="detail-panel__photo-wrapper">
        <svg class="venue-circle-svg">...</svg>
      </div>
      <h3 class="timeline-title">Hotel Check-In & Luggage Drop</h3>
    </div>
    <div class="detail-panel__footer">
      <span class="timeline-cost">¥0</span>
      <div class="drag-grip" aria-label="Drag handle">:::</div>
    </div>
  </div>
</article>
```

```css
.timeline-card {
  position: relative;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.76) 0%, rgba(255, 255, 255, 0.58) 100%);
  backdrop-filter: blur(24px) saturate(190%) contrast(96%);
  -webkit-backdrop-filter: blur(24px) saturate(190%) contrast(96%);
  border: 1px solid rgba(255, 255, 255, 0.88);
  border-radius: 20px;
  box-shadow: 
    0 8px 24px rgba(15, 23, 42, 0.06),
    inset 0 1px 1.5px rgba(255, 255, 255, 0.95);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}
```

---

## 6. Transit Buffer Connectors & Node Pins

Vertical blue timeline spine (`#2563EB`), clear white circle node pins, and translucent buffer capsules indicating travel transit times between events.

```html
<div class="timeline-node-pin"></div>
<div class="timeline-buffer-connector">
  <div class="timeline-buffer-line"></div>
  <div class="timeline-buffer-tag">
    <svg>...</svg>
    <span>30m Subway (Marunouchi Line)</span>
  </div>
</div>
```

```css
.timeline-node-pin {
  position: absolute;
  left: -28px;
  top: 16px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  border: 3px solid #2563EB;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 0 12px rgba(37, 99, 235, 0.4), inset 0 1px 1px #FFFFFF;
}

.timeline-buffer-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.68);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.86);
  font-size: 11px;
  font-weight: 600;
  color: #1E293B;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 1px #FFFFFF;
}
```

---

## 7. Per-Activity Chat Threads & Glass Bubbles

Chat threads with translucent incoming/outgoing message bubbles and a floating glass input pill bar.

```html
<div class="chat-message chat-message--incoming">
  <div class="user-avatar-initials">AK</div>
  <div class="chat-message__bubble">
    <div class="chat-message__sender">Aki Tanaka</div>
    <p class="chat-message__text">Meet at the Kaminarimon gate by 10:15 AM!</p>
    <span class="chat-message__time">9:42 AM</span>
  </div>
</div>
```

```css
.chat-message__bubble {
  padding: 10px 14px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.82) 0%, rgba(255, 255, 255, 0.62) 100%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.90);
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.05), inset 0 1px 1px #FFFFFF;
}

.chat-message--outgoing .chat-message__bubble {
  background: linear-gradient(135deg, rgba(232, 98, 26, 0.90) 0%, rgba(217, 88, 15, 0.85) 100%);
  color: #FFFFFF;
  border-color: rgba(255, 255, 255, 0.45);
}
```

---

## 8. AI Schedule Assistant Optimizer Cards

Cards displaying AI conflict resolution, pace adjustment buttons, and schedule proposal cards with accept/reject buttons.

```css
.optimizer-card,
.proposal-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.78) 0%, rgba(255, 255, 255, 0.60) 100%);
  backdrop-filter: blur(24px) saturate(190%);
  -webkit-backdrop-filter: blur(24px) saturate(190%);
  border: 1px solid rgba(255, 255, 255, 0.90);
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06), inset 0 1px 1.5px #FFFFFF;
}
```

---

## 9. Ideas Wishlist & Pastel Glass Sticky Notes

Creative workshop wishlist cards and translucent pastel sticky notes (`blur(16px)`) with subtle rotation.

```css
.sticky-note {
  border-radius: 18px;
  padding: 14px;
  backdrop-filter: blur(18px) saturate(170%);
  -webkit-backdrop-filter: blur(18px) saturate(170%);
  border: 1px solid rgba(255, 255, 255, 0.75);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.9);
}

.sticky-note--yellow {
  background: linear-gradient(135deg, rgba(254, 240, 138, 0.65) 0%, rgba(253, 224, 71, 0.45) 100%);
}

.sticky-note--pink {
  background: linear-gradient(135deg, rgba(251, 207, 232, 0.65) 0%, rgba(244, 114, 182, 0.45) 100%);
}
```

---

## 10. Live HUD Dashboard Cards & Transit Steps

Real-time travel widgets: next activity preview, current transit step, checklist cards, and shift toolbars.

```css
.hud-card,
.checklist-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.76) 0%, rgba(255, 255, 255, 0.58) 100%);
  backdrop-filter: blur(24px) saturate(190%);
  -webkit-backdrop-filter: blur(24px) saturate(190%);
  border: 1px solid rgba(255, 255, 255, 0.88);
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06), inset 0 1px 1.5px #FFFFFF;
}
```

---

## 11. Liquid Glass Modals & Sheets

Full-height sheets (`.carpool-sheet`, `.itinerary-modal-sheet`) and alert dialogs (`.qr-modal`, `.onboarding-card`) with 32px frosted glass panels, 28px radii, and specular top highlights.

```css
.modal-content {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.82) 0%, rgba(255, 255, 255, 0.64) 100%);
  backdrop-filter: blur(32px) saturate(200%);
  -webkit-backdrop-filter: blur(32px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.92);
  border-radius: 28px;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.18), inset 0 1px 2px #FFFFFF;
}
```

---

## 12. Buttons, Chips & Form Controls

- **Primary Button (`.btn--primary`)**: Radiant amber-orange gradient (`linear-gradient(135deg, #F97316 0%, #EA580C 100%)`) with top specular shine.
- **Secondary Button (`.btn--secondary`)**: Frosted glass capsule with thin white border.
- **Chips (`.filter-chip`, `.day-chip`)**: Translucent pill badges (`border-radius: 9999px`) with blur and active illumination.
- **Form Inputs (`.form-input`)**: Frosted capsules with inset subtle depth shadow.
