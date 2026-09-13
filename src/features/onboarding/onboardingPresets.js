/**
 * Preset Social Reel catalogs and date helpers for Onboarding.
 */

export const REEL_PRESETS = {
  penangfoodie: {
    creator: '@penangfoodie',
    title: '5 Must-Visit Heritage Spots & Sunset Lookouts',
    url: 'https://www.instagram.com/reel/C8x9_penang_heritage',
    tag: 'Verified Scan',
    views: '3.8M',
    anchors: [
      {
        id: 'anchor-chew-jetty',
        title: 'Clan Jetties (Chew Jetty) Morning Heritage Walk',
        location: 'Chew Jetty, Weld Quay, George Town',
        day: 1,
        startTime: '09:30',
        endTime: '11:00',
        timeSlot: '09:30 – 11:00',
        category: 'activity',
        tag: 'Heritage Walk',
        icon: '📍',
        notes: 'Historic 19th-century Chinese waterfront settlement on wooden stilts.',
      },
      {
        id: 'anchor-penang-hill',
        title: 'Penang Hill Funicular & The Habitat Sunset Canopy Walk',
        location: 'Bukit Bendera, Air Itam',
        day: 1,
        startTime: '16:30',
        endTime: '19:00',
        timeSlot: '16:30 – 19:00',
        category: 'activity',
        tag: 'Nature & Sunset',
        icon: '📍',
        notes: 'Ride historical funicular railway to 833m peak; sunset at The Habitat.',
      },
    ],
  },
  penangvibes: {
    creator: '@penangvibes',
    title: 'George Town Colonial Streets & Street Art',
    url: 'https://www.instagram.com/reel/C8_georgetown_heritage',
    tag: 'Trending Scan',
    views: '1.9M',
    anchors: [
      {
        id: 'anchor-chew-jetty',
        title: 'Clan Jetties (Chew Jetty) Morning Heritage Walk',
        location: 'Chew Jetty, Weld Quay, George Town',
        day: 1,
        startTime: '09:30',
        endTime: '11:00',
        timeSlot: '09:30 – 11:00',
        category: 'activity',
        tag: 'Heritage Walk',
        icon: '📍',
        notes: 'Historic 19th-century Chinese waterfront settlement on wooden stilts.',
      },
      {
        id: 'anchor-blue-mansion',
        title: 'Cheong Fatt Tze (The Blue Mansion) Heritage Tour',
        location: '14 Leith Street, George Town',
        day: 1,
        startTime: '11:30',
        endTime: '13:00',
        timeSlot: '11:30 – 13:00',
        category: 'activity',
        tag: 'Colonial Architecture',
        icon: '📍',
        notes: 'Award-winning indigo-blue heritage mansion tour with courtyard acoustics.',
      },
      {
        id: 'anchor-penang-hill',
        title: 'Penang Hill Funicular & The Habitat Sunset Canopy Walk',
        location: 'Bukit Bendera, Air Itam',
        day: 1,
        startTime: '16:30',
        endTime: '19:00',
        timeSlot: '16:30 – 19:00',
        category: 'activity',
        tag: 'Nature & Sunset',
        icon: '📍',
        notes: 'Ride historical funicular railway to 833m peak; sunset at The Habitat.',
      },
    ],
  },
};

export function addDaysToDate(startDateStr, numDays) {
  if (!startDateStr) return '2026-10-14';
  const parts = startDateStr.split('-').map(Number);
  if (parts.length !== 3) return '2026-10-14';
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  d.setUTCDate(d.getUTCDate() + numDays);
  return d.toISOString().split('T')[0];
}

export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
