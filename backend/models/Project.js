const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Project name is required'], trim: true },
  description: { type: String, trim: true, default: '' },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: [true, 'Client is required'] },
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  hourlyRate: {
    type: Number,
    required: [true, 'Hourly rate is required'],
    min: [0, 'Hourly rate must be 0 or more'],
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Project', projectSchema);
