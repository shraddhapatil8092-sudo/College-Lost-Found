import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import itemRoutes from './routes/itemRoutes.js';
import claimRoutes from './routes/claimRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';
import { sendSuccess } from './utils/apiResponse.js';
import { uploadDirectory } from './config/uploads.js';

const app = express();
const port = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in server/.env');
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDirectory, { maxAge: '1d' }));

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/test', (_request, response) => {
  return sendSuccess(response, 200, 'Backend API is working', {});
});

app.use(notFoundHandler);
app.use(errorHandler);

await connectDB();

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});