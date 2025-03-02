const express = require('express');
const router = express.Router();
const Repertoire = require('../models/Repertoire');

// Yeni repertuar oluştur
router.post('/', async (req, res) => {
  const repertoire = new Repertoire({
    userId: req.body.userId,
    name: req.body.name,
    songs: req.body.songIds || [] // songIds'i songs dizisine atıyoruz
  });

  try {
    const newRepertoire = await repertoire.save();
    res.status(201).json(newRepertoire);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Kullanıcının repertuarlarını getir
router.get('/user/:userId', async (req, res) => {
  try {
    const repertoires = await Repertoire.find({ userId: req.params.userId });
    res.json(repertoires);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Repertuar detaylarını getir
router.get('/:id', async (req, res) => {
  try {
    const repertoire = await Repertoire.findById(req.params.id)
      .populate('songs')
      .exec();
    
    if (!repertoire) {
      return res.status(404).json({ message: 'Repertuar bulunamadı' });
    }
    
    res.json(repertoire);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Repertuara şarkı ekle
router.post('/:id/songs', async (req, res) => {
  try {
    const repertoire = await Repertoire.findById(req.params.id);
    if (!repertoire) {
      return res.status(404).json({ message: 'Repertuar bulunamadı' });
    }

    const songId = req.body.songId;
    if (!repertoire.songs.includes(songId)) {
      repertoire.songs.push(songId);
      await repertoire.save();
    }

    res.json(repertoire);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Repertuardan şarkı çıkar
router.delete('/:id/songs/:songId', async (req, res) => {
  try {
    const repertoire = await Repertoire.findById(req.params.id);
    if (!repertoire) {
      return res.status(404).json({ message: 'Repertuar bulunamadı' });
    }

    repertoire.songs = repertoire.songs.filter(id => id.toString() !== req.params.songId);
    await repertoire.save();

    res.json(repertoire);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Repertuar güncelle
router.put('/:id', async (req, res) => {
  try {
    const repertoire = await Repertoire.findById(req.params.id);
    if (!repertoire) {
      return res.status(404).json({ message: 'Repertuar bulunamadı' });
    }

    if (req.body.name) {
      repertoire.name = req.body.name;
    }
    
    if (req.body.songs) {
      repertoire.songs = req.body.songs.map(song => song._id || song);
    }

    const updatedRepertoire = await repertoire.save();
    res.json(updatedRepertoire);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Repertuar silme
router.delete('/:id', async (req, res) => {
  try {
    const repertoire = await Repertoire.findByIdAndDelete(req.params.id);
    if (!repertoire) {
      return res.status(404).json({ message: 'Repertuar bulunamadı' });
    }
    res.json({ message: 'Repertuar başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
