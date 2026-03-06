const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    // Ensure the database is created in MongoDB by initialising a collection.
    // Without at least one collection MongoDB won't show the DB in Compass.
    const db = conn.connection.db;
    const collections = await db.listCollections().toArray();
    if (collections.length === 0) {
      await db.createCollection("app_init");
      console.log("📦 Initialised 'kaammitra' database (created app_init collection)");
    }
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
