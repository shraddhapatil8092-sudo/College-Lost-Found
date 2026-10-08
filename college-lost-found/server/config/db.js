import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB() {
  if (mongoose.connection.readyState >= 1 || isConnected) {
    return;
  }
  await mongoose.connect(
    process.env.MONGO_URI || 'mongodb+srv://shraddhapatil8092_db_user:Shraddha123@cluster0.ludoqls.mongodb.net/college_lost_found?retryWrites=true&w=majority&appName=Cluster0',
  );
  isConnected = true;
  console.log('MongoDB connected successfully');
}