"use client";

import type { GitHubRepo } from "@/lib/github";
import { useRepoBranchSelector } from "@/app/hooks/useRepoBranchSelector";
import { useInvitations } from "@/app/hooks";
import { LeftPanel } from "./LeftPanel";
import { RightPanel } from "./RightPanel";
import { InvitePromptModal } from "@/app/components/InvitePromptModal";

interface RepoBranchSelectorProps {
  repos: GitHubRepo[];
  accessToken: string;
  userName?: string;
  logoutForm?: React.ReactNode;
}

/**
 * Split-screen component for selecting a repository, branch, viewing commits,
 * and displaying details for selected commits including changed files.
 *
 * @param repos - List of user's GitHub repositories
 * @param accessToken - GitHub OAuth access token for fetching data
 * @param userName - Display name of the logged-in user
 * @param logoutForm - Optional logout form component
 */
export function RepoBranchSelector({ repos: initialRepos, accessToken, userName, logoutForm }: RepoBranchSelectorProps) {
  const { invitations, isLoading: invitationsLoading } = useInvitations();

  const {
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
    setShowCreateBranch,
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

    // Error
    error,

    // Clear all
    handleClearSelection,

    // User
    user,

    // Buggers
    branchBuggerMap,
    loadingBuggers,
  } = useRepoBranchSelector({
    initialRepos,
    accessToken,
  });

  /**
   * Handles canceling the create branch form.
   * Resets all form state to defaults.
   */
  const handleCancelCreateBranch = () => {
    setShowCreateBranch(false);
    setBranchSuffix("");
    setStressContext("");
    setStressLevel("medium");
    setCustomFilesCount(1);
    setCustomBugCount(1);
  };

  return (
    <div className="flex h-screen w-full">
      <LeftPanel
        repos={repos}
        selectedRepo={selectedRepo}
        onRepoSelect={handleRepoSelect}
        branches={branches}
        selectedBranch={selectedBranch}
        loadingBranches={loadingBranches}
        onBranchSelect={handleBranchSelect}
        commits={commits}
        selectedCommit={selectedCommit}
        loadingCommits={loadingCommits}
        onCommitSelect={handleCommitSelect}
        showDeleteConfirm={showDeleteConfirm}
        setShowDeleteConfirm={setShowDeleteConfirm}
        deletingBranch={deletingBranch}
        onDeleteBranch={handleDeleteBranch}
        showDeleteAllConfirm={showDeleteAllConfirm}
        setShowDeleteAllConfirm={setShowDeleteAllConfirm}
        deletingAllBranches={deletingAllBranches}
        onDeleteAllBuggeredBranches={handleDeleteAllBuggeredBranches}
        copiedBranchLink={copiedBranchLink}
        onCopyBranchLink={handleCopyBranchLink}
        error={error}
        onClearSelection={handleClearSelection}
        onForkSuccess={handleForkSuccess}
        branchBuggerMap={branchBuggerMap}
        loadingBuggers={loadingBuggers}
      />

      <RightPanel
        userName={userName}
        userCoins={user?.coins}
        logoutForm={logoutForm}
        selectedRepo={selectedRepo}
        selectedBranch={selectedBranch}
        selectedCommit={selectedCommit}
        commitDetails={commitDetails}
        loadingDetails={loadingDetails}
        showScorePanel={showScorePanel}
        setShowScorePanel={setShowScorePanel}
        startCommit={startCommit}
        completeCommit={completeCommit}
        canCheckScore={canCheckScore}
        stressMetadata={stressMetadata}
        showCreateBranch={showCreateBranch}
        setShowCreateBranch={setShowCreateBranch}
        timestamp={timestamp}
        branchSuffix={branchSuffix}
        setBranchSuffix={setBranchSuffix}
        stressContext={stressContext}
        setStressContext={setStressContext}
        stressLevel={stressLevel}
        setStressLevel={setStressLevel}
        customFilesCount={customFilesCount}
        setCustomFilesCount={setCustomFilesCount}
        customBugCount={customBugCount}
        setCustomBugCount={setCustomBugCount}
        creatingBranch={creatingBranch}
        loadingStep={loadingStep}
        onCreateBranch={handleCreateBranch}
        onCancelCreateBranch={handleCancelCreateBranch}
        branchSuccess={branchSuccess}
        setBranchSuccess={setBranchSuccess}
        onShowBranch={handleBranchSelect}
        copiedBranchLink={copiedBranchLink}
        onCopyBranchLink={handleCopyBranchLink}
      />

      {/* Invite Prompt Modal */}
      <InvitePromptModal hasInvites={invitations.length > 0} isLoading={invitationsLoading} />
    </div>
  );
}
