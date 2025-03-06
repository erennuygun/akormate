const mongoose = require('mongoose');
const jwt = require('jsonwebtoken'); // jwt modülünü ekledik

const repertoireSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  songs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song',
    required: true
  }],
  created_at: {
    type: Date,
    default: Date.now
  }
});

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
  token: {
    type: String,
    default: null
  },
  tokenExpires: {
    type: Date,
    default: null
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song'
  }],
  repertoires: {
    type: [repertoireSchema],
    default: []
  },
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

  // Önceki tüm tokenleri temizle
  user.token = token;
  user.tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  await user.save();
  return token;
};

// Token silmek için metod
userSchema.methods.removeToken = async function() {
  const user = this;
  user.token = null;
  user.tokenExpires = null;
  await user.save();
};

module.exports = mongoose.model('User', userSchema);
