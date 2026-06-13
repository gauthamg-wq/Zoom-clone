/** True when the ISO string already includes a timezone offset or Z. */
const HAS_TIMEZONE = /(?:[zZ]|[+-]\d{2}:?\d{2})$/;

/**
 * Parse datetimes from the API. Values are stored as UTC in SQLite and
 * serialized without a trailing Z, which would otherwise be read as local time.
 */
export function parseApiDateTime(value: string): Date {
  const trimmed = value.trim();
  const normalized = HAS_TIMEZONE.test(trimmed) ? trimmed : `${trimmed}Z`;
  return new Date(normalized);
}
