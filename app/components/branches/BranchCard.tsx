"use client";

import type { GitHubBranch } from "@/lib/github";
import type { BranchBuggerInfo } from "@/app/hooks/useRepoBranchSelector";
import { BuggrIcon, TrophyIcon } from "@/app/components/icons";

interface BranchCardProps {
  /**
   * The branch data to display.
   */
  branch: GitHubBranch;
  /**
   * Whether this branch is currently selected.
   */
  isSelected: boolean;
  /**
   * Callback when the branch is clicked.
   */
  onClick: () => void;
  /**
   * Optional bugger information for this branch.
   */
  buggerInfo?: BranchBuggerInfo;
}

/**
 * Checks if a branch name indicates it's a buggr-created branch.
 *
 * @param name - The branch name to check
 * @returns Whether the branch is a buggr branch
 */
function isBuggrBranch(name: string): boolean {
  return name.includes("buggr-");
}

/**
 * Returns the color class for a grade.
 *
 * @param grade - The grade string (A+, A, B, C, D, F)
 * @returns Tailwind color class
 */
function getGradeColor(grade: string): string {
  const letter = grade.charAt(0).toUpperCase();
  switch (letter) {
    case "A":
      return "text-gh-success";
    case "B":
      return "text-blue-400";
    case "C":
      return "text-yellow-400";
    case "D":
      return "text-orange-400";
    case "F":
      return "text-gh-danger-fg";
    default:
      return "text-gh-text-muted";
  }
}

/**
 * Returns the background color class for a grade badge.
 *
 * @param grade - The grade string (A+, A, B, C, D, F)
 * @returns Tailwind background color class
 */
function getGradeBgColor(grade: string): string {
  const letter = grade.charAt(0).toUpperCase();
  switch (letter) {
    case "A":
      return "bg-gh-success/20";
    case "B":
      return "bg-blue-400/20";
    case "C":
      return "bg-yellow-400/20";
    case "D":
      return "bg-orange-400/20";
    case "F":
      return "bg-gh-danger/20";
    default:
      return "bg-gh-border";
  }
}

/**
 * A card component displaying a single branch with status indicators.
 *
 * @param branch - The GitHub branch data
 * @param isSelected - Whether this branch is selected
 * @param onClick - Click handler for selection
 * @param buggerInfo - Optional bugger/analysis info for this branch
 */
export function BranchCard({ branch, isSelected, onClick, buggerInfo }: BranchCardProps) {
  const isBuggr = isBuggrBranch(branch.name);
  const hasGrade = buggerInfo?.hasAnalysis && buggerInfo?.grade;

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 border-b border-gh-border p-3 text-left transition-colors last:border-b-0 hover:bg-gh-border-muted ${
        isSelected ? "bg-gh-success/10 hover:bg-gh-success/15" : ""
      }`}
    >
      {/* Branch Icon */}
      <div className="flex-shrink-0">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            isBuggr
              ? "bg-gh-danger/20 text-gh-danger-fg"
              : "bg-gh-border text-gh-text-muted"
          }`}
        >
          <BuggrIcon className="h-4 w-4" />
        </div>
      </div>

      {/* Branch Details */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate font-mono text-sm font-medium text-white">
          {branch.name}
        </p>
        <div className="flex items-center gap-2 text-xs text-gh-text-muted">
          {branch.protected && (
            <span className="flex items-center gap-1">
              <span>🔒</span>
              <span>Protected</span>
            </span>
          )}
          {isBuggr && !hasGrade && (
            <span className="rounded bg-gh-danger/20 px-1.5 py-0.5 text-gh-danger-fg">
              Buggered
            </span>
          )}
          {!branch.protected && !isBuggr && (
            <span className="text-gh-text-muted">
              {branch.commit.sha.substring(0, 7)}
            </span>
          )}
        </div>
      </div>

      {/* Grade Badge */}
      {hasGrade && (
        <div
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${getGradeBgColor(buggerInfo.grade!)}`}
          title={`Completed with grade ${buggerInfo.grade}`}
        >
          <TrophyIcon className={`h-3.5 w-3.5 ${getGradeColor(buggerInfo.grade!)}`} />
          <span className={`text-xs font-bold ${getGradeColor(buggerInfo.grade!)}`}>
            {buggerInfo.grade}
          </span>
        </div>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <div className="flex items-center">
          <div className="h-2 w-2 rounded-full bg-gh-success" />
        </div>
      )}
    </button>
  );
}
