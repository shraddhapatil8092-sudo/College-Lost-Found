import mongoose from 'mongoose';

export async function connectDB() {
  await mongoose.connect(
    process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/college_lost_found',
  );
  console.log('MongoDB connected successfully');
}