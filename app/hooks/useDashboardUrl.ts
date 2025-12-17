"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export interface DashboardUrlParams {
  repo: string | null;
  branch: string | null;
  commit: string | null;
  score: boolean;
}

interface UseDashboardUrlReturn {
  /** Current URL parameters */
  params: DashboardUrlParams;
  /** Whether the URL has been read and initialized */
  isInitialized: boolean;
  /** Update one or more URL parameters */
  updateParams: (updates: Partial<DashboardUrlParams>) => void;
  /** Clear all URL parameters */
  clearParams: () => void;
}

/**
 * Custom hook for managing dashboard URL state.
 * Handles reading, writing, and syncing URL parameters for the dashboard.
 * 
 * Supported URL parameters:
 * - repo: Full repository name (owner/repo)
 * - branch: Branch name
 * - commit: Commit SHA (full or short)
 * - score: Whether to show the score panel (true/false)
 * 
 * @returns Object with params, isInitialized flag, and update functions
 * 
 * @example
 * ```tsx
 * const { params, isInitialized, updateParams } = useDashboardUrl();
 * 
 * // Read initial params
 * if (isInitialized && params.repo) {
 *   selectRepo(params.repo);
 * }
 * 
 * // Update params when state changes
 * updateParams({ repo: "owner/repo", branch: "main" });
 * ```
 */
export function useDashboardUrl(): UseDashboardUrlReturn {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isInitialized, setIsInitialized] = useState(false);
  const [params, setParams] = useState<DashboardUrlParams>({
    repo: null,
    branch: null,
    commit: null,
    score: false,
  });

  // Use refs to keep stable references for the callback functions
  const searchParamsRef = useRef(searchParams);
  const pathnameRef = useRef(pathname);
  const routerRef = useRef(router);

  // Keep refs up to date
  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  /**
   * Parse current URL parameters into typed object.
   */
  const parseParams = useCallback((): DashboardUrlParams => {
    const sp = searchParamsRef.current;
    return {
      repo: sp.get("repo"),
      branch: sp.get("branch"),
      commit: sp.get("commit"),
      score: sp.get("score") === "true",
    };
  }, []);

  /**
   * Update URL parameters without triggering a page reload.
   * This function is stable (won't change on re-renders).
   */
  const updateParams = useCallback(
    (updates: Partial<DashboardUrlParams>) => {
      const newParams = new URLSearchParams(searchParamsRef.current.toString());

      if (updates.repo !== undefined) {
        if (updates.repo) newParams.set("repo", updates.repo);
        else newParams.delete("repo");
      }
      if (updates.branch !== undefined) {
        if (updates.branch) newParams.set("branch", updates.branch);
        else newParams.delete("branch");
      }
      if (updates.commit !== undefined) {
        if (updates.commit) newParams.set("commit", updates.commit);
        else newParams.delete("commit");
      }
      if (updates.score !== undefined) {
        if (updates.score) newParams.set("score", "true");
        else newParams.delete("score");
      }

      const currentPathname = pathnameRef.current;
      const newUrl = newParams.toString() ? `${currentPathname}?${newParams.toString()}` : currentPathname;
      routerRef.current.replace(newUrl, { scroll: false });

      // Update local state
      setParams((prev) => ({ ...prev, ...updates }));
    },
    [] // No dependencies - uses refs for stable reference
  );

  /**
   * Clear all URL parameters.
   * This function is stable (won't change on re-renders).
   */
  const clearParams = useCallback(() => {
    routerRef.current.replace(pathnameRef.current, { scroll: false });
    setParams({ repo: null, branch: null, commit: null, score: false });
  }, []); // No dependencies - uses refs for stable reference

  /**
   * Initialize params from URL on mount.
   */
  useEffect(() => {
    if (!isInitialized) {
      setParams(parseParams());
      setIsInitialized(true);
    }
  }, [isInitialized, parseParams]);

  return {
    params,
    isInitialized,
    updateParams,
    clearParams,
  };
}

