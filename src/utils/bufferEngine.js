/**
 * Buffer & Transit Calculation Engine
 * Recomputes available buffer times between consecutive blocks, recalculates
 * chronological schedule times after dragging/reordering, and flags
 * realistic vs unrealistic transit buffer alerts.
 */

/**
 * Parse time string (e.g. "09:00", "14:30", "02:15 PM", "2:15") to minutes from midnight.
 * Gracefully handles both 24-hour and 12-hour AM/PM formats, plus heuristics for legacy data.
 */
export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const clean = String(timeStr).trim();

  // Check for AM/PM
  const isPM = /pm/i.test(clean);
  const isAM = /am/i.test(clean);
  const parts = clean.replace(/am|pm/gi, '').trim().split(':');

  let hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  // Heuristic for legacy 12-hour values lacking AM/PM (e.g. "02:00", "04:30", "05:00" in afternoon slots)
  if (!isAM && !isPM && hours >= 1 && hours <= 6) {
    hours += 12;
  }

  return hours * 60 + minutes;
}

/**
 * Format minutes from midnight to standard 24h format "HH:MM" (e.g. "09:00", "14:30")
 */
export function minutesTo24(totalMinutes) {
  const mins = Math.max(0, totalMinutes % 1440);
  const hours = Math.floor(mins / 60);
  const m = mins % 60;
  const hh = String(hours).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Format minutes from midnight back to readable 12h time string (e.g. "09:00 AM", "02:30 PM")
 */
export function minutesToTime(totalMinutes) {
  const mins = Math.max(0, totalMinutes % 1440);
  const hours = Math.floor(mins / 60);
  const m = mins % 60;
  const period = hours >= 12 ? 'PM' : 'AM';

  let displayHours = hours % 12;
  if (displayHours === 0) displayHours = 12;

  const hh = String(displayHours).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return `${hh}:${mm} ${period}`;
}

/**
 * Format any time string into a clean, friendly 12h display string (e.g. "9:00 AM", "2:15 PM")
 */
export function formatDisplayTime(timeStr) {
  if (!timeStr) return '';
  const mins = timeToMinutes(timeStr);
  const hours = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const period = hours >= 12 ? 'PM' : 'AM';

  let displayHours = hours % 12;
  if (displayHours === 0) displayHours = 12;

  const mm = String(m).padStart(2, '0');
  return `${displayHours}:${mm} ${period}`;
}

/**
 * Format a duration in minutes into a human-friendly string (e.g. "1h 15m", "45m", "2h")
 */
export function formatDuration(durationMinutes) {
  const total = Math.max(0, durationMinutes || 0);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

/**
 * Recalculate schedule times for an ordered list of blocks on a single day.
 * Preserves each block's planned activity duration while updating start & end times
 * sequentially based on transit windows, guaranteeing strictly chronological times.
 *
 * @param {Array} blocks Reordered array of blocks for a day
 * @param {Number|null} anchorStartMinutes Optional starting time for the day (minutes from midnight)
 * @returns {Array} Updated blocks with chronological startTime and endTime
 */
export function recalculateDaySchedule(blocks, anchorStartMinutes = null) {
  if (!Array.isArray(blocks) || blocks.length === 0) return [];

  // Determine starting time for the first block of the day
  let currentStart = anchorStartMinutes !== null
    ? anchorStartMinutes
    : timeToMinutes(blocks[0].startTime);

  if (!currentStart || currentStart <= 0) {
    currentStart = 9 * 60; // Default 09:00 AM
  }

  return blocks.map((block, index) => {
    // Preserve duration of this block
    const origStart = timeToMinutes(block.startTime);
    const origEnd = timeToMinutes(block.endTime);
    let duration = origEnd - origStart;
    if (duration <= 0) {
      duration = 60; // 1-hour safe fallback
    }

    const startMins = currentStart;
    const endMins = startMins + duration;

    // Next activity begins after this activity's required transit travel time
    const transit = block.transitToNextMinutes !== undefined && block.transitToNextMinutes !== null
      ? Math.max(0, block.transitToNextMinutes)
      : 15;

    currentStart = endMins + transit;

    return {
      ...block,
      startTime: minutesTo24(startMins),
      endTime: minutesTo24(endMins),
    };
  });
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
      startTime: minutesTo24(startMins),
      endTime: minutesTo24(endMins),
    };
  });
}
