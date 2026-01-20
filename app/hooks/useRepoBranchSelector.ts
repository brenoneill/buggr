"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { GitHubRepo, GitHubBranch, GitHubCommit, GitHubCommitDetails, StressMetadata } from "@/lib/github";
import { fetchStressMetadata } from "@/lib/github";
import { generateTimestamp } from "@/lib/date";
import { useDashboardState } from "@/app/hooks/useDashboardState";
import { notificationsQueryKey } from "@/app/hooks/useNotifications";
import { useUser, userQueryKey } from "@/app/hooks/useUser";
import { useBuggers, type Bugger } from "@/app/hooks/useBuggers";
import { useNotes } from "@/app/context/NotesContext";
import { LOADING_STEPS } from "@/app/components/stress/loading-steps";

/**
 * Information about a branch's bugger status.
 * Used to show analysis status on branch cards.
 */
export interface BranchBuggerInfo {
  /** Whether this branch is a buggered branch */
  hasBugger: boolean;
  /** The bugger's grade if analysis was completed */
  grade: string | null;
  /** Whether analysis has been completed */
  hasAnalysis: boolean;
  /** The stress level used */
  stressLevel: string | null;
  /** The bugger ID for linking */
  buggerId: string | null;
}

export interface UseRepoBranchSelectorProps {
  initialRepos: GitHubRepo[];
  accessToken: string;
}

export interface UseRepoBranchSelectorReturn {
  // Repos
  repos: GitHubRepo[];
  selectedRepo: GitHubRepo | null;
  handleRepoSelect: (repo: GitHubRepo) => Promise<void>;
  handleForkSuccess: (forkedRepo: GitHubRepo) => void;

  // Branches
  branches: GitHubBranch[];
  selectedBranch: string | null;
  loadingBranches: boolean;
  handleBranchSelect: (branchName: string) => Promise<void>;

  // Commits
  commits: GitHubCommit[];
  selectedCommit: GitHubCommit | null;
  commitDetails: GitHubCommitDetails | null;
  loadingCommits: boolean;
  loadingDetails: boolean;
  handleCommitSelect: (commit: GitHubCommit) => Promise<void>;

  // Computed commit helpers
  startCommit: GitHubCommit | undefined;
  completeCommit: GitHubCommit | undefined;
  canCheckScore: boolean;

  // Branch creation
  showCreateBranch: boolean;
  setShowCreateBranch: (show: boolean) => void;
  branchSuffix: string;
  setBranchSuffix: (suffix: string) => void;
  stressContext: string;
  setStressContext: (context: string) => void;
  stressLevel: "low" | "medium" | "high" | "custom";
  setStressLevel: (level: "low" | "medium" | "high" | "custom") => void;
  customFilesCount: number;
  setCustomFilesCount: (count: number) => void;
  customBugCount: number;
  setCustomBugCount: (count: number) => void;
  creatingBranch: boolean;
  loadingStep: number;
  loadingSteps: typeof LOADING_STEPS;
  timestamp: string;
  handleCreateBranch: (e: React.FormEvent) => Promise<void>;

  // Branch success
  branchSuccess: string | null;
  setBranchSuccess: (name: string | null) => void;

  // Branch deletion
  deletingBranch: boolean;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (show: boolean) => void;
  handleDeleteBranch: () => Promise<void>;
  deletingAllBranches: boolean;
  showDeleteAllConfirm: boolean;
  setShowDeleteAllConfirm: (show: boolean) => void;
  handleDeleteAllBuggeredBranches: () => Promise<void>;

  // Branch link
  copiedBranchLink: boolean;
  handleCopyBranchLink: () => Promise<void>;

  // Score panel
  showScorePanel: boolean;
  setShowScorePanel: (show: boolean) => void;
  stressMetadata: StressMetadata | null;
  loadingMetadata: boolean;

  // Error
  error: string | null;
  setError: (error: string | null) => void;

  // Clear all
  handleClearSelection: () => void;

  // User
  user: ReturnType<typeof useUser>["user"];

  // Buggers
  branchBuggerMap: Map<string, BranchBuggerInfo>;
}

/**
 * Custom hook that encapsulates all state and handlers for the RepoBranchSelector component.
 * Manages repository selection, branch operations, commit viewing, and branch creation.
 *
 * @param initialRepos - List of user's GitHub repositories
 * @param accessToken - GitHub OAuth access token for fetching data
 * @returns All state and handlers needed by the RepoBranchSelector UI
 */
export function useRepoBranchSelector({
  initialRepos,
  accessToken,
}: UseRepoBranchSelectorProps): UseRepoBranchSelectorReturn {
  const { openPanel } = useNotes();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { buggers } = useBuggers({ limit: 100 });

  // URL state via nuqs
  const {
    repo: urlRepo,
    branch: urlBranch,
    commit: urlCommit,
    showScore: urlShowScore,
    setRepo: setUrlRepo,
    setBranch: setUrlBranch,
    setCommit: setUrlCommit,
    setShowScore: setUrlShowScore,
    clearAll: clearUrlParams,
  } = useDashboardState();

  // Core state
  const [repos, setRepos] = useState<GitHubRepo[]>(initialRepos);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<GitHubCommit | null>(null);
  const [commitDetails, setCommitDetails] = useState<GitHubCommitDetails | null>(null);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create branch state
  const [showCreateBranch, setShowCreateBranch] = useState(false);
  const [branchSuffix, setBranchSuffix] = useState("");
  const [stressContext, setStressContext] = useState("");
  const [stressLevel, setStressLevel] = useState<"low" | "medium" | "high" | "custom">("low");
  const [customFilesCount, setCustomFilesCount] = useState(1);
  const [customBugCount, setCustomBugCount] = useState(1);
  const [creatingBranch, setCreatingBranch] = useState(false);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [branchSuccess, setBranchSuccess] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState(() => generateTimestamp());
  const [deletingBranch, setDeletingBranch] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedBranchLink, setCopiedBranchLink] = useState(false);
  const [deletingAllBranches, setDeletingAllBranches] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  // Score panel state
  const [showScorePanel, setShowScorePanel] = useState(false);
  const [stressMetadata, setStressMetadata] = useState<StressMetadata | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  // Refs for tracking initialization
  const hasInitialized = useRef(false);
  const isRestoringFromUrl = useRef(false);
  const lastAutoShowBranch = useRef<string | null>(null);

  // Computed values
  const startCommit = commits.find(
    (c) => c.commit.message.toLowerCase().includes("start") || c.commit.message.toLowerCase().includes("run")
  );

  const completeCommit = commits.find(
    (c) =>
      c.commit.message.toLowerCase().includes("complete") ||
      c.commit.message.toLowerCase().includes("done") ||
      c.commit.message.toLowerCase().includes("stop") ||
      c.commit.message.toLowerCase().includes("end")
  );

  const canCheckScore = Boolean(startCommit && completeCommit);

  /**
   * Creates a map from branch name to bugger info for the current repo.
   * Allows BranchCard to display analysis status and grades.
   */
  const branchBuggerMap = useMemo(() => {
    const map = new Map<string, BranchBuggerInfo>();
    
    if (!selectedRepo || buggers.length === 0) return map;
    
    // Filter buggers for the current repo
    const repoBuggers = buggers.filter(
      (b) => b.owner === selectedRepo.owner.login && b.repo === selectedRepo.name
    );
    
    // Map each bugger's branchName to its info
    for (const bugger of repoBuggers) {
      map.set(bugger.branchName, {
        hasBugger: true,
        grade: bugger.result?.grade ?? bugger.grade ?? null,
        hasAnalysis: Boolean(bugger.result),
        stressLevel: bugger.stressLevel,
        buggerId: bugger.id,
      });
    }
    
    return map;
  }, [selectedRepo, buggers]);

  // ============================================
  // Handlers
  // ============================================

  /**
   * Fetches branches for the selected repository.
   */
  const handleRepoSelect = useCallback(async (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    setSelectedBranch(null);
    setSelectedCommit(null);
    setCommitDetails(null);
    setCommits([]);
    setLoadingBranches(true);
    setError(null);
    setShowScorePanel(false);

    try {
      const response = await fetch(`/api/github/branches?owner=${repo.owner.login}&repo=${repo.name}`);

      if (!response.ok) {
        throw new Error("Failed to fetch branches");
      }

      const data = await response.json();
      setBranches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBranches([]);
    } finally {
      setLoadingBranches(false);
    }
  }, []);

  /**
   * Fetches details for the selected commit including changed files.
   */
  const handleCommitSelect = useCallback(async (commit: GitHubCommit) => {
    if (!selectedRepo) return;

    setSelectedCommit(commit);
    setLoadingDetails(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/github/commit?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}&sha=${commit.sha}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch commit details");
      }

      const data = await response.json();
      setCommitDetails(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setCommitDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  }, [selectedRepo]);

  /**
   * Fetches commits for the selected branch.
   */
  const handleBranchSelect = useCallback(async (branchName: string) => {
    if (!selectedRepo) return;

    setSelectedBranch(branchName);
    setSelectedCommit(null);
    setCommitDetails(null);
    setLoadingCommits(true);
    setError(null);
    setShowScorePanel(false);
    setStressMetadata(null);

    try {
      const response = await fetch(
        `/api/github/commits?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}&branch=${encodeURIComponent(branchName)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch commits");
      }

      const data = await response.json();
      setCommits(data);

      // Auto-select the first commit if available
      if (data.length > 0) {
        // Inline commit selection to avoid dependency issues
        setSelectedCommit(data[0]);
        setLoadingDetails(true);
        try {
          const detailsResponse = await fetch(
            `/api/github/commit?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}&sha=${data[0].sha}`
          );
          if (detailsResponse.ok) {
            const detailsData = await detailsResponse.json();
            setCommitDetails(detailsData);
          }
        } catch {
          // Silently fail for details
        } finally {
          setLoadingDetails(false);
        }
      }

      // Fetch stress metadata for buggr branches
      if (branchName.includes("buggr-")) {
        setLoadingMetadata(true);
        try {
          const metadata = await fetchStressMetadata(accessToken, selectedRepo.owner.login, selectedRepo.name, branchName);
          setStressMetadata(metadata);
        } catch {
          setStressMetadata(null);
        } finally {
          setLoadingMetadata(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setCommits([]);
    } finally {
      setLoadingCommits(false);
    }
  }, [selectedRepo, accessToken]);

  /**
   * Creates a new branch from the selected commit and automatically buggers it up.
   */
  const handleCreateBranch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepo || !selectedCommit || !selectedBranch || !commitDetails?.files) return;

    const base = `buggr-${selectedBranch}-${timestamp}`;
    const fullBranchName = branchSuffix.trim() ? `${base}-${branchSuffix.trim()}` : base;

    // Filter out removed files, sort by most changes, and limit based on stress level
    const MAX_FILES_TO_STRESS =
      stressLevel === "custom" ? customFilesCount : stressLevel === "low" ? 1 : stressLevel === "medium" ? 2 : 3;
    const availableFiles = commitDetails.files.filter((f) => f.status !== "removed");

    if (availableFiles.length === 0) {
      setError("No files available to bugger up");
      return;
    }

    // Check if there are enough files for the selected stress level
    if (availableFiles.length < MAX_FILES_TO_STRESS) {
      const stressLevelName =
        stressLevel === "custom" ? "custom" : stressLevel === "low" ? "easy" : stressLevel === "medium" ? "medium" : "hard";
      setError(
        `Only ${availableFiles.length} file${availableFiles.length === 1 ? "" : "s"} available, but ${stressLevelName} mode requires ${MAX_FILES_TO_STRESS}. Proceeding with ${availableFiles.length} file${availableFiles.length === 1 ? "" : "s"}.`
      );
    }

    // File selection mode
    const fileSelectionMode = process.env.NEXT_PUBLIC_FILE_SELECTION_MODE || "random";

    let sortedFiles;
    if (fileSelectionMode === "random") {
      sortedFiles = [...availableFiles];
      for (let i = sortedFiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sortedFiles[i], sortedFiles[j]] = [sortedFiles[j], sortedFiles[i]];
      }
    } else {
      sortedFiles = [...availableFiles].sort((a, b) => b.additions + b.deletions - (a.additions + a.deletions));
    }

    const filesToStress = sortedFiles.slice(0, MAX_FILES_TO_STRESS).map((f) => f.filename);

    setCreatingBranch(true);
    setLoadingStep(0);
    setError(null);
    setBranchSuccess(null);

    try {
      // Step 1: Create the branch
      setLoadingStep(1);
      const response = await fetch("/api/github/branch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: selectedRepo.owner.login,
          repo: selectedRepo.name,
          branchName: fullBranchName,
          sha: selectedCommit.sha,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create branch");
      }

      // Step 2: Analyze files
      setLoadingStep(2);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Step 3: Introduce stress on the new branch
      setLoadingStep(3);
      const requestBody: {
        owner: string;
        repo: string;
        branch: string;
        files: string[];
        context?: string;
        difficulty: "low" | "medium" | "high" | "custom";
        originalCommitSha: string;
        customFilesCount?: number;
        customBugCount?: number;
      } = {
        owner: selectedRepo.owner.login,
        repo: selectedRepo.name,
        branch: fullBranchName,
        files: filesToStress,
        context: stressContext.trim() || undefined,
        difficulty: stressLevel,
        originalCommitSha: selectedCommit.sha,
      };

      if (stressLevel === "custom") {
        requestBody.customFilesCount = customFilesCount;
        requestBody.customBugCount = customBugCount;
      }

      const stressResponse = await fetch("/api/github/stress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      // Step 4: Committing changes
      setLoadingStep(4);
      const stressData = await stressResponse.json();

      // Step 5: Finalizing
      setLoadingStep(5);
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (!stressResponse.ok) {
        setBranchSuccess(fullBranchName);
        setError(`Branch created, but buggering failed: ${stressData.error || "Unknown error"}`);
      } else {
        setBranchSuccess(fullBranchName);
        queryClient.invalidateQueries({ queryKey: notificationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: userQueryKey });
        openPanel();
      }

      setBranchSuffix("");
      setStressContext("");
      setStressLevel("medium");
      setCustomFilesCount(1);
      setCustomBugCount(1);
      setShowCreateBranch(false);

      // Refresh branches list
      const branchesResponse = await fetch(
        `/api/github/branches?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}`
      );
      if (branchesResponse.ok) {
        const branchesData = await branchesResponse.json();
        setBranches(branchesData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create branch");
    } finally {
      setCreatingBranch(false);
      setLoadingStep(0);
    }
  }, [
    selectedRepo,
    selectedCommit,
    selectedBranch,
    commitDetails,
    timestamp,
    branchSuffix,
    stressLevel,
    customFilesCount,
    customBugCount,
    stressContext,
    queryClient,
    openPanel,
  ]);

  /**
   * Deletes the currently selected branch.
   */
  const handleDeleteBranch = useCallback(async () => {
    if (!selectedRepo || !selectedBranch) return;

    const protectedBranches = ["main", "master", "develop", "dev"];
    if (protectedBranches.includes(selectedBranch.toLowerCase())) {
      setError("Cannot delete protected branches");
      return;
    }

    setDeletingBranch(true);
    setError(null);

    try {
      const response = await fetch("/api/github/branch/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: selectedRepo.owner.login,
          repo: selectedRepo.name,
          branchName: selectedBranch,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete branch");
      }

      const branchesResponse = await fetch(
        `/api/github/branches?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}`
      );
      if (branchesResponse.ok) {
        const branchesData = await branchesResponse.json();
        setBranches(branchesData);
      }

      setSelectedBranch(null);
      setSelectedCommit(null);
      setCommitDetails(null);
      setCommits([]);
      setShowDeleteConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete branch");
    } finally {
      setDeletingBranch(false);
    }
  }, [selectedRepo, selectedBranch]);

  /**
   * Copies the branch link to clipboard.
   */
  const handleCopyBranchLink = useCallback(async () => {
    if (!selectedRepo || !selectedBranch) return;

    const branchUrl = `https://github.com/${selectedRepo.owner.login}/${selectedRepo.name}/tree/${encodeURIComponent(selectedBranch)}`;

    try {
      await navigator.clipboard.writeText(branchUrl);
      setCopiedBranchLink(true);
      setTimeout(() => setCopiedBranchLink(false), 2000);
    } catch (err) {
      console.error("Failed to copy branch link:", err);
      setError("Failed to copy branch link");
    }
  }, [selectedRepo, selectedBranch]);

  /**
   * Deletes all branches that include "buggr-" in their name.
   */
  const handleDeleteAllBuggeredBranches = useCallback(async () => {
    if (!selectedRepo) return;

    setDeletingAllBranches(true);
    setError(null);
    setShowDeleteAllConfirm(false);

    try {
      const response = await fetch("/api/github/branches/delete-all", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: selectedRepo.owner.login,
          repo: selectedRepo.name,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete branches");
      }

      const data = await response.json();

      // Refresh branches list
      const branchesResponse = await fetch(
        `/api/github/branches?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}`
      );
      if (branchesResponse.ok) {
        const branchesData = await branchesResponse.json();
        setBranches(branchesData);
      }

      // Clear selection if the current branch was deleted
      if (selectedBranch && data.deleted.includes(selectedBranch)) {
        setSelectedBranch(null);
        setSelectedCommit(null);
        setCommitDetails(null);
        setCommits([]);
      }

      if (data.count === 0) {
        setError("No buggr- branches found to delete");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete branches");
    } finally {
      setDeletingAllBranches(false);
    }
  }, [selectedRepo, selectedBranch]);

  /**
   * Handles successful fork by adding the forked repo to the list and selecting it.
   */
  const handleForkSuccess = useCallback(
    (forkedRepo: GitHubRepo) => {
      setRepos((prev) => [forkedRepo, ...prev.filter((r) => r.id !== forkedRepo.id)]);
      handleRepoSelect(forkedRepo);
    },
    [handleRepoSelect]
  );

  /**
   * Clears all selections and resets state.
   */
  const handleClearSelection = useCallback(() => {
    setSelectedRepo(null);
    setSelectedBranch(null);
    setSelectedCommit(null);
    setCommitDetails(null);
    setBranches([]);
    setCommits([]);
    setBranchSuccess(null);
    setShowCreateBranch(false);
    setShowScorePanel(false);
    clearUrlParams();
  }, [clearUrlParams]);

  // ============================================
  // Effects
  // ============================================

  /**
   * Automatically show score panel when both start and complete commits are detected.
   */
  useEffect(() => {
    if (canCheckScore && selectedBranch && lastAutoShowBranch.current !== selectedBranch) {
      lastAutoShowBranch.current = selectedBranch;
      setShowScorePanel(true);
    }
    if (!canCheckScore && selectedBranch) {
      lastAutoShowBranch.current = null;
    }
  }, [canCheckScore, selectedBranch]);

  /**
   * Initialize state from URL parameters.
   */
  useEffect(() => {
    if (!urlRepo) return;
    if (selectedRepo?.full_name === urlRepo) return;

    isRestoringFromUrl.current = true;

    const repo = repos.find((r) => r.full_name === urlRepo);
    if (repo) {
      handleRepoSelect(repo);
    } else {
      isRestoringFromUrl.current = false;
    }

    if (!urlBranch) {
      setTimeout(() => {
        isRestoringFromUrl.current = false;
      }, 100);
    }
  }, [urlRepo, repos, selectedRepo?.full_name, urlBranch, handleRepoSelect]);

  /**
   * Show score panel from URL on initial load.
   */
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (urlShowScore) {
      setShowScorePanel(true);
    }
  }, [urlShowScore]);

  /**
   * Restore branch selection when URL branch changes or branches load.
   */
  useEffect(() => {
    if (urlBranch && branches.length > 0 && selectedBranch !== urlBranch) {
      const branchExists = branches.some((b) => b.name === urlBranch);
      if (branchExists) {
        isRestoringFromUrl.current = true;
        handleBranchSelect(urlBranch);
        setTimeout(() => {
          isRestoringFromUrl.current = false;
        }, 100);
      }
    }
  }, [urlBranch, branches, selectedBranch, handleBranchSelect]);

  /**
   * Restore commit selection when URL commit changes or commits load.
   */
  useEffect(() => {
    if (urlCommit && commits.length > 0 && !selectedCommit) {
      const commit = commits.find((c) => c.sha === urlCommit || c.sha.startsWith(urlCommit));
      if (commit) {
        handleCommitSelect(commit);
      }
    }
  }, [urlCommit, commits, selectedCommit, handleCommitSelect]);

  /**
   * Sync component state to URL when selections change.
   */
  useEffect(() => {
    if (isRestoringFromUrl.current) return;
    const newRepo = selectedRepo?.full_name || null;
    if (newRepo !== urlRepo) {
      setUrlRepo(newRepo);
    }
  }, [selectedRepo, urlRepo, setUrlRepo]);

  useEffect(() => {
    if (isRestoringFromUrl.current) return;
    if (selectedBranch !== urlBranch) {
      setUrlBranch(selectedBranch);
    }
  }, [selectedBranch, urlBranch, setUrlBranch]);

  useEffect(() => {
    const newCommit = selectedCommit?.sha.substring(0, 7) || null;
    if (newCommit !== urlCommit) {
      setUrlCommit(newCommit);
    }
  }, [selectedCommit, urlCommit, setUrlCommit]);

  useEffect(() => {
    if (showScorePanel !== urlShowScore) {
      setUrlShowScore(showScorePanel);
    }
  }, [showScorePanel, urlShowScore, setUrlShowScore]);

  // Reset timestamp when showing create branch form
  const setShowCreateBranchWithTimestamp = useCallback((show: boolean) => {
    if (show) {
      setTimestamp(generateTimestamp());
    }
    setShowCreateBranch(show);
  }, []);

  return {
    // Repos
    repos,
    selectedRepo,
    handleRepoSelect,
    handleForkSuccess,

    // Branches
    branches,
    selectedBranch,
    loadingBranches,
    handleBranchSelect,

    // Commits
    commits,
    selectedCommit,
    commitDetails,
    loadingCommits,
    loadingDetails,
    handleCommitSelect,

    // Computed commit helpers
    startCommit,
    completeCommit,
    canCheckScore,

    // Branch creation
    showCreateBranch,
    setShowCreateBranch: setShowCreateBranchWithTimestamp,
    branchSuffix,
    setBranchSuffix,
    stressContext,
    setStressContext,
    stressLevel,
    setStressLevel,
    customFilesCount,
    setCustomFilesCount,
    customBugCount,
    setCustomBugCount,
    creatingBranch,
    loadingStep,
    loadingSteps: LOADING_STEPS,
    timestamp,
    handleCreateBranch,

    // Branch success
    branchSuccess,
    setBranchSuccess,

    // Branch deletion
    deletingBranch,
    showDeleteConfirm,
    setShowDeleteConfirm,
    handleDeleteBranch,
    deletingAllBranches,
    showDeleteAllConfirm,
    setShowDeleteAllConfirm,
    handleDeleteAllBuggeredBranches,

    // Branch link
    copiedBranchLink,
    handleCopyBranchLink,

    // Score panel
    showScorePanel,
    setShowScorePanel,
    stressMetadata,
    loadingMetadata,

    // Error
    error,
    setError,

    // Clear all
    handleClearSelection,

    // User
    user,

    // Buggers
    branchBuggerMap,
  };
}
