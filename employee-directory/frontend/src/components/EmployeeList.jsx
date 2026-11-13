/**
 * EmployeeList — responsive card grid.
 *
 * 1 column on mobile, 2 on tablet (md), 3 on desktop (lg).
 * Each card animates in via CSS (animate-fade-in on EmployeeCard).
 */

import { EmployeeCard } from "./EmployeeCard";

export function EmployeeList({ employees, searchTerm }) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {employees.map((emp) => (
        <EmployeeCard key={emp.id} employee={emp} searchTerm={searchTerm} />
      ))}
    </div>
  );
}

