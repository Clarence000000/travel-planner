/**
 * Venue vector thumbnail generators for Penang landmarks and categories.
 */

export function getVenueThumbnail(block) {
  const title = (block.title || '').toLowerCase();
  const idSuffix = block.id ? block.id.replace(/[^a-zA-Z0-9]/g, '') : 'default';

  // 1. Chew Jetty Clan Waterfront Walk
  if (title.includes('chew jetty') || block.id === 'd1-chew-jetty') {
    return `
      <svg class="venue-circle-svg" viewBox="0 0 64 64" width="36" height="36" xmlns="http://www.w3.org/2000/svg" aria-label="Chew Jetty">
        <defs>
          <linearGradient id="jettyBg-${idSuffix}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#38BDF8"/>
            <stop offset="60%" stop-color="#0284C7"/>
            <stop offset="100%" stop-color="#0369A1"/>
          </linearGradient>
        </defs>
        <rect width="64" height="64" fill="url(#jettyBg-${idSuffix})"/>
        <path d="M0,46 Q16,42 32,46 T64,46 L64,64 L0,64 Z" fill="#075985" opacity="0.6"/>
        <line x1="16" y1="36" x2="16" y2="58" stroke="#78350F" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="48" y1="36" x2="48" y2="58" stroke="#78350F" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="32" y1="38" x2="32" y2="60" stroke="#78350F" stroke-width="2.5" stroke-linecap="round"/>
        <rect x="8" y="24" width="48" height="15" rx="2" fill="#B45309"/>
        <polygon points="6,24 32,8 58,24" fill="#991B1B"/>
        <path d="M0,52 Q16,48 32,52 T64,52" stroke="#BAE6FD" stroke-width="1.5" fill="none"/>
        <path d="M0,58 Q16,55 32,58 T64,58" stroke="#E0F2FE" stroke-width="1.2" fill="none"/>
      </svg>
    `;
  }

  // 2. Penang Hill Funicular & The Habitat
  if (title.includes('penang hill') || block.id === 'd1-penang-hill' || block.id === 'penang-hill-canopy') {
    return `
      <svg class="venue-circle-svg" viewBox="0 0 64 64" width="36" height="36" xmlns="http://www.w3.org/2000/svg" aria-label="Penang Hill">
        <defs>
          <linearGradient id="hillBg-${idSuffix}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#1E293B"/>
            <stop offset="100%" stop-color="#0F172A"/>
          </linearGradient>
        </defs>
        <rect width="64" height="64" fill="url(#hillBg-${idSuffix})"/>
        <circle cx="32" cy="18" r="10" fill="#F59E0B" opacity="0.95"/>
        <polygon points="0,64 24,26 48,64" fill="#14532D"/>
        <polygon points="20,64 44,20 64,64" fill="#166534"/>
        <polygon points="36,64 54,30 64,64" fill="#15803D" opacity="0.8"/>
        <line x1="8" y1="64" x2="56" y2="14" stroke="#DC2626" stroke-width="2.5" stroke-linecap="round"/>
        <rect x="36" y="22" width="12" height="7" rx="1.5" fill="#EF4444" transform="rotate(-40 36 22)"/>
      </svg>
    `;
  }

  // 3. Teochew Chendul & Hawkers
  if (
    title.includes('chendul') ||
    title.includes('cendol') ||
    title.includes('siam road') ||
    title.includes('char koay teow') ||
    block.category === 'meal' ||
    block.category === 'food'
  ) {
    return `
      <svg class="venue-circle-svg" viewBox="0 0 64 64" width="36" height="36" xmlns="http://www.w3.org/2000/svg" aria-label="Penang Hawker Food">
        <defs>
          <linearGradient id="chendulBg-${idSuffix}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#FEF3C7"/>
            <stop offset="100%" stop-color="#FDE68A"/>
          </linearGradient>
        </defs>
        <rect width="64" height="64" fill="url(#chendulBg-${idSuffix})"/>
        <path d="M12,34 C12,50 20,54 32,54 C44,54 52,50 52,34 Z" fill="#0284C7"/>
        <path d="M12,34 Q32,40 52,34" stroke="#0369A1" stroke-width="2" fill="none"/>
        <ellipse cx="32" cy="30" rx="18" ry="12" fill="#FEF08A"/>
        <circle cx="26" cy="24" r="3.5" fill="#DC2626"/>
        <circle cx="34" cy="22" r="3.5" fill="#991B1B"/>
        <path d="M22,28 Q30,22 36,30" stroke="#16A34A" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M28,32 Q34,26 42,32" stroke="#15803D" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      </svg>
    `;
  }

  // 4. The Top Komtar
  if (title.includes('komtar') || title.includes('the top') || block.id.includes('komtar')) {
    return `
      <svg class="venue-circle-svg" viewBox="0 0 64 64" width="36" height="36" xmlns="http://www.w3.org/2000/svg" aria-label="The Top Komtar">
        <defs>
          <linearGradient id="komtarBg-${idSuffix}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#1E293B"/>
            <stop offset="100%" stop-color="#0F172A"/>
          </linearGradient>
        </defs>
        <rect width="64" height="64" fill="url(#komtarBg-${idSuffix})"/>
        <rect x="22" y="10" width="20" height="54" fill="#38BDF8" opacity="0.85" rx="2"/>
        <rect x="26" y="14" width="12" height="50" fill="#0284C7" rx="1"/>
        <path d="M20,18 Q32,8 44,18" stroke="#F59E0B" stroke-width="3" fill="none"/>
        <path d="M22,19 Q32,11 42,19" stroke="#10B981" stroke-width="1.5" fill="none"/>
        <circle cx="32" cy="12" r="2.5" fill="#FFFFFF"/>
      </svg>
    `;
  }

  // 5. ChinaHouse Cafe / Heritage Rest Pocket
  if (title.includes('chinahouse') || block.category === 'rest' || title.includes('cafe')) {
    return `
      <svg class="venue-circle-svg" viewBox="0 0 64 64" width="36" height="36" xmlns="http://www.w3.org/2000/svg" aria-label="Heritage Cafe">
        <defs>
          <linearGradient id="cafeBg-${idSuffix}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#FEF3C7"/>
            <stop offset="100%" stop-color="#FED7AA"/>
          </linearGradient>
        </defs>
        <rect width="64" height="64" fill="url(#cafeBg-${idSuffix})"/>
        <rect x="14" y="16" width="36" height="48" fill="#78350F" rx="2"/>
        <path d="M12,18 L32,6 L52,18 Z" fill="#991B1B"/>
        <rect x="20" y="24" width="8" height="10" fill="#FEF3C7" rx="4"/>
        <rect x="36" y="24" width="8" height="10" fill="#FEF3C7" rx="4"/>
        <path d="M26,44 A6,6 0 0 1 38,44 L38,64 L26,64 Z" fill="#FEF3C7"/>
        <path d="M46,38 Q48,34 46,30" stroke="#EA580C" stroke-width="1.5" fill="none"/>
      </svg>
    `;
  }

  // 6. Nature / Entopia / Batu Ferringhi Beach
  if (title.includes('entopia') || title.includes('batu ferringhi') || title.includes('beach')) {
    return `
      <svg class="venue-circle-svg" viewBox="0 0 64 64" width="36" height="36" xmlns="http://www.w3.org/2000/svg" aria-label="Penang Nature">
        <defs>
          <linearGradient id="beachGrad-${idSuffix}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#F97316"/>
            <stop offset="50%" stop-color="#FDE047"/>
            <stop offset="100%" stop-color="#0284C7"/>
          </linearGradient>
        </defs>
        <rect width="64" height="64" fill="url(#beachGrad-${idSuffix})"/>
        <path d="M14,64 Q24,42 28,32" stroke="#78350F" stroke-width="3" fill="none"/>
        <path d="M28,32 Q20,26 12,30" stroke="#15803D" stroke-width="2.5" fill="none"/>
        <path d="M28,32 Q36,24 44,28" stroke="#15803D" stroke-width="2.5" fill="none"/>
        <path d="M28,32 Q30,20 28,16" stroke="#15803D" stroke-width="2.5" fill="none"/>
        <circle cx="48" cy="22" r="8" fill="#FEF08A"/>
        <path d="M0,54 Q16,50 32,54 T64,54" stroke="#FFFFFF" stroke-width="2" fill="none"/>
      </svg>
    `;
  }

  // Default Fallback
  return `
    <svg class="venue-circle-svg" viewBox="0 0 64 64" width="36" height="36" xmlns="http://www.w3.org/2000/svg" aria-label="Landmark">
      <defs>
        <linearGradient id="artBg-${idSuffix}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#3B82F6"/>
          <stop offset="100%" stop-color="#8B5CF6"/>
        </linearGradient>
      </defs>
      <rect width="64" height="64" fill="url(#artBg-${idSuffix})"/>
      <polygon points="32,14 46,32 32,50 18,32" fill="#FFFFFF" opacity="0.85"/>
      <circle cx="32" cy="32" r="6" fill="#FBBF24"/>
    </svg>
  `;
}
