import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../client/dist');

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

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  app.use((request, response, next) => {
    if (request.method === 'GET' && !request.path.startsWith('/api') && !request.path.startsWith('/uploads')) {
      return response.sendFile(path.join(clientDistPath, 'index.html'));
    }
    return next();
  });
}

app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

app.use(notFoundHandler);
app.use(errorHandler);

if (!process.env.VERCEL) {
  await connectDB();
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

export default app;