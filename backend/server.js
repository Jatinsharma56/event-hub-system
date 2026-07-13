const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const path = require('path');
// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/registrations', require('./routes/registrationRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve frontend static files (index.html, css/, js/) — no cache during dev
app.use(express.static(path.join(__dirname, '..'), { maxAge: 0, etag: false }));

// Catch-all: serve index.html for any unmatched route
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
