const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '20kb' }));

// In production, serve the built React app from the same origin as the API.
const frontendBuild = path.join(__dirname, '..', 'frontend', 'build');
if (process.env.NODE_ENV === 'production' && fs.existsSync(frontendBuild)) {
  app.use(express.static(frontendBuild));
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/merchants', require('./routes/merchants'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/pilot', require('./routes/pilot'));

// Health check
app.get('/api/health', (req, res) => {
  const database = mongoose.connection.readyState === 1 ? 'connected' : 'unavailable';
  res.status(database === 'connected' ? 200 : 503).json({ status: database === 'connected' ? 'ok' : 'degraded', database });
});

if (process.env.NODE_ENV === 'production' && fs.existsSync(frontendBuild)) {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(frontendBuild, 'index.html'));
  });
}

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI || '')
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    // Start server anyway for demo purposes
    app.listen(PORT, () => console.log(`Server running on port ${PORT} (without DB)`));
  });

module.exports = app;
