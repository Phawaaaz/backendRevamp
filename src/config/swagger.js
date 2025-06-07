const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Visitor Management System API',
      version: '1.0.0',
      description: `
        API documentation for the Visitor Management System.
        
        ## Authentication
        All protected routes require a JWT token in the Authorization header:
        \`Authorization: Bearer <your_token>\`
        
        ## User Roles
        - visitor: Basic user role for visitors
        - admin: Administrative access
        - super-admin: Super administrative access
        - developer: Highest level access
        
        ## Rate Limiting
        API requests are limited to 100 requests per 15 minutes per IP address.
      `,
      contact: {
        name: 'API Support',
        email: 'support@example.com',
        url: 'https://example.com/support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://phawaazvms.onrender.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  msg: { type: 'string' },
                  param: { type: 'string' },
                  location: { type: 'string' }
                }
              }
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            _id: { 
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            firstName: { 
              type: 'string',
              example: 'John'
            },
            lastName: { 
              type: 'string',
              example: 'Doe'
            },
            email: { 
              type: 'string',
              format: 'email',
              example: 'john.doe@example.com'
            },
            role: {
              type: 'string',
              enum: ['visitor', 'admin', 'super-admin', 'developer'],
              example: 'visitor',
              description: 'User role in the system'
            },
            phone: { 
              type: 'string',
              example: '+1234567890'
            },
            photo: { 
              type: 'string',
              example: 'default-avatar.png'
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            lastLogin: {
              type: 'string',
              format: 'date-time'
            },
            createdAt: { 
              type: 'string',
              format: 'date-time'
            },
            updatedAt: { 
              type: 'string',
              format: 'date-time'
            }
          },
          required: ['email', 'firstName', 'lastName', 'role']
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Authentication successful'
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User'
                },
                token: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                }
              }
            }
          }
        },
        Visitor: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            user: {
              $ref: '#/components/schemas/User'
            },
            purpose: { 
              type: 'string',
              example: 'Business Meeting'
            },
            visitDate: { 
              type: 'string',
              format: 'date-time'
            },
            expectedDuration: { 
              type: 'number',
              example: 60,
              description: 'Duration in minutes'
            },
            company: { 
              type: 'string',
              example: 'Acme Corp'
            },
            notes: { 
              type: 'string',
              example: 'Meeting with the marketing team'
            },
            status: {
              type: 'string',
              enum: ['scheduled', 'checked-in', 'checked-out', 'cancelled'],
              example: 'scheduled'
            },
            checkInTime: {
              type: 'string',
              format: 'date-time'
            },
            checkOutTime: {
              type: 'string',
              format: 'date-time'
            },
            qrCode: {
              type: 'string'
            },
            qrCodeExpiry: {
              type: 'string',
              format: 'date-time'
            }
          },
          required: ['user', 'purpose', 'visitDate', 'expectedDuration']
        }
      }
    },
    security: [{ bearerAuth: [] }],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Visitors',
        description: 'Visitor management endpoints'
      },
      {
        name: 'Admin',
        description: 'Administrative endpoints'
      },
      {
        name: 'Super Admin',
        description: 'Super administrative endpoints'
      }
    ]
  },
  apis: ['./src/routes/*.js'] // Path to the API routes
};

const specs = swaggerJsdoc(options);

module.exports = specs; 