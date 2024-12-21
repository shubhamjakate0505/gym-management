const mongoose = require('mongoose');

const trainerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  hourlyRate: { type: Number, required: true },
  commissionRate: { type: Number, required: true },  
  totalEarnings: { type: Number, default: 0 },
});

module.exports = mongoose.model('Trainer', trainerSchema);
