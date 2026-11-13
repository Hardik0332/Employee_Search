/**
 * Formats a "YYYY-MM-DD" date string into a readable form.
 * Example: "2022-03-12" → "12 Mar 2022"
 *
 * We split manually instead of using new Date() because
 * Date parsing treats "YYYY-MM-DD" as UTC midnight — which
 * in IST (UTC+5:30) shows the previous day. Splitting avoids
 * that timezone trap entirely.
 */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

