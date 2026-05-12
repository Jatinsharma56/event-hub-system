const User  = require('../models/User');
const Event = require('../models/Event');

const seedData = async () => {
  try {
    // Skip if users already seeded
    const count = await User.countDocuments();
    if (count > 0) return;

    // ── Demo Users ──────────────────────────────────────────
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@demo.com',
      password: 'admin123',
      role: 'admin',
      department: 'Administration',
      category: 'Day Scholar',
    });

    await User.create({
      name: 'Demo Student',
      email: 'student@demo.com',
      password: 'demo123',
      role: 'student',
      department: 'BCA',
      category: 'Day Scholar',
    });

    // ── Sample Events ───────────────────────────────────────
    const today = new Date();
    const fmt   = (d) => d.toISOString().split('T')[0];

    const futureDate = (days) => {
      const d = new Date(today);
      d.setDate(d.getDate() + days);
      return fmt(d);
    };

    await Event.insertMany([
      {
        name: 'TechFest Hackathon 2025',
        description: 'A 24-hour hackathon open to all engineering students. Build innovative solutions to real-world problems. Prizes worth ₹50,000!',
        date: futureDate(5),
        time: '09:00',
        location: 'Main Auditorium, Block A',
        category: 'Tech',
        seatLimit: 120,
        registrationOpen: true,
        emoji: '💻',
        bannerColor: 'linear-gradient(135deg,#0a1628,#1a3a5c)',
        organizer: admin.name,
        createdBy: admin._id,
      },
      {
        name: 'Cultural Night 2025',
        description: 'An evening of music, dance and drama performances by talented students. Come celebrate art and culture with us!',
        date: futureDate(10),
        time: '18:00',
        location: 'Open Air Theatre',
        category: 'Cultural',
        seatLimit: 300,
        registrationOpen: true,
        emoji: '🎭',
        bannerColor: 'linear-gradient(135deg,#1a0a28,#3d1a5c)',
        organizer: admin.name,
        createdBy: admin._id,
      },
      {
        name: 'Inter-Department Cricket Tournament',
        description: 'Annual cricket tournament between all departments. Form your team of 11 and compete for the championship trophy!',
        date: futureDate(14),
        time: '08:00',
        location: 'College Ground',
        category: 'Sports',
        seatLimit: 200,
        registrationOpen: true,
        emoji: '🏏',
        bannerColor: 'linear-gradient(135deg,#1a1a0a,#3a3a0a)',
        organizer: admin.name,
        createdBy: admin._id,
      },
      {
        name: 'Web Development Workshop',
        description: 'A hands-on workshop covering React, Node.js and MongoDB. Learn to build full-stack web applications from scratch.',
        date: futureDate(3),
        time: '10:00',
        location: 'Computer Lab 3, Block B',
        category: 'Workshop',
        seatLimit: 50,
        registrationOpen: true,
        emoji: '🔧',
        bannerColor: 'linear-gradient(135deg,#1a0a00,#3a2000)',
        organizer: admin.name,
        createdBy: admin._id,
      },
      {
        name: 'Career Guidance Seminar',
        description: 'Industry experts share insights on placement preparation, resume building and interview techniques. Don\'t miss it!',
        date: futureDate(7),
        time: '11:00',
        location: 'Seminar Hall, Block C',
        category: 'Seminar',
        seatLimit: 150,
        registrationOpen: true,
        emoji: '🎤',
        bannerColor: 'linear-gradient(135deg,#1a0a1a,#2a1a3a)',
        organizer: admin.name,
        createdBy: admin._id,
      },
    ]);

    console.log('✅ Demo data seeded: 2 users + 5 events');
  } catch (err) {
    console.error('❌ Seeder error:', err.message);
  }
};

module.exports = seedData;
