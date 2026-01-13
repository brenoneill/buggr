"use client";

import { useEffect, useCallback } from "react";
import { CloseIcon } from "@/app/components/icons";

interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal content */
  children: React.ReactNode;
  /** Optional max width class (default: "max-w-md") */
  maxWidth?: string;
  /** Whether to show the close button (default: true) */
  showCloseButton?: boolean;
  /** Whether clicking backdrop closes modal (default: true) */
  closeOnBackdrop?: boolean;
  /** Whether pressing Escape closes modal (default: true) */
  closeOnEscape?: boolean;
}

/**
 * Reusable modal component with backdrop, animations, and accessibility features.
 * 
 * @param isOpen - Controls modal visibility
 * @param onClose - Called when modal should close
 * @param children - Content to display inside the modal
 * @param maxWidth - Tailwind max-width class (default: "max-w-md")
 * @param showCloseButton - Whether to show X button (default: true)
 * @param closeOnBackdrop - Close when clicking backdrop (default: true)
 * @param closeOnEscape - Close when pressing Escape (default: true)
 * 
 * @example
 * ```tsx
 * <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
 *   <h2>Modal Title</h2>
 *   <p>Modal content goes here</p>
 * </Modal>
 * ```
 */
export function Modal({
  isOpen,
  onClose,
  children,
  maxWidth = "max-w-md",
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
}: ModalProps) {
  /**
   * Handle Escape key press to close modal.
   */
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape) {
        onClose();
      }
    },
    [onClose, closeOnEscape]
  );

  // Add/remove escape key listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div className={`relative z-10 mx-4 w-full ${maxWidth} animate-in fade-in zoom-in-95 duration-200`}>
        <div className="rounded-xl border border-gh-border bg-gh-canvas-default shadow-2xl">
          {/* Close button */}
          {showCloseButton && (
            <button
              onClick={onClose}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-gh-text-muted transition-colors hover:bg-gh-canvas-subtle hover:text-white"
              aria-label="Close modal"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          )}

          {/* Content */}
          {children}
        </div>
      </div>
    </div>
  );
}
