import mongoose from 'mongoose';

let cachedPromise = null;

const connectDB = async () => {
  // Return existing active connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || (
    !process.env.VERCEL ? 'mongodb://localhost:27017/trackmytrash' : null
  );

  if (!MONGODB_URI) {
    const errorMsg = 'MONGODB_URI environment variable is not defined in Vercel settings.';
    console.error(`❌ MongoDB Error: ${errorMsg}`);
    throw new Error(errorMsg);
  }

  // Detect un-replaced Atlas template placeholders
  if (MONGODB_URI.includes('<') || MONGODB_URI.includes('>')) {
    const errorMsg = 'MONGODB_URI contains placeholder angle brackets < > (e.g. <cluster> or <password>). Remove the < > brackets and insert your actual Atlas cluster name and password.';
    console.error(`❌ MongoDB Config Error: ${errorMsg}`);
    throw new Error(errorMsg);
  }

  if (!cachedPromise) {
    cachedPromise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    }).then((conn) => {
      console.log(`✅ MongoDB Connected to: ${conn.connection.name || 'default'} @ ${conn.connection.host}`);
      return conn;
    }).catch((err) => {
      cachedPromise = null; // Reset so next request can retry
      console.error(`❌ MongoDB Connection Error: ${err.message}`);
      throw err;
    });
  }

  return cachedPromise;
};

export default connectDB;
