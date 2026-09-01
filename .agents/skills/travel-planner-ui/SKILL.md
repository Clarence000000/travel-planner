---
name: travel-planner-ui
description: >-
  Use this skill when building or modifying frontend UI for the travel planner
  application. It defines the complete design system including color palette,
  typography, spacing, component library, layout patterns, and mobile-first
  responsive rules. Activate whenever the user asks to create pages, components,
  or layouts for the travel planner app.
---

# Travel Planner UI Design System

This skill contains the complete design system for the Travel Planner
application — a mobile-first, browser-based web app for discovering and managing
travel destinations and trips.

> **Design Philosophy**: Warm, nature-inspired, friendly and approachable.
> The UI uses soft earth tones, rounded shapes, illustrated imagery, and generous
> whitespace to evoke a sense of wanderlust and comfort.

---

## Quick Reference

| Token              | Value                                           |
| :----------------- | :---------------------------------------------- |
| Primary color      | `#E8621A` (burnt orange)                        |
| Secondary color    | `#2D6A2E` (forest green)                        |
| Background         | `#F5F0E8` (warm cream)                          |
| Surface/Card       | `#FFFFFF`                                       |
| Text primary       | `#1A1A1A`                                       |
| Text secondary     | `#6B6B6B`                                       |
| Border radius (sm) | `12px`                                          |
| Border radius (md) | `16px`                                          |
| Border radius (lg) | `24px`                                          |
| Border radius (xl) | `9999px` (pill)                                 |
| Font family        | `'Inter', 'SF Pro Display', system-ui, sans-serif` |
| Max mobile width   | `430px` (centered container)                    |

---

## Design Tokens

Read the full token definitions in [references/design-tokens.md](./references/design-tokens.md).

## Component Library

Read the complete component specifications with HTML/CSS examples in
[references/components.md](./references/components.md).

## Layout Patterns

Read the page layout patterns (Home, Detail, Trips) in
[references/layouts.md](./references/layouts.md).

---

## Steps to Build a New Page

1. **Set up the HTML shell** using the base layout template from
   [references/layouts.md](./references/layouts.md). Always include the
   viewport meta tag and the CSS custom properties from design tokens.

2. **Compose the page** using components from
   [references/components.md](./references/components.md). Every page should
   include:
   - A **top header** (location selector + notification bell + avatar) OR a
     **detail header** (back arrow + heart icon).
   - The **page body** with the appropriate content.
   - The **bottom navigation bar** (fixed, 5 tabs).

3. **Apply mobile-first responsive rules**:
   - Default styles target mobile (`max-width: 430px` centered).
   - Use `@media (min-width: 768px)` for tablet adjustments.
   - Use `@media (min-width: 1024px)` for desktop layouts.

4. **Use CSS custom properties** for all colors, spacing, and radii — never
   hard-code hex values directly in component styles.

5. **Test at 375px, 390px, and 430px widths** to cover common mobile
   viewports (iPhone SE, iPhone 14, iPhone 14 Pro Max).

---

## Key Design Rules

- **Rounded everything**: All cards, buttons, inputs, and images use generous
  border-radius (minimum `12px` for small elements, `24px` for cards).
- **Warm palette**: The background is a warm cream (`#F5F0E8`), never pure
  white. Cards are white to provide contrast against the cream background.
- **Orange as primary CTA**: All primary actions (buttons, active states,
  active nav icons) use the burnt orange `#E8621A`.
- **Illustrated imagery**: Destination images use colorful, flat-style
  landscape illustrations (windmills, farms, mountains, forests) — not
  photographs.
- **Bottom navigation always visible**: The 5-tab bottom nav is fixed and
  always visible. The active tab label is colored orange.
- **Soft shadows**: Cards use subtle box-shadows
  (`0 2px 12px rgba(0,0,0,0.08)`), never harsh or dark shadows.
- **Country flag emoji**: Country names are preceded by the flag emoji of that
  country (e.g. 🇩🇪 Germany, 🇨🇭 Switzerland).
- **Star ratings**: Displayed with an orange star icon (`★`) followed by the
  numeric rating.
- **Chip/tag pattern**: Horizontally scrollable chip rows for filtering
  (country filters, amenity tags). Active chip is filled orange with white
  text; inactive chips have a dark border with transparent background.
