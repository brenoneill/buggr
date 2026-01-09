"use client";

import { ReactNode } from "react";

interface ContainerProps {
  /**
   * The content to render inside the container.
   */
  children: ReactNode;
  /**
   * Additional CSS classes to apply.
   */
  className?: string;
  /**
   * Whether the container should be scrollable (adds flex-1 overflow-y-auto).
   * @default false
   */
  scrollable?: boolean;
}

/**
 * A styled container/wrapper component for grouping content.
 * Uses the GitHub-inspired theme colors for consistent styling.
 *
 * @param children - Content to render inside the container
 * @param className - Additional CSS classes
 * @param scrollable - Whether to enable scrolling behavior
 */
export function Container({ children, className = "", scrollable = false }: ContainerProps) {
  return (
    <div
      className={`rounded-lg border border-gh-border bg-gh-canvas-subtle ${
        scrollable ? "flex-1 overflow-y-auto" : ""
      } ${className}`.trim()}
    >
      {children}
    </div>
  );
}

