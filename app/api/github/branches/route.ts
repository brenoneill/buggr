import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchRepoBranches } from "@/lib/github";

/**
 * GET /api/github/branches
 * 
 * Fetches branches for a specific repository.
 * Requires owner and repo query parameters.
 */
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "Missing owner or repo parameter" },
      { status: 400 }
    );
  }

  try {
    const branches = await fetchRepoBranches(session.accessToken, owner, repo);
    return NextResponse.json(branches);
  } catch (error) {
    console.error("Error fetching branches:", error);
    return NextResponse.json(
      { error: "Failed to fetch branches" },
      { status: 500 }
    );
  }
}

