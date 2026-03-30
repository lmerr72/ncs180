require('./loadEnv');

const { createApp } = require('./app');

const port = process.env.PORT || 3001;

createApp()
  .then((app) => {
    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server', error);
    process.exit(1);
  });
