const express = require('express');
const router = express.Router();
const Song = require('../models/Song');
const auth = require('../middleware/auth'); // Auth middleware'i doğru yoldan import edildi

// Tüm şarkıları getir (public)
router.get('/', async (req, res) => {
  try {
    const { search, tag, random } = req.query;
    
    if (tag === 'artists') {
      const artists = await Song.aggregate([
        { $group: { _id: '$artist' } },
        { $sample: { size: 20 } },
        { $project: { 
          _id: '$_id',
          title: '$_id',
          artist: { $literal: '' },
          originalKey: { $literal: 'artist' }
        }}
      ]);
      return res.json(artists);
    }

    let query = {
      $or: [
        { isPrivate: false },
        { isPrivate: { $exists: false } }
      ]
    };

    // Eğer arama varsa, title veya artist'te ara
    if (search) {
      query.$and = [{
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { artist: { $regex: search, $options: 'i' } }
        ]
      }];
    }

    // Tag'e göre filtrele
    if (tag && ['popular', 'new', 'normal'].includes(tag)) {
      query.tag = tag;
    }

    let songs;
    if (random === 'true') {
      // Rastgele 20 şarkı getir
      songs = await Song.aggregate([
        { $match: query },
        { $sample: { size: 15 } }
      ]);
    } else {
      songs = await Song.find(query).sort({ created_at: -1 });
    }

    res.json(songs);
  } catch (error) {
    console.error('Şarkıları getirirken hata:', error);
    res.status(500).json({ 
      message: 'Şarkılar yüklenirken bir hata oluştu',
      error: error.message 
    });
  }
});

// ID'ye göre şarkı getir (public)
router.get('/:id', async (req, res) => {
  try {
    const song = await Song.findOne({
      _id: req.params.id,
      $or: [
        { isPrivate: false },
        { isPrivate: { $exists: false } }
      ]
    });

    if (!song) {
      return res.status(404).json({ message: 'Şarkı bulunamadı' });
    }

    res.json(song);
  } catch (error) {
    console.error('Şarkı getirirken hata:', error);
    res.status(500).json({ 
      message: 'Şarkı yüklenirken bir hata oluştu',
      error: error.message 
    });
  }
});

// Yeni şarkı ekle (auth gerekli)
router.post('/', auth, async (req, res) => {
  try {
    const song = new Song({
      title: req.body.title,
      artist: req.body.artist,
      originalKey: req.body.originalKey,
      chords: req.body.chords,
      userId: req.user._id,
      isPrivate: req.body.isPrivate || false
    });

    const newSong = await song.save();
    res.status(201).json(newSong);
  } catch (error) {
    console.error('Şarkı eklerken hata:', error);
    res.status(400).json({ 
      message: 'Şarkı eklenirken bir hata oluştu',
      error: error.message 
    });
  }
});

// Birden fazla şarkıyı sil (auth gerekli)
router.delete('/batch', auth, async (req, res) => {
  try {
    const { songIds } = req.body;
    
    if (!Array.isArray(songIds) || songIds.length === 0) {
      return res.status(400).json({ message: 'Geçerli şarkı ID\'leri gönderilmedi' });
    }

    const result = await Song.deleteMany({ _id: { $in: songIds } });

    res.json({
      message: `${result.deletedCount} şarkı başarıyla silindi`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Şarkıları silerken hata:', error);
    res.status(500).json({ 
      message: 'Şarkılar silinirken bir hata oluştu',
      error: error.message 
    });
  }
});

// Özel şarkı ekle (auth gerekli)
router.post('/private', auth, async (req, res) => {
  try {
    const song = new Song({
      ...req.body,
      isPrivate: true,
      userId: req.user._id
    });

    const newSong = await song.save();
    res.status(201).json(newSong);
  } catch (error) {
    console.error('Özel şarkı eklerken hata:', error);
    res.status(400).json({ 
      message: 'Özel şarkı eklenirken bir hata oluştu',
      error: error.message 
    });
  }
});

// Kullanıcının özel şarkılarını getir (auth gerekli)
router.get('/private/user/:userId', auth, async (req, res) => {
  try {
    // Sadece kendi özel şarkılarını görebilir
    if (req.user._id.toString() !== req.params.userId) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    const songs = await Song.find({ 
      userId: req.params.userId,
      isPrivate: true
    }).sort({ created_at: -1 });

    res.json(songs);
  } catch (error) {
    console.error('Özel şarkıları getirirken hata:', error);
    res.status(500).json({ 
      message: 'Özel şarkılar yüklenirken bir hata oluştu',
      error: error.message 
    });
  }
});

// Birden fazla şarkının tag'ini güncelle (auth gerekli)
router.put('/batch/tag', auth, async (req, res) => {
  try {
    const { songIds, tag } = req.body;
    
    if (!Array.isArray(songIds) || songIds.length === 0) {
      return res.status(400).json({ message: 'Geçerli şarkı ID\'leri gönderilmedi' });
    }

    if (!['normal', 'popular', 'new'].includes(tag)) {
      return res.status(400).json({ message: 'Geçersiz tag değeri' });
    }

    const result = await Song.updateMany(
      { _id: { $in: songIds } },
      { $set: { tag: tag } }
    );

    res.json({
      message: `${result.modifiedCount} şarkının tag'i güncellendi`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Tag güncellenirken hata:', error);
    res.status(500).json({ 
      message: 'Tag güncellenirken bir hata oluştu',
      error: error.message 
    });
  }
});

// Benzersiz sanatçıları getir
router.get('/artists', async (req, res) => {
  try {
    const artists = await Song.aggregate([
      { $group: { _id: "$artist" } },
      { $sort: { _id: 1 } },
      { $limit: 20 }
    ]);

    res.json(artists.map(a => a._id));
  } catch (error) {
    console.error('Sanatçıları getirirken hata:', error);
    res.status(500).json({ message: 'Bir hata oluştu' });
  }
});

// Sanatçıya ait şarkıları getir
router.get('/artist/:name', async (req, res) => {
  try {
    const songs = await Song.find({ 
      artist: req.params.name 
    }).sort({ title: 1 });

    res.json(songs);
  } catch (error) {
    console.error('Sanatçı şarkılarını getirirken hata:', error);
    res.status(500).json({ message: 'Bir hata oluştu' });
  }
});

// Get 20 random artists
router.get('/random-artists', auth, async (req, res) => {
  try {
    const artists = await Song.aggregate([
      { $group: { _id: '$artist' } },
      { $sample: { size: 20 } }
    ]);
    
    const formattedArtists = artists.map(a => ({
      _id: a._id + '_artist', // Unique ID for each artist
      title: a._id,
      artist: '',
      originalKey: ''
    }));
    
    res.json(formattedArtists);
  } catch (error) {
    console.error('Error getting random artists:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
