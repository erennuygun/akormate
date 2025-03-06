const mongoose = require('mongoose');
const jwt = require('jsonwebtoken'); // jwt modülünü ekledik

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    trim: true
  },
  photoURL: {
    type: String
  },
  tokens: [{
    token: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 24 * 60 * 60 // Token 24 saat sonra otomatik silinir
    }
  }],
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song'
  }],
  repertoires: [{
    name: String,
    songs: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Song'
    }]
  }],
  privateSongs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song'
  }],
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Token eklemek için metod
userSchema.methods.generateAuthToken = async function() {
  const user = this;
  const token = jwt.sign(
    { userId: user._id.toString() },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );

  // Yeni token'ı tokens dizisine ekle
  user.tokens = user.tokens || [];
  user.tokens.push({
    token,
    createdAt: new Date()
  });

  await user.save();
  return token;
};

// Token silmek için metod
userSchema.methods.removeToken = async function(token) {
  const user = this;
  user.tokens = user.tokens.filter(t => t.token !== token);
  await user.save();
};

module.exports = mongoose.model('User', userSchema);
