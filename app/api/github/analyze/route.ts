import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchCommitDetails, GitHubCommitFile } from "@/lib/github";

/**
 * Feedback item returned by the analysis.
 */
export interface AnalysisFeedback {
  type: "success" | "warning" | "info" | "hint";
  title: string;
  message: string;
  file?: string;
}

/**
 * Response from the analyze endpoint.
 */
export interface AnalyzeResponse {
  feedback: AnalysisFeedback[];
  summary: string;
  isPerfect: boolean;
}

/**
 * Analyzes a code patch for common issues like:
 * - Functions that were left but do nothing (pass-through functions)
 * - Unnecessary code left behind
 * - Empty functions or commented out code
 * 
 * @param file - The file with patch data to analyze
 * @returns Array of feedback items for this file
 */
function analyzeFilePatch(file: GitHubCommitFile): AnalysisFeedback[] {
  const feedback: AnalysisFeedback[] = [];
  const patch = file.patch || "";
  
  // Skip if no patch data
  if (!patch) {
    return feedback;
  }

  // Extract added lines (lines starting with +)
  const addedLines = patch
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
    .map((line) => line.substring(1));
  
  // Extract removed lines (lines starting with -)
  const removedLines = patch
    .split("\n")
    .filter((line) => line.startsWith("-") && !line.startsWith("---"))
    .map((line) => line.substring(1));

  // Check for pass-through functions (function that just returns its input)
  // Pattern: function that takes input and returns it unchanged
  const passThroughPattern = /function\s+(\w+)\s*\([^)]*\)\s*{\s*return\s+\w+;?\s*}/;
  const arrowPassThroughPattern = /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*\w+;?/;
  
  const addedCode = addedLines.join("\n");
  
  const passThroughMatch = addedCode.match(passThroughPattern);
  if (passThroughMatch) {
    feedback.push({
      type: "warning",
      title: "Pass-through function detected",
      message: `The function '${passThroughMatch[1]}' appears to just return its input without doing anything. Consider removing it entirely if it's not needed.`,
      file: file.filename,
    });
  }

  const arrowPassThroughMatch = addedCode.match(arrowPassThroughPattern);
  if (arrowPassThroughMatch && !passThroughMatch) {
    feedback.push({
      type: "warning",
      title: "Pass-through function detected",
      message: `The function '${arrowPassThroughMatch[1]}' appears to just return its input without doing anything. Consider removing it entirely if it's not needed.`,
      file: file.filename,
    });
  }

  // Check for empty function bodies
  const emptyFunctionPattern = /function\s+(\w+)\s*\([^)]*\)\s*{\s*}/;
  const emptyArrowPattern = /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*{\s*}/;
  
  const emptyFuncMatch = addedCode.match(emptyFunctionPattern);
  if (emptyFuncMatch) {
    feedback.push({
      type: "warning",
      title: "Empty function",
      message: `The function '${emptyFuncMatch[1]}' has an empty body. Did you mean to implement it or remove it?`,
      file: file.filename,
    });
  }

  const emptyArrowMatch = addedCode.match(emptyArrowPattern);
  if (emptyArrowMatch) {
    feedback.push({
      type: "warning",
      title: "Empty function",
      message: `The function '${emptyArrowMatch[1]}' has an empty body. Did you mean to implement it or remove it?`,
      file: file.filename,
    });
  }

  // Check for function calls to removed functions
  // Look for function definitions that were removed
  const removedFunctionPattern = /function\s+(\w+)/g;
  const removedCode = removedLines.join("\n");
  let match;
  while ((match = removedFunctionPattern.exec(removedCode)) !== null) {
    const funcName = match[1];
    // Check if this function is still being called in added code
    const callPattern = new RegExp(`\\b${funcName}\\s*\\(`);
    if (callPattern.test(addedCode)) {
      feedback.push({
        type: "hint",
        title: "Function call may be orphaned",
        message: `You removed the '${funcName}' function but it appears to still be called. Make sure all references are updated.`,
        file: file.filename,
      });
    }
  }

  // Check for console.log statements left behind
  if (addedCode.includes("console.log")) {
    feedback.push({
      type: "info",
      title: "Debug statement found",
      message: "You left console.log statements in your code. Consider removing them for production code.",
      file: file.filename,
    });
  }

  // Check for TODO/FIXME comments
  if (/\/\/\s*(TODO|FIXME)/i.test(addedCode)) {
    feedback.push({
      type: "info",
      title: "TODO/FIXME comment found",
      message: "You have TODO or FIXME comments in your code. Make sure these are intentional.",
      file: file.filename,
    });
  }

  // Check for commented out code
  const commentedCodePattern = /\/\/\s*(const|let|var|function|return|if|for|while)/;
  if (commentedCodePattern.test(addedCode)) {
    feedback.push({
      type: "hint",
      title: "Commented out code",
      message: "It looks like you left some code commented out. Consider removing it if it's not needed.",
      file: file.filename,
    });
  }

  return feedback;
}

/**
 * POST /api/github/analyze
 * 
 * Analyzes the code changes in a commit and provides feedback.
 * Requires owner, repo, and sha in the request body.
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { owner, repo, sha } = body;

    if (!owner || !repo || !sha) {
      return NextResponse.json(
        { error: "Missing owner, repo, or sha parameter" },
        { status: 400 }
      );
    }

    // Fetch the commit details including the diff
    const commitDetails = await fetchCommitDetails(session.accessToken, owner, repo, sha);
    
    // Analyze each file in the commit
    const allFeedback: AnalysisFeedback[] = [];
    
    for (const file of commitDetails.files) {
      const fileFeedback = analyzeFilePatch(file);
      allFeedback.push(...fileFeedback);
    }

    // Determine if the fix was "perfect" (no warnings or issues)
    const hasWarnings = allFeedback.some((f) => f.type === "warning");
    const hasHints = allFeedback.some((f) => f.type === "hint");
    const isPerfect = !hasWarnings && !hasHints;

    // Generate summary
    let summary: string;
    if (isPerfect && allFeedback.length === 0) {
      summary = "Excellent work! Your fix looks clean and complete.";
    } else if (isPerfect) {
      summary = "Good job! Your fix is solid with just a few minor notes.";
    } else if (hasWarnings) {
      summary = "Your fix works, but there are some issues to consider.";
    } else {
      summary = "Your fix is complete with some suggestions for improvement.";
    }

    // Add a success message if perfect
    if (isPerfect) {
      allFeedback.unshift({
        type: "success",
        title: "Clean fix!",
        message: "Your code changes look good. No unnecessary code or common issues detected.",
      });
    }

    const response: AnalyzeResponse = {
      feedback: allFeedback,
      summary,
      isPerfect,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error analyzing commit:", error);
    return NextResponse.json(
      { error: "Failed to analyze commit" },
      { status: 500 }
    );
  }
}

