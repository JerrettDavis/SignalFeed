/**
 * Sanitize a value before writing it to a log line.
 *
 * SECURITY (log injection): user-controlled values written to logs can contain
 * newlines or control characters that forge additional log entries or corrupt
 * log parsing. This strips CR/LF and other control characters and bounds the
 * length.
 */
export const sanitizeForLog = (value: unknown): string => {
  const str = typeof value === "string" ? value : String(value);
  // Replace ASCII control characters (incl. CR/LF) with a single space.
  const cleaned = str.replace(/[\x00-\x1f\x7f]/g, " ");
  return cleaned.length > 200 ? `${cleaned.slice(0, 200)}…` : cleaned;
};
