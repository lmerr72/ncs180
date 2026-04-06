const crypto = require('crypto');

function createRequestId() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `req-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function serializeError(error) {
  if (!error) {
    return null;
  }

  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    code: error.code,
    cause: error.cause ? serializeError(error.cause) : undefined
  };
}

function serializeValue(value) {
  if (value instanceof Error) {
    return serializeError(value);
  }

  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, serializeValue(nestedValue)])
    );
  }

  return value;
}

function writeLog(level, scope, event, metadata = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    scope,
    event,
    ...serializeValue(metadata)
  };
  const writer = level === 'debug' ? console.debug : console[level];
  writer(JSON.stringify(payload));
}

function createLogger(scope) {
  return {
    debug(event, metadata) {
      writeLog('debug', scope, event, metadata);
    },
    info(event, metadata) {
      writeLog('info', scope, event, metadata);
    },
    warn(event, metadata) {
      writeLog('warn', scope, event, metadata);
    },
    error(event, metadata) {
      writeLog('error', scope, event, metadata);
    }
  };
}

module.exports = {
  createLogger,
  createRequestId,
  serializeError
};
