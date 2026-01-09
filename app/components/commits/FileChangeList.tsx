"use client";

import { Container } from "@/app/components/Container";

interface FileChange {
  sha: string;
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  previous_filename?: string;
}

interface FileChangeListProps {
  /**
   * Array of file changes to display.
   */
  files: FileChange[];
}

/**
 * Returns the appropriate color classes for a file status.
 */
function getStatusColor(status: string): { bg: string; text: string; label: string } {
  switch (status) {
    case "added":
      return { bg: "bg-gh-success/20", text: "text-gh-success-fg", label: "A" };
    case "removed":
      return { bg: "bg-gh-danger/20", text: "text-gh-danger-fg", label: "D" };
    case "modified":
      return { bg: "bg-gh-warning/20", text: "text-gh-warning-fg", label: "M" };
    case "renamed":
      return { bg: "bg-gh-text-muted/20", text: "text-gh-text-muted", label: "R" };
    default:
      return { bg: "bg-gh-text-muted/20", text: "text-gh-text-muted", label: "?" };
  }
}

/**
 * A list component displaying changed files with their status and diff stats.
 *
 * @param files - Array of file change objects
 */
export function FileChangeList({ files }: FileChangeListProps) {
  if (files.length === 0) {
    return (
      <Container className="px-4 py-3 text-sm text-gh-text-muted">
        No files changed
      </Container>
    );
  }

  return (
    <Container scrollable>
      {files.map((file) => {
        const statusStyle = getStatusColor(file.status);
        return (
          <div
            key={file.sha + file.filename}
            className="flex items-center gap-3 border-b border-gh-border px-4 py-3 last:border-b-0 hover:bg-gh-border-muted"
          >
            {/* Status Badge */}
            <span
              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-xs font-bold ${statusStyle.bg} ${statusStyle.text}`}
            >
              {statusStyle.label}
            </span>

            {/* Filename */}
            <span className="min-w-0 flex-1 truncate font-mono text-sm text-white">
              {file.status === "renamed" && file.previous_filename ? (
                <>
                  <span className="text-gh-text-muted">{file.previous_filename}</span>
                  <span className="mx-2 text-gh-text-muted">→</span>
                  {file.filename}
                </>
              ) : (
                file.filename
              )}
            </span>

            {/* Changes */}
            <div className="flex flex-shrink-0 items-center gap-2 text-xs">
              {file.additions > 0 && <span className="text-gh-success-fg">+{file.additions}</span>}
              {file.deletions > 0 && <span className="text-gh-danger-fg">-{file.deletions}</span>}
            </div>
          </div>
        );
      })}
    </Container>
  );
}

