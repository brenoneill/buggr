import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchFileContent, updateFile } from "@/lib/github";
import { introduceAIStress } from "@/lib/ai-stress";

// Maximum file size in lines to process (keeps token usage reasonable)
const MAX_FILE_LINES_SINGLE = 5000; // If only 1 file, allow up to 5000 lines
const MAX_FILE_LINES_MULTIPLE = 2000; // If multiple files, limit to 2000 lines per file

/**
 * POST /api/github/stress
 * 
 * Uses AI to introduce subtle breaking changes to files that were modified in a commit.
 * Requires owner, repo, branch, and files (array of file paths) in the request body.
 * 
 * Randomly selects ONE file from the provided files and applies all bugs to that single file.
 * Files exceeding the line limit are skipped to keep token usage reasonable.
 * Selected file can be up to 5000 lines.
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
    const { owner, repo, branch, files, context, difficulty } = body;

    if (!owner || !repo || !branch || !files || !Array.isArray(files)) {
      return NextResponse.json(
        { error: "Missing required fields: owner, repo, branch, files" },
        { status: 400 }
      );
    }

    // Validate context length if provided
    const stressContext = typeof context === "string" ? context.slice(0, 200) : undefined;
    
    // Validate stress level
    const validLevels = ["low", "medium", "high"] as const;
    const stressLevel: "low" | "medium" | "high" = validLevels.includes(difficulty) ? difficulty : "medium";

    // Calculate total bug count based on stress level (TOTAL across all files, not per file)
    const STRESS_CONFIGS = {
      low: { bugCountMin: 1, bugCountMax: 2 },
      medium: { bugCountMin: 2, bugCountMax: 3 },
      high: { bugCountMin: 2, bugCountMax: 3 },
    };
    const config = STRESS_CONFIGS[stressLevel];
    const totalBugCount = Math.floor(Math.random() * (config.bugCountMax - config.bugCountMin + 1)) + config.bugCountMin;

    const results: { file: string; success: boolean; changes?: string[]; symptoms?: string[]; error?: string }[] = [];
    const allSymptoms: string[] = [];

    // Count valid code files to determine line limit
    const validCodeFiles = files.filter((filePath) => {
      const ext = filePath.split(".").pop()?.toLowerCase();
      return ["ts", "tsx", "js", "jsx", "py", "java", "go", "rs", "c", "cpp", "h", "cs"].includes(ext || "");
    });
    
    // Since we're only processing one file, allow up to 5000 lines
    const maxFileLines = MAX_FILE_LINES_SINGLE;

    // First, collect all valid files that we can process (fetch content and check size)
    interface ProcessableFile {
      filePath: string;
      content: string;
      sha: string;
    }
    const processableFiles: ProcessableFile[] = [];

    for (const filePath of files) {
      try {
        // Skip non-code files
        const ext = filePath.split(".").pop()?.toLowerCase();
        if (!["ts", "tsx", "js", "jsx", "py", "java", "go", "rs", "c", "cpp", "h", "cs"].includes(ext || "")) {
          results.push({ file: filePath, success: false, error: "Skipped non-code file" });
          continue;
        }

        // Fetch the current file content
        const fileContent = await fetchFileContent(
          session.accessToken,
          owner,
          repo,
          filePath,
          branch
        );

        // Decode the content (it's base64 encoded)
        const decodedContent = Buffer.from(fileContent.content, "base64").toString("utf-8");

        // Skip files that are too large (keeps token usage reasonable)
        const lineCount = decodedContent.split("\n").length;
        if (lineCount > maxFileLines) {
          results.push({ 
            file: filePath, 
            success: false, 
            error: `Skipped: file too large (${lineCount} lines, max ${maxFileLines})` 
          });
          continue;
        }

        processableFiles.push({
          filePath,
          content: decodedContent,
          sha: fileContent.sha,
        });
      } catch (error) {
        results.push({
          file: filePath,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Randomly pick ONE file to stress
    if (processableFiles.length === 0) {
      return NextResponse.json({
        message: "No processable files found",
        results,
        symptoms: [],
      });
    }

    // Randomly select one file
    const selectedFileIndex = Math.floor(Math.random() * processableFiles.length);
    const selectedFile = processableFiles[selectedFileIndex];

    // Mark all other files as skipped
    for (let i = 0; i < processableFiles.length; i++) {
      if (i !== selectedFileIndex) {
        results.push({ 
          file: processableFiles[i].filePath, 
          success: false, 
          error: "Not selected for stress testing" 
        });
      }
    }

    // Apply all bugs to the selected file
    try {
      const { filePath, content: decodedContent, sha } = selectedFile;
      
      // Use AI to introduce subtle stress with all bugs in this single file
      const { content: modifiedContent, changes, symptoms } = await introduceAIStress(
        decodedContent, 
        filePath, 
        stressContext, 
        stressLevel,
        totalBugCount
      );

      // Only update if changes were made
      if (changes.length > 0 && modifiedContent !== decodedContent) {
        await updateFile(
          session.accessToken,
          owner,
          repo,
          filePath,
          modifiedContent,
          `🔥 ${filePath} is stressed out`,
          sha,
          branch
        );

        results.push({ file: filePath, success: true, changes, symptoms });
        allSymptoms.push(...symptoms);
      } else {
        results.push({ file: filePath, success: false, error: "No changes made" });
      }
    } catch (error) {
      results.push({
        file: selectedFile.filePath,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    const successCount = results.filter((r) => r.success).length;

    // Deduplicate symptoms
    const uniqueSymptoms = [...new Set(allSymptoms)];

    return NextResponse.json({
      message: `${successCount} of ${files.length} files have been stressed out`,
      results,
      symptoms: uniqueSymptoms,
    });
  } catch (error) {
    console.error("Error introducing stress:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to introduce stress" },
      { status: 500 }
    );
  }
}

