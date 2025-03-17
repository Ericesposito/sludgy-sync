import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors';
import authRoutes from './routes/auth';

const app = express();

// Add JSON body parsing
app.use(express.json());

// Configure CORS
app.use(cors(corsOptions));

// Mount routes
app.use('/api/auth', authRoutes);

export default app;
