const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const connectToMongo = require('./db');
const cors = require('cors');
const express = require('express');

connectToMongo().catch((error) => {
  console.error('MongoDB connection failed:', error.message);
});

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

app.use('/api/auth', require('./routes/auth'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/notes', require('./routes/notes'));

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  });
}

module.exports = app;