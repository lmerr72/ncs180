export type OutlookAuthStatus = {
  configured: boolean;
  connected: boolean;
  expiresAt: string | null;
  scope: string | null;
  redirectUri?: string;
  scopes?: string[];
  tenantId?: string;
  error?: string;
};

export type OutlookMessage = {
  id: string;
  subject: string;
  bodyPreview: string;
  sentDateTime: string | null;
  webLink: string;
  toRecipients: string[];
  ccRecipients: string[];
  bccRecipients: string[];
  matchedEmails: string[];
};

export type OutlookMessagesResponse = {
  messages: OutlookMessage[];
  matchedEmails: string[];
  error?: string;
};

export async function getOutlookAuthStatus(signal?: AbortSignal): Promise<OutlookAuthStatus> {
  const response = await fetch("/api/outlook/auth/status", {
    credentials: "include",
    signal,
  });
  const payload = await response.json() as OutlookAuthStatus;

  if (!response.ok) {
    throw new Error(payload.error ?? "Unable to check Outlook connection status.");
  }

  return payload;
}

export async function getOutlookSentMessages(
  emails: string[],
  options: {
    limit?: number;
    signal?: AbortSignal;
  } = {},
): Promise<OutlookMessagesResponse> {
  const normalizedEmails = Array.from(
    new Set(emails.map((email) => email.trim().toLowerCase()).filter(Boolean)),
  );
  const params = new URLSearchParams();

  normalizedEmails.forEach((email) => {
    params.append("email", email);
  });

  if (options.limit) {
    params.set("limit", String(options.limit));
  }

  const response = await fetch(`/api/outlook/sent-messages?${params.toString()}`, {
    credentials: "include",
    signal: options.signal,
  });
  const payload = await response.json() as OutlookMessagesResponse;

  if (!response.ok) {
    throw new Error(payload.error ?? "Unable to load Outlook sent messages.");
  }

  return payload;
}
