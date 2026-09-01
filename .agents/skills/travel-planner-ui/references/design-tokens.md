# Design Tokens

All design tokens are defined as CSS custom properties on `:root`. Every
component must reference these variables — never hard-code raw values.

```css
:root {
  /* ──────────────── Colors ──────────────── */

  /* Primary (Burnt Orange) */
  --color-primary:          #E8621A;
  --color-primary-hover:    #D4580F;
  --color-primary-light:    #FFF0E6;   /* tinted background for badges */
  --color-primary-text:     #FFFFFF;   /* text on primary bg */

  /* Secondary (Forest Green) */
  --color-secondary:        #2D6A2E;
  --color-secondary-light:  #E8F5E9;

  /* Neutral */
  --color-background:       #F5F0E8;   /* warm cream page bg */
  --color-surface:          #FFFFFF;   /* card / modal bg */
  --color-surface-alt:      #FDF6EE;   /* slightly tinted surface (detail hero bg) */
  --color-border:           #E0DDD6;   /* subtle borders */
  --color-border-strong:    #1A1A1A;   /* chip outlines */
  --color-divider:          #F0ECE4;

  /* Text */
  --color-text-primary:     #1A1A1A;
  --color-text-secondary:   #6B6B6B;
  --color-text-tertiary:    #9E9E9E;
  --color-text-inverse:     #FFFFFF;

  /* Semantic */
  --color-star:             #E8621A;   /* rating star */
  --color-heart:            #E8621A;   /* favorite heart */
  --color-success:          #2D6A2E;
  --color-error:            #D32F2F;

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
  --text-3xl:               2rem;      /* 32px — temperature display */

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

  /* ──────────────── Border Radius ──────────────── */

  --radius-sm:              8px;
  --radius-md:              12px;
  --radius-lg:              16px;
  --radius-xl:              24px;
  --radius-2xl:             32px;
  --radius-pill:            9999px;

  /* ──────────────── Shadows ──────────────── */

  --shadow-card:            0 2px 12px rgba(0, 0, 0, 0.08);
  --shadow-card-hover:      0 4px 20px rgba(0, 0, 0, 0.12);
  --shadow-nav:             0 -2px 12px rgba(0, 0, 0, 0.06);
  --shadow-button:          0 2px 8px rgba(232, 98, 26, 0.3);

  /* ──────────────── Transitions ──────────────── */

  --transition-fast:        150ms ease;
  --transition-base:        250ms ease;
  --transition-slow:        400ms ease;

  /* ──────────────── Z-Index ──────────────── */

  --z-base:                 0;
  --z-card:                 10;
  --z-header:               100;
  --z-nav:                  100;
  --z-modal:                200;
  --z-toast:                300;

  /* ──────────────── Layout ──────────────── */

  --mobile-max-width:       430px;
  --page-padding:           20px;
  --nav-height:             64px;
  --header-height:          56px;
}
```

---

## Color Usage Guidelines

| Context                     | Token                        |
| :-------------------------- | :--------------------------- |
| Page background             | `--color-background`         |
| Card / sheet background     | `--color-surface`            |
| Detail page hero background | `--color-surface-alt`        |
| Primary button / CTA        | `--color-primary`            |
| Primary button hover        | `--color-primary-hover`      |
| Active chip fill            | `--color-primary`            |
| Inactive chip border        | `--color-border-strong`      |
| Active nav tab label/icon   | `--color-primary`            |
| Inactive nav tab            | `--color-text-secondary`     |
| Star rating icon            | `--color-star`               |
| Heart / favorite icon       | `--color-heart`              |
| Section headings            | `--color-text-primary`       |
| Body / description text     | `--color-text-secondary`     |
| Country / meta labels       | `--color-text-secondary`     |
| Date range labels           | `--color-text-secondary`     |
| "View all" link             | `--color-primary`            |

---

## Typography Scale Usage

| Element                    | Size          | Weight              | Color                    |
| :------------------------- | :------------ | :------------------ | :----------------------- |
| Page title ("Berlin")      | `--text-2xl`  | `--font-extrabold`  | `--color-text-primary`   |
| Section title              | `--text-xl`   | `--font-bold`       | `--color-text-primary`   |
| Card title (destination)   | `--text-lg`   | `--font-bold`       | `--color-text-primary`   |
| Detail page title          | `--text-2xl`  | `--font-bold`       | `--color-text-primary`   |
| Body text / description    | `--text-base` | `--font-regular`    | `--color-text-secondary` |
| Chip label                 | `--text-sm`   | `--font-medium`     | varies                   |
| Meta label (country, date) | `--text-sm`   | `--font-regular`    | `--color-text-secondary` |
| "Location" small label     | `--text-xs`   | `--font-regular`    | `--color-text-secondary` |
| Nav tab label              | `--text-xs`   | `--font-medium`     | varies                   |
| Star rating number         | `--text-sm`   | `--font-semibold`   | `--color-text-inverse`   |
| Temperature display        | `--text-3xl`  | `--font-bold`       | `--color-text-primary`   |
| "View all" link            | `--text-sm`   | `--font-semibold`   | `--color-primary`        |
