"use client";

import { ReactNode } from "react";
import { DocumentIcon, CheckIcon, SearchIcon } from "@/app/components/icons";
import { Container } from "@/app/components/Container";

interface EmptyStateProps {
  /**
   * Icon to display (SVG element or component).
   */
  icon: ReactNode;
  /**
   * Main title text.
   */
  title: string;
  /**
   * Optional description text below the title.
   */
  description?: string;
  /**
   * Size variant for the empty state.
   * @default "default"
   */
  size?: "sm" | "default";
}

/**
 * A reusable empty state component for displaying when no data is available.
 *
 * @param icon - Icon element to display
 * @param title - Main heading text
 * @param description - Optional subtext
 * @param size - Size variant (sm for inline, default for centered)
 */
export function EmptyState({ icon, title, description, size = "default" }: EmptyStateProps) {
  if (size === "sm") {
    return (
      <Container className="px-4 py-3 text-sm text-gh-text-muted">
        {title}
      </Container>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gh-border bg-gh-canvas-subtle">
        <div className="h-8 w-8 text-gh-text-muted">{icon}</div>
      </div>
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        {description && <p className="text-xs text-gh-text-muted">{description}</p>}
      </div>
    </div>
  );
}

/**
 * Common icons for empty states.
 * Uses the shared icon components with full sizing.
 */
export const EmptyStateIcons = {
  commits: <DocumentIcon className="h-full w-full" />,
  bugReports: <CheckIcon className="h-full w-full" />,
  search: <SearchIcon className="h-full w-full" />,
};

