const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Visitor Management System API',
      version: '1.0.0',
      description: 'API documentation for the Visitor Management System',
      contact: {
        name: 'Your Name',
        email: 'your@email.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
            role: {
              type: 'string',
              enum: ['visitor', 'admin', 'super-admin', 'developer'],
              description: 'User role. developer has the highest privileges and can access all routes, including creating new super-admins.'
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            phone: { type: 'string' },
            photo: { type: 'string' }
          },
          required: ['email', 'password', 'firstName', 'lastName']
        },
        Visitor: {
          type: 'object',
          properties: {
            purpose: { type: 'string' },
            visitDate: { type: 'string', format: 'date-time' },
            expectedDuration: { type: 'number' },
            company: { type: 'string' },
            notes: { type: 'string' }
          },
          required: ['purpose', 'visitDate']
        },
        Admin: {
          type: 'object',
          properties: {
            department: { type: 'string' },
            title: { type: 'string' },
            timezone: { type: 'string' }
          },
          required: ['department', 'title']
        }
      }
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'] // Path to the API routes
};

const specs = swaggerJsdoc(options);

module.exports = specs; 