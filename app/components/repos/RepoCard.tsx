import { GitHubIcon, StarIcon } from "@/app/components/icons";

/**
 * Returns the appropriate Tailwind color class for a programming language.
 *
 * @param language - The programming language name
 * @returns Tailwind background color class
 */
export function getLanguageColor(language: string | null): string {
  switch (language) {
    case "TypeScript":
      return "bg-blue-400";
    case "JavaScript":
      return "bg-yellow-400";
    case "Python":
      return "bg-green-400";
    case "Go":
      return "bg-cyan-400";
    case "Rust":
      return "bg-orange-400";
    case "Java":
      return "bg-red-400";
    case "Ruby":
      return "bg-red-500";
    case "PHP":
      return "bg-purple-400";
    case "C#":
      return "bg-green-500";
    case "C++":
      return "bg-pink-400";
    case "C":
      return "bg-gray-400";
    default:
      return "bg-gray-400";
  }
}

export interface RepoCardData {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
}

interface RepoCardProps {
  /** Repository data to display */
  repo: RepoCardData;
  /** Optional actions to render on the right side */
  actions?: React.ReactNode;
  /** Optional className for custom styling */
  className?: string;
}

/**
 * Displays a repository card with name, description, language, and star count.
 * Accepts optional actions (buttons) to render on the right side.
 *
 * @param repo - Repository data to display
 * @param actions - Optional React nodes for action buttons
 * @param className - Optional additional CSS classes
 */
export function RepoCard({ repo, actions, className = "" }: RepoCardProps) {
  const repoUrl = `https://github.com/${repo.full_name}`;

  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-lg border border-gh-border bg-gh-canvas-subtle px-4 py-3 ${className}`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-mono text-sm font-medium text-white">
          {repo.full_name}
        </span>
        <span className="truncate text-xs text-gh-text-muted">
          {repo.description || "No description"}
        </span>
        <div className="mt-1 flex items-center gap-3">
          {repo.language && (
            <div className="flex items-center gap-1 text-xs text-gh-text-muted">
              <span
                className={`h-2.5 w-2.5 rounded-full ${getLanguageColor(repo.language)}`}
              />
              {repo.language}
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-gh-text-muted">
            <StarIcon className="h-3.5 w-3.5" />
            {repo.stargazers_count}
          </div>
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : (
        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-md border border-gh-border px-2.5 py-1.5 text-xs text-gh-text-muted transition-colors hover:border-gh-text-muted hover:text-white"
          title="View on GitHub"
        >
          <GitHubIcon className="h-3.5 w-3.5" />
          View
        </a>
      )}
    </div>
  );
}

