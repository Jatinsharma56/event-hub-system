const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  email: { type: String, required: true },
  roll: { type: String, required: true },
  department: { type: String, required: true },
  category: { type: String, required: true },
  attended: { type: Boolean, default: false },
  attendedAt: { type: Date }
}, { timestamps: true });

// Prevent duplicate registration for the same event by the same user or roll number
registrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });
registrationSchema.index({ eventId: 1, roll: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
