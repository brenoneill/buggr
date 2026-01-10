import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { AnalysisFeedback } from "@/app/api/github/analyze/route";

/**
 * Request body for saving a stress test result.
 */
interface SaveResultRequest {
  // Repository info
  owner: string;
  repo: string;
  branchName: string;

  // Scoring
  grade: string;
  timeMs: number;
  bugCount: number;
  stressLevel: "low" | "medium" | "high";

  // Commit references
  startCommitSha: string;
  completeCommitSha: string;

  // Bug details (from StressMetadata)
  symptoms: string[];
  filesBuggered: string[];
  changes: string[];

  // AI Analysis results
  analysisSummary?: string;
  analysisIsPerfect?: boolean;
  analysisFeedback?: AnalysisFeedback[];
}

/**
 * POST /api/results
 * 
 * Saves a completed stress test result to the database.
 * Called from the ScorePanel after the user completes a debugging challenge.
 * 
 * @returns The created StressResult record
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body: SaveResultRequest = await request.json();

    // Validate required fields
    const requiredFields = [
      "owner", "repo", "branchName", "grade", "timeMs", 
      "bugCount", "stressLevel", "startCommitSha", "completeCommitSha"
    ];
    
    for (const field of requiredFields) {
      if (body[field as keyof SaveResultRequest] === undefined) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Create the stress result record
    const result = await prisma.stressResult.create({
      data: {
        userId: user.id,
        owner: body.owner,
        repo: body.repo,
        branchName: body.branchName,
        grade: body.grade,
        timeMs: body.timeMs,
        bugCount: body.bugCount,
        stressLevel: body.stressLevel,
        startCommitSha: body.startCommitSha,
        completeCommitSha: body.completeCommitSha,
        symptoms: body.symptoms || [],
        filesBuggered: body.filesBuggered || [],
        changes: body.changes || [],
        analysisSummary: body.analysisSummary,
        analysisIsPerfect: body.analysisIsPerfect ?? false,
        analysisFeedback: body.analysisFeedback ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      resultId: result.id,
    });
  } catch (error) {
    console.error("[Results] Error saving result:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save result" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/results
 * 
 * Fetches stress test results for the current user.
 * Supports pagination via `limit` and `offset` query params.
 * 
 * @returns Array of StressResult records
 */
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch results for this user
    const results = await prisma.stressResult.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const total = await prisma.stressResult.count({
      where: { userId: user.id },
    });

    return NextResponse.json({
      results,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[Results] Error fetching results:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch results" },
      { status: 500 }
    );
  }
}

