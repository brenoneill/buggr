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
 */
export function RepoBranchSelector({ repos: initialRepos, accessToken, userName, logoutForm }: RepoBranchSelectorProps) {
  const { invitations, isLoading: invitationsLoading } = useInvitations();

  const {
    repos,
    selectedRepo,
    handleRepoSelect,
    handleForkSuccess,

    branches,
    selectedBranch,
    loadingBranches,
    handleBranchSelect,

    commits,
    selectedCommit,
    commitDetails,
    loadingCommits,
    loadingDetails,
    handleCommitSelect,

    startCommit,
    completeCommit,
    canCheckScore,

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

    branchSuccess,
    setBranchSuccess,

    deletingBranch,
    showDeleteConfirm,
    setShowDeleteConfirm,
    handleDeleteBranch,
    deletingAllBranches,
    showDeleteAllConfirm,
    setShowDeleteAllConfirm,
    handleDeleteAllBuggeredBranches,

    copiedBranchLink,
    handleCopyBranchLink,

    showScorePanel,
    setShowScorePanel,
    stressMetadata,

    error,

    handleClearSelection,

    user,

    branchBuggerMap,
    loadingBuggers,
  } = useRepoBranchSelector({
    initialRepos,
    accessToken,
  });


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
        loadingCommits={loadingCommits}
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

      <InvitePromptModal hasInvites={invitations.length > 0} isLoading={invitationsLoading} />
    </div>
  );
}
