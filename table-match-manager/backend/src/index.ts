import express from 'express';
import cors from 'cors';
import { config } from './config/environment';
import { testConnection } from './database/connection';
import { initializeDatabase } from './database/init';
import personsRoutes from './routes/persons';
import matchesRoutes from './routes/matches';
import queueRoutes from './routes/queue';
import rankingsRoutes from './routes/rankings';
import adminRoutes from './routes/admin';
import playerStatsRoutes from './routes/playerStats';

const app = express();
const PORT = config.server.port;

// Configure CORS for production
app.use(cors({
  origin: config.cors.origin,
  credentials: true
}));
app.use(express.json());

app.use('/api/persons', personsRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/rankings', rankingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/player-stats', playerStatsRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/health', async (_req, res) => {
  try {
    // Test database connection
    await testConnection();
    res.json({ 
      status: 'healthy',
      service: 'table-match-manager',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '1.0.0'
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy',
      service: 'table-match-manager',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'Database connection failed'
    });
  }
});

async function startServer(): Promise<void> {
  try {
    await testConnection();
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();