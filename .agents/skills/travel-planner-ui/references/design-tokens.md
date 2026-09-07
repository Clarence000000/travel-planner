# Design Tokens

All design tokens are defined as CSS custom properties on `:root` in [`src/styles/tokens.css`](file:///c:/Users/clare/Desktop/Project/travel-planner/src/styles/tokens.css). Every component must reference these variables — never hard-code raw values or flat opaque colors.

```css
:root {
  /* ──────────────── Colors ──────────────── */

  /* Primary (Burnt Orange / Amber CTA) */
  --color-primary:          #E8621A;
  --color-primary-hover:    #D4580F;
  --color-primary-light:    #FFF0E6;   /* tinted background for badges */
  --color-primary-text:     #FFFFFF;   /* text on primary bg */

  /* Secondary (Forest Green & Accents) */
  --color-secondary:        #2D6A2E;
  --color-secondary-light:  #E8F5E9;

  /* Neutral Surfaces & Backgrounds — Apple iOS 26 Liquid Glass */
  --color-background:       #F5F0E8;   /* warm cream page background with cat wallpaper */
  --color-surface:          rgba(255, 255, 255, 0.74);   /* translucent frosted glass */
  --color-surface-alt:      rgba(255, 255, 255, 0.58);   /* layered frosted glass */
  --color-border:           rgba(255, 255, 255, 0.88);   /* light-refractive edge */
  --color-border-strong:    rgba(15, 23, 42, 0.25);
  --color-divider:          rgba(255, 255, 255, 0.70);

  /* Liquid Glass System Tokens */
  --glass-blur-sm:          blur(12px) saturate(180%);
  --glass-blur-md:          blur(22px) saturate(190%);
  --glass-blur-lg:          blur(32px) saturate(200%);
  --glass-bg-card:          linear-gradient(180deg, rgba(255, 255, 255, 0.76) 0%, rgba(255, 255, 255, 0.56) 100%);
  --glass-bg-card-hover:    linear-gradient(180deg, rgba(255, 255, 255, 0.90) 0%, rgba(255, 255, 255, 0.72) 100%);
  --glass-border-refractive:1px solid rgba(255, 255, 255, 0.90);
  --glass-specular-top:     inset 0 1px 1.5px rgba(255, 255, 255, 0.98);
  --glass-shadow:           0 8px 24px rgba(15, 23, 42, 0.06);
  --glass-shadow-floating:  0 14px 38px rgba(15, 23, 42, 0.12);

  /* Typography Colors */
  --color-text-primary:     #0F172A;   /* deep slate / rich dark */
  --color-text-secondary:   #475569;   /* refined slate gray */
  --color-text-tertiary:    #64748B;   /* muted slate */
  --color-text-inverse:     #FFFFFF;

  /* Semantic */
  --color-star:             #E8621A;   /* rating star */
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
| App Shell Background        | `--color-background` (`#F5F0E8`) + Page Cat Pattern Wallpaper  | Warm cream with repeating illustrated cats        |
| Standard Card Background    | `--glass-bg-card`                                             | Frosted semi-transparent glass panel              |
| Hover Card Background       | `--glass-bg-card-hover`                                       | Luminously brightened frosted glass               |
| Card Refractive Border      | `--color-border` (`rgba(255, 255, 255, 0.88)`)                | 1px thin light-refractive edge                    |
| Top Specular Highlight      | `--glass-specular-top`                                        | Curved glass reflection along top edge            |
| Primary Button / Active CTA | `--color-primary` (`#E8621A`) + specular glow                 | Radiant orange with white specular shine          |
| Secondary Button / Chips    | Translucent glass pill (`rgba(255,255,255,0.7)`)              | Frosted glass capsule                             |
| Floating Dock Bar           | Multi-stop glass gradient + `blur(28px)`                      | Floating pill at `bottom: 12px`                   |
| Sticky Cat Photo Header     | Vertical cat asset banner + glass scrim + `blur(14px)` badge  | Floating rounded banner at `top: 12px`            |
| Top/Bottom Occlusion Guards | Fixed matching tab wallpaper at `top: 0` & `bottom: 0`        | Completely occludes bleeding scrolled content     |
