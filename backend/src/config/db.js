import mongoose from 'mongoose';

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/trackmytrash';
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`✅ MongoDB Connected to: ${conn.connection.name || 'default'} @ ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // If Atlas failed, attempt local mongodb fallback if not in Vercel
    if (!process.env.VERCEL) {
      try {
        const localFallback = await mongoose.connect('mongodb://localhost:27017/trackmytrash');
        console.log(`✅ Connected to Local MongoDB: ${localFallback.connection.host}`);
        return localFallback;
      } catch (localErr) {
        console.error(`❌ Local MongoDB also unavailable: ${localErr.message}`);
      }
    }
    if (process.env.VERCEL) {
      throw error;
    }
  }
};

export default connectDB;
