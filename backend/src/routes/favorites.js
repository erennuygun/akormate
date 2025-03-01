const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Song = require('../models/Song');
const auth = require('../middleware/auth');

// Favorilere şarkı ekle
router.post('/:songId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    const songId = req.params.songId;
    
    // Şarkının var olduğunu kontrol et
    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ message: 'Şarkı bulunamadı' });
    }

    // Şarkı zaten favorilerde mi kontrol et
    if (user.favorites.includes(songId)) {
      return res.status(400).json({ message: 'Bu şarkı zaten favorilerinizde' });
    }

    // Favorilere ekle
    user.favorites.push(songId);
    await user.save();

    res.json({ message: 'Şarkı favorilere eklendi' });
  } catch (error) {
    console.error('Favorilere eklerken hata:', error);
    res.status(500).json({ message: 'Bir hata oluştu', error: error.message });
  }
});

// Favorilerden şarkı çıkar
router.delete('/:songId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    const songId = req.params.songId;
    
    // Şarkı favorilerde var mı kontrol et
    if (!user.favorites.includes(songId)) {
      return res.status(400).json({ message: 'Bu şarkı favorilerinizde değil' });
    }

    // Favorilerden çıkar
    user.favorites = user.favorites.filter(id => id.toString() !== songId);
    await user.save();

    res.json({ message: 'Şarkı favorilerden çıkarıldı' });
  } catch (error) {
    console.error('Favorilerden çıkarırken hata:', error);
    res.status(500).json({ message: 'Bir hata oluştu', error: error.message });
  }
});

// Kullanıcının favori şarkılarını getir
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('favorites');
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    res.json(user.favorites);
  } catch (error) {
    console.error('Favorileri getirirken hata:', error);
    res.status(500).json({ message: 'Bir hata oluştu', error: error.message });
  }
});

// Bir şarkının favori olup olmadığını kontrol et
router.get('/check/:songId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    const isFavorite = user.favorites.includes(req.params.songId);
    res.json({ isFavorite });
  } catch (error) {
    console.error('Favori kontrolü yaparken hata:', error);
    res.status(500).json({ message: 'Bir hata oluştu', error: error.message });
  }
});

module.exports = router;
