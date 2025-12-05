"use client";

import { Button } from "@/app/components/inputs/Button";
import { Card } from "@/app/components/Card";

interface BranchSuccessCardProps {
  /**
   * The name of the successfully created branch.
   */
  branchName: string;
  /**
   * Callback when the card is dismissed.
   */
  onDismiss: () => void;
  /**
   * Callback when "Show Stressed Branch" is clicked.
   */
  onShowBranch: () => void;
}

/**
 * A success card displayed after a branch is created.
 *
 * @param branchName - Name of the created branch
 * @param onDismiss - Callback to dismiss the card
 * @param onShowBranch - Callback to navigate to the branch
 */
export function BranchSuccessCard({ branchName, onDismiss, onShowBranch }: BranchSuccessCardProps) {
  return (
    <Card variant="success">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gh-success-fg">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="text-sm font-medium">Branch created successfully!</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onDismiss}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </Button>
      </div>
      <p className="mb-3 text-xs text-gh-text-muted">
        <code className="rounded bg-gh-border px-1.5 py-0.5 font-mono text-gh-success-fg">
          {branchName}
        </code>
      </p>
      <Button variant="primary" fullWidth onClick={onShowBranch}>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
        Show Stressed Branch
      </Button>
    </Card>
  );
}

