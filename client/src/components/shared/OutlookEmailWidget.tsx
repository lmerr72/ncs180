import { useEffect, useMemo, useState } from "react";
import { Clock, ExternalLink, Mail, MailOpen, Send, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/helpers/formatters";
import {
  getOutlookAuthStatus,
  getOutlookSentMessages,
  type OutlookAuthStatus,
  type OutlookMessage,
} from "@/services/outlookService";

type OutlookEmailWidgetProps = {
  emails: string[];
  returnTo: string;
  title: string;
  description: string;
  emptyMessage: string;
  limit?: number;
};

export default function OutlookEmailWidget({
  emails,
  returnTo,
  title,
  description,
  emptyMessage,
  limit = 10,
}: OutlookEmailWidgetProps) {
  const normalizedEmails = useMemo(
    () => Array.from(new Set(emails.map((email) => email.trim().toLowerCase()).filter(Boolean))),
    [emails],
  );
  const [authStatus, setAuthStatus] = useState<OutlookAuthStatus | null>(null);
  const [messages, setMessages] = useState<OutlookMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectUrl = `/api/outlook/auth/start?returnTo=${encodeURIComponent(returnTo)}`;

  useEffect(() => {
    const controller = new AbortController();

    getOutlookAuthStatus(controller.signal)
      .then((status) => {
        setAuthStatus(status);
      })
      .catch((fetchError: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setAuthStatus({
          configured: false,
          connected: false,
          expiresAt: null,
          scope: null,
        });
        setError(fetchError instanceof Error ? fetchError.message : "Unable to check Outlook connection status.");
      });

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (normalizedEmails.length === 0) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    if (!authStatus?.configured || !authStatus.connected) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    const controller = new AbortController();
    setLoadingMessages(true);
    setError(null);

    getOutlookSentMessages(normalizedEmails, {
      limit,
      signal: controller.signal,
    })
      .then((payload) => {
        setMessages(payload.messages ?? []);
      })
      .catch((fetchError: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setMessages([]);
        setError(fetchError instanceof Error ? fetchError.message : "Unable to load Outlook sent messages.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingMessages(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [authStatus?.configured, authStatus?.connected, limit, normalizedEmails]);

  const statusMessage = (() => {
    if (normalizedEmails.length === 0) {
      return "Add an email address to this record before Outlook activity can be matched.";
    }

    if (!authStatus) {
      return "Checking Outlook connection...";
    }

    if (!authStatus.configured) {
      return error || "Outlook integration is not configured on the server yet.";
    }

    if (!authStatus.connected) {
      return "Connect Outlook to load recent sent messages for these email addresses.";
    }

    if (error) {
      console.error('[OutlookEmailWidget]: failed to connect to outlook inbox',error)
      return 'Failed to connect to Outlook inbox';
    }

    return emptyMessage;
  })();

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-border/50 bg-muted/20 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <MailOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-foreground">{title}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            </div>
          </div>
        </div>

        {authStatus?.configured && !authStatus.connected && normalizedEmails.length > 0 && (
          <a
            href={connectUrl}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Connect Outlook
          </a>
        )}
      </div>

      <div className="px-6 py-4 border-b border-border/40 bg-muted/10 flex flex-wrap gap-2">
        {normalizedEmails.length === 0 && (
          <span className="text-sm text-muted-foreground">No contact emails on file.</span>
        )}
        {normalizedEmails.map((email) => (
          <span
            key={email}
            className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700"
          >
            {email}
          </span>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto max-h-[28rem]">
        {(loadingMessages || messages.length === 0) && (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            {loadingMessages ? "Loading Outlook emails..." : statusMessage}
          </div>
        )}

        {messages.length > 0 && (
          <div className="divide-y divide-border/40">
            {messages.map((message) => (
              <article key={message.id} className="px-6 py-4 hover:bg-muted/20 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{message.subject}</p>
                      <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">
                        Email
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.matchedEmails.map((email) => (
                        <span
                          key={`${message.id}-${email}`}
                          className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700"
                        >
                          Matched: {email}
                        </span>
                      ))}
                    </div>

                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                      {message.bodyPreview || "No preview available for this message."}
                    </p>

                    <div className="mt-3 flex flex-col gap-2 text-xs text-muted-foreground">
                      <RecipientRow label="To" values={message.toRecipients} />
                      {message.ccRecipients.length > 0 && <RecipientRow label="Cc" values={message.ccRecipients} />}
                    </div>
                  </div>

                  {message.webLink && (
                    <a
                      href={message.webLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open
                    </a>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {formatSentDate(message.sentDateTime)}
                  </span>
                  {message.sentDateTime && (
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      {timeAgo(message.sentDateTime)}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RecipientRow({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="flex items-start gap-2">
      <span className="min-w-8 font-semibold text-foreground">{label}</span>
      <span className={cn("flex items-start gap-1.5", values.length > 6 && "flex-wrap")}>
        <Users className="w-3.5 h-3.5 mt-0.5" />
        <span>{values.join(", ")}</span>
      </span>
    </div>
  );
}

function formatSentDate(value: string | null) {
  if (!value) {
    return "Sent time unavailable";
  }

  const sentAt = new Date(value);
  if (Number.isNaN(sentAt.getTime())) {
    return "Sent time unavailable";
  }

  return sentAt.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
