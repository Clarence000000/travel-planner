/**
 * Buffer & Transit Calculation Engine
 * Recomputes available buffer times between consecutive blocks and flags
 * realistic vs unrealistic transit buffer alerts.
 */

/**
 * Parse time string (e.g. "09:00", "14:30", "02:15 PM") to minutes from midnight
 */
export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const clean = timeStr.trim();

  // Check for AM/PM
  const isPM = /pm/i.test(clean);
  const isAM = /am/i.test(clean);
  const parts = clean.replace(/am|pm/gi, '').trim().split(':');

  let hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  // If 24h format was already supplied (e.g. "14:30"), hours is already >= 12
  return hours * 60 + minutes;
}

/**
 * Format minutes from midnight back to readable 12h time string (e.g. "09:00 AM", "02:30 PM")
 */
export function minutesToTime(totalMinutes) {
  let mins = Math.max(0, totalMinutes % 1440);
  let hours = Math.floor(mins / 60);
  const m = mins % 60;
  const period = hours >= 12 ? 'PM' : 'AM';

  let displayHours = hours % 12;
  if (displayHours === 0) displayHours = 12;

  const hh = String(displayHours).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return `${hh}:${mm} ${period}`;
}

/**
 * Calculate transit buffers and alerts for an ordered array of blocks
 * @param {Array} blocks Chronologically ordered blocks for a single day
 * @returns {Array} Augmented blocks with .transitBuffer info
 */
export function calculateItineraryBuffers(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) return [];

  return blocks.map((block, index) => {
    const nextBlock = blocks[index + 1];
    if (!nextBlock) {
      return {
        ...block,
        transitBuffer: null, // End of the day
      };
    }

    const currentEnd = timeToMinutes(block.endTime);
    const nextStart = timeToMinutes(nextBlock.startTime);
    const availableBufferMinutes = nextStart - currentEnd;
    const requiredTransitMinutes = block.transitToNextMinutes || 15;

    const isDeficit = availableBufferMinutes < requiredTransitMinutes;

    return {
      ...block,
      transitBuffer: {
        availableMinutes: availableBufferMinutes,
        requiredMinutes: requiredTransitMinutes,
        isDeficit,
        transitMode: block.transitMode || 'Transit to next spot',
        warningMessage: isDeficit
          ? `Transit Alert: Only ${Math.max(0, availableBufferMinutes)}m allocated for ${requiredTransitMinutes}m travel (${block.transitMode || 'transit'}).`
          : null,
      },
    };
  });
}

/**
 * Auto-shift subsequent blocks after a block is modified or moved
 * @param {Array} blocks 
 * @param {Number} fromIndex 
 * @param {Number} deltaMinutes 
 */
export function shiftSubsequentBlocks(blocks, fromIndex, deltaMinutes) {
  return blocks.map((block, idx) => {
    if (idx <= fromIndex) return block;

    const startMins = timeToMinutes(block.startTime) + deltaMinutes;
    const endMins = timeToMinutes(block.endTime) + deltaMinutes;

    return {
      ...block,
      startTime: minutesToTime(startMins),
      endTime: minutesToTime(endMins),
    };
  });
}
