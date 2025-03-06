const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    let token = req.header('Authorization');
    
    // Token formatını kontrol et ve düzelt
    if (token) {
      // "Bearer " prefix'ini kaldır (eğer varsa)
      token = token.replace('Bearer ', '');
    } else {
      // Authorization header yoksa body'den veya query'den kontrol et
      token = req.body.token || req.query.token;
    }
    
    if (!token) {
      return res.status(401).json({ message: 'Yetkilendirme token\'ı bulunamadı' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findOne({
      _id: decoded.userId,
      token: token,
      tokenExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(401).json({ message: 'Geçersiz token' });
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware hatası:', error);
    res.status(401).json({ message: 'Lütfen giriş yapın' });
  }
};

module.exports = auth;
