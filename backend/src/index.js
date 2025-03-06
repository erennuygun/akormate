const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); 
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Statik dosyalar için 
app.use('/assets', express.static(path.join(__dirname, '../../assets')));

// Health check endpoint'i
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI || 'mongodb://0.0.0.0:27017/akormate', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB bağlantısı başarılı');
}).catch((err) => {
  console.error('MongoDB bağlantı hatası:', err);
});

// Route'ları import et
app.use('/api/users', require('./routes/users'));
app.use('/api/songs', require('./routes/songs'));
app.use('/api/favorites', require('./routes/favorites'));

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Static files are served from: ${path.join(__dirname, '../../assets')}`);
});
