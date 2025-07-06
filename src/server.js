require('dotenv').config();
const express = require('express');
const cors = require('cors');
const winston = require('winston');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const connectDB = require('./config/database');
const createDefaultAdmin = require('./utils/defaultAdmin');
const checkAndCreateSuperAdmin = require('./utils/checkSuperAdmin');

// Debug: Check if environment variables are loaded
console.log('Environment variables loaded:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  MONGODB_URI: process.env.MONGODB_URI ? 'MongoDB URI is set' : 'MongoDB URI is not set'
});

// Import routes
const authRoutes = require('./routes/auth.routes');
const visitorRoutes = require('./routes/visitor.routes');
const adminRoutes = require('./routes/admin.routes');
const superAdminRoutes = require('./routes/superAdmin.routes');

// Create Express app
const app = express();

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the Visitor Management System API',
    version: '1.0.0',
    documentation: {
      swagger: '/api-docs',
      description: 'Interactive API documentation'
    },
    availableEndpoints: {
      authentication: {
        path: '/api/auth',
        description: 'User authentication and authorization'
      },
      visitors: {
        path: '/api/visitors',
        description: 'Visitor management operations'
      },
      admin: {
        path: '/api/admin',
        description: 'Administrative operations'
      },
      superAdmin: {
        path: '/api/super-admin',
        description: 'Super admin operations'
      }
    },
    status: {
      server: 'Running',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    }
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/super-admin', superAdminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await connectDB();
    
    // Create default admin users
    await createDefaultAdmin();
    
    // Ensure super admin exists
    await checkAndCreateSuperAdmin();
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 