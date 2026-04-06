import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, MailOpen, RefreshCw, ShieldCheck, Unplug } from "lucide-react";
import { getOutlookAuthStatus, type OutlookAuthStatus } from "@/services/outlookService";

type OutlookSettingsWidgetProps = {
  returnTo: string;
};

export default function OutlookSettingsWidget({ returnTo }: OutlookSettingsWidgetProps) {
  const [status, setStatus] = useState<OutlookAuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const connectUrl = useMemo(
    () => `/api/outlook/auth/start?returnTo=${encodeURIComponent(returnTo)}`,
    [returnTo],
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getOutlookAuthStatus(controller.signal)
      .then((nextStatus) => {
        setStatus(nextStatus);
      })
      .catch((fetchError: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setStatus(null);
        setError(fetchError instanceof Error ? fetchError.message : "Unable to check Outlook connection status.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, []);

  async function handleDisconnect() {
    setDisconnecting(true);
    setError(null);

    try {
      const response = await fetch("/api/outlook/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Unable to disconnect Outlook.");
      }

      setStatus((currentStatus) => currentStatus
        ? { ...currentStatus, connected: false, expiresAt: null, scope: null }
        : {
            configured: false,
            connected: false,
            expiresAt: null,
            scope: null,
          });
    } catch (disconnectError) {
      setError(disconnectError instanceof Error ? disconnectError.message : "Unable to disconnect Outlook.");
    } finally {
      setDisconnecting(false);
    }
  }

  const statusTone = status?.connected
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-amber-200 bg-amber-50 text-amber-700";
  const statusLabel = status?.connected ? "Connected" : "Not connected";

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden md:col-span-2">
      <div className="p-6 border-b border-border/50 bg-muted/10 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <MailOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Outlook Email Sync</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Connect your Outlook account so client and contact pages can show emails you have sent.
            </p>
          </div>
        </div>

        {!loading && status?.configured && !status.connected && (
          <a
            href={connectUrl}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            Connect Outlook
          </a>
        )}
      </div>

      <div className="p-6 space-y-5">
        <div className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${statusTone}`}>
          {status?.connected && <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />}
          {statusLabel}
        </div>

        {loading && (
          <p className="text-sm text-muted-foreground">Checking Outlook connection status...</p>
        )}

        {!loading && error && (
          <p className="text-sm text-rose-600">{error}</p>
        )}

        {!loading && !error && status && !status.configured && (
          <p className="text-sm text-muted-foreground">
            Outlook integration is not configured on the server yet. Add the Microsoft app credentials before users can connect.
          </p>
        )}

        {!loading && !error && status?.configured && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoTile
              label="Connection"
              value={status.connected ? "Active" : "Waiting"}
              helpText={status.connected ? "Your mailbox is available for email matching." : "Connect to start syncing sent email activity."}
            />
            <InfoTile
              label="Access Expires"
              value={formatExpiresAt(status.expiresAt)}
              helpText="The app refreshes access automatically when a refresh token is available."
            />
            <InfoTile
              label="Scopes"
              value={status.scope ? formatScopeSummary(status.scope) : "Not granted yet"}
              helpText="Uses Microsoft Graph delegated mailbox read access for your own account."
            />
          </div>
        )}

        {!loading && status?.configured && (
          <div className="flex flex-wrap gap-3">
            <a
              href={connectUrl}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background font-semibold text-foreground hover:bg-muted/40 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              {status.connected ? "Reconnect Outlook" : "Start Connection"}
            </a>

            {status.connected && (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 font-semibold text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-60"
              >
                <Unplug className="w-4 h-4" />
                {disconnecting ? "Disconnecting..." : "Disconnect"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoTile({ label, value, helpText }: { label: string; value: string; helpText: string }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-base font-semibold text-foreground">{value}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{helpText}</p>
    </div>
  );
}

function formatExpiresAt(value: string | null) {
  if (!value) {
    return "Not connected";
  }

  const expiresAt = new Date(value);
  if (Number.isNaN(expiresAt.getTime())) {
    return "Unavailable";
  }

  return expiresAt.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatScopeSummary(scope: string) {
  const scopes = scope.split(" ").filter(Boolean);
  if (scopes.length <= 2) {
    return scopes.join(", ");
  }

  return `${scopes.slice(0, 2).join(", ")} +${scopes.length - 2} more`;
}
