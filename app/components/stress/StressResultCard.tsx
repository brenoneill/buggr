"use client";

import { Button } from "@/app/components/inputs/Button";
import { Card } from "@/app/components/Card";

interface StressResult {
  message: string;
  results: { file: string; success: boolean; changes?: string[] }[];
  symptoms?: string[];
}

interface StressResultCardProps {
  /**
   * The stress result data.
   */
  result: StressResult;
  /**
   * The author's name to display.
   */
  authorName: string;
  /**
   * Callback when the card is dismissed.
   */
  onDismiss: () => void;
}

/**
 * A card displaying the results of a stress operation.
 *
 * @param result - The stress result data
 * @param authorName - Author name to show in the message
 * @param onDismiss - Callback to dismiss the card
 */
export function StressResultCard({ result, authorName, onDismiss }: StressResultCardProps) {
  return (
    <Card variant="danger">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="flex items-center gap-2 font-medium text-gh-danger-fg">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          {authorName}&apos;s commit is now stressed! 😈
        </h4>
        <Button variant="ghost" size="icon" onClick={onDismiss}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </Button>
      </div>
      <p className="mb-2 text-sm text-gh-danger-fg">{result.message}</p>
      <div className="space-y-2">
        {result.results
          .filter((r) => r.success)
          .map((fileResult) => (
            <div
              key={fileResult.file}
              className="rounded border border-gh-border bg-gh-canvas-subtle p-2 text-xs"
            >
              <div className="font-mono text-white">{fileResult.file}</div>
              {fileResult.changes && (
                <ul className="mt-1 list-inside list-disc text-gh-text-muted">
                  {fileResult.changes.map((change, i) => (
                    <li key={i}>{change}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
      </div>
    </Card>
  );
}

