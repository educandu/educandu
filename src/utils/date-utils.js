import { DAY_OF_WEEK } from '../domain/constants.js';

export function getDayOfWeek(date) {
  const day = date.getDay();
  switch (day) {
    case 0:
      return DAY_OF_WEEK.sunday;
    case 1:
      return DAY_OF_WEEK.monday;
    case 2:
      return DAY_OF_WEEK.tuesday;
    case 3:
      return DAY_OF_WEEK.wednesday;
    case 4:
      return DAY_OF_WEEK.thursday;
    case 5:
      return DAY_OF_WEEK.friday;
    case 6:
      return DAY_OF_WEEK.saturday;
    default:
      return null;
  }
}

export function dateToNumericDay(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return year * 10000 + month * 100 + day;
}

export function getStartOfDay(date) {
  const result = new Date(date);
  result.setUTCHours(0, 0, 0, 0);
  return result;
}

export function addDays(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function parseDaysOfWeek(value) {
  return (value || '')
    .split('')
    .map(stringValue => Number.parseInt(stringValue, 10))
    .filter(numberValue => !isNaN(numberValue) && numberValue > 0 && numberValue < 8);
}

// For values created with: new Date().getTime()
export function parseTime(value) {
  // Only accept numbers or strings
  if (typeof value !== 'number' && typeof value !== 'string') {
    return null;
  }

  // For strings, check if it exactly represents a positive integer (no whitespace, no extra characters)
  if (typeof value === 'string') {
    if (!/^\d+$/.test(value)) {
      return null;
    }
  }

  const timestamp = Number.parseInt(value, 10);
  if (Number.isNaN(timestamp) || timestamp < 0) {
    return null;
  }

  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date;
}
