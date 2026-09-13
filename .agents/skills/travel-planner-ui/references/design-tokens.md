# Design Tokens

All design tokens are defined as CSS custom properties on `:root` in [`src/styles/tokens.css`](file:///c:/Users/clare/Desktop/Project/travel-planner/src/styles/tokens.css). Every component must reference these variables — never hard-code raw values or flat opaque colors.

```css
:root {
  /* ──────────────── Colors ──────────────── */

  /* ──────────────── 60-30-10 Color Role Distribution ──────────────── */

  /* 10% Primary Brand Accent (Terracotta) */
  --color-primary:          #D85822;
  --color-primary-hover:    #C24B19;
  --color-primary-light:    #FDF1EB;   /* tinted background for badges */
  --color-primary-text:     #FFFFFF;   /* text on primary bg */

  /* Supporting Functional Accents */
  --color-accent-honey:     #E9A33B;   /* Honey Gold: secondary status ("Proposed"), star ratings */
  --color-status-proposed:  #E9A33B;
  --color-accent-ochre:     #B57738;   /* Warm Ochre: secondary category chips ("Sightseeing") */
  --color-category-sightseeing: #B57738;

  /* 60% Base / Background (Soft Cream) & Surfaces */
  --color-background:       #F5EFEB;   /* Soft cream backdrop & empty state fills */
  --color-surface:          rgba(245, 239, 235, 0.76);   /* translucent frosted glass */
  --color-surface-alt:      rgba(245, 239, 235, 0.58);   /* layered frosted glass */

  /* 30% Structure & Neutrals (Warm Taupe) */
  --color-border:           #C8B39B;   /* Warm Taupe card borders & unselected chips */
  --color-border-subtle:    rgba(200, 179, 155, 0.55);
  --color-border-strong:    rgba(200, 179, 155, 0.85);
  --color-divider:          rgba(200, 179, 155, 0.45);

  /* Liquid Glass System Tokens */
  --glass-blur-sm:          blur(12px) saturate(180%);
  --glass-blur-md:          blur(22px) saturate(190%);
  --glass-blur-lg:          blur(32px) saturate(200%);
  --glass-bg-card:          linear-gradient(180deg, rgba(255, 255, 255, 0.78) 0%, rgba(245, 239, 235, 0.65) 100%);
  --glass-bg-card-hover:    linear-gradient(180deg, rgba(255, 255, 255, 0.90) 0%, rgba(245, 239, 235, 0.80) 100%);
  --glass-border-refractive:1px solid rgba(200, 179, 155, 0.45);
  --glass-specular-top:     inset 0 1px 1.5px rgba(255, 255, 255, 0.98);
  --glass-shadow:           0 8px 24px rgba(200, 179, 155, 0.20);
  --glass-shadow-floating:  0 14px 38px rgba(38, 41, 46, 0.10);

  /* 30% Typography & Inactive Neutrals */
  --color-text-primary:     #26292E;   /* Charcoal: primary text, activity names, time headers */
  --color-text-secondary:   #6D7C8A;   /* Slate / Blue-Grey: subtitles, "TBD", buffer duration */
  --color-text-tertiary:    #6D7C8A;   /* Slate / Blue-Grey: inactive icons, muted labels */
  --color-text-inverse:     #FFFFFF;
  --color-timeline-spine:   #6D7C8A;   /* Slate / Blue-Grey: vertical timeline connector line */

  /* Semantic */
  --color-star:             #E9A33B;   /* Honey Gold rating star */
  --color-heart:            #E8621A;   /* favorite heart */
  --color-success:          #10B981;
  --color-error:            #EF4444;
  --color-badge-bg:         rgba(232, 98, 26, 0.15);
  --color-badge-text:       #EA580C;

  /* ──────────────── Typography ──────────────── */

  --font-family:            'Inter', 'SF Pro Display', -apple-system,
                            BlinkMacSystemFont, 'Segoe UI', Roboto,
                            Oxygen, Ubuntu, Cantarell, sans-serif;

  /* Font sizes */
  --text-xs:                0.75rem;   /* 12px */
  --text-sm:                0.8125rem; /* 13px */
  --text-base:              0.875rem;  /* 14px */
  --text-md:                1rem;      /* 16px */
  --text-lg:                1.125rem;  /* 18px */
  --text-xl:                1.25rem;   /* 20px */
  --text-2xl:               1.5rem;    /* 24px */
  --text-3xl:               2rem;      /* 32px */
  --text-4xl:               2.5rem;    /* 40px */

  /* Font weights */
  --font-regular:           400;
  --font-medium:            500;
  --font-semibold:          600;
  --font-bold:              700;
  --font-extrabold:         800;

  /* Line heights */
  --leading-tight:          1.2;
  --leading-normal:         1.4;
  --leading-relaxed:        1.6;

  /* ──────────────── Spacing ──────────────── */

  --space-1:                4px;
  --space-2:                8px;
  --space-3:                12px;
  --space-4:                16px;
  --space-5:                20px;
  --space-6:                24px;
  --space-8:                32px;
  --space-10:               40px;
  --space-12:               48px;
  --space-16:               64px;

  /* ──────────────── Border Radius ──────────────── */

  --radius-sm:              8px;
  --radius-md:              12px;
  --radius-lg:              16px;
  --radius-xl:              24px;
  --radius-2xl:             32px;
  --radius-pill:            9999px;

  /* ──────────────── Shadows ──────────────── */

  --shadow-card:            0 2px 12px rgba(0, 0, 0, 0.06);
  --shadow-card-hover:      0 8px 24px rgba(0, 0, 0, 0.10);
  --shadow-header:          0 2px 12px rgba(0, 0, 0, 0.04);
  --shadow-drawer:          -4px 0 24px rgba(0, 0, 0, 0.15);
  --shadow-button:          0 4px 14px rgba(232, 98, 26, 0.28);
  --shadow-nav:             0 -4px 16px rgba(0, 0, 0, 0.06);

  /* ──────────────── Transitions ──────────────── */

  --transition-fast:        150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base:        250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow:        400ms cubic-bezier(0.4, 0, 0.2, 1);

  /* ──────────────── Z-Index Hierarchy ──────────────── */

  --z-base:                 0;
  --z-card:                 10;
  /* Top Viewport Occlusion Guard sits at z-index: 39 */
  /* Sticky Cat Banner Header sits at z-index: 40 */
  /* Bottom Viewport Occlusion Guard sits at z-index: 90 */
  --z-header:               100;
  --z-nav:                  100;
  --z-backdrop:             200;
  --z-drawer:               210;
  --z-modal:                300;
  --z-toast:                400;

  /* ──────────────── Layout ──────────────── */

  --mobile-max-width:       430px;
  --content-max-width:      1040px;
  --page-padding:           20px;
  --header-height:          64px;
  --nav-height:             64px;
}
```

---

## Color & Material Usage Guidelines

| Context                     | Token / Value                                                 | Visual Effect                                     |
| :-------------------------- | :------------------------------------------------------------ | :------------------------------------------------ |
| App Shell Background        | `--color-background` (`#F5EFEB`) + `cat-bg.jpg`               | Soft cream backdrop with cat crowd pattern        |
| Standard Card Background    | `--glass-bg-card`                                             | Frosted soft cream translucent glass panel        |
| Hover Card Background       | `--glass-bg-card-hover`                                       | Luminously brightened frosted glass panel         |
| Card Refractive Border      | `--color-border` (`#C8B39B` / `rgba(200, 179, 155, 0.45)`)    | 1px Warm Taupe border                             |
| Top Specular Highlight      | `--glass-specular-top`                                        | Curved glass reflection along top edge            |
| Selected Day Chip (Day 1)   | `--color-primary` (`#D85822`) + white text                    | Warm Terracotta active chip                       |
| Unselected Day Chips        | Warm Taupe (`#C8B39B`) border + soft cream glass fill         | Subtly grounded secondary chips                   |
| Primary Center FAB (+)      | `--color-primary` (`#D85822`) + specular highlight            | Solid Warm Terracotta floating action button      |
| Timeline Vertical Spine     | `--color-timeline-spine` (`#6D7C8A`)                          | Slate / Blue-Grey continuous connector line       |
| Active Timeline Dots        | White node + `--color-primary` (`#D85822`) border             | Terracotta focused timeline node                  |
| Proposed Status Tag         | `--color-status-proposed` (`#E9A33B`)                         | Honey Gold secondary status pill                  |
| Sightseeing Category Chip   | `--color-category-sightseeing` (`#B57738`)                    | Warm Ochre secondary category chip                |
