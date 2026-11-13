/**
 * Extracts initials from a full name — used for avatar
 * placeholders when there's no profile photo.
 *
 * Examples:
 *   "Rahul Sharma"        → "RS"
 *   "Priya"               → "P"
 *   "A. P. J. Abdul Kalam" → "AK"  (first + last)
 *   ""                    → "?"
 */
export function getInitials(name) {
  if (!name || !name.trim()) return "?";

  const parts = name.trim().split(/\s+/).filter(Boolean);
  // Take first and last parts at most — "John Michael Doe" → "JD"
  const picks = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts;
  return picks.map((word) => word[0].toUpperCase()).join("");
}

