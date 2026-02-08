require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const WebSocket = require('ws');
const Redis = require('ioredis');
const { Pool } = require('pg');

// Import routes
const projectRoutes = require('./routes/projects');
const agentRoutes = require('./routes/agents');
const characterRoutes = require('./routes/characters');
const executionRoutes = require('./routes/executions');
const fileRoutes = require('./routes/files');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize WebSocket server
const wss = new WebSocket.Server({ server });

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379');

// Initialize PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Make database and redis available to routes
app.locals.db = pool;
app.locals.redis = redis;
app.locals.wss = wss;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      database: pool.totalCount > 0 ? 'connected' : 'disconnected',
      redis: redis.status === 'ready' ? 'connected' : 'disconnected'
    }
  });
});

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/files', fileRoutes);

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection established');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received WebSocket message:', data);
      
      // Handle different message types
      if (data.type === 'subscribe') {
        ws.projectId = data.projectId;
        ws.send(JSON.stringify({ 
          type: 'subscribed', 
          projectId: data.projectId 
        }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Redis subscriber for real-time updates
const subscriber = new Redis(process.env.REDIS_URL || 'redis://redis:6379');
subscriber.subscribe('agent-events', 'execution-updates', (err, count) => {
  if (err) {
    console.error('Failed to subscribe to Redis channels:', err);
  } else {
    console.log(`Subscribed to ${count} Redis channels`);
  }
});

subscriber.on('message', (channel, message) => {
  try {
    const data = JSON.parse(message);
    
    // Broadcast to relevant WebSocket clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        if (!client.projectId || client.projectId === data.projectId) {
          client.send(JSON.stringify({
            channel,
            data
          }));
        }
      }
    });
  } catch (error) {
    console.error('Redis message processing error:', error);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Route not found' } });
});

// Initialize database schema
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL,
        duration INTEGER,
        status VARCHAR(50) DEFAULT 'draft',
        manifest JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS characters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        profile JSONB NOT NULL,
        reference_image VARCHAR(500),
        seed VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS executions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        scene_id VARCHAR(100),
        agent_name VARCHAR(100),
        status VARCHAR(50) DEFAULT 'pending',
        input JSONB,
        output JSONB,
        error TEXT,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS agent_logs (
        id SERIAL PRIMARY KEY,
        execution_id UUID REFERENCES executions(id) ON DELETE CASCADE,
        agent_name VARCHAR(100),
        level VARCHAR(20),
        message TEXT,
        metadata JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
      CREATE INDEX IF NOT EXISTS idx_executions_project ON executions(project_id);
      CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status);
      CREATE INDEX IF NOT EXISTS idx_agent_logs_execution ON agent_logs(execution_id);
    `);
    
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Start server
const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    await initDatabase();
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Jarvis Panel API running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 WebSocket server ready`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed');
  });
  await pool.end();
  redis.disconnect();
  subscriber.disconnect();
  process.exit(0);
});
