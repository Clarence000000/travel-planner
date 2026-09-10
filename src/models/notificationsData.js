/**
 * Trip Notifications Data Model & Persistence
 * Manages travel notifications, transit warnings, schedule alerts,
 * and JSON ingestion for the active trip.
 */

import { getActiveTripId } from './tripsModel.js';

function getStorageKey() {
  const tripId = getActiveTripId() || 'default';
  return `travel_planner_notifications_v1_${tripId}`;
}

const listeners = new Set();

function notifyListeners() {
  const notifs = getNotifications();
  listeners.forEach((fn) => {
    try {
      fn(notifs);
    } catch (e) {
      console.error('[notificationsData] Listener error:', e);
    }
  });
}

/**
 * Get all notifications for current trip. Default is empty (0 new).
 */
export function getNotifications() {
  try {
    const raw = localStorage.getItem(getStorageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('[notificationsData] Error reading notifications:', e);
    return [];
  }
}

/**
 * Save notifications list.
 */
export function saveNotifications(notifications) {
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(notifications));
    notifyListeners();
  } catch (e) {
    console.error('[notificationsData] Error saving notifications:', e);
  }
}

/**
 * Get unread notification count.
 */
export function getUnreadCount() {
  const notifs = getNotifications();
  return notifs.filter((n) => !n.read).length;
}

/**
 * Add a new notification.
 */
export function addNotification({ title, text, type = 'info', time = 'Just now' }) {
  const notifs = getNotifications();
  const newNotif = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: title || 'Trip Alert',
    text: text || '',
    type: ['success', 'warning', 'info', 'alert'].includes(type) ? type : 'info',
    time: time || 'Just now',
    read: false,
    createdAt: new Date().toISOString(),
  };

  notifs.unshift(newNotif);
  saveNotifications(notifs);
  return newNotif;
}

/**
 * Ingest JSON string or object for notifications.
 * Supports:
 * - Single notification object: { "title": "...", "text": "...", "type": "info", "time": "..." }
 * - Array of notifications: [ { ... }, { ... } ]
 * - Object with "notifications" property: { "notifications": [ ... ] }
 */
export function ingestNotificationsJson(input) {
  let parsed = input;
  if (typeof input === 'string') {
    try {
      parsed = JSON.parse(input.trim());
    } catch (err) {
      return { success: false, error: `Invalid JSON format: ${err.message}` };
    }
  }

  let itemsToIngest = [];
  if (Array.isArray(parsed)) {
    itemsToIngest = parsed;
  } else if (parsed && Array.isArray(parsed.notifications)) {
    itemsToIngest = parsed.notifications;
  } else if (parsed && typeof parsed === 'object') {
    itemsToIngest = [parsed];
  } else {
    return { success: false, error: 'JSON must be an object or array of notifications.' };
  }

  if (itemsToIngest.length === 0) {
    return { success: false, error: 'No notification items found in JSON.' };
  }

  const notifs = getNotifications();
  let addedCount = 0;

  itemsToIngest.reverse().forEach((item) => {
    if (!item || typeof item !== 'object') return;
    const title = item.title || item.heading || item.name || 'Trip Alert';
    const text = item.text || item.message || item.desc || item.description || '';
    const type = item.type || item.level || 'info';
    const time = item.time || 'Just now';

    const newNotif = {
      id: item.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title,
      text,
      type: ['success', 'warning', 'info', 'alert'].includes(type) ? type : 'info',
      time,
      read: false,
      createdAt: new Date().toISOString(),
    };
    notifs.unshift(newNotif);
    addedCount++;
  });

  saveNotifications(notifs);
  return { success: true, count: addedCount };
}

/**
 * Mark all notifications as read.
 */
export function markAllAsRead() {
  const notifs = getNotifications().map((n) => ({ ...n, read: true }));
  saveNotifications(notifs);
}

/**
 * Clear all notifications.
 */
export function clearNotifications() {
  saveNotifications([]);
}

/**
 * Delete a single notification by id.
 */
export function deleteNotification(id) {
  const notifs = getNotifications().filter((n) => n.id !== id);
  saveNotifications(notifs);
}

/**
 * Subscribe to notification state changes.
 */
export function onNotificationsChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Sample JSON for user reference / quick copy.
 */
export const SAMPLE_NOTIFICATIONS_JSON = JSON.stringify(
  [
    {
      title: "Senso-ji Visit Confirmed",
      text: "Booked 10:45 AM – 12:30 PM. 2 requirements verified.",
      type: "success",
      time: "Just now"
    },
    {
      title: "Tight Transit Buffer (30m)",
      text: "Day 1: Hotel Check-In to Senso-ji on Subway.",
      type: "warning",
      time: "15m ago"
    },
    {
      title: "Tokyo Weather Forecast",
      text: "Sunny 24°C / 75°F. Ideal for temple walking.",
      type: "info",
      time: "1h ago"
    }
  ],
  null,
  2
);
