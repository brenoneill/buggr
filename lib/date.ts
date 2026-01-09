/**
 * Date formatting utilities.
 */

/**
 * Formats a date string into a full human-readable format.
 *
 * @param dateString - ISO date string to format
 * @returns Formatted date string (e.g., "Monday, January 6, 2025 at 02:30 PM")
 */
export function formatFullDate(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formats a date string into a shorter human-readable format.
 *
 * @param dateString - ISO date string to format
 * @returns Formatted date string (e.g., "Dec 17, 2025 at 2:30 PM")
 */
export function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Generates a timestamp string for branch naming.
 *
 * @returns Timestamp in YYYYMMDD-HHMMSS format
 */
export function generateTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

