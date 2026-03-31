import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './api/auth.js';
import { authenticateToken } from './middleware/auth.js';

dotenv.config();

const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Public routes
app.use('/api/auth', authRouter);

// Protected test route
app.get('/api/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🍕 Backend läuft auf http://localhost:${PORT}`));
