function getErrorMessage(error, fallbackMessage, exposeMessage) {
  if (!exposeMessage) {
    return fallbackMessage;
  }

  return error instanceof Error ? error.message : fallbackMessage;
}

function respondWithError({
  req,
  res,
  logger,
  event,
  error,
  statusCode = 500,
  fallbackMessage = 'Internal server error.',
  exposeMessage = true,
  details = {}
}) {
  logger.error(event, {
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    ...details,
    error
  });

  res.status(statusCode).json({
    error: getErrorMessage(error, fallbackMessage, exposeMessage),
    requestId: req.id
  });
}

module.exports = {
  respondWithError
};
