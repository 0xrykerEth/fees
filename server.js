const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.dune.com"],
      frameSrc: ["'self'", "https://dune.com"]
    }
  }
}));

// CORS middleware
app.use(cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files middleware - serve HTML files directly
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api', require('./routes/api'));

// Serve main pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/stats', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'stats.html'));
});

app.get('/tvl-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tvl-dashboard.html'));
});



// 404 handler
app.use((req, res) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>404 - Page Not Found</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #e74c3c; }
        a { color: #3498db; text-decoration: none; }
      </style>
    </head>
    <body>
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <a href="/">← Back to Calculator</a>
    </body>
    </html>
  `);
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>500 - Server Error</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #e74c3c; }
        a { color: #3498db; text-decoration: none; }
      </style>
    </head>
    <body>
      <h1>500 - Server Error</h1>
      <p>${process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message}</p>
      <a href="/">← Back to Calculator</a>
    </body>
    </html>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Lighter Exchange Calculator running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
