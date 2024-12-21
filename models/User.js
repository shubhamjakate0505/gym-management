const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  subscriptionStatus: { type: String, enum: ['active', 'inactive'], default: 'inactive' },
  subscriptionExpiry: { type: Date },
});

module.exports = mongoose.model('User', userSchema);
