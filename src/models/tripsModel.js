/**
 * Multi-Trip Data Model & Persistence
 * Supports multiple itineraries with clean zero-state initialization.
 */

const STORAGE_KEY_TRIPS = 'travel_planner_trips_list_v1';
const STORAGE_KEY_ACTIVE_TRIP = 'travel_planner_active_trip_id_v1';

const tripListeners = new Set();

function notifyListeners() {
  const trips = getTrips();
  const activeTrip = getActiveTrip();
  tripListeners.forEach((listener) => {
    try {
      listener(trips, activeTrip);
    } catch (err) {
      console.error('[tripsModel] Listener error:', err);
    }
  });
}

/**
 * Get all trips. Automatically deduplicates records for identical destination & dates,
 * and defaults to an empty list on a clean slate.
 */
export function getTrips() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRIPS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Deduplicate any trips with identical destination and date range
    const seen = new Set();
    const uniqueTrips = [];
    for (const trip of parsed) {
      if (!trip || !trip.id) continue;
      const destKey = (trip.destination || '').toLowerCase().trim();
      const key = `${destKey}|${trip.startDate || ''}|${trip.endDate || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueTrips.push(trip);
      }
    }

    // If duplicate records were found and pruned, save the cleaned array back
    if (uniqueTrips.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY_TRIPS, JSON.stringify(uniqueTrips));
    }

    return uniqueTrips;
  } catch (err) {
    console.error('[tripsModel] Failed to load trips:', err);
    return [];
  }
}

/**
 * Save trips list to localStorage.
 */
export function saveTrips(trips) {
  try {
    localStorage.setItem(STORAGE_KEY_TRIPS, JSON.stringify(trips));
    notifyListeners();
  } catch (err) {
    console.error('[tripsModel] Failed to save trips:', err);
  }
}

/**
 * Get current active trip ID.
 */
export function getActiveTripId() {
  try {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_TRIP) || null;
  } catch {
    return null;
  }
}

/**
 * Get the active trip object or null if none selected.
 */
export function getActiveTrip() {
  const activeId = getActiveTripId();
  if (!activeId) return null;
  const trips = getTrips();
  return trips.find((t) => t.id === activeId) || null;
}

/**
 * Set the active trip ID.
 */
export function setActiveTripId(tripId) {
  try {
    if (tripId) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_TRIP, tripId);
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_TRIP);
    }
    notifyListeners();
    window.dispatchEvent(new CustomEvent('trip:selected', { detail: { tripId } }));
  } catch (err) {
    console.error('[tripsModel] Failed to set active trip ID:', err);
  }
}

/**
 * Create a new trip and set it active.
 * Guards against duplicate trip creation: if a trip with the same destination and date range already exists,
 * updates and activates it rather than creating a duplicate entry.
 */
export function createTrip({
  title = 'Penang Food & Heritage Exploration',
  destination = 'Penang, Malaysia',
  startDate = '2026-10-12',
  endDate = '2026-10-14',
  totalDays = 3,
  coverImage = './src/assets/bg-itinerary.png',
  members = ['You'],
} = {}) {
  const trips = getTrips();

  // Deduplication guard: if an identical trip destination & date range exists, update and activate it
  const destKey = (destination || '').toLowerCase().trim();
  const existingIndex = trips.findIndex(
    (t) =>
      (t.destination || '').toLowerCase().trim() === destKey &&
      t.startDate === startDate &&
      t.endDate === endDate
  );
  if (existingIndex >= 0) {
    trips[existingIndex] = {
      ...trips[existingIndex],
      title: title || trips[existingIndex].title,
      totalDays: Number(totalDays) || trips[existingIndex].totalDays || 3,
      coverImage: coverImage || trips[existingIndex].coverImage,
      members: members && members.length ? members : trips[existingIndex].members,
    };
    saveTrips(trips);
    setActiveTripId(trips[existingIndex].id);
    return trips[existingIndex];
  }

  const id = `trip-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  
  const newTrip = {
    id,
    title,
    destination,
    startDate,
    endDate,
    totalDays: Number(totalDays) || 3,
    coverImage,
    members,
    createdAt: new Date().toISOString(),
  };

  // Clean any old chat or itinerary keys for this new ID
  try {
    localStorage.removeItem(`travel_planner_chat_${id}`);
    localStorage.removeItem(`travel_planner_itinerary_${id}`);
    localStorage.removeItem(`travel_planner_settings_${id}`);
    localStorage.removeItem(`travel_planner_wishlist_${id}`);
    localStorage.removeItem('travel_planner_chat_v6');
  } catch (e) {}

  trips.unshift(newTrip);
  saveTrips(trips);
  setActiveTripId(id);

  window.dispatchEvent(new CustomEvent('trip:created', { detail: { trip: newTrip, tripId: id } }));
  return newTrip;
}

/**
 * Update an existing trip.
 */
export function updateTrip(tripId, updates) {
  const trips = getTrips();
  const index = trips.findIndex((t) => t.id === tripId);
  if (index === -1) return null;

  trips[index] = { ...trips[index], ...updates };
  saveTrips(trips);
  return trips[index];
}

/**
 * Delete a trip.
 */
export function deleteTrip(tripId) {
  let trips = getTrips();
  trips = trips.filter((t) => t.id !== tripId);
  saveTrips(trips);

  try {
    localStorage.removeItem(`travel_planner_chat_${tripId}`);
    localStorage.removeItem(`travel_planner_itinerary_${tripId}`);
    localStorage.removeItem(`travel_planner_settings_${tripId}`);
    localStorage.removeItem(`travel_planner_wishlist_${tripId}`);
    localStorage.removeItem(`travel_planner_notifications_${tripId}`);
  } catch (e) {}

  if (getActiveTripId() === tripId) {
    const nextTripId = trips.length > 0 ? trips[0].id : null;
    setActiveTripId(nextTripId);
    if (!nextTripId) {
      try {
        localStorage.removeItem('travel_planner_chat_v6');
        localStorage.removeItem('travel_planner_itinerary_v3');
      } catch (e) {}
    }
  }

  window.dispatchEvent(new CustomEvent('trip:deleted', { detail: { tripId } }));
}

/**
 * Reset all trips to pure clean slate (0 trips, no active trip).
 */
export function clearAllTrips() {
  try {
    const trips = getTrips();
    trips.forEach((t) => {
      localStorage.removeItem(`travel_planner_chat_${t.id}`);
      localStorage.removeItem(`travel_planner_itinerary_${t.id}`);
      localStorage.removeItem(`travel_planner_settings_${t.id}`);
      localStorage.removeItem(`travel_planner_wishlist_${t.id}`);
      localStorage.removeItem(`travel_planner_notifications_${t.id}`);
    });
    localStorage.removeItem('travel_planner_chat_v6');
    localStorage.removeItem('travel_planner_itinerary_v3');
    localStorage.removeItem(STORAGE_KEY_TRIPS);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_TRIP);
    notifyListeners();
    window.dispatchEvent(new CustomEvent('trip:deleted', { detail: { all: true } }));
  } catch (err) {
    console.error('[tripsModel] Failed to clear trips:', err);
  }
}

/**
 * Subscribe to trip changes.
 */
export function subscribeTrips(listener) {
  tripListeners.add(listener);
  return () => tripListeners.delete(listener);
}
