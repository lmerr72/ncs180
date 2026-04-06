require('./loadEnv');

const { createApp } = require('./app');
const { createLogger } = require('./logger');

const port = process.env.PORT || 3001;
const logger = createLogger('server');

process.on('unhandledRejection', (error) => {
  logger.error('unhandled_rejection', { error });
});

process.on('uncaughtException', (error) => {
  logger.error('uncaught_exception', { error });
  process.exit(1);
});

createApp()
  .then((app) => {
    app.listen(port, () => {
      logger.info('server_started', {
        port,
        url: `http://localhost:${port}`
      });
    });
  })
  .catch((error) => {
    logger.error('server_start_failed', { error });
    process.exit(1);
  });
