/**
 * Shared props interface for all icon components.
 */
export interface IconProps {
  /**
   * Tailwind classes for styling the icon.
   * @default "h-5 w-5"
   */
  className?: string;
  /**
   * Accessibility label for screen readers.
   * When provided, removes aria-hidden.
   */
  ariaLabel?: string;
}

