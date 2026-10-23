import mongoose from 'mongoose';

const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/trackmytrash';
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`✅ MongoDB Connected to: ${conn.connection.name || 'default'} @ ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // If Atlas failed, attempt local mongodb fallback
    try {
      const localFallback = await mongoose.connect('mongodb://localhost:27017/trackmytrash');
      console.log(`✅ Connected to Local MongoDB: ${localFallback.connection.host}`);
    } catch (localErr) {
      console.error(`❌ Local MongoDB also unavailable: ${localErr.message}`);
    }
  }
};

export default connectDB;
