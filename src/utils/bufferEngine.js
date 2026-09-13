/**
 * Buffer & Transit Calculation Engine
 * Recomputes available buffer times between consecutive blocks, recalculates
 * chronological schedule times after dragging/reordering, and flags
 * realistic vs unrealistic transit buffer alerts.
 */

/**
 * Parse time string (e.g. "09:00", "14:30", "02:15 PM", "2:15") to minutes from midnight.
 * Gracefully handles both 24-hour ("HH:MM") and 12-hour AM/PM formats strictly without
 * unexpected hour-shifting heuristics.
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

  // Fallback to 09:00 AM if start time is invalid or overnight (10 PM to 6 AM)
  if (!currentStart || currentStart <= 0 || currentStart >= 22 * 60 || currentStart < 6 * 60) {
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
 * Calculate available buffer windows and alert on transit deficits.
 * For each block (except the last), buffer = (nextBlock.startTime - thisBlock.endTime).
 * Deficit occurs if buffer < transitToNextMinutes.
 *
 * @param {Array} blocks Chronological array of blocks for a day
 * @returns {Array} Blocks enriched with transitBuffer metadata
 */
/**
 * Swap time slots between two blocks on a single day.
 * Preserves each activity's duration while exchanging their scheduled start times.
 * If an earlier activity extends past the next activity's start time,
 * downstream activities are cleanly cascaded forward to prevent time collisions.
 *
 * @param {Array} blocks Current blocks for the day
 * @param {string} sourceId ID of dragged block
 * @param {string} targetId ID of target block
 * @returns {Array} Updated array of blocks in chronological order
 */
export function swapBlockTimeSlots(blocks, sourceId, targetId) {
  if (!Array.isArray(blocks) || blocks.length < 2) return blocks;

  const sourceIndex = blocks.findIndex((b) => b.id === sourceId);
  const targetIndex = blocks.findIndex((b) => b.id === targetId);

  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
    return blocks;
  }

  const newBlocks = blocks.map((b) => ({ ...b }));
  const source = newBlocks[sourceIndex];
  const target = newBlocks[targetIndex];

  // Calculate durations for both blocks
  const sourceStartMins = timeToMinutes(source.startTime);
  const sourceEndMins = timeToMinutes(source.endTime);
  const sourceDuration = Math.max(30, sourceEndMins - sourceStartMins);

  const targetStartMins = timeToMinutes(target.startTime);
  const targetEndMins = timeToMinutes(target.endTime);
  const targetDuration = Math.max(30, targetEndMins - targetStartMins);

  // Exchange start times
  const newSourceStartMins = targetStartMins;
  const newTargetStartMins = sourceStartMins;

  source.startTime = minutesTo24(newSourceStartMins);
  source.endTime = minutesTo24(newSourceStartMins + sourceDuration);

  target.startTime = minutesTo24(newTargetStartMins);
  target.endTime = minutesTo24(newTargetStartMins + targetDuration);

  // Sort chronological by start time
  newBlocks.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  // Resolve any downstream overlaps cleanly while preserving activity durations
  for (let i = 0; i < newBlocks.length - 1; i++) {
    const currentEnd = timeToMinutes(newBlocks[i].endTime);
    const minBuffer = newBlocks[i].transitToNextMinutes !== undefined && newBlocks[i].transitToNextMinutes !== null
      ? Math.max(10, newBlocks[i].transitToNextMinutes)
      : 15;
    const earliestNextStart = currentEnd + minBuffer;

    const nextStart = timeToMinutes(newBlocks[i + 1].startTime);
    if (nextStart < earliestNextStart) {
      const nextEnd = timeToMinutes(newBlocks[i + 1].endTime);
      const nextDuration = Math.max(30, nextEnd - nextStart);
      newBlocks[i + 1].startTime = minutesTo24(earliestNextStart);
      newBlocks[i + 1].endTime = minutesTo24(earliestNextStart + nextDuration);
    }
  }

  return newBlocks;
}

export function calculateItineraryBuffers(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) return [];

  return blocks.map((block, index) => {
    if (index === blocks.length - 1) {
      // Last item on the day has no subsequent transit
      return {
        ...block,
        transitBuffer: null,
      };
    }

    const nextBlock = blocks[index + 1];
    const thisEnd = timeToMinutes(block.endTime);
    const nextStart = timeToMinutes(nextBlock.startTime);

    // Available gap between activities
    let availableBufferMinutes = nextStart - thisEnd;
    if (availableBufferMinutes < 0) {
      availableBufferMinutes = 0; // Overlapping or negative buffer
    }

    const requiredMinutes = block.transitToNextMinutes !== undefined && block.transitToNextMinutes !== null
      ? block.transitToNextMinutes
      : 15;

    const isDeficit = availableBufferMinutes < requiredMinutes;
    const deficitMinutes = isDeficit ? requiredMinutes - availableBufferMinutes : 0;

    return {
      ...block,
      transitBuffer: {
        availableMinutes: availableBufferMinutes,
        requiredMinutes: requiredMinutes,
        isDeficit: isDeficit,
        deficitMinutes: deficitMinutes,
        transitMode: block.transitMode || 'Transit',
      },
    };
  });
}
