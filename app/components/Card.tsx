"use client";

import { ElementType, ComponentPropsWithoutRef, ReactNode } from "react";

type CardVariant = "default" | "success" | "danger" | "inset";

type CardProps<T extends ElementType = "div"> = {
  /**
   * The element type to render as.
   * @default "div"
   */
  as?: T;
  /**
   * The content to render inside the card.
   */
  children: ReactNode;
  /**
   * Visual style variant of the card.
   * @default "default"
   */
  variant?: CardVariant;
  /**
   * Whether to apply default padding (p-4).
   * @default true
   */
  padded?: boolean;
  /**
   * Additional CSS classes to apply.
   */
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "variant" | "padded" | "className">;

const variantStyles: Record<CardVariant, string> = {
  default: "border-gh-border bg-gh-canvas-subtle",
  success: "border-gh-success/30 bg-gh-success/10",
  danger: "border-gh-danger/30 bg-gh-danger/10",
  inset: "border-gh-border bg-gh-canvas",
};

/**
 * A styled card container component with multiple variants.
 * Uses the GitHub-inspired theme colors for consistent styling.
 *
 * @param as - Element type to render (div, form, section, etc.)
 * @param children - Content to render inside the card
 * @param variant - Visual style variant (default, success, danger, inset)
 * @param padded - Whether to apply default padding
 * @param className - Additional CSS classes
 * @param props - Additional props passed to the underlying element
 */
export function Card<T extends ElementType = "div">({
  as,
  children,
  variant = "default",
  padded = true,
  className = "",
  ...props
}: CardProps<T>) {
  const Component = as || "div";
  const classes = `rounded-lg border ${variantStyles[variant]} ${padded ? "p-4" : ""} ${className}`.trim();

  return (
    <Component className={classes} {...(props as Record<string, unknown>)}>
      {children}
    </Component>
  );
}

