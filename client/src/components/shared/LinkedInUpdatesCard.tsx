import { ExternalLink } from "lucide-react";

export type LinkedInPostItem = {
  id: string;
  title: string;
  postUrl: string;
  embedUrl?: string;
  summary?: string;
  publishedLabel?: string;
};

export function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

type LinkedInUpdatesCardProps = {
  companyLinkedInUrl?: string;
  posts: LinkedInPostItem[];
  emptyMessage?: string;
  openLabel?: string;
  loading?: boolean;
  statusMessage?: string;
  actionHref?: string;
  actionLabel?: string;
};

export function LinkedInUpdatesCard({
  companyLinkedInUrl = "",
  posts,
  emptyMessage = "No LinkedIn posts are configured yet.",
  openLabel = "Open LinkedIn",
  loading = false,
  statusMessage,
  actionHref,
  actionLabel,
}: LinkedInUpdatesCardProps) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-border/50 bg-muted/20 flex items-center gap-2">
        <LinkedInIcon className="w-4 h-4 text-[#0A66C2]" />
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">LinkedIn Updates</h2>
        <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">{posts.length}</span>
      </div>

      {loading ? (
        <div className="px-6 py-6">
          <div className="rounded-2xl border border-dashed border-[#0A66C2]/25 bg-blue-50/40 p-5">
            <p className="text-sm font-semibold text-foreground">Loading recent LinkedIn posts...</p>
            {companyLinkedInUrl && (
              <p className="mt-3 text-xs text-muted-foreground break-all">
                Company page: {companyLinkedInUrl}
              </p>
            )}
          </div>
        </div>
      ) : posts.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 p-5 bg-muted/10">
          {posts.slice(0, 3).map(post => (
            <div key={post.id} className="rounded-2xl border border-border bg-background overflow-hidden shadow-sm flex flex-col">
              <div className="px-4 py-3 border-b border-border/50 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-snug">{post.title}</p>
                  {post.publishedLabel && (
                    <p className="mt-1 text-xs text-muted-foreground">{post.publishedLabel}</p>
                  )}
                </div>
                <a
                  href={post.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#0A66C2] hover:underline flex-shrink-0"
                >
                  Open
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {post.embedUrl ? (
                <iframe
                  src={post.embedUrl}
                  title={post.title}
                  className="w-full min-h-[560px] bg-white"
                  allowFullScreen
                />
              ) : (
                <div className="p-4 flex-1 bg-gradient-to-br from-white to-slate-50">
                  <div className="rounded-2xl border border-[#0A66C2]/15 bg-blue-50/40 p-4 h-full">
                    <div className="flex items-center gap-2 text-[#0A66C2] text-xs font-semibold uppercase tracking-wide">
                      <LinkedInIcon className="w-3.5 h-3.5" />
                      Recent Post
                    </div>
                    <p className="mt-3 text-sm text-foreground leading-relaxed">
                      {post.summary ?? "Open this LinkedIn update to view the full post."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="px-6 py-6">
          <div className="rounded-2xl border border-dashed border-[#0A66C2]/25 bg-blue-50/40 p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold text-foreground">{statusMessage ?? emptyMessage}</p>
                {companyLinkedInUrl && (
                  <p className="mt-3 text-xs text-muted-foreground break-all">
                    LinkedIn URL: {companyLinkedInUrl}
                  </p>
                )}
              </div>

              {actionHref ? (
                <a
                  href={actionHref}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#0A66C2]/20 bg-white text-sm font-medium text-[#0A66C2] hover:bg-blue-50 transition-colors"
                >
                  <LinkedInIcon className="w-4 h-4" />
                  {actionLabel ?? "Connect LinkedIn"}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : companyLinkedInUrl && (
                <a
                  href={companyLinkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#0A66C2]/20 bg-white text-sm font-medium text-[#0A66C2] hover:bg-blue-50 transition-colors"
                >
                  <LinkedInIcon className="w-4 h-4" />
                  {openLabel}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
