type LogLevel = "debug" | "info" | "warn" | "error";

type LogMetadata = Record<string, unknown>;

const sessionId = createSessionId();
let globalLoggingInstalled = false;

function createSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function shouldLog(level: LogLevel): boolean {
  if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
    return true;
  }

  return level === "warn" || level === "error";
}

function serializeValue(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack
    };
  }

  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, serializeValue(nestedValue)])
    );
  }

  return value;
}

function writeLog(level: LogLevel, scope: string, message: string, metadata: LogMetadata = {}) {
  if (!shouldLog(level)) {
    return;
  }

  const serializedMetadata = serializeValue(metadata) as LogMetadata;
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    scope,
    sessionId,
    message,
    ...serializedMetadata
  };

  const writer = level === "debug" ? console.debug : console[level];
  writer(`[ui:${scope}] ${message}`, payload);
}

export function createBrowserLogger(scope: string) {
  return {
    debug(message: string, metadata?: LogMetadata) {
      writeLog("debug", scope, message, metadata);
    },
    info(message: string, metadata?: LogMetadata) {
      writeLog("info", scope, message, metadata);
    },
    warn(message: string, metadata?: LogMetadata) {
      writeLog("warn", scope, message, metadata);
    },
    error(message: string, metadata?: LogMetadata) {
      writeLog("error", scope, message, metadata);
    }
  };
}

export function installGlobalErrorLogging() {
  if (globalLoggingInstalled || typeof window === "undefined") {
    return;
  }

  globalLoggingInstalled = true;
  const logger = createBrowserLogger("global");

  window.addEventListener("error", (event) => {
    logger.error("Unhandled window error", {
      source: event.filename,
      line: event.lineno,
      column: event.colno,
      error: event.error
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    logger.error("Unhandled promise rejection", {
      reason: event.reason
    });
  });
}
