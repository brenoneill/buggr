"use client";

import { useState, useEffect, useRef } from "react";
import { useNotes } from "@/app/context/NotesContext";
import { Button } from "@/app/components/inputs/Button";
import { EmptyState, EmptyStateIcons } from "@/app/components/EmptyState";
import {
  BellIcon,
  CloseIcon,
  GitHubIcon,
  ExternalLinkIcon,
  LightningIcon,
  CheckIcon,
  CopyIcon,
  DocumentIcon,
} from "@/app/components/icons";

type NotificationTab = "bug-reports" | "branch-changes";

/**
 * Notes toggle button component for use in headers/navbars.
 * Shows unread count badge when there are unread notes or branch changes.
 */
export function NotesButton({ onClick }: { onClick: () => void }) {
  const { unreadCount, unreadBranchChangesCount } = useNotes();
  const totalUnread = unreadCount + unreadBranchChangesCount;

  return (
    <button
      onClick={onClick}
      className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-gh-border bg-gh-canvas-subtle text-gh-text-muted transition-colors hover:border-gh-text-muted hover:text-white"
      title="Notifications"
    >
      <BellIcon className="h-4 w-4" />
      {totalUnread > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gh-danger text-[10px] font-bold text-white">
          {totalUnread > 9 ? "9+" : totalUnread}
        </span>
      )}
    </button>
  );
}

/**
 * Notes panel component that displays notifications about stressed branches.
 * Shows as a slide-out panel from the right side with tabs for Bug Reports and Branch Changes.
 */
export function NotesPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationTab>("bug-reports");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const {
    notes,
    branchChanges,
    unreadCount,
    unreadBranchChangesCount,
    markAsRead,
    markBranchChangeAsRead,
    markAllAsRead,
    markAllBranchChangesAsRead,
    clearNotes,
    clearBranchChanges,
  } = useNotes();
  const prevNotesCountRef = useRef(notes.length);
  const prevBranchChangesCountRef = useRef(branchChanges.length);

  // Auto-open panel when a new note is added
  useEffect(() => {
    if (notes.length > prevNotesCountRef.current) {
      setIsOpen(true);
      setActiveTab("bug-reports");
    }
    prevNotesCountRef.current = notes.length;
  }, [notes.length]);

  // Auto-open panel when a new branch change is added
  useEffect(() => {
    if (branchChanges.length > prevBranchChangesCountRef.current) {
      setIsOpen(true);
      setActiveTab("branch-changes");
    }
    prevBranchChangesCountRef.current = branchChanges.length;
  }, [branchChanges.length]);

  /**
   * Generates a shareable message from a note.
   */
  function generateShareMessage(note: typeof notes[0]): string {
    const branchUrl = getBranchUrl(note.repoName, note.branchName, note.repoOwner);
    let message = `🐛 Bug Report\n\n`;
    
    if (note.branchName) {
      message += `Branch: ${note.branchName}\n`;
    }
    if (branchUrl) {
      message += `Link: ${branchUrl}\n`;
    }
    
    message += `\nReported Issues:\n`;
    note.messages.forEach((msg, i) => {
      message += `${i + 1}. ${msg}\n`;
    });
    
    message += `\nPlease investigate and fix these issues.`;
    
    return message;
  }

  /**
   * Copies note message to clipboard and shows feedback.
   */
  async function copyToClipboard(noteId: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(noteId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  /**
   * Formats a date to a relative time string.
   */
  function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  }

  /**
   * Generates a GitHub branch URL from repo and branch names.
   */
  function getBranchUrl(repoName?: string, branchName?: string, repoOwner?: string): string | null {
    if (!repoName || !branchName || !repoOwner) return null;
    return `https://github.com/${repoOwner}/${repoName}/tree/${encodeURIComponent(branchName)}`;
  }

  return (
    <>
      {/* Header Button */}
      <NotesButton onClick={() => setIsOpen(true)} />

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9998] bg-black/50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Notes Panel */}
      <div
        className={`fixed right-0 top-0 z-[9999] h-full w-96 transform border-l border-gh-border bg-gh-canvas shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gh-border px-4 py-4">
          <div className="flex items-center gap-2">
            <BellIcon className="h-5 w-5 text-gh-text-muted" />
            <h2 className="text-lg font-semibold text-white">Notifications</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
          >
            <CloseIcon className="h-5 w-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gh-border">
          <button
            onClick={() => setActiveTab("bug-reports")}
            className={`relative flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "bug-reports"
                ? "text-white"
                : "text-gh-text-muted hover:text-white"
            }`}
          >
            <LightningIcon className="h-4 w-4" />
            Bug Reports
            {unreadCount > 0 && (
              <span className="rounded-full bg-gh-danger/20 px-1.5 py-0.5 text-[10px] text-gh-danger-fg">
                {unreadCount}
              </span>
            )}
            {activeTab === "bug-reports" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gh-accent" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("branch-changes")}
            className={`relative flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "branch-changes"
                ? "text-white"
                : "text-gh-text-muted hover:text-white"
            }`}
          >
            <DocumentIcon className="h-4 w-4" />
            Branch Changes
            {unreadBranchChangesCount > 0 && (
              <span className="rounded-full bg-gh-accent/20 px-1.5 py-0.5 text-[10px] text-gh-accent">
                {unreadBranchChangesCount}
              </span>
            )}
            {activeTab === "branch-changes" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gh-accent" />
            )}
          </button>
        </div>

        {/* Actions - Bug Reports */}
        {activeTab === "bug-reports" && notes.length > 0 && (
          <div className="flex items-center justify-end gap-2 border-b border-gh-border px-4 py-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-gh-accent hover:underline"
              >
                Mark all as read
              </button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearNotes}
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Actions - Branch Changes */}
        {activeTab === "branch-changes" && branchChanges.length > 0 && (
          <div className="flex items-center justify-end gap-2 border-b border-gh-border px-4 py-2">
            {unreadBranchChangesCount > 0 && (
              <button
                onClick={markAllBranchChangesAsRead}
                className="text-xs text-gh-accent hover:underline"
              >
                Mark all as read
              </button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearBranchChanges}
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="h-[calc(100%-10rem)] overflow-y-auto">
          {/* Bug Reports Tab */}
          {activeTab === "bug-reports" && (
            <>
              {notes.length === 0 ? (
                <EmptyState
                  icon={EmptyStateIcons.bugReports}
                  title="No bug reports yet"
                  description="Stress a branch to see reports here"
                />
              ) : (
                <div className="flex flex-col">
                  {notes.map((note) => {
                    const branchUrl = getBranchUrl(note.repoName, note.branchName, note.repoOwner);
                    
                    return (
                      <div
                        key={note.id}
                        onClick={() => markAsRead(note.id)}
                        className={`cursor-pointer border-b border-gh-border p-4 transition-colors hover:bg-gh-canvas-subtle ${
                          !note.read ? "bg-gh-danger/5" : ""
                        }`}
                      >
                        {/* Note Header */}
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {!note.read && (
                              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-gh-danger" />
                            )}
                            <h3 className="text-sm font-medium text-white">{note.title}</h3>
                          </div>
                          <span className="flex-shrink-0 text-xs text-gh-text-muted">
                            {formatRelativeTime(note.timestamp)}
                          </span>
                        </div>

                        {/* Branch/Repo Info with Link */}
                        {(note.branchName || note.repoName) && (
                          <div className="mb-3">
                            {branchUrl ? (
                              <a
                                href={branchUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 rounded-md border border-gh-border bg-gh-canvas-subtle px-2 py-1 text-xs text-gh-accent transition-colors hover:border-gh-accent hover:bg-gh-accent/10"
                              >
                                <GitHubIcon className="h-3 w-3" />
                                <span className="font-mono">{note.branchName}</span>
                                <ExternalLinkIcon className="h-3 w-3" />
                              </a>
                            ) : (
                              <div className="flex items-center gap-2 text-xs text-gh-text-muted">
                                <LightningIcon className="h-3 w-3" />
                                <code className="rounded bg-gh-border px-1.5 py-0.5 font-mono">
                                  {note.repoName && `${note.repoName}/`}
                                  {note.branchName}
                                </code>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Messages */}
                        <ul className="space-y-1.5">
                          {note.messages.map((message, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-gh-text">
                              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gh-danger-fg" />
                              {message}
                            </li>
                          ))}
                        </ul>

                        {/* Copy to Clipboard Button */}
                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(note.id, generateShareMessage(note));
                            }}
                            className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors ${
                              copiedId === note.id
                                ? "bg-gh-success/20 text-gh-success-fg"
                                : "text-gh-text-muted hover:bg-gh-border hover:text-white"
                            }`}
                          >
                            {copiedId === note.id ? (
                              <>
                                <CheckIcon className="h-3.5 w-3.5" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <CopyIcon className="h-3.5 w-3.5" />
                                Copy to Clipboard
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Branch Changes Tab */}
          {activeTab === "branch-changes" && (
            <>
              {branchChanges.length === 0 ? (
                <EmptyState
                  icon={EmptyStateIcons.commits}
                  title="No branch changes yet"
                  description="File changes from stressed branches will appear here"
                />
              ) : (
                <div className="flex flex-col">
                  {branchChanges.map((change) => {
                    const branchUrl = getBranchUrl(change.repoName, change.branchName, change.repoOwner);
                    
                    return (
                      <div
                        key={change.id}
                        onClick={() => markBranchChangeAsRead(change.id)}
                        className={`cursor-pointer border-b border-gh-border p-4 transition-colors hover:bg-gh-canvas-subtle ${
                          !change.read ? "bg-gh-accent/5" : ""
                        }`}
                      >
                        {/* Header */}
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {!change.read && (
                              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-gh-accent" />
                            )}
                            <h3 className="text-sm font-medium text-white">Branch Stressed</h3>
                          </div>
                          <span className="flex-shrink-0 text-xs text-gh-text-muted">
                            {formatRelativeTime(change.timestamp)}
                          </span>
                        </div>

                        {/* Branch Link */}
                        <div className="mb-3">
                          {branchUrl ? (
                            <a
                              href={branchUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 rounded-md border border-gh-border bg-gh-canvas-subtle px-2 py-1 text-xs text-gh-accent transition-colors hover:border-gh-accent hover:bg-gh-accent/10"
                            >
                              <GitHubIcon className="h-3 w-3" />
                              <span className="font-mono">{change.branchName}</span>
                              <ExternalLinkIcon className="h-3 w-3" />
                            </a>
                          ) : (
                            <code className="rounded bg-gh-border px-1.5 py-0.5 font-mono text-xs text-gh-text-muted">
                              {change.branchName}
                            </code>
                          )}
                        </div>

                        {/* Message */}
                        <p className="mb-3 text-sm text-gh-text-muted">{change.message}</p>

                        {/* Files Changed */}
                        <div className="space-y-2">
                          {change.files
                            .filter((f) => f.success)
                            .map((fileResult) => (
                              <div
                                key={fileResult.file}
                                className="rounded border border-gh-border bg-gh-canvas-subtle p-2 text-xs"
                              >
                                <div className="font-mono text-white">{fileResult.file}</div>
                                {fileResult.changes && fileResult.changes.length > 0 && (
                                  <ul className="mt-1 list-inside list-disc text-gh-text-muted">
                                    {fileResult.changes.map((changeDesc, i) => (
                                      <li key={i}>{changeDesc}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
