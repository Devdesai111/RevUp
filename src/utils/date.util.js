'use strict';

const { startOfWeek, endOfWeek, getWeek, getYear } = require('date-fns');
const { fromZonedTime, toZonedTime } = require('date-fns-tz');

/**
 * getISOWeekKey — returns "YYYY-WW" string for use in Redis keys.
 * @param {Date} date
 * @returns {string}
 */
const getISOWeekKey = (date = new Date()) => {
  const week = String(getWeek(date, { weekStartsOn: 1 })).padStart(2, '0');
  const year = getYear(date);
  return `${year}-${week}`;
};

/**
 * toLocalMidnightUTC — convert a local date string to UTC midnight of that local day.
 * @param {string} dateStr — e.g. "2024-03-15"
 * @param {string} timezone — IANA tz, e.g. "Asia/Kolkata"
 * @returns {Date}
 */
const toLocalMidnightUTC = (dateStr, timezone) => {
  const localMidnight = `${dateStr}T00:00:00`;
  return fromZonedTime(localMidnight, timezone);
};

/**
 * getLocalDayBounds — returns UTC start/end for today in user's timezone.
 * @param {string} timezone
 * @returns {{ startUTC: Date, endUTC: Date }}
 */
const getLocalDayBounds = (timezone) => {
  const now       = new Date();
  const zonedNow  = toZonedTime(now, timezone);
  const dateStr   = zonedNow.toISOString().slice(0, 10);

  const startUTC = toLocalMidnightUTC(dateStr, timezone);
  const endUTC   = new Date(startUTC.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { startUTC, endUTC };
};

/**
 * getWeekBounds — returns Monday–Sunday UTC bounds for the current local week.
 * @param {string} timezone
 * @returns {{ startUTC: Date, endUTC: Date }}
 */
const getWeekBounds = (timezone) => {
  const now      = new Date();
  const zonedNow = toZonedTime(now, timezone);

  const monday   = startOfWeek(zonedNow, { weekStartsOn: 1 });
  const sunday   = endOfWeek(zonedNow,   { weekStartsOn: 1 });

  const mondayStr = monday.toISOString().slice(0, 10);
  const sundayStr = sunday.toISOString().slice(0, 10);

  const startUTC = fromZonedTime(`${mondayStr}T00:00:00`, timezone);
  const endUTC   = fromZonedTime(`${sundayStr}T23:59:59`, timezone);

  return { startUTC, endUTC };
};

module.exports = { getISOWeekKey, toLocalMidnightUTC, getLocalDayBounds, getWeekBounds };
