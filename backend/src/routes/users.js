const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
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
    
    // Hassas bilgileri çıkar ve kullanıcı bilgilerini gönder
    const userObject = user.toObject();
    delete userObject.password;
    
    res.json({
      user: userObject,
      token
    });
  } catch (error) {
    console.error('Kullanıcı girişi sırasında hata:', error);
    res.status(500).json({ message: 'Kullanıcı girişi sırasında hata' });
  }
});

// Çıkış yap
router.post('/logout', auth, async (req, res) => {
  try {
    await req.user.removeToken();
    res.json({ message: 'Başarıyla çıkış yapıldı' });
  } catch (error) {
    console.error('Çıkış yaparken hata:', error);
    res.status(500).json({ message: 'Çıkış yaparken hata' });
  }
});

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
router.put('/profile', auth, async (req, res) => {
  try {
    const { displayName, photoURL } = req.body;
    const user = req.user;

    if (displayName) {
      user.name = displayName;
    }
    
    if (photoURL) {
      const photoData = photoURL;
      // Base64 kontrolü
      if (photoData.startsWith('data:image')) {
        const photoExtension = photoData.split(';')[0].split('/')[1];
        const base64Data = photoData.split(',')[1];

        // Profil fotoğrafı için klasör oluştur
        const profilePicturesDir = path.join(__dirname, '../../../assets/images/profilePictures');
        if (!fs.existsSync(profilePicturesDir)) {
          fs.mkdirSync(profilePicturesDir, { recursive: true });
        }

        // Profil fotoğrafı için dosya yolu
        const photoFileName = `${user._id}.${photoExtension}`;
        const photoPath = path.join(profilePicturesDir, photoFileName);

        // Base64'ten dosyaya kaydet
        fs.writeFileSync(photoPath, base64Data, 'base64');

        // Kullanıcı verisini güncelle
        user.photoURL = `/assets/images/profilePictures/${photoFileName}`;
      }
    }

    await user.save();
    res.json({ user });
  } catch (error) {
    console.error('Profil güncellenirken hata:', error);
    res.status(500).json({ message: 'Profil güncellenirken hata oluştu' });
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
    if (req.body.photoURL) {
      const photoData = req.body.photoURL;
      // Base64 kontrolü
      if (photoData.startsWith('data:image')) {
        const photoExtension = photoData.split(';')[0].split('/')[1];
        const base64Data = photoData.split(',')[1];

        // Profil fotoğrafı için klasör oluştur
        const profilePicturesDir = path.join(__dirname, '../../../assets/images/profilePictures');
        if (!fs.existsSync(profilePicturesDir)) {
          fs.mkdirSync(profilePicturesDir, { recursive: true });
        }

        // Profil fotoğrafı için dosya yolu
        const photoFileName = `${user._id}.${photoExtension}`;
        const photoPath = path.join(profilePicturesDir, photoFileName);

        // Base64'ten dosyaya kaydet
        fs.writeFileSync(photoPath, base64Data, 'base64');

        // Kullanıcı verisini güncelle
        user.photoURL = `/assets/images/profilePictures/${photoFileName}`;
      }
    }

    await user.save();
    res.json(user);
  } catch (error) {
    console.error('Profil güncellenirken hata:', error);
    res.status(500).json({ message: error.message });
  }
});

// Repertuar oluşturma
router.post('/repertoires', auth, async (req, res) => {
  try {
    const { name, songIds } = req.body;
    const user = req.user;

    if (!name || !songIds || !Array.isArray(songIds)) {
      return res.status(400).json({ message: 'Geçersiz istek verileri' });
    }

    const newRepertoire = {
      name,
      songs: songIds
    };

    if (!user.repertoires) {
      user.repertoires = [];
    }
    user.repertoires.push(newRepertoire);

    try {
      const savedUser = await user.save();
      const addedRepertoire = savedUser.repertoires[savedUser.repertoires.length - 1];
      
      await User.populate(savedUser, {
        path: 'repertoires.songs',
        model: 'Song'
      });
      
      res.status(201).json(addedRepertoire);
    } catch (saveError) {
      throw saveError;
    }
  } catch (error) {
    res.status(500).json({ message: 'Repertuar oluşturulurken hata oluştu' });
  }
});

// Repertuar detaylarını getir
router.get('/repertoires/:id', auth, async (req, res) => {
  try {
    const user = req.user;
    const repertoire = user.repertoires.id(req.params.id);
    
    if (!repertoire) {
      return res.status(404).json({ message: 'Repertuar bulunamadı' });
    }

    // Şarkı detaylarını populate et
    await user.populate('repertoires.songs');
    
    res.json(repertoire);
  } catch (error) {
    console.error('Repertuar detayları alınırken hata:', error);
    res.status(500).json({ message: 'Repertuar detayları alınırken hata oluştu' });
  }
});

// Repertuar güncelleme
router.put('/repertoires/:id', auth, async (req, res) => {
  try {
    const user = req.user;
    const repertoire = user.repertoires.id(req.params.id);
    
    if (!repertoire) {
      return res.status(404).json({ message: 'Repertuar bulunamadı' });
    }

    // Gelen verileri güncelle
    if (req.body.name) repertoire.name = req.body.name;
    if (req.body.songs) repertoire.songs = req.body.songs.map(song => song._id);

    await user.save();
    res.json(repertoire);
  } catch (error) {
    console.error('Repertuar güncellenirken hata:', error);
    res.status(500).json({ message: 'Repertuar güncellenirken hata oluştu' });
  }
});

// Repertuar silme
router.delete('/repertoires/:id', auth, async (req, res) => {
  try {
    const user = req.user;
    const repertoireIndex = user.repertoires.findIndex(r => r._id.toString() === req.params.id);
    
    if (repertoireIndex === -1) {
      return res.status(404).json({ message: 'Repertuar bulunamadı' });
    }

    user.repertoires.splice(repertoireIndex, 1);
    await user.save();
    
    res.json({ message: 'Repertuar başarıyla silindi' });
  } catch (error) {
    console.error('Repertuar silinirken hata:', error);
    res.status(500).json({ message: 'Repertuar silinirken hata oluştu' });
  }
});

// Kullanıcının tüm repertuarlarını getir
router.get('/repertoires', auth, async (req, res) => {
  try {
    const user = req.user;
    
    // Şarkı detaylarını populate et
    await user.populate('repertoires.songs');
    
    res.json(user.repertoires);
  } catch (error) {
    console.error('Repertuarlar getirilirken hata:', error);
    res.status(500).json({ message: 'Repertuarlar getirilirken hata oluştu' });
  }
});

// Kullanıcı bilgilerini getir
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -tokens');
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // PhotoURL'i düzelt
    if (user.photoURL && !user.photoURL.startsWith('http')) {
      user.photoURL = `/assets/images/profilePictures/${user._id}.jpeg`;
    }

    res.json(user);
  } catch (error) {
    console.error('Kullanıcı bilgileri getirilirken hata:', error);
    res.status(500).json({ message: 'Kullanıcı bilgileri getirilirken hata oluştu' });
  }
});

module.exports = router;
