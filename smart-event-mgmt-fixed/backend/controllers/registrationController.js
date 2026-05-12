const Registration = require('../models/Registration');
const Event = require('../models/Event');

// @desc    Register for an event
// @route   POST /api/registrations
const registerForEvent = async (req, res) => {
  try {
    const { eventId, userName, roll, department, category } = req.body;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (!event.registrationOpen) return res.status(400).json({ message: 'Registration is closed' });

    // Check capacity
    const currentRegs = await Registration.countDocuments({ eventId });
    if (event.seatLimit > 0 && currentRegs >= event.seatLimit) {
      return res.status(400).json({ message: 'Event is full' });
    }

    // Check duplicate by user or roll
    const existingUserReg = await Registration.findOne({ eventId, userId });
    if (existingUserReg) return res.status(400).json({ message: 'You are already registered for this event' });

    const existingRollReg = await Registration.findOne({ eventId, roll });
    if (existingRollReg) return res.status(400).json({ message: 'This Roll Number is already registered for this event' });

    const registration = new Registration({
      eventId, userId, userName, roll, department, category
    });

    const createdReg = await registration.save();
    res.status(201).json(createdReg);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get registrations (All for admin, User's for student)
// @route   GET /api/registrations
const getRegistrations = async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query.userId = req.user._id;
    }
    const registrations = await Registration.find(query);
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark attendance
// @route   PUT /api/registrations/:id/attendance
const markAttendance = async (req, res) => {
  try {
    const reg = await Registration.findById(req.params.id);
    if (!reg) return res.status(404).json({ message: 'Registration not found' });

    reg.attended = true;
    reg.attendedAt = new Date();
    await reg.save();

    res.json(reg);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerForEvent, getRegistrations, markAttendance };
