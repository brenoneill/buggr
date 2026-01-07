import type { IconProps } from "./types";

/**
 * Buggr logo icon - a code-bug caterpillar made of stacked angle brackets < >.
 * Combines programming syntax with a caterpillar/bug shape.
 * Uses stroke="currentColor" to inherit text color from parent.
 *
 * @param className - Tailwind classes for styling
 * @param ariaLabel - Accessibility label (optional)
 */
export function BuggrIcon({ className = "h-5 w-5", ariaLabel }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
    >
      {/* Antennae - like // comment slashes */}
      <path d="M9.5 4 L7.5 1" />
      <path d="M14.5 4 L16.5 1" />
      
      {/* Head segment - small < > */}
      <path d="M9.5 4 L12 6.5 L14.5 4" />
      <path d="M9.5 4 L12 1.5 L14.5 4" />
      
      {/* Middle segment - medium < > */}
      <path d="M7.5 9 L12 13 L16.5 9" />
      <path d="M7.5 9 L12 5 L16.5 9" />
      
      {/* Bottom/rear segment - large < > */}
      <path d="M5 16 L12 22 L19 16" />
      <path d="M5 16 L12 10 L19 16" />
    </svg>
  );
}

