---
name: travel-planner-ui
description: >-
  Use this skill when building or modifying frontend UI for the travel planner
  application. It defines the complete design system including the Apple iOS 26
  "Liquid Glass" design language, color palette, typography, spacing, component library,
  layout patterns, and mobile-first responsive rules. Activate whenever the user asks
  to create pages, components, or layouts for the travel planner app.
---

# Travel Planner UI Design System

This skill contains the complete design system for the Travel Planner
application — a mobile-first, browser-based web app featuring Apple's iOS 26
**"Liquid Glass"** aesthetic combined with cozy, warm vertical cat wallpaper patterns.

> **Design Philosophy**: Modern, luminous, tactile, and cozy.
> Built on Apple iOS 26 "Liquid Glass" principles: frosted translucency (20px–32px blur),
> delicate 1px light-refractive borders, top specular highlights that simulate curved glass,
> layered z-axis elevation, continuous squircle geometry, and atmospheric vertical cat artwork.

---

## Quick Reference

| Token              | Value                                                      |
| :----------------- | :--------------------------------------------------------- |
| Primary color      | `#E8621A` (radiant burnt orange / amber CTA)               |
| Secondary color    | `#2563EB` (vibrant electric blue for transit & accents)    |
| Background         | `#F5F0E8` (warm cream with dynamic cat wallpaper pattern)  |
| Glass Surface      | `linear-gradient(135deg, rgba(255,255,255,0.76) 0%, rgba(255,255,255,0.58) 100%)` |
| Glass Alt Surface  | `rgba(255, 255, 255, 0.62)` (subtle secondary panel)      |
| Glass Border       | `1px solid rgba(255, 255, 255, 0.88)` (light-refractive)   |
| Specular Highlight | `inset 0 1px 1.5px rgba(255, 255, 255, 0.95)`              |
| Text primary       | `#0F172A` / `#1A1A1A` (deep slate / rich dark)             |
| Text secondary     | `#475569` / `#64748B` (refined slate gray)                 |
| Border radius (sm) | `8px`                                                      |
| Border radius (md) | `14px` (capsules & buttons)                                |
| Border radius (lg) | `20px` (cards & modules)                                   |
| Border radius (xl) | `28px` (view banners & drawers)                            |
| Border radius (2xl)| `32px` (floating dock bar)                                 |
| Border radius (pill)| `9999px` (pills & chips)                                  |
| Font family        | `'Inter', 'SF Pro Display', -apple-system, sans-serif`     |
| Max mobile width   | `430px` (centered container)                               |

---

## Architecture Overview

1. **Root Mobile Shell (`.app-shell`)**:
   - Centered container (`max-width: 430px`, `min-height: 100dvh`).
   - Dynamic vertical cat pattern wallpapers synced via `data-active-tab` with `background-attachment: fixed`.
2. **Atmospheric Sticky Cat Photo Banner Header (`.view-banner`)**:
   - Sticky at `top: 12px` (`height: 124px`, `border-radius: 28px`).
   - Embeds page-specific cat illustration artwork with an integrated glass circular menu button (`.view-banner__menu-btn`) to trigger the slide-out sidebar.
3. **Viewport Occlusion Guards (`.app-shell__top-guard`, `.app-shell__bottom-guard`)**:
   - Fixed masks at `top: 0` (`height: 14px; z-index: 39`) and `bottom: 0` (`height: 14px; z-index: 90`).
   - Seamlessly match the active tab's fixed cat pattern background so scrolled content never pokes out above the cat photo banner or below the floating navigation dock.
4. **Slide-Out Liquid Glass Sidebar Drawer (`.sidebar-drawer`)**:
   - Full-height frosted glass drawer (`backdrop-filter: blur(32px)`).
   - Contains Trip Management, quick tab-switch chips, and live notification glass cards.
5. **Floating Liquid Glass Bottom Dock Bar (`.bottom-nav`)**:
   - Floating dock pill at `bottom: 12px` (`height: 66px`, `border-radius: 32px`, `backdrop-filter: blur(28px)`).
   - 5 core views: Itinerary, Chat, Assistant, Ideas, Dashboard. Active tab glows in a beveled glass capsule.

---

## Design Tokens

Read the full token definitions in [references/design-tokens.md](./references/design-tokens.md).

## Component Library

Read the complete component specifications with HTML/CSS examples in
[references/components.md](./references/components.md).

## Layout Patterns

Read the page layout patterns (App Shell, Itinerary, Chat, Assistant, Ideas, Dashboard) in
[references/layouts.md](./references/layouts.md).

---

## Steps to Build a New View or Component

1. **Reference Design Tokens**:
   - Always use CSS variables (`var(--glass-surface)`, `var(--glass-border)`, `var(--glass-specular-top)`, `var(--radius-xl)`) instead of hardcoded hex colors or opaque backgrounds.

2. **Apply the Liquid Glass Material**:
   - Set semi-transparent multi-stop linear gradients (`rgba(255, 255, 255, 0.76)` to `0.58`).
   - Apply `backdrop-filter: blur(20px - 32px) saturate(180%)`. Include the `-webkit-backdrop-filter` prefix.
   - Add thin refractive border: `1px solid rgba(255, 255, 255, 0.88)`.
   - Add top specular edge highlight: `box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08), inset 0 1px 1.5px rgba(255, 255, 255, 0.95)`.

3. **Incorporate Continuous Squircle Radii**:
   - Cards and panels: `border-radius: 20px` to `24px`.
   - Banners and drawers: `border-radius: 28px`.
   - Floating dock: `border-radius: 32px`.
   - Chips and badges: `border-radius: 9999px` (pill).

4. **Preserve Scroll & Drag Integrity**:
   - Content scrolls on `window` to support drag-and-drop auto-scrolling with `window.scrollBy`.
   - Never remove `.app-shell__top-guard` or `.app-shell__bottom-guard`—they protect the floating banner and dock from viewport bleed.
   - Always include `.nav-spacer` at the end of `.main-content` to prevent the floating dock from obscuring the last content item.

---

## Key Design Rules

- **Use SVGs Everywhere, Discourage Emojis**: Always use inline SVG vector icons
  for all UI elements, controls, chips, pills, badges, tabs, and buttons.
  **Avoid and discourage the use of emojis in UI components** (e.g. no emojis
  inside filter chips, category pills, status tags, headers, or buttons).
  *Why*: Emojis render unpredictably across different operating systems (iOS,
  Android, Linux, Windows), disrupt typographic line-heights and vertical
  alignment, and cannot adapt to theme tokens or active/hover states with
  `currentColor`. In contrast, clean inline SVGs (`stroke="currentColor"`,
  stroke-width 2–2.5px, `stroke-linecap="round"`, `stroke-linejoin="round"`)
  ensure razor-sharp vector scaling, consistent styling, and full accessibility.
- **Liquid Glass Translucency**: Cards must never be flat, opaque white. Every card reveals the underlying cat wallpaper softly through frosted glassmorphism.
- **Top Specular Light**: Every card, button, and glass pill must have a soft specular white inner highlight along its top edge (`inset 0 1px 1.5px rgba(255, 255, 255, 0.95)`).
- **Beveled Icon Capsules**: Icons, badges, and counters sit in their own translucent frosted glass capsules rather than flat circles.
- **Floating Symmetrical Elements**: Both the cat photo header (`top: 12px`) and the bottom navigation bar (`bottom: 12px`) float with 12px margins and squircle corners.
- **Clean Occlusion**: Top and bottom occlusion guards keep scrolling content contained strictly between the cat banner and bottom dock.
- **Burnt Orange CTA**: The vibrant burnt orange `#E8621A` is reserved for primary actions, active indicators, and glowing highlights.
- **Electric Blue Transit**: Accent blue `#2563EB` is used for timeline spines, transit nodes, buffer connectors, and time tags.
- **Rounded everything**: All cards, buttons, inputs, and images use generous border-radius (minimum `12px` for small elements, `24px` for cards, `9999px` for pills).
- **Warm palette**: The background is a warm cream (`#F5F0E8`), never pure white. Cards are translucent white/glass to provide contrast against the cream background.
- **Bottom navigation always visible**: The 5-tab bottom nav is fixed and always visible. The active tab label and icon are highlighted in burnt orange.
- **Clean vector metadata**: Metadata (locations, dates, categories) uses crisp inline SVG icons (e.g. pin, calendar, clock) followed by clean text, never platform-dependent emojis.
- **Chip/tag & pill pattern**: Horizontally scrollable chip rows for filtering (categories, amenities, quick filters). Use an inline SVG icon inside the chip alongside concise text — never emojis. Active chip is filled orange with white text and white icon; inactive chips have a subtle border with transparent or glass-tinted background.
