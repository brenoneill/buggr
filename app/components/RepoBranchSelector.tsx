"use client";

import { useState } from "react";
import type { GitHubRepo, GitHubBranch } from "@/lib/github";

interface RepoBranchSelectorProps {
  repos: GitHubRepo[];
  accessToken: string;
}

/**
 * Interactive component for selecting a repository and viewing its branches.
 * 
 * @param repos - List of user's GitHub repositories
 * @param accessToken - GitHub OAuth access token for fetching branches
 */
export function RepoBranchSelector({ repos, accessToken }: RepoBranchSelectorProps) {
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches branches for the selected repository.
   */
  async function handleRepoSelect(repo: GitHubRepo) {
    setSelectedRepo(repo);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/github/branches?owner=${repo.owner.login}&repo=${repo.name}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch branches");
      }
      
      const data = await response.json();
      setBranches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      {/* Repository Selector */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-[#8b949e]">
          Select a repository
        </label>
        <div className="relative">
          <select
            className="w-full appearance-none rounded-lg border border-[#30363d] bg-[#161b22] px-4 py-3 pr-10 text-white transition-colors focus:border-[#238636] focus:outline-none focus:ring-1 focus:ring-[#238636]"
            value={selectedRepo?.id ?? ""}
            onChange={(e) => {
              const repo = repos.find((r) => r.id === Number(e.target.value));
              if (repo) handleRepoSelect(repo);
            }}
          >
            <option value="">Choose a repository...</option>
            {repos.map((repo) => (
              <option key={repo.id} value={repo.id}>
                {repo.full_name} {repo.private ? "🔒" : ""}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              className="h-5 w-5 text-[#8b949e]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Branches List */}
      {selectedRepo && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-[#8b949e]">
            Branches in {selectedRepo.name}
          </h3>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#30363d] border-t-[#238636]" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400">
              {error}
            </div>
          ) : branches.length === 0 ? (
            <div className="rounded-lg border border-[#30363d] bg-[#161b22] px-4 py-3 text-[#8b949e]">
              No branches found
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto rounded-lg border border-[#30363d] bg-[#161b22]">
              {branches.map((branch) => (
                <div
                  key={branch.name}
                  className="flex items-center justify-between border-b border-[#30363d] px-4 py-3 last:border-b-0 hover:bg-[#21262d]"
                >
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 text-[#8b949e]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                    <span className="font-mono text-sm text-white">
                      {branch.name}
                    </span>
                  </div>
                  {branch.protected && (
                    <span className="rounded-full bg-[#238636]/20 px-2 py-0.5 text-xs text-[#238636]">
                      protected
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

