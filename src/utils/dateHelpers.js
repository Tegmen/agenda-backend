/**
 * Get the start and end date of a week for a given year and week number
 * Uses ISO 8601 week date system (week starts on Monday)
 * @param {number} year - Year
 * @param {number} week - Week number (1-53)
 * @returns {object} Object with startDate and endDate
 */
export function getWeekDateRange(year, week) {
  // January 4th is always in week 1
  const jan4 = new Date(year, 0, 4);

  // Find the Monday of week 1
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - jan4.getDay() + 1);

  // Calculate the Monday of the requested week
  const startDate = new Date(week1Monday);
  startDate.setDate(week1Monday.getDate() + (week - 1) * 7);

  // Calculate the Sunday of the requested week
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  // Set to start of day (00:00:00)
  startDate.setHours(0, 0, 0, 0);
  // Set to end of day (23:59:59)
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
}

/**
 * Get the ISO week number for a given date
 * @param {Date} date - Date object
 * @returns {object} Object with year and week number
 */
export function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNo };
}

/**
 * Parse a date string to a Date object (removes time component)
 * @param {string} dateString - Date string in ISO format (YYYY-MM-DD)
 * @returns {Date} Date object with time set to 00:00:00
 */
export function parseDisplayDate(dateString) {
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  return date;
}
