# Component Library

This document contains all reusable UI components for the Travel Planner app.
Each component includes its purpose, HTML structure, and CSS styles.

> **Iconography Principle**: Always use crisp, inline SVG vector icons for all
> components (chips, pills, tags, buttons, badges). **Emojis are strictly discouraged
> in UI components** because they render inconsistently across platforms and OSes,
> cannot inherit theme token colors with `currentColor`, and disrupt typographic line-heights.

---

## Table of Contents

1. [App Shell](#1-app-shell)
2. [Top Header](#2-top-header)
3. [Detail Header](#3-detail-header)
4. [Search Bar](#4-search-bar)
5. [Filter Chips](#5-filter-chips)
6. [Section Header](#6-section-header)
7. [Destination Card (Large)](#7-destination-card-large)
8. [Trip Card (Grid)](#8-trip-card-grid)
9. [Amenity Tags](#9-amenity-tags)
10. [Star Rating Badge](#10-star-rating-badge)
11. [Weather Widget](#11-weather-widget)
12. [Map Embed](#12-map-embed)
13. [Author / Reviewer Row](#13-author--reviewer-row)
14. [Bottom Navigation](#14-bottom-navigation)
15. [Primary Button](#15-primary-button)
16. [Heart / Favorite Button](#16-heart--favorite-button)
17. [Avatar](#17-avatar)
18. [Icon Button](#18-icon-button)

---

## 1. App Shell

The outermost wrapper that centers the mobile layout and sets the background.

```html
<div class="app-shell">
  <div class="app-container">
    <!-- Header -->
    <!-- Page content -->
    <!-- Bottom nav -->
  </div>
</div>
```

```css
.app-shell {
  min-height: 100dvh;
  background-color: var(--color-background);
  display: flex;
  justify-content: center;
}

.app-container {
  width: 100%;
  max-width: var(--mobile-max-width);
  min-height: 100dvh;
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background);
}

/* Tablet+ : show side-by-side or wider container */
@media (min-width: 768px) {
  .app-container {
    max-width: 768px;
    border-left: 1px solid var(--color-border);
    border-right: 1px solid var(--color-border);
  }
}
```

---

## 2. Top Header

Used on Home and Trips pages. Shows location, notification bell, and avatar.

```html
<header class="top-header">
  <div class="top-header__location">
    <span class="top-header__label">Location</span>
    <button class="top-header__city">
      Berlin <span class="top-header__dropdown-icon">▾</span>
    </button>
  </div>
  <div class="top-header__actions">
    <button class="icon-btn" aria-label="Notifications">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><!-- bell icon --></svg>
    </button>
    <div class="avatar avatar--sm">
      <img src="avatar.jpg" alt="User" />
    </div>
  </div>
</header>
```

```css
.top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--page-padding);
  padding-top: var(--space-6);
}

.top-header__label {
  display: block;
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  font-weight: var(--font-regular);
}

.top-header__city {
  font-size: var(--text-2xl);
  font-weight: var(--font-extrabold);
  color: var(--color-text-primary);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.top-header__dropdown-icon {
  font-size: var(--text-md);
  color: var(--color-text-primary);
}

.top-header__actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}
```

---

## 3. Detail Header

Used on destination detail pages. Transparent overlay on the hero image.

```html
<header class="detail-header">
  <button class="icon-btn icon-btn--round" aria-label="Go back">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><!-- left arrow icon --></svg>
  </button>
  <button class="icon-btn icon-btn--round" aria-label="Favorite">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><!-- heart outline icon --></svg>
  </button>
</header>
```

```css
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--page-padding);
  padding-top: var(--space-6);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-header);
}

.icon-btn--round {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-pill);
  background: var(--color-surface);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.icon-btn--round:hover {
  background: var(--color-divider);
}
```

---

## 4. Search Bar

Rounded search input with a filter button.

```html
<div class="search-bar">
  <div class="search-bar__input-wrapper">
    <svg class="search-bar__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><!-- search icon --></svg>
    <input
      type="search"
      class="search-bar__input"
      placeholder="Search"
      aria-label="Search destinations"
    />
  </div>
  <button class="search-bar__filter-btn" aria-label="Filters">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><!-- sliders/filter icon --></svg>
  </button>
</div>
```

```css
.search-bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 0 var(--page-padding);
  margin-bottom: var(--space-4);
}

.search-bar__input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  background: var(--color-surface);
  border-radius: var(--radius-pill);
  padding: var(--space-3) var(--space-4);
  box-shadow: var(--shadow-card);
}

.search-bar__icon {
  width: 18px;
  height: 18px;
  color: var(--color-text-tertiary);
  margin-right: var(--space-2);
  flex-shrink: 0;
}

.search-bar__input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: var(--text-base);
  font-family: var(--font-family);
  color: var(--color-text-primary);
}

.search-bar__input::placeholder {
  color: var(--color-text-tertiary);
}

.search-bar__filter-btn {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.search-bar__filter-btn:hover {
  background: var(--color-divider);
}
```

---

## 5. Filter Chips & Pills

Horizontal scrollable row of category/filter chips. Always use inline SVG vector icons instead of emojis.

```html
<div class="chip-row" role="tablist">
  <button class="chip chip--active">
    <svg class="chip__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"></circle>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
    </svg>
    <span>All</span>
  </button>
  <button class="chip">
    <svg class="chip__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
    <span>Locations</span>
  </button>
  <button class="chip">
    <svg class="chip__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
      <line x1="6" y1="1" x2="6" y2="4"></line>
      <line x1="10" y1="1" x2="10" y2="4"></line>
      <line x1="14" y1="1" x2="14" y2="4"></line>
    </svg>
    <span>Dining</span>
  </button>
  <!-- more chips -->
</div>
```

```css
.chip-row {
  display: flex;
  gap: var(--space-2);
  padding: 0 var(--page-padding);
  margin-bottom: var(--space-5);
  overflow-x: auto;
  scrollbar-width: none;       /* Firefox */
  -ms-overflow-style: none;    /* IE / Edge */
}

.chip-row::-webkit-scrollbar {
  display: none;               /* Chrome / Safari */
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-pill);
  border: 1.5px solid var(--color-border-strong);
  background: transparent;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  font-family: var(--font-family);
  color: var(--color-text-primary);
  white-space: nowrap;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.chip svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  stroke: currentColor;
}

.chip--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.chip--active svg {
  stroke: var(--color-text-inverse);
}

.chip:not(.chip--active):hover {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
}
```

---

## 6. Section Header

Title row with an optional "View all" link.

```html
<div class="section-header">
  <h2 class="section-header__title">Popular Destinations</h2>
  <a href="#" class="section-header__link">View all ›</a>
</div>
```

```css
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--page-padding);
  margin-bottom: var(--space-4);
}

.section-header__title {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.section-header__link {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-primary);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.section-header__link:hover {
  text-decoration: underline;
}
```

---

## 7. Destination Card (Large)

Vertical card used in the "Popular Destinations" horizontal scroll on the Home page.

```html
<article class="destination-card">
  <div class="destination-card__image-wrapper">
    <img
      src="whispering-fields.jpg"
      alt="Whispering Fields — German countryside with windmills"
      class="destination-card__image"
    />
    <div class="rating-badge">
      <span class="rating-badge__star">★</span>
      <span class="rating-badge__value">4.9</span>
    </div>
    <button class="heart-btn" aria-label="Add to favorites">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><!-- heart icon --></svg>
    </button>
  </div>
  <div class="destination-card__body">
    <h3 class="destination-card__name">Whispering Fields</h3>
    <p class="destination-card__country">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
      <span>Germany</span>
    </p>
    <p class="destination-card__description">
      Fictional countryside surrounded by windmills, lakes, and soft green hills.
    </p>
    <p class="destination-card__dates">27 June – 12 May</p>
    <button class="btn btn--primary btn--sm">Show details</button>
  </div>
</article>
```

```css
.destination-card {
  width: 260px;
  flex-shrink: 0;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  transition: box-shadow var(--transition-base);
}

.destination-card:hover {
  box-shadow: var(--shadow-card-hover);
}

.destination-card__image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
}

.destination-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.destination-card__body {
  padding: var(--space-4);
}

.destination-card__name {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-1);
}

.destination-card__country {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-2);
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}

.destination-card__description {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
  margin: 0 0 var(--space-3);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.destination-card__dates {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-3);
}
```

---

## 8. Trip Card (Grid)

Compact card used in the "My Trips" grid (2 columns) on the Trips page. Uses SVG icons for location and dates.

```html
<article class="trip-card">
  <div class="trip-card__image-wrapper">
    <img
      src="alpine-meadow.jpg"
      alt="Alpine Meadow Path"
      class="trip-card__image"
    />
  </div>
  <div class="trip-card__body">
    <h3 class="trip-card__name">Alpine Meadow Path</h3>
    <p class="trip-card__country">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
      <span>Switzerland</span>
    </p>
    <p class="trip-card__meta">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
      <span>August 2022 (8 days)</span>
    </p>
    <button class="btn btn--primary btn--xs">Show details</button>
  </div>
</article>
```

```css
.trips-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  padding: 0 var(--page-padding);
}

.trip-card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  transition: box-shadow var(--transition-base);
}

.trip-card:hover {
  box-shadow: var(--shadow-card-hover);
}

.trip-card__image-wrapper {
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
}

.trip-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.trip-card__body {
  padding: var(--space-3);
}

.trip-card__name {
  font-size: var(--text-base);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-1);
  line-height: var(--leading-tight);
}

.trip-card__country {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-1);
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}

.trip-card__meta {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-2);
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}
```

---

## 9. Amenity Tags

Horizontal row of small outlined tag pills (Ticket, Hotel, Meal, etc.).

```html
<div class="amenity-tags">
  <span class="amenity-tag">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><!-- ticket icon --></svg> Ticket
  </span>
  <span class="amenity-tag">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><!-- hotel/bed icon --></svg> Hotel
  </span>
  <span class="amenity-tag">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><!-- meal icon --></svg> Meal
  </span>
</div>
```

```css
.amenity-tags {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  padding: 0 var(--page-padding);
  margin-bottom: var(--space-5);
}

.amenity-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-primary);
  background: var(--color-surface);
}

.amenity-tag svg {
  width: 16px;
  height: 16px;
  color: var(--color-text-secondary);
}
```

---

## 10. Star Rating Badge

Floating badge overlaid on a destination card image.

```html
<div class="rating-badge">
  <span class="rating-badge__star">★</span>
  <span class="rating-badge__value">4.9</span>
</div>
```

```css
.rating-badge {
  position: absolute;
  top: var(--space-3);
  left: var(--space-3);
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
}

.rating-badge__star {
  color: var(--color-star);
  font-size: var(--text-sm);
}

.rating-badge__value {
  color: var(--color-text-inverse);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
}
```

---

## 11. Weather Widget

Compact weather display showing an icon, condition text, time, and temperature.

```html
<div class="weather-widget">
  <div class="weather-widget__condition">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><!-- cloud/rain icon --></svg>
    <span>Rainy</span>
  </div>
  <span class="weather-widget__time">8:40 AM</span>
  <span class="weather-widget__temp">
    32<sup>°C</sup>
  </span>
</div>
```

```css
.weather-widget {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--page-padding);
  margin-bottom: var(--space-4);
}

.weather-widget__condition {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-base);
  color: var(--color-text-secondary);
}

.weather-widget__condition svg {
  width: 24px;
  height: 24px;
}

.weather-widget__time {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}

.weather-widget__temp {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
}

.weather-widget__temp sup {
  font-size: var(--text-md);
  font-weight: var(--font-regular);
}
```

---

## 12. Map Embed

Rounded map placeholder/iframe within the detail page.

```html
<div class="map-embed">
  <!-- Use an iframe or static map image -->
  <img src="map-preview.png" alt="Route map" class="map-embed__img" />
  <div class="map-embed__controls">
    <button class="map-embed__zoom" aria-label="Zoom in">+</button>
    <button class="map-embed__zoom" aria-label="Zoom out">−</button>
  </div>
</div>
```

```css
.map-embed {
  position: relative;
  margin: 0 var(--page-padding) var(--space-4);
  border-radius: var(--radius-lg);
  overflow: hidden;
  aspect-ratio: 16 / 10;
}

.map-embed__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.map-embed__controls {
  position: absolute;
  bottom: var(--space-3);
  left: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.map-embed__zoom {
  width: 32px;
  height: 32px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  font-size: var(--text-lg);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.map-embed__zoom:first-child {
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
}

.map-embed__zoom:last-child {
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
}
```

---

## 13. Author / Reviewer Row

Shows an avatar, name, and star rating for a destination author/reviewer.

```html
<div class="author-row">
  <div class="avatar avatar--sm">
    <img src="james.jpg" alt="James Kir" />
  </div>
  <span class="author-row__name">By James Kir</span>
  <div class="author-row__rating">
    <span class="author-row__star">★</span>
    <span class="author-row__value">4.9</span>
  </div>
</div>
```

```css
.author-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--page-padding);
}

.author-row__name {
  flex: 1;
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--color-text-primary);
}

.author-row__rating {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.author-row__star {
  color: var(--color-star);
  font-size: var(--text-md);
}

.author-row__value {
  font-size: var(--text-base);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
}
```

---

## 14. Bottom Navigation

Fixed 5-tab bottom navigation bar.

**Tab items**: Home, Tracks, Trips, More, Settings.

```html
<nav class="bottom-nav" aria-label="Main navigation">
  <a href="/" class="bottom-nav__tab bottom-nav__tab--active">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><!-- home icon --></svg>
    <span>Home</span>
  </a>
  <a href="/tracks" class="bottom-nav__tab">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><!-- compass/track icon --></svg>
    <span>Tracks</span>
  </a>
  <a href="/trips" class="bottom-nav__tab">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><!-- backpack/trip icon --></svg>
    <span>Trips</span>
  </a>
  <a href="/more" class="bottom-nav__tab">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><!-- grid/dots icon --></svg>
    <span>More</span>
  </a>
  <a href="/settings" class="bottom-nav__tab">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><!-- gear icon --></svg>
    <span>Settings</span>
  </a>
</nav>
```

```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: var(--mobile-max-width);
  height: var(--nav-height);
  background: var(--color-surface);
  border-top: 1px solid var(--color-divider);
  box-shadow: var(--shadow-nav);
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: var(--z-nav);
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.bottom-nav__tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  text-decoration: none;
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  transition: color var(--transition-fast);
  -webkit-tap-highlight-color: transparent;
}

.bottom-nav__tab svg {
  width: 24px;
  height: 24px;
}

.bottom-nav__tab--active {
  color: var(--color-primary);
}

.bottom-nav__tab--active svg {
  color: var(--color-primary);
}
```

---

## 15. Primary Button

Rounded, filled orange button.

```html
<button class="btn btn--primary">Show details</button>
<button class="btn btn--primary btn--sm">Show details</button>
<button class="btn btn--primary btn--xs">Show details</button>
```

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-family);
  font-weight: var(--font-semibold);
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.btn--primary {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-radius: var(--radius-pill);
  padding: var(--space-3) var(--space-6);
  font-size: var(--text-base);
  box-shadow: var(--shadow-button);
}

.btn--primary:hover {
  background: var(--color-primary-hover);
}

.btn--primary:active {
  transform: scale(0.97);
}

/* Sizes */
.btn--sm {
  padding: var(--space-2) var(--space-5);
  font-size: var(--text-sm);
}

.btn--xs {
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
}
```

---

## 16. Heart / Favorite Button

Floating heart icon on destination cards or detail page header.

```html
<button class="heart-btn" aria-label="Add to favorites">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><!-- heart outline --></svg>
</button>
<button class="heart-btn heart-btn--active" aria-label="Remove from favorites">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><!-- filled heart --></svg>
</button>
```

```css
.heart-btn {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  width: 36px;
  height: 36px;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(4px);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform var(--transition-fast);
}

.heart-btn svg {
  width: 20px;
  height: 20px;
  color: var(--color-text-secondary);
}

.heart-btn--active svg {
  color: var(--color-heart);
  fill: var(--color-heart);
}

.heart-btn:active {
  transform: scale(1.15);
}
```

---

## 17. Avatar

Circular user avatar in two sizes.

```html
<div class="avatar avatar--sm">
  <img src="user.jpg" alt="User" />
</div>
<div class="avatar avatar--md">
  <img src="user.jpg" alt="User" />
</div>
```

```css
.avatar {
  border-radius: var(--radius-pill);
  overflow: hidden;
  flex-shrink: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar--sm {
  width: 40px;
  height: 40px;
}

.avatar--md {
  width: 48px;
  height: 48px;
}
```

---

## 18. Icon Button

Generic transparent icon button used in headers and toolbars.

```html
<button class="icon-btn" aria-label="Notifications">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><!-- icon --></svg>
</button>
```

```css
.icon-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-pill);
  cursor: pointer;
  color: var(--color-text-primary);
  transition: background var(--transition-fast);
  -webkit-tap-highlight-color: transparent;
}

.icon-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.icon-btn svg {
  width: 24px;
  height: 24px;
}
```
