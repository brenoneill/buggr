"use client";

import { ComponentType } from "react";
import { IconProps } from "@/app/components/icons/types";

interface ToggleOption<T extends string> {
  /**
   * The value of the option.
   */
  value: T;
  /**
   * The display label for the option.
   */
  label: string;
  /**
   * Optional icon component to display before the label.
   */
  icon?: ComponentType<IconProps>;
}

interface ToggleGroupProps<T extends string> {
  /**
   * Array of options to render in the toggle group.
   */
  options: ToggleOption<T>[];
  /**
   * The currently selected value.
   */
  value: T;
  /**
   * Callback fired when the selected value changes.
   */
  onChange: (value: T) => void;
  /**
   * Whether the toggle group is disabled.
   * @default false
   */
  disabled?: boolean;
}

/**
 * A segmented control component for toggling between mutually exclusive options.
 * Similar to a radio group but with a pill-style visual treatment.
 *
 * @param options - Array of options with value, label, and optional icon
 * @param value - Currently selected value
 * @param onChange - Callback when selection changes
 * @param disabled - Whether the entire group is disabled
 */
export function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
}: ToggleGroupProps<T>) {
  return (
    <div className="flex items-center justify-center gap-1 p-1 rounded-lg bg-gh-canvas-subtle">
      {options.map((option, index) => {
        const isSelected = option.value === value;
        const Icon = option.icon;

        return (
          <div key={option.value} className="contents">
            {index > 0 && <div className="w-px h-5 bg-gh-border" />}
            <button
              type="button"
              onClick={() => onChange(option.value)}
              disabled={disabled}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                isSelected
                  ? "bg-gh-border-muted text-white shadow-sm ring-1 ring-gh-border"
                  : "text-gh-text-muted hover:text-white"
              }`}
            >
              {Icon && <Icon className="inline-block h-3 w-3 mr-1.5" />}
              {option.label}
            </button>
          </div>
        );
      })}
    </div>
  );
}

