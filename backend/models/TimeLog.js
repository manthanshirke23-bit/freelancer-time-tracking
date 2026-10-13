const mongoose = require('mongoose');

const timeLogSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: [true, 'Project is required'] },
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: [true, 'Date is required'] },
  hours: {
    type: Number,
    required: [true, 'Hours are required'],
    validate: {
      validator: (value) => value > 0,
      message: 'Hours must be greater than 0',
    },
  },
  description: { type: String, trim: true, default: '' },
  createdAt: { type: Date, default: Date.now },
});

// Speeds up the most common query: one freelancer's logs for a project by date.
timeLogSchema.index({ freelancer: 1, project: 1, date: -1 });

module.exports = mongoose.model('TimeLog', timeLogSchema);
