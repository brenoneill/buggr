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

