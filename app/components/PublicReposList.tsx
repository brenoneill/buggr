"use client";

import { useState, useEffect } from "react";
import type { GitHubRepo } from "@/lib/github";
import { Button } from "@/app/components/inputs/Button";

interface PublicReposListProps {
  /** Callback when a repo is successfully forked */
  onForkSuccess?: (forkedRepo: GitHubRepo) => void;
}

/**
 * Returns the appropriate Tailwind color class for a programming language.
 *
 * @param language - The programming language name
 * @returns Tailwind background color class
 */
function getLanguageColor(language: string | null): string {
  switch (language) {
    case "TypeScript":
      return "bg-blue-400";
    case "JavaScript":
      return "bg-yellow-400";
    case "Python":
      return "bg-green-400";
    case "Go":
      return "bg-cyan-400";
    case "Rust":
      return "bg-orange-400";
    case "Java":
      return "bg-red-400";
    case "Ruby":
      return "bg-red-500";
    case "PHP":
      return "bg-purple-400";
    case "C#":
      return "bg-green-500";
    case "C++":
      return "bg-pink-400";
    case "C":
      return "bg-gray-400";
    default:
      return "bg-gray-400";
  }
}

/**
 * Displays a list of public repositories available for forking.
 * Fetches repos from the stresst GitHub account.
 *
 * @param onForkSuccess - Callback triggered when a repo is successfully forked
 */
export function PublicReposList({ onForkSuccess }: PublicReposListProps) {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forkingRepo, setForkingRepo] = useState<string | null>(null);
  const [forkError, setForkError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRepos() {
      try {
        const response = await fetch("/api/github/public-repos");
        if (!response.ok) {
          throw new Error("Failed to fetch repos");
        }
        const data = await response.json();
        setRepos(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load repos");
      } finally {
        setLoading(false);
      }
    }

    fetchRepos();
  }, []);

  /**
   * Forks a repository into the user's GitHub account.
   */
  async function handleFork(repo: GitHubRepo) {
    setForkingRepo(repo.full_name);
    setForkError(null);

    try {
      const response = await fetch("/api/github/fork", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: repo.owner.login,
          repo: repo.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fork repository");
      }

      // Call success callback with the forked repo
      if (onForkSuccess && data.repo) {
        onForkSuccess(data.repo);
      }
    } catch (err) {
      setForkError(err instanceof Error ? err.message : "Failed to fork repository");
    } finally {
      setForkingRepo(null);
    }
  }

  if (loading) {
    return (
      <div className="mt-3 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-gh-border" />
          <span className="text-xs font-medium text-gh-text-muted">or fork one of our public repos</span>
          <div className="h-px flex-1 bg-gh-border" />
        </div>
        <div className="flex items-center justify-center py-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gh-border border-t-gh-success" />
        </div>
      </div>
    );
  }

  if (error || repos.length === 0) {
    return null; // Don't show section if no repos available
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-gh-border" />
        <span className="text-xs font-medium text-gh-text-muted">or fork one of our public repos</span>
        <div className="h-px flex-1 bg-gh-border" />
      </div>

      {forkError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {forkError}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {repos.map((repo) => {
          const isForking = forkingRepo === repo.full_name;
          const repoUrl = `https://github.com/${repo.full_name}`;
          
          return (
            <div
              key={repo.id}
              className="flex items-center justify-between rounded-lg border border-gh-border bg-gh-canvas-subtle px-4 py-3"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-sm font-medium text-white">
                  {repo.full_name}
                </span>
                <span className="text-xs text-gh-text-muted">
                  {repo.description || "No description"}
                </span>
                <div className="mt-1 flex items-center gap-3">
                  {repo.language && (
                    <div className="flex items-center gap-1 text-xs text-gh-text-muted">
                      <span className={`h-2.5 w-2.5 rounded-full ${getLanguageColor(repo.language)}`} />
                      {repo.language}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-gh-text-muted">
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    {repo.stargazers_count}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* View on GitHub button */}
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-md border border-gh-border px-2.5 py-1.5 text-xs text-gh-text-muted transition-colors hover:border-gh-text-muted hover:text-white"
                  title="View on GitHub"
                >
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  View
                </a>
                
                {/* Fork button */}
                <Button
                  size="sm"
                  onClick={() => handleFork(repo)}
                  disabled={isForking || forkingRepo !== null}
                  title="Fork to your account"
                >
                  {isForking ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                  )}
                  Fork
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
