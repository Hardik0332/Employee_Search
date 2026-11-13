/**
 * EmployeeList — responsive card grid.
 *
 * 1 column on mobile, 2 on tablet (md), 3 on desktop (lg).
 * Each card animates in via CSS (animate-fade-in on EmployeeCard).
 * Uses progressive rendering when list size is large (e.g. 50,000 "Show All")
 * to keep the browser responsive at 60 FPS while rendering thousands of items.
 */

import { useState, useEffect, useRef } from "react";
import { EmployeeCard } from "./EmployeeCard";

const CHUNK_SIZE = 60; // Initial and batch size for DOM nodes

export function EmployeeList({ employees, searchTerm }) {
  // If list is small (normal pagination 20, 50, 100), render all directly.
  // If "Show All" with 50,000 items, progressively render so DOM doesn't freeze.
  const [renderedCount, setRenderedCount] = useState(
    Math.min(employees.length, CHUNK_SIZE)
  );
  const sentinelRef = useRef(null);

  // Reset rendered count whenever employees list changes (new search or filter)
  useEffect(() => {
    setRenderedCount(Math.min(employees.length, CHUNK_SIZE));
  }, [employees]);

  // Observer to load more cards into DOM as the user scrolls down
  useEffect(() => {
    if (renderedCount >= employees.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setRenderedCount((prev) => Math.min(prev + CHUNK_SIZE, employees.length));
        }
      },
      { rootMargin: "300px" } // Load ahead before reaching bottom
    );

    const sentinel = sentinelRef.current;
    if (sentinel) observer.observe(sentinel);

    return () => {
      if (sentinel) observer.unobserve(sentinel);
    };
  }, [renderedCount, employees.length]);

  const visibleEmployees = employees.slice(0, renderedCount);

  return (
    <>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleEmployees.map((emp) => (
          <EmployeeCard key={emp.id} employee={emp} searchTerm={searchTerm} />
        ))}
      </div>
      {/* Sentinel for progressive infinite DOM scroll when viewing all */}
      {renderedCount < employees.length && (
        <div ref={sentinelRef} className="h-10 w-full" />
      )}
    </>
  );
}
