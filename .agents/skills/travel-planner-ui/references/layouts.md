# Page Layouts

This document defines the three primary page layouts visible in the travel
planner mockup: **Home**, **Detail**, and **Trips**. Each layout specifies the
page structure, content sections, and responsive behavior.

---

## Base HTML Template

Every page begins with this HTML shell:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="theme-color" content="#F5F0E8" />
  <title>Travel Planner</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
    rel="stylesheet"
  />
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="app-shell">
    <div class="app-container">
      <!-- PAGE CONTENT HERE -->
    </div>
  </div>
  <script src="app.js" type="module"></script>
</body>
</html>
```

### Global Reset (include in `styles.css`)

```css
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-family: var(--font-family);
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--color-text-primary);
  background-color: var(--color-background);
}

body {
  min-height: 100dvh;
}

img {
  display: block;
  max-width: 100%;
}

a {
  color: inherit;
  text-decoration: none;
}

button {
  font-family: inherit;
}
```

---

## 1. Home Page

The Home page is the app's landing screen with location selector, search,
country filters, and horizontally scrollable destination cards.

### Structure

```
┌─────────────────────────────┐
│  Top Header                 │  (Location + bell + avatar)
├─────────────────────────────┤
│  Search Bar                 │  (Input + filter button)
├─────────────────────────────┤
│  Filter Chips               │  (Horizontal scroll)
├─────────────────────────────┤
│  Section Header             │  ("Popular Destinations" + "View all")
├─────────────────────────────┤
│  Destination Cards Carousel │  (Horizontal scroll of large cards)
│                             │
│                             │
├─────────────────────────────┤
│  Bottom Navigation          │  (Fixed, "Home" active)
└─────────────────────────────┘
```

### HTML

```html
<div class="app-container">
  <!-- Top Header -->
  <header class="top-header">
    <div class="top-header__location">
      <span class="top-header__label">Location</span>
      <button class="top-header__city">Berlin <span class="top-header__dropdown-icon">▾</span></button>
    </div>
    <div class="top-header__actions">
      <button class="icon-btn" aria-label="Notifications">🔔</button>
      <div class="avatar avatar--sm"><img src="avatar.jpg" alt="User" /></div>
    </div>
  </header>

  <!-- Search -->
  <div class="search-bar">
    <div class="search-bar__input-wrapper">
      <span class="search-bar__icon">🔍</span>
      <input type="search" class="search-bar__input" placeholder="Search" />
    </div>
    <button class="search-bar__filter-btn" aria-label="Filters">⚙</button>
  </div>

  <!-- Country Chips -->
  <div class="chip-row">
    <button class="chip chip--active"><span class="chip__flag">🇩🇪</span> Germany</button>
    <button class="chip"><span class="chip__flag">🇩🇰</span> Denmark</button>
    <button class="chip"><span class="chip__flag">🇸🇪</span> Sweden</button>
  </div>

  <!-- Popular Destinations -->
  <div class="section-header">
    <h2 class="section-header__title">Popular Destinations</h2>
    <a href="#" class="section-header__link">View all ›</a>
  </div>

  <div class="card-carousel" id="destinations-carousel">
    <!-- Destination cards rendered here -->
  </div>

  <!-- Spacer for bottom nav -->
  <div class="nav-spacer"></div>

  <!-- Bottom Nav -->
  <nav class="bottom-nav" aria-label="Main navigation">
    <a href="/" class="bottom-nav__tab bottom-nav__tab--active">🏠 <span>Home</span></a>
    <a href="/tracks" class="bottom-nav__tab">🧭 <span>Tracks</span></a>
    <a href="/trips" class="bottom-nav__tab">🎒 <span>Trips</span></a>
    <a href="/more" class="bottom-nav__tab">⋯ <span>More</span></a>
    <a href="/settings" class="bottom-nav__tab">⚙ <span>Settings</span></a>
  </nav>
</div>
```

### Carousel CSS

```css
.card-carousel {
  display: flex;
  gap: var(--space-4);
  padding: 0 var(--page-padding);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-overflow-scrolling: touch;
}

.card-carousel::-webkit-scrollbar {
  display: none;
}

.card-carousel > .destination-card {
  scroll-snap-align: start;
}

.nav-spacer {
  height: calc(var(--nav-height) + var(--space-4));
}
```

---

## 2. Detail Page

The destination detail page has a large hero image at the top, scrollable
content below, and no bottom navigation (replaced by the back/heart header
overlay).

### Structure

```
┌─────────────────────────────┐
│  Hero Image                 │  (Full-width illustrated image)
│  ┌───┐              ┌───┐  │
│  │ ← │              │ ♡ │  │  (Detail header overlay)
│  └───┘              └───┘  │
├─────────────────────────────┤
│  Destination Title + Country│
├─────────────────────────────┤
│  Description Text           │
├─────────────────────────────┤
│  Map Embed                  │
├─────────────────────────────┤
│  Weather Widget             │  (Condition + time + temperature)
├─────────────────────────────┤
│  Amenity Tags               │  (Ticket, Hotel, Meal)
├─────────────────────────────┤
│  Author / Reviewer Row      │  (Avatar + name + rating)
└─────────────────────────────┘
```

### HTML

```html
<div class="app-container detail-page">
  <!-- Hero -->
  <div class="detail-hero">
    <img src="sunny-ridge-farm.jpg" alt="Sunny Ridge Farm" class="detail-hero__image" />
    <header class="detail-header">
      <button class="icon-btn icon-btn--round" aria-label="Go back">←</button>
      <button class="icon-btn icon-btn--round" aria-label="Favorite">♡</button>
    </header>
  </div>

  <!-- Content Sheet -->
  <div class="detail-sheet">
    <h1 class="detail-sheet__title">Sunny Ridge Farm</h1>
    <p class="detail-sheet__country">🇩🇪 Germany</p>
    <p class="detail-sheet__description">
      Fictional countryside gem surrounded by windmills, lakes, and soft green hills.
    </p>

    <!-- Map -->
    <div class="map-embed">
      <img src="map.png" alt="Route map" class="map-embed__img" />
    </div>

    <!-- Weather -->
    <div class="weather-widget">
      <div class="weather-widget__condition">🌧 <span>Rainy</span></div>
      <span class="weather-widget__time">8:40 AM</span>
      <span class="weather-widget__temp">32<sup>°C</sup></span>
    </div>

    <!-- Amenities -->
    <div class="amenity-tags">
      <span class="amenity-tag">🎫 Ticket</span>
      <span class="amenity-tag">🏨 Hotel</span>
      <span class="amenity-tag">🍴 Meal</span>
    </div>

    <!-- Author -->
    <div class="author-row">
      <div class="avatar avatar--sm"><img src="james.jpg" alt="James Kir" /></div>
      <span class="author-row__name">By James Kir</span>
      <div class="author-row__rating">
        <span class="author-row__star">★</span>
        <span class="author-row__value">4.9</span>
      </div>
    </div>
  </div>
</div>
```

### Detail Page CSS

```css
.detail-page {
  background: var(--color-surface);
}

.detail-hero {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: var(--color-surface-alt);
}

.detail-hero__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-sheet {
  position: relative;
  margin-top: -var(--space-6);
  background: var(--color-surface);
  border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
  padding: var(--space-6) var(--page-padding);
  padding-bottom: var(--space-10);
}

.detail-sheet__title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.detail-sheet__country {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-4);
}

.detail-sheet__description {
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-5);
}
```

---

## 3. Trips Page

Grid-based listing of the user's trips, presented in a 2-column grid.

### Structure

```
┌─────────────────────────────┐
│  Top Header                 │  (Location + bell + avatar)
├─────────────────────────────┤
│  Search Bar                 │
├─────────────────────────────┤
│  Section Header             │  ("My Trips" + "View all")
├─────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ │
│  │ Trip Card│ │ Trip Card│ │
│  └──────────┘ └──────────┘ │
│  ┌──────────┐ ┌──────────┐ │
│  │ Trip Card│ │ Trip Card│ │
│  └──────────┘ └──────────┘ │
│         ...                 │
├─────────────────────────────┤
│  Bottom Navigation          │  (Fixed, "Trips" active)
└─────────────────────────────┘
```

### HTML

```html
<div class="app-container">
  <!-- Top Header (same as Home) -->
  <header class="top-header">...</header>

  <!-- Search (same as Home) -->
  <div class="search-bar">...</div>

  <!-- My Trips Section -->
  <div class="section-header">
    <h2 class="section-header__title">My Trips</h2>
    <a href="#" class="section-header__link">View all ›</a>
  </div>

  <div class="trips-grid">
    <article class="trip-card">...</article>
    <article class="trip-card">...</article>
    <article class="trip-card">...</article>
    <article class="trip-card">...</article>
  </div>

  <div class="nav-spacer"></div>

  <nav class="bottom-nav" aria-label="Main navigation">
    <!-- "Trips" tab has bottom-nav__tab--active -->
  </nav>
</div>
```

---

## Responsive Breakpoints

### Tablet (≥ 768px)

```css
@media (min-width: 768px) {
  .app-container {
    max-width: 768px;
    border-left: 1px solid var(--color-border);
    border-right: 1px solid var(--color-border);
  }

  .trips-grid {
    grid-template-columns: 1fr 1fr 1fr;   /* 3 columns on tablet */
  }

  .destination-card {
    width: 280px;
  }
}
```

### Desktop (≥ 1024px)

```css
@media (min-width: 1024px) {
  .app-container {
    max-width: 430px;   /* Stay phone-width, centered */
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.1);
    border-radius: var(--radius-2xl);
    margin: var(--space-8) auto;
    min-height: calc(100dvh - var(--space-8) * 2);
  }

  .bottom-nav {
    max-width: 430px;
    border-radius: 0 0 var(--radius-2xl) var(--radius-2xl);
  }
}
```

---

## Scrolling & Safe Areas

- **Page content** scrolls vertically; the bottom nav stays fixed.
- **Card carousels** and **chip rows** scroll horizontally.
- Use `padding-bottom: env(safe-area-inset-bottom)` on the bottom nav for
  notched devices.
- Use `100dvh` (dynamic viewport height) instead of `100vh` to account for
  mobile browser chrome.
