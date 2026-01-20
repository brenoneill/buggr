"use client";

import type { GitHubCommit } from "@/lib/github";

interface CommitCardProps {
  /**
   * The commit data to display.
   */
  commit: GitHubCommit;
  /**
   * Whether this commit is currently selected.
   */
  isSelected: boolean;
  /**
   * Callback when the commit is clicked.
   */
  onClick: () => void;
}

/**
 * Formats a date string to a relative time (e.g., "2 hours ago").
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

/**
 * A card component displaying a single commit with author info and message.
 *
 * @param commit - The GitHub commit data
 * @param isSelected - Whether this commit is selected
 * @param onClick - Click handler for selection
 */
export function CommitCard({ commit, isSelected, onClick }: CommitCardProps) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full gap-3 border-b border-gh-border p-3 text-left transition-colors last:border-b-0 hover:bg-gh-border-muted ${
        isSelected ? "bg-gh-success/10 hover:bg-gh-success/15" : ""
      }`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {commit.author?.avatar_url ? (
          <img
            src={commit.author.avatar_url}
            alt={commit.author.login}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gh-border text-xs text-gh-text-muted">
            {commit.commit.author.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Commit Details */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-sm font-medium text-white">
          {commit.commit.message.split("\n")[0]}
        </p>
        <div className="flex items-center gap-2 text-xs text-gh-text-muted">
          <span>{commit.author?.login ?? commit.commit.author.name}</span>
          <span>•</span>
          <span>{formatRelativeTime(commit.commit.author.date)}</span>
        </div>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="flex items-center">
          <div className="h-2 w-2 rounded-full bg-gh-success" />
        </div>
      )}
    </button>
  );
}
