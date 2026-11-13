/**
 * EmployeeCard — displays one employee's details.
 *
 * Presentational only: gets data through props, never fetches.
 * Avatar color is derived from the name hash so the same
 * person always gets the same color (no randomness).
 */

import { Mail, Briefcase, Calendar } from "lucide-react";
import { getInitials } from "../utils/getInitials";
import { formatDate } from "../utils/formatDate";

// ── Avatar colors ────────────────────────────────────────────
// Hand-picked Tailwind palette — enough variety to feel unique,
// all with white text contrast
const AVATAR_COLORS = [
  "bg-rose-500",    "bg-pink-500",   "bg-fuchsia-500",
  "bg-purple-500",  "bg-violet-500", "bg-indigo-500",
  "bg-blue-500",    "bg-sky-500",    "bg-cyan-500",
  "bg-teal-500",    "bg-emerald-500","bg-green-500",
  "bg-amber-500",   "bg-orange-500",
];

function avatarColor(name) {
  // Simple hash — consistent for the same name every time
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ── Search-term highlighting ─────────────────────────────────
function highlight(text, term) {
  if (!term) return text;
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return text;

  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-sm bg-amber-200/70 text-inherit dark:bg-amber-400/25">
        {text.slice(idx, idx + term.length)}
      </mark>
      {text.slice(idx + term.length)}
    </>
  );
}

export function EmployeeCard({ employee, searchTerm }) {
  const initials = getInitials(employee.name);
  const color = avatarColor(employee.name);

  return (
    <article
      className="animate-fade-in group rounded-2xl border border-gray-100 bg-white p-5
                 shadow-sm transition-all duration-200
                 hover:-translate-y-1 hover:shadow-md
                 dark:border-gray-700/60 dark:bg-gray-800"
    >
      {/* Top row: avatar + name & designation */}
      <div className="flex items-start gap-4">
        <div
          className={`${color} flex h-12 w-12 shrink-0 items-center justify-center
                      rounded-full text-sm font-bold text-white shadow-inner`}
          aria-hidden="true"
        >
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">
            {highlight(employee.name, searchTerm)}
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <Briefcase className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{employee.designation}</span>
          </p>
        </div>
      </div>

      {/* Details row: email, department badge, join date */}
      <div className="mt-3 space-y-2 pl-16">
        <p className="flex items-center gap-1.5 truncate text-sm text-gray-500 dark:text-gray-400">
          <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {employee.email}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5
                        text-xs font-medium text-indigo-700
                        dark:bg-indigo-500/10 dark:text-indigo-300"
          >
            {highlight(employee.department, searchTerm)}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
            <Calendar className="h-3 w-3" aria-hidden="true" />
            Joined {formatDate(employee.date_of_joining)}
          </span>
        </div>
      </div>
    </article>
  );
}

