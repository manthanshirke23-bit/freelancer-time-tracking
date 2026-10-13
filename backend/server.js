require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const projectRoutes = require('./routes/projectRoutes');
const timeLogRoutes = require('./routes/timeLogRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// CORS: open by default for local development. In production set CLIENT_URL
// (comma-separated) to allow only your deployed frontend.
const corsOptions = process.env.CLIENT_URL
  ? { origin: process.env.CLIENT_URL.split(',').map((url) => url.trim()) }
  : {};
app.use(cors(corsOptions));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/time-logs', timeLogRoutes);

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  const missing = ['MONGO_URI', 'JWT_SECRET'].filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.error(`Missing environment variable(s): ${missing.join(', ')}. Copy .env.example to .env and fill them in.`);
    process.exit(1);
  }

  await connectDB();

  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`Server running on port ${port}`));
};

// Only start listening when run directly (node server.js / nodemon).
// This lets the app be imported without side effects.
if (require.main === module) {
  startServer();
}

module.exports = app;
