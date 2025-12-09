"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

type TextButtonVariant = "default" | "danger";

interface TextButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The content to render inside the button.
   */
  children: ReactNode;
  /**
   * The visual style variant of the button.
   * @default "default"
   */
  variant?: TextButtonVariant;
}

const variantStyles: Record<TextButtonVariant, string> = {
  default: "text-gh-text-muted hover:text-white hover:bg-gh-canvas-subtle",
  danger: "text-gh-text-muted hover:text-gh-danger-fg hover:bg-gh-danger/20",
};

/**
 * A lightweight text button for secondary actions.
 * Simpler than the main Button component, for ghost-style actions.
 *
 * @param children - Content to render inside the button
 * @param variant - Visual style variant (default, danger)
 * @param props - Standard button HTML attributes
 */
export function TextButton({
  children,
  variant = "default",
  className = "",
  disabled,
  ...props
}: TextButtonProps) {
  return (
    <button
      className={`flex items-center gap-1 rounded px-2 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantStyles[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

