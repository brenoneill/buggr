"use client";

import { CoinIcon } from "@/app/components/icons";

interface CoinsUpsellProps {
  contactEmail?: string;
}

export function CoinsUpsell({ contactEmail }: CoinsUpsellProps) {
  const email = contactEmail || "hello@buggr.dev";

  return (
    <div className="mb-4 rounded-lg border border-gh-border bg-gh-canvas-subtle p-4">
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-white">
        <CoinIcon className="h-4 w-4 text-gh-accent" />
        Want more coins?
      </div>
      <p className="text-xs text-gh-text-muted">
        Pull the repo and connect your own LLM locally to avoid spend, or email me at{" "}
        <a className="text-gh-accent hover:underline" href={`mailto:${email}`}>
          {email}
        </a>{" "}
        and I can top you up.
      </p>
    </div>
  );
}
