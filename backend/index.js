const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const connectToMongo = require('./db');
const cors = require('cors');
const express = require('express');

const dbReady = connectToMongo();

const app = express();
const port = process.env.PORT || 5000;
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
  credentials: true,
}));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Backend is running' });
});

app.get('/', (req, res) => {
  res.json({ success: true, message: 'API is live' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/notes', require('./routes/notes'));

if (require.main === module) {
  dbReady
    .then(() => {
      app.listen(port, '0.0.0.0', () => {
        console.log(`Example app listening at http://0.0.0.0:${port}`);
      });
    })
    .catch((error) => {
      console.error('Cannot start server — MongoDB connection failed:', error.message);
      process.exit(1);
    });
}

module.exports = app;