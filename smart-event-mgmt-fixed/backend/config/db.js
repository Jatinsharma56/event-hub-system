const mongoose = require('mongoose');
const seedData  = require('./seeder');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eventhub');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await seedData();
  } catch (err) {
    console.log(`Failed to connect to local MongoDB. Starting in-memory database...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      const conn = await mongoose.connect(mongoUri);
      console.log(`MongoDB In-Memory Server Connected: ${conn.connection.host}`);
      await seedData();
    } catch (memErr) {
      console.error(`Error starting in-memory DB: ${memErr.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
