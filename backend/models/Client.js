const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Client name is required'], trim: true },
  email: { type: String, trim: true, lowercase: true, default: '' },
  phone: { type: String, trim: true, default: '' },
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Client', clientSchema);
