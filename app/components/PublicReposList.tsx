"use client";

import { useState, useEffect } from "react";
import type { GitHubRepo } from "@/lib/github";
import { Button } from "@/app/components/inputs/Button";
import { GitHubIcon, StarIcon, ForkIcon } from "@/app/components/icons";

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
                    <StarIcon className="h-3.5 w-3.5" />
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
                  <GitHubIcon className="h-3.5 w-3.5" />
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
                    <ForkIcon className="h-3.5 w-3.5" />
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
