const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// Kullanıcı kaydı
router.post('/', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Email kontrolü
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu email adresi zaten kullanımda' });
    }

    // Şifre hashleme
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({
      email,
      password: hashedPassword
    });

    await user.save();
    const token = await user.generateAuthToken();

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Kullanıcı kaydı sırasında hata:', error);
    res.status(400).json({ message: 'Kullanıcı kaydı sırasında hata' });
  }
});

// Kullanıcı girişi
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Kullanıcıyı bul
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Şifre kontrolü
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Geçersiz şifre' });
    }

    const token = await user.generateAuthToken();
    res.json({ user, token });
  } catch (error) {
    console.error('Kullanıcı girişi sırasında hata:', error);
    res.status(500).json({ message: 'Kullanıcı girişi sırasında hata' });
  }
});

// Çıkış yap
router.post('/logout', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Token bulunamadı' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    await user.removeToken(token);
    res.json({ message: 'Başarıyla çıkış yapıldı' });
  } catch (error) {
    console.error('Çıkış yaparken hata:', error);
    res.status(500).json({ message: 'Çıkış yaparken hata' });
  }
});

// Token kontrolü middleware
const auth = async (req, res, next) => {
  try {
    // Authorization header'ını kontrol et
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      console.error('Authorization header bulunamadı');
      return res.status(401).json({ message: 'Token bulunamadı' });
    }

    // Token'ı ayıkla
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      console.error('Token boş');
      return res.status(401).json({ message: 'Geçersiz token formatı' });
    }

    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId) {
      console.error('Token doğrulanamadı veya userId bulunamadı');
      return res.status(401).json({ message: 'Geçersiz token' });
    }

    // Kullanıcıyı bul
    const user = await User.findOne({
      _id: decoded.userId,
      'tokens.token': token
    });

    if (!user) {
      console.error('Token ile kullanıcı bulunamadı. UserId:', decoded.userId);
      return res.status(401).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Token'ın süresi dolmuş mu kontrol et
    const tokenDoc = user.tokens.find(t => t.token === token);
    if (!tokenDoc) {
      console.error('Token kullanıcının token listesinde bulunamadı');
      return res.status(401).json({ message: 'Token geçersiz' });
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    console.error('Token kontrolü sırasında hata:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Geçersiz token formatı' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token süresi dolmuş' });
    }
    res.status(401).json({ message: 'Lütfen tekrar giriş yapın' });
  }
};

// Favorilere şarkı ekle
router.post('/:userId/favorites', auth, async (req, res) => {
  try {
    const user = req.user;
    if (user._id.toString() !== req.params.userId) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    const songId = req.body.songId;
    if (!user.favorites.includes(songId)) {
      user.favorites.push(songId);
      await user.save();
    }

    res.json(user.favorites || []);
  } catch (error) {
    console.error('Favorilere şarkı eklerken hata:', error);
    res.status(500).json({ message: 'Favorilere şarkı eklerken hata' });
  }
});

// Favorilerden şarkı çıkar
router.delete('/:userId/favorites/:songId', auth, async (req, res) => {
  try {
    const user = req.user;
    if (user._id.toString() !== req.params.userId) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    user.favorites = user.favorites.filter(id => id.toString() !== req.params.songId);
    await user.save();

    res.json(user.favorites || []);
  } catch (error) {
    console.error('Favorilerden şarkı çıkarırken hata:', error);
    res.status(500).json({ message: 'Favorilerden şarkı çıkarırken hata' });
  }
});

// Kullanıcının favorilerini getir
router.get('/:userId/favorites', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('favorites');
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    res.json(user.favorites || []);
  } catch (error) {
    console.error('Favorileri getirirken hata:', error);
    res.status(500).json({ message: 'Favorileri getirirken hata' });
  }
});

// Kullanıcının repertuarlarını getir
router.get('/:userId/repertoires', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate({
        path: 'repertoires.songs',
        model: 'Song'
      });
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    res.json(user.repertoires || []);
  } catch (error) {
    console.error('Repertuarları getirirken hata:', error);
    res.status(500).json({ message: 'Repertuarları getirirken hata' });
  }
});

// Kullanıcının özel şarkılarını getir
router.get('/:userId/private-songs', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('privateSongs');
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    res.json(user.privateSongs || []);
  } catch (error) {
    console.error('Özel şarkıları getirirken hata:', error);
    res.status(500).json({ message: 'Özel şarkıları getirirken hata' });
  }
});

// Profil güncelleme
router.put('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // İsim güncelleme
    if (req.body.name) {
      user.name = req.body.name;
    }

    // Profil fotoğrafı güncelleme
    if (req.body.photoData) {
      const photoData = req.body.photoData;
      const photoExtension = photoData.split(';')[0].split('/')[1];
      const base64Data = photoData.split(',')[1];

      // Profil fotoğrafı için dosya yolu
      const photoFileName = `${user._id}.${photoExtension}`;
      const photoPath = path.join(__dirname, '../../../assets/images/profilePictures', photoFileName);

      // Base64'ten dosyaya kaydet
      fs.writeFileSync(photoPath, base64Data, 'base64');

      // Kullanıcı verisini güncelle
      user.photoURL = `/assets/images/profilePictures/${photoFileName}`;
    }

    await user.save();
    res.json(user);
  } catch (error) {
    console.error('Profil güncellenirken hata:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
