"use client";

import { useEffect, useState, useRef } from "react";
import type { GitHubCommit, StressMetadata } from "@/lib/github";
import type { AnalysisFeedback, AnalyzeResponse } from "@/app/api/github/analyze/route";
import { formatShortDate } from "@/lib/date";
import { Button } from "@/app/components/inputs/Button";
import { ToggleGroup } from "@/app/components/inputs/ToggleGroup";
import { LoadingProgress, LoadingStep } from "@/app/components/stress/LoadingProgress";
import { Card } from "@/app/components/Card";
import { CloseIcon, BuggrIcon, SparklesIcon, CheckIcon, InfoIcon, LightbulbIcon, TrophyIcon, DocumentIcon, FolderIcon } from "@/app/components/icons";
import {
  SCORE_RATINGS,
  DIFFICULTY_CONFIG,
  type ScoreRating,
} from "@/lib/score-config";
import { useResultByBugger, useSaveResult } from "@/app/hooks/useBuggers";

/** Steps shown during code analysis */
const ANALYSIS_STEPS: LoadingStep[] = [
  { label: "Fetching commit changes", timeEstimate: "5-30s" },
  { label: "Reading your code diff", timeEstimate: "5-30s" },
  { label: "Checking for reasoning.txt", timeEstimate: "5-30s" },
  { label: "AI analyzing your fix", timeEstimate: "5-30s" },
  { label: "Generating feedback", timeEstimate: "1-2 min" },
];

interface ScorePanelProps {
  /** The commit where debugging started (contains "start" in message) */
  startCommit: GitHubCommit;
  /** The commit where debugging completed (contains "complete" in message) */
  completeCommit: GitHubCommit;
  /** The branch name being viewed */
  branchName: string;
  /** Callback to close the score panel */
  onClose: () => void;
  /** Optional buggr metadata from .buggr.json */
  stressMetadata?: StressMetadata | null;
}

/**
 * Calculates the time difference between start and complete commits.
 *
 * @param startCommit - The commit where debugging started
 * @param completeCommit - The commit where debugging completed
 * @returns Object with formatted string and raw milliseconds
 */
function calculateTimeDifference(
  startCommit: GitHubCommit,
  completeCommit: GitHubCommit
): { formatted: string; ms: number } {
  const startTime = new Date(startCommit.commit.author.date).getTime();
  const completeTime = new Date(completeCommit.commit.author.date).getTime();
  const diffMs = Math.abs(completeTime - startTime);

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  let formatted: string;
  if (hours > 0) {
    formatted = `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    formatted = `${minutes}m ${seconds}s`;
  } else {
    formatted = `${seconds}s`;
  }

  return { formatted, ms: diffMs };
}

/** Props for the score card helper components */
interface ScoreCardProps {
  scoreRating: ScoreRating;
  timeDifference: string;
  bugCount: number;
  difficulty: { label: string; color: string } | null;
  repoFullName: string | null;
  isVisible: boolean;
}

/** Props for time-only card shown before analysis */
interface TimeOnlyCardProps {
  timeDifference: string;
  bugCount: number;
  difficulty: { label: string; color: string } | null;
  repoFullName: string | null;
  isVisible: boolean;
}

/**
 * Renders a card showing only time before AI analysis has occurred.
 * No grade is displayed - the grade comes from AI analysis.
 * 
 * @param props - Time card display properties
 * @returns JSX element for the time-only card
 */
function TimeOnlyCard({
  timeDifference,
  bugCount,
  difficulty,
  repoFullName,
  isVisible,
}: TimeOnlyCardProps) {
  return (
    <div 
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-gh-canvas-subtle to-gh-canvas-default border border-gh-border p-[2px] transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"}`}
      style={{ transitionDelay: "100ms" }}
    >
      <div className="rounded-[14px] bg-gh-canvas-default p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BuggrIcon className="h-4 w-4 text-gh-success" />
            <span className="text-xs font-semibold tracking-wide text-white uppercase">Buggr</span>
          </div>
          {repoFullName && (
            <code className="font-mono text-xs text-white">{repoFullName}</code>
          )}
        </div>

        {/* Waiting for Analysis */}
        <div 
          className={`text-center mb-6 transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ transitionDelay: "300ms" }}
        >
          <div className={`inline-flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-gh-accent/30 to-purple-600/30 mb-3 transition-transform duration-700 ease-out ${isVisible ? "scale-100 rotate-0" : "scale-50 -rotate-12"}`}
            style={{ transitionDelay: "400ms" }}
          >
            <span className="text-5xl">⏱️</span>
          </div>
          <div 
            className={`flex items-center justify-center gap-2 mb-1 transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
            style={{ transitionDelay: "500ms" }}
          >
            <h2 className="text-xl font-bold text-white">
              Challenge Complete!
            </h2>
          </div>
          <p 
            className={`text-sm text-gh-text-muted transition-all duration-500 ease-out ${isVisible ? "opacity-100" : "opacity-0"}`}
            style={{ transitionDelay: "600ms" }}
          >
            Analyze your code to get your grade
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div 
            className={`rounded-lg bg-gh-canvas-subtle p-3 text-center transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ transitionDelay: "650ms" }}
          >
            <p className="text-2xl font-bold text-white">{timeDifference}</p>
            <p className="text-xs text-gh-text-muted mt-1">Time</p>
          </div>
          <div 
            className={`rounded-lg bg-gh-canvas-subtle p-3 text-center transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ transitionDelay: "750ms" }}
          >
            <p className="text-2xl font-bold text-white">{bugCount}</p>
            <p className="text-xs text-gh-text-muted mt-1">{bugCount === 1 ? "Bug" : "Bugs"}</p>
          </div>
          <div 
            className={`rounded-lg bg-gh-canvas-subtle p-3 text-center transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ transitionDelay: "850ms" }}
          >
            <p className={`text-2xl font-bold ${difficulty?.color || "text-white"}`}>
              {difficulty?.label || "—"}
            </p>
            <p className="text-xs text-gh-text-muted mt-1">Level</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders a compact/slim version of the score card.
 * Used when analysis results are displayed to save vertical space.
 * 
 * @param props - Score card display properties
 * @returns JSX element for the slim score card
 */
function SlimScoreCard({
  scoreRating,
  timeDifference,
  bugCount,
  difficulty,
}: ScoreCardProps) {
  return (
    <div 
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${scoreRating.gradient} p-[2px] transition-all duration-500 ease-out`}
    >
      <div className="rounded-[10px] bg-gh-canvas-default px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Grade Badge */}
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${scoreRating.gradient}`}>
            <span className="text-2xl font-black text-white drop-shadow-lg">
              {scoreRating.grade}
            </span>
          </div>
          
          {/* Score Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">{scoreRating.emoji}</span>
              <h2 className={`text-base font-bold ${scoreRating.textColor}`}>
                {scoreRating.label}
              </h2>
            </div>
            <p className="text-xs text-gh-text-muted truncate">{scoreRating.description}</p>
          </div>
          
          {/* Compact Stats */}
          <div className="hidden sm:flex items-center gap-3 text-xs">
            <div className="text-center px-2">
              <p className="font-bold text-white">{timeDifference}</p>
              <p className="text-gh-text-muted">Time</p>
            </div>
            <div className="w-px h-6 bg-gh-border" />
            <div className="text-center px-2">
              <p className="font-bold text-white">{bugCount}</p>
              <p className="text-gh-text-muted">{bugCount === 1 ? "Bug" : "Bugs"}</p>
            </div>
            <div className="w-px h-6 bg-gh-border" />
            <div className="text-center px-2">
              <p className={`font-bold ${difficulty?.color || "text-white"}`}>{difficulty?.label || "—"}</p>
              <p className="text-gh-text-muted">Level</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders the full score card with all details and animations.
 * Used before analysis is triggered to show the complete score breakdown.
 * 
 * @param props - Score card display properties
 * @returns JSX element for the full score card
 */
function FullScoreCard({
  scoreRating,
  timeDifference,
  bugCount,
  difficulty,
  repoFullName,
  isVisible,
}: ScoreCardProps) {
  return (
    <div 
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${scoreRating.gradient} p-[2px] transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"}`}
      style={{ transitionDelay: "100ms" }}
    >
      <div className="rounded-[14px] bg-gh-canvas-default p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BuggrIcon className="h-4 w-4 text-gh-success" />
            <span className="text-xs font-semibold tracking-wide text-white uppercase">Buggr</span>
          </div>
          {repoFullName && (
            <code className="font-mono text-xs text-white">{repoFullName}</code>
          )}
        </div>

        {/* Grade */}
        <div 
          className={`text-center mb-6 transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ transitionDelay: "300ms" }}
        >
          <div className={`inline-flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br ${scoreRating.gradient} mb-3 transition-transform duration-700 ease-out ${isVisible ? "scale-100 rotate-0" : "scale-50 -rotate-12"}`}
            style={{ transitionDelay: "400ms" }}
          >
            <span className="text-6xl font-black text-white drop-shadow-lg">
              {scoreRating.grade}
            </span>
          </div>
          <div 
            className={`flex items-center justify-center gap-2 mb-1 transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
            style={{ transitionDelay: "500ms" }}
          >
            <span className="text-2xl">{scoreRating.emoji}</span>
            <h2 className={`text-xl font-bold ${scoreRating.textColor}`}>
              {scoreRating.label}
            </h2>
          </div>
          <p 
            className={`text-sm text-white transition-all duration-500 ease-out ${isVisible ? "opacity-100" : "opacity-0"}`}
            style={{ transitionDelay: "600ms" }}
          >
            {scoreRating.description}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div 
            className={`rounded-lg bg-gh-canvas-subtle p-3 text-center transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ transitionDelay: "650ms" }}
          >
            <p className="text-2xl font-bold text-white">{timeDifference}</p>
            <p className="text-xs text-gh-text-muted mt-1">Time</p>
          </div>
          <div 
            className={`rounded-lg bg-gh-canvas-subtle p-3 text-center transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ transitionDelay: "750ms" }}
          >
            <p className="text-2xl font-bold text-white">{bugCount}</p>
            <p className="text-xs text-gh-text-muted mt-1">{bugCount === 1 ? "Bug" : "Bugs"}</p>
          </div>
          <div 
            className={`rounded-lg bg-gh-canvas-subtle p-3 text-center transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ transitionDelay: "850ms" }}
          >
            <p className={`text-2xl font-bold ${difficulty?.color || "text-white"}`}>
              {difficulty?.label || "—"}
            </p>
            <p className="text-xs text-gh-text-muted mt-1">Level</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Task Panel Helper Components
// =============================================================================

/** Props for section header component */
interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
}

/**
 * Renders a consistent section header with icon and title.
 * 
 * @param props - Section header properties
 * @returns JSX element for the section header
 */
function SectionHeader({ icon, title }: SectionHeaderProps) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-semibold tracking-wide text-gh-text-muted uppercase">
      {icon}
      {title}
    </h3>
  );
}

/** Props for Bug Report section */
interface BugReportSectionProps {
  symptoms: string[];
}

/**
 * Renders the Bug Report section showing user-facing symptom descriptions.
 * Exported for reuse in commit view when viewing a buggr branch.
 * 
 * @param props - Bug report properties containing symptoms array
 * @returns JSX element for the bug report section
 */
export function BugReportSection({ symptoms }: BugReportSectionProps) {
  return (
    <div className="space-y-2">
      <SectionHeader icon={<span className="text-sm">🐛</span>} title="Bug Report" />
      <Card variant="default" padded className="p-3">
        <ul className="space-y-2">
          {symptoms.map((symptom, index) => (
            <li
              key={index}
              className="flex items-start gap-2 text-sm text-gh-text"
            >
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gh-danger-fg" />
              {symptom}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/** Props for Files Modified section */
interface FilesModifiedSectionProps {
  files: string[];
}

/**
 * Renders the Files Modified section showing which files were buggered.
 * 
 * @param props - Files modified properties containing files array
 * @returns JSX element for the files modified section
 */
function FilesModifiedSection({ files }: FilesModifiedSectionProps) {
  return (
    <div className="space-y-2">
      <SectionHeader icon={<FolderIcon className="h-3.5 w-3.5" />} title="Files Modified" />
      <div className="space-y-2">
        {files.map((file, index) => (
          <Card key={index} variant="default" padded={false} className="p-2 text-xs">
            <code className="font-mono text-gh-accent">{file}</code>
          </Card>
        ))}
      </div>
    </div>
  );
}

/** Props for Changes Made (Spoiler) section */
interface ChangesMadeSectionProps {
  changes: string[];
}

/**
 * Renders the Changes Made section showing technical descriptions of bugs.
 * Styled as a spoiler with warning colors.
 * 
 * @param props - Changes made properties containing changes array
 * @returns JSX element for the changes made section
 */
function ChangesMadeSection({ changes }: ChangesMadeSectionProps) {
  return (
    <div className="space-y-2">
      <SectionHeader icon={<span className="text-sm">⚠️</span>} title="Changes Made (Spoiler)" />
      {/* Using custom styling for warning/spoiler appearance since Card doesn't have a warning variant */}
      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
        <ul className="space-y-2">
          {changes.map((change, index) => (
            <li
              key={index}
              className="flex items-start gap-2 text-sm text-gh-text-muted"
            >
              <span className="mt-1 text-yellow-500">•</span>
              {change}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Props for the Task Details panel */
interface TaskDetailsPanelProps {
  stressMetadata: StressMetadata;
  isVisible: boolean;
}

/**
 * Renders the complete Task Details panel with Bug Report, Files Modified, and Changes Made sections.
 * 
 * @param props - Task details panel properties
 * @returns JSX element for the task details panel
 */
function TaskDetailsPanel({ stressMetadata, isVisible }: TaskDetailsPanelProps) {
  return (
    <div 
      className={`space-y-4 transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      style={{ transitionDelay: "100ms" }}
    >
      <BugReportSection symptoms={stressMetadata.symptoms} />
      <FilesModifiedSection files={stressMetadata.filesBuggered} />
      <ChangesMadeSection changes={stressMetadata.changes} />
    </div>
  );
}

// =============================================================================
// Analysis Panel Helper Components
// =============================================================================

/** Props for Analysis Summary section */
interface AnalysisSummarySectionProps {
  summary: string;
  isPerfect: boolean;
  isRevealed: boolean;
}

/**
 * Renders the Analysis Summary card.
 * Uses success styling when the fix is perfect.
 * 
 * @param props - Analysis summary properties
 * @returns JSX element for the analysis summary
 */
function AnalysisSummarySection({ summary, isPerfect, isRevealed }: AnalysisSummarySectionProps) {
  return (
    <Card 
      variant={isPerfect ? "success" : "default"}
      padded={false}
      className={`p-3 transition-all duration-500 ease-out ${isRevealed ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"}`}
      style={{ transitionDelay: "100ms" }}
    >
      <p className={`text-sm font-medium ${isPerfect ? "text-green-400" : "text-white"}`}>
        {summary}
      </p>
    </Card>
  );
}

/** Props for a single feedback item */
interface FeedbackItemProps {
  item: AnalysisFeedback;
  index: number;
  isRevealed: boolean;
  getFeedbackIcon: (type: AnalysisFeedback["type"]) => React.ReactNode;
  getFeedbackBgColor: (type: AnalysisFeedback["type"]) => string;
}

/**
 * Renders a single feedback item card with icon, title, message, and optional improvement suggestion.
 * 
 * @param props - Feedback item properties
 * @returns JSX element for the feedback item
 */
function FeedbackItem({ item, index, isRevealed, getFeedbackIcon, getFeedbackBgColor }: FeedbackItemProps) {
  return (
    <div 
      className={`rounded-lg border p-3 transition-all duration-500 ease-out ${getFeedbackBgColor(item.type)} ${isRevealed ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
      style={{ transitionDelay: `${200 + index * 100}ms` }}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5 shrink-0">
          {getFeedbackIcon(item.type)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white">{item.title}</p>
          <p className="text-xs text-gh-text-muted mt-1">{item.message}</p>
          {item.improvement && (
            <Card variant="inset" padded={false} className="mt-2 p-2 bg-gh-canvas-default/50">
              <p className="text-xs font-medium text-purple-300 mb-1">💡 Better approach:</p>
              <p className="text-xs text-gh-text-muted">{item.improvement}</p>
            </Card>
          )}
          {item.file && (
            <code className="mt-2 inline-block rounded bg-gh-canvas-default px-1.5 py-0.5 font-mono text-xs text-gh-accent">
              {item.file}
            </code>
          )}
        </div>
      </div>
    </div>
  );
}

/** Props for the Analysis Results panel */
interface AnalysisResultsPanelProps {
  analysisResult: AnalyzeResponse;
  isRevealed: boolean;
  getFeedbackIcon: (type: AnalysisFeedback["type"]) => React.ReactNode;
  getFeedbackBgColor: (type: AnalysisFeedback["type"]) => string;
}

/**
 * Renders the complete Analysis Results panel with summary and feedback items.
 * 
 * @param props - Analysis results panel properties
 * @returns JSX element for the analysis results panel
 */
function AnalysisResultsPanel({ 
  analysisResult, 
  isRevealed,
  getFeedbackIcon,
  getFeedbackBgColor,
}: AnalysisResultsPanelProps) {
  return (
    <div className="space-y-3">
      <h3 
        className={`text-xs font-semibold tracking-wide text-gh-text-muted uppercase transition-all duration-500 ease-out ${isRevealed ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}
      >
        Analysis
      </h3>
      
      <AnalysisSummarySection 
        summary={analysisResult.summary} 
        isPerfect={analysisResult.isPerfect} 
        isRevealed={isRevealed} 
      />

      {analysisResult.feedback.length > 0 && (
        <div className="space-y-2">
          {analysisResult.feedback.map((item, index) => (
            <FeedbackItem
              key={index}
              item={item}
              index={index}
              isRevealed={isRevealed}
              getFeedbackIcon={getFeedbackIcon}
              getFeedbackBgColor={getFeedbackBgColor}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Timeline Panel Helper Components
// =============================================================================

/** Props for a timeline commit item */
interface TimelineCommitItemProps {
  commit: GitHubCommit;
  icon: string;
  iconBgColor: string;
  isVisible: boolean;
  transitionDelay: string;
}

/**
 * Renders a single commit item in the timeline.
 * 
 * @param props - Timeline commit item properties
 * @returns JSX element for the timeline commit item
 */
function TimelineCommitItem({ commit, icon, iconBgColor, isVisible, transitionDelay }: TimelineCommitItemProps) {
  return (
    <Card 
      variant="default"
      padded={false}
      className={`flex items-center gap-3 p-3 transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
      style={{ transitionDelay }}
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconBgColor}`}>
        <span className="text-sm">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white truncate">
          {commit.commit.message.split("\n")[0]}
        </p>
        <p className="text-xs text-gh-text-muted">
          {formatShortDate(commit.commit.author.date)}
        </p>
      </div>
      <code className="shrink-0 rounded bg-gh-canvas-default px-2 py-0.5 font-mono text-xs text-gh-accent">
        {commit.sha.substring(0, 7)}
      </code>
    </Card>
  );
}

/** Props for the Timeline panel */
interface TimelinePanelProps {
  startCommit: GitHubCommit;
  completeCommit: GitHubCommit;
  isVisible: boolean;
}

/**
 * Renders the Timeline panel showing start and complete commits.
 * 
 * @param props - Timeline panel properties
 * @returns JSX element for the timeline panel
 */
function TimelinePanel({ startCommit, completeCommit, isVisible }: TimelinePanelProps) {
  return (
    <div 
      className={`space-y-3 transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      style={{ transitionDelay: "1000ms" }}
    >
      <h3 className="text-xs font-semibold tracking-wide text-gh-text-muted uppercase">Timeline</h3>
      
      <div className="space-y-2">
        <TimelineCommitItem
          commit={startCommit}
          icon="🚀"
          iconBgColor="bg-blue-500/20"
          isVisible={isVisible}
          transitionDelay="1100ms"
        />

        {/* Connector */}
        <div className="flex justify-center">
          <div 
            className={`w-0.5 bg-gh-border transition-all duration-300 ease-out ${isVisible ? "h-4" : "h-0"}`}
            style={{ transitionDelay: "1200ms" }}
          />
        </div>

        <TimelineCommitItem
          commit={completeCommit}
          icon="✅"
          iconBgColor="bg-green-500/20"
          isVisible={isVisible}
          transitionDelay="1250ms"
        />
      </div>
    </div>
  );
}

export function ScorePanel({
  startCommit,
  completeCommit,
  branchName,
  onClose,
  stressMetadata,
}: ScorePanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"analysis" | "score" | "task">("analysis");
  const [analysisRevealed, setAnalysisRevealed] = useState(false);
  
  // Ref to track step progression intervals
  const stepIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check for existing result in the database
  const { result: existingResult, isLoading: isCheckingExisting } = useResultByBugger(
    stressMetadata?.buggerId
  );

  // Mutation hook for saving results
  const { saveResult, isSaving } = useSaveResult();

  // If we found an existing result, populate the analysis state immediately
  useEffect(() => {
    if (existingResult && !analysisResult) {
      setAnalysisResult({
        summary: existingResult.analysisSummary || "",
        isPerfect: existingResult.analysisIsPerfect,
        feedback: existingResult.analysisFeedback || [],
        grade: existingResult.grade,
      });
      // Set revealed immediately for existing results (no animation needed)
      setAnalysisRevealed(true);
    }
  }, [existingResult, analysisResult]);

  // Trigger reveal animation when analysis completes from a fresh analyze action
  useEffect(() => {
    // Only animate reveal for fresh analysis (not existing results)
    if (analysisResult && !analysisRevealed && !existingResult) {
      const timer = setTimeout(() => setAnalysisRevealed(true), 50);
      return () => clearTimeout(timer);
    }
  }, [analysisResult, analysisRevealed, existingResult]);

  // Trigger entrance animation on mount
  useEffect(() => {
    // Small delay to ensure the component is mounted before animating
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);
  
  // Cleanup step interval on unmount
  useEffect(() => {
    return () => {
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
      }
    };
  }, []);

  const { formatted: timeDifference, ms: timeMs } = calculateTimeDifference(
    startCommit,
    completeCommit
  );
  const difficulty = stressMetadata?.stressLevel
    ? DIFFICULTY_CONFIG[stressMetadata.stressLevel]
    : null;
  const repoFullName = stressMetadata
    ? `${stressMetadata.owner}/${stressMetadata.repo}`
    : null;
  
  // Score rating is determined by AI analysis - use the grade from analysis result
  // If we have an existing result, use its grade; if we have fresh analysis, use that
  const aiGrade = analysisResult?.grade || existingResult?.grade;
  const scoreRating = aiGrade && SCORE_RATINGS[aiGrade] 
    ? SCORE_RATINGS[aiGrade] 
    : SCORE_RATINGS.C; // Fallback, but should only be used after analysis

  const bugCount = stressMetadata?.bugCount || 1;
  
  // Whether we have a grade (either from fresh analysis or existing result)
  const hasGrade = !!(analysisResult?.grade || existingResult?.grade);
  
  // Whether we're still initializing (loading OR waiting for analysisResult to sync from existingResult)
  const isInitializing = isCheckingExisting || (existingResult && !analysisResult);
  
  // Whether we have task data to display (stressMetadata with symptoms/changes)
  const hasTaskData = !!(stressMetadata?.symptoms?.length || stressMetadata?.changes?.length);

  // Ensure activeView is valid and prioritize Analysis when available
  useEffect(() => {
    // When grade becomes available, switch to analysis (the preferred default)
    if (hasGrade && activeView !== "analysis" && activeView !== "score") {
      setActiveView("analysis");
    }
    // If on analysis view but no grade, switch to task (if available) or score
    else if (activeView === "analysis" && !hasGrade) {
      setActiveView(hasTaskData ? "task" : "score");
    }
    // If on task view but no task data, switch to analysis (if available) or score
    else if (activeView === "task" && !hasTaskData) {
      setActiveView(hasGrade ? "analysis" : "score");
    }
  }, [hasGrade, hasTaskData, activeView]);

  /**
   * Saves the stress test result to the database using the mutation hook.
   * Called after analysis completes successfully.
   * Uses the AI-determined grade from the analysis result.
   * 
   * @param analysis - The AI analysis result including the grade
   */
  const handleSaveResult = async (analysis: AnalyzeResponse) => {
    if (!stressMetadata?.buggerId) {
      console.warn("No buggerId found in stressMetadata, skipping result save");
      return;
    }

    try {
      await saveResult({
        buggerId: stressMetadata.buggerId,
        grade: analysis.grade, // Use AI-determined grade
        timeMs,
        startCommitSha: startCommit.sha,
        completeCommitSha: completeCommit.sha,
        analysisSummary: analysis.summary,
        analysisIsPerfect: analysis.isPerfect,
        analysisFeedback: analysis.feedback,
      });
    } catch (error) {
      // Log but don't fail the UI if saving fails
      console.error("Error saving result:", error);
    }
  };

  /**
   * Handles the analyze code action.
   * Fetches the complete commit's diff and analyzes it for common issues.
   * Shows step-by-step progress during the analysis.
   */
  const handleAnalyzeCode = async () => {
    if (!stressMetadata) {
      setAnalysisError("No stress metadata available for analysis");
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisStep(1);
    
    // Progress through steps automatically
    // Steps 1-3 are quick (fetching/reading), step 4 (AI) takes longer
    const stepTimings = [1500, 1000, 800, 4000, 2000]; // ms per step
    let currentStep = 1;
    
    stepIntervalRef.current = setInterval(() => {
      currentStep++;
      if (currentStep <= ANALYSIS_STEPS.length) {
        setAnalysisStep(currentStep);
      }
    }, stepTimings[currentStep - 1] || 1500);

    try {
      const response = await fetch("/api/github/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: stressMetadata.owner,
          repo: stressMetadata.repo,
          sha: completeCommit.sha,
          timeMs, // Pass time so AI can factor it into the grade
          stressMetadata,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze code");
      }

      const result: AnalyzeResponse = await response.json();
      
      // Complete all steps before showing result
      setAnalysisStep(ANALYSIS_STEPS.length);
      
      // Small delay to show completion before transitioning
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      setAnalysisResult(result);
      
      // Save the result to the database
      await handleSaveResult(result);
    } catch (error) {
      console.error("Error analyzing code:", error);
      setAnalysisError("Failed to analyze code. Please try again.");
    } finally {
      // Clear the interval
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
        stepIntervalRef.current = null;
      }
      setAnalyzing(false);
      setAnalysisStep(0);
    }
  };

  /**
   * Returns the appropriate icon for a feedback type.
   * 
   * @param type - The feedback type
   * @returns JSX element for the icon
   */
  const getFeedbackIcon = (type: AnalysisFeedback["type"]) => {
    switch (type) {
      case "success":
        return <CheckIcon className="h-4 w-4 text-green-400" />;
      case "warning":
        return <span className="text-sm">⚠️</span>;
      case "hint":
        return <LightbulbIcon className="h-4 w-4 text-yellow-400" />;
      case "tip":
        return <SparklesIcon className="h-4 w-4 text-purple-400" />;
      case "info":
      default:
        return <InfoIcon className="h-4 w-4 text-blue-400" />;
    }
  };

  /**
   * Returns the appropriate background color for a feedback type.
   * 
   * @param type - The feedback type
   * @returns Tailwind CSS class for background color
   */
  const getFeedbackBgColor = (type: AnalysisFeedback["type"]) => {
    switch (type) {
      case "success":
        return "bg-green-500/10 border-green-500/30";
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/30";
      case "hint":
        return "bg-amber-500/10 border-amber-500/30";
      case "tip":
        return "bg-purple-500/10 border-purple-500/30";
      case "info":
      default:
        return "bg-blue-500/10 border-blue-500/30";
    }
  };

  // Props for time-only card (before analysis)
  const timeOnlyCardProps: TimeOnlyCardProps = {
    timeDifference,
    bugCount,
    difficulty,
    repoFullName,
    isVisible,
  };

  // Props for score card components (after analysis)
  const scoreCardProps: ScoreCardProps = {
    scoreRating,
    timeDifference,
    bugCount,
    difficulty,
    repoFullName,
    isVisible,
  };

  // Whether to show the slim card (during analysis loading, or when viewing analysis/task results)
  const showSlimCard = analyzing || (analysisResult && activeView !== "score");

  return (
    <div className={`flex flex-1 h-full min-h-0 flex-col overflow-hidden pt-10 transition-all duration-500 ease-out ${isVisible ? "opacity-100" : "opacity-0"}`}>
      {/* Fixed Header Section - Toggle + Score Card (always visible) */}
      <div className="shrink-0 space-y-4 pb-4">
        {/* View Toggle - shown when we have grade OR task data, and not initializing */}
        {(hasGrade || hasTaskData) && !isInitializing && (
          <ToggleGroup
            options={[
              // Analysis tab: only show if we have a grade (analysis complete)
              ...(hasGrade ? [{ value: "analysis", label: "Analysis", icon: SparklesIcon }] : []),
              // Task tab: show if we have task data (stressMetadata with symptoms/changes)
              ...(hasTaskData ? [{ value: "task", label: "Task", icon: DocumentIcon }] : []),
              // Score tab: always show when toggle is visible
              { value: "score", label: "Score", icon: TrophyIcon },
            ]}
            value={activeView}
            onChange={(val) => setActiveView(val as "analysis" | "score" | "task")}
          />
        )}

        {/* Card display logic:
            - While initializing (checking for existing result or syncing state): show loading skeleton
            - Before analysis (no grade): show TimeOnlyCard
            - After analysis with grade:
              - If showing analysis mode: slim score card
              - If showing score view: full score card
            - During analysis: show analyzing placeholder
        */}
        {isInitializing ? (
          // Loading skeleton while checking for existing result
          <div 
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-gh-canvas-subtle to-gh-canvas-default border border-gh-border p-[2px] transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"}`}
            style={{ transitionDelay: "100ms" }}
          >
            <div className="rounded-[14px] bg-gh-canvas-default p-5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <BuggrIcon className="h-4 w-4 text-gh-success" />
                  <span className="text-xs font-semibold tracking-wide text-white uppercase">Buggr</span>
                </div>
                <div className="h-4 w-24 bg-gh-canvas-subtle rounded animate-pulse" />
              </div>
              <div className="text-center mb-6">
                <div className="inline-flex h-24 w-24 items-center justify-center rounded-2xl bg-gh-canvas-subtle mb-3 animate-pulse" />
                <div className="h-6 w-32 bg-gh-canvas-subtle rounded mx-auto mb-2 animate-pulse" />
                <div className="h-4 w-48 bg-gh-canvas-subtle rounded mx-auto animate-pulse" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg bg-gh-canvas-subtle p-3 text-center">
                    <div className="h-8 w-12 bg-gh-canvas-default rounded mx-auto mb-1 animate-pulse" />
                    <div className="h-3 w-8 bg-gh-canvas-default rounded mx-auto animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : !hasGrade && !analyzing ? (
          <TimeOnlyCard {...timeOnlyCardProps} />
        ) : hasGrade && showSlimCard ? (
          <SlimScoreCard {...scoreCardProps} />
        ) : hasGrade ? (
          <FullScoreCard {...scoreCardProps} />
        ) : (
          // During analysis loading, show a placeholder slim card
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gh-canvas-subtle to-gh-canvas-default border border-gh-border p-[2px]">
            <div className="rounded-[10px] bg-gh-canvas-default px-4 py-3">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gh-canvas-subtle animate-pulse">
                  <SparklesIcon className="h-6 w-6 text-gh-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">
                      Analyzing...
                    </h2>
                  </div>
                  <p className="text-xs text-gh-text-muted truncate">AI is determining your grade</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analyze Button - only when not analyzing, no result yet, and not checking for existing */}
        {!analyzing && !analysisResult && !isCheckingExisting && (
          <div 
            className={`transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ transitionDelay: "900ms" }}
          >
            <Button 
              variant="primary" 
              className="w-full" 
              onClick={handleAnalyzeCode}
              disabled={!stressMetadata}
            >
              <SparklesIcon className="h-4 w-4" />
              Analyze Code
            </Button>
          </div>
        )}
      </div>

      {/* Scrollable Content Section - Analysis/Timeline */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pb-2">
        {/* Loading Progress - shown in analysis view while analyzing */}
        {analyzing && activeView === "analysis" && (
          <LoadingProgress
            steps={ANALYSIS_STEPS}
            currentStep={analysisStep}
            title="Analyzing your code"
            subtitle="AI is reviewing your fix..."
          />
        )}

        {/* Analysis Error */}
        {analysisError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <p className="text-sm text-red-400">{analysisError}</p>
          </div>
        )}

        {/* Analysis Results - shown when analysis exists and analysis view is active */}
        {analysisResult && activeView === "analysis" && (
          <AnalysisResultsPanel
            analysisResult={analysisResult}
            isRevealed={analysisRevealed}
            getFeedbackIcon={getFeedbackIcon}
            getFeedbackBgColor={getFeedbackBgColor}
          />
        )}

        {/* Task Details - shown when task view is active */}
        {activeView === "task" && stressMetadata && (
          <TaskDetailsPanel stressMetadata={stressMetadata} isVisible={isVisible} />
        )}

        {/* Timeline - shown when no analysis OR when score view is active */}
        {(!analysisResult || activeView === "score") && (
          <TimelinePanel
            startCommit={startCommit}
            completeCommit={completeCommit}
            isVisible={isVisible}
          />
        )}
      </div>

      {/* Fixed Footer */}
      <div 
        className={`shrink-0 mt-auto pt-4 border-t border-gh-border transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        style={{ transitionDelay: "1350ms" }}
      >
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <CloseIcon className="h-4 w-4" />
            Close
          </Button>
          <code className="font-mono text-xs text-gh-text-muted">{branchName}</code>
        </div>
      </div>
    </div>
  );
}


