import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/results/[buggerId]
 * 
 * Fetches a Result by its associated Bugger ID.
 * Returns null if no result exists yet (user hasn't completed the challenge).
 * 
 * @param buggerId - The Bugger ID to fetch the result for
 * @returns The Result record with its associated Bugger, or null
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ buggerId: string }> }
) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { buggerId } = await params;

    if (!buggerId) {
      return NextResponse.json(
        { error: "Missing buggerId parameter" },
        { status: 400 }
      );
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

    // Fetch the bugger with its result
    const bugger = await prisma.bugger.findUnique({
      where: { id: buggerId },
      include: { result: true },
    });

    if (!bugger) {
      return NextResponse.json(
        { error: "Bugger not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (bugger.userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized - this bugger belongs to another user" },
        { status: 403 }
      );
    }

    // Return the result (may be null if not completed yet)
    return NextResponse.json({
      result: bugger.result,
      bugger: {
        id: bugger.id,
        owner: bugger.owner,
        repo: bugger.repo,
        branchName: bugger.branchName,
        stressLevel: bugger.stressLevel,
        bugCount: bugger.bugCount,
        createdAt: bugger.createdAt,
      },
    });
  } catch (error) {
    console.error("[Results] Error fetching result:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch result" },
      { status: 500 }
    );
  }
}

