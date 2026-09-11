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
 * Get all trips. Defaults to an empty list on a clean slate.
 */
export function getTrips() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRIPS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
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
  } catch (err) {
    console.error('[tripsModel] Failed to set active trip ID:', err);
  }
}

/**
 * Create a new trip and set it active.
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

  trips.unshift(newTrip);
  saveTrips(trips);
  setActiveTripId(id);
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
  } catch (e) {}

  if (getActiveTripId() === tripId) {
    setActiveTripId(trips.length > 0 ? trips[0].id : null);
  }
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
    });
    localStorage.removeItem("travel_planner_chat_v6");
    localStorage.removeItem(STORAGE_KEY_TRIPS);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_TRIP);
    notifyListeners();
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
