const express = require('express');

const app = express();

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'server'
  });
});

module.exports = app;
