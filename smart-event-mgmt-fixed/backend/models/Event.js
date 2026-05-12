const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  date: { type: String, required: true },
  time: { type: String },
  location: { type: String },
  category: { type: String, enum: ['Tech', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Other'], default: 'Other' },
  seatLimit: { type: Number, default: 100 },
  registrationOpen: { type: Boolean, default: true },
  deadline: { type: String },
  emoji: { type: String, default: '📅' },
  bannerColor: { type: String, default: 'var(--bg-elevated)' },
  coverPhoto: { type: String },
  clubLogo: { type: String },
  club: { type: String },
  organizer: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
