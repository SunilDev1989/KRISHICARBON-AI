import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS class names safely, resolving conflicts.
 * Combines clsx (conditional classes) with tailwind-merge (conflict resolution).
 *
 * @param inputs - Class values: strings, arrays, objects, or conditionals
 * @returns A single merged class string with Tailwind conflicts resolved
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-emerald-600', 'bg-gray-100')
 * // → 'px-4 py-2 bg-emerald-600'  (bg-gray-100 removed — conflict resolved)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
