const httpError = require('./httpError');

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}/;

const isValidObjectId = (id) => typeof id === 'string' && OBJECT_ID_PATTERN.test(id);
const isValidEmail = (email) => typeof email === 'string' && EMAIL_PATTERN.test(email);

const assertObjectId = (id, label) => {
  if (!isValidObjectId(id)) {
    throw httpError(400, `Invalid ${label} ID`);
  }
};

// Required, non-empty string. Returns the trimmed value.
const requireString = (value, label) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw httpError(400, `${label} is required`);
  }
  return value.trim();
};

// Optional string. Returns '' when missing.
const optionalString = (value) => (typeof value === 'string' ? value.trim() : '');

// Optional email. Returns '' when missing, throws when present but invalid.
const optionalEmail = (value) => {
  const email = optionalString(value).toLowerCase();
  if (email && !isValidEmail(email)) {
    throw httpError(400, 'Email is not valid');
  }
  return email;
};

// Required number (accepts a number or a numeric string).
const parseNumber = (value, label) => {
  if (value === undefined || value === null || value === '') {
    throw httpError(400, `${label} is required`);
  }
  if (typeof value !== 'number' && typeof value !== 'string') {
    throw httpError(400, `${label} must be a number`);
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw httpError(400, `${label} must be a number`);
  }
  return number;
};

// True when the YYYY-MM-DD part of the string is a real calendar day.
// (JavaScript would silently turn 2026-02-31 into 2026-03-03.)
const isRealCalendarDay = (value) => {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const check = new Date(Date.UTC(year, month - 1, day));
  return (
    check.getUTCFullYear() === year &&
    check.getUTCMonth() === month - 1 &&
    check.getUTCDate() === day
  );
};

// Required date in YYYY-MM-DD (or full ISO) format.
const parseDate = (value, label) => {
  if (value === undefined || value === null || value === '') {
    throw httpError(400, `${label} is required`);
  }
  const looksValid = typeof value === 'string' && DATE_PATTERN.test(value) && isRealCalendarDay(value);
  const date = looksValid ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    throw httpError(400, `${label} must be a valid date (YYYY-MM-DD)`);
  }
  return date;
};

module.exports = {
  isValidObjectId,
  isValidEmail,
  assertObjectId,
  requireString,
  optionalString,
  optionalEmail,
  parseNumber,
  parseDate,
};
