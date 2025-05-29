# Visitor Management System API

A robust backend API for managing visitors, built with Node.js, Express, and MongoDB.

## Features

- 🔐 **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (visitor, admin, super-admin, developer)
  - Secure password hashing
  - Session management

- 👥 **Visitor Management**
  - Visitor registration and profiles
  - Visit scheduling
  - QR code generation for check-in/out
  - Visit history tracking
  - Email notifications

- 📊 **Admin Features**
  - Visitor analytics and reporting
  - Real-time visitor tracking
  - Custom notification settings
  - System configuration management

- 🔒 **Security**
  - Rate limiting
  - Input validation
  - XSS protection
  - CORS enabled
  - Secure headers

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/visitor-management-api.git
cd visitor-management-api
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/visitor-management
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
```

4. Start the development server:
```bash
npm run dev
```

## API Documentation

The API documentation is available at `/api-docs` when the server is running.

### Base URL
- Development: `http://localhost:5000`
- Production: `https://api.example.com`

### Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your_token>
```

### Main Endpoints

#### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

#### Visitors
- `POST /api/visitors` - Create new visit
- `GET /api/visitors/my-visits` - Get visitor's visits
- `POST /api/visitors/check-in/:qrCode` - Check in visitor
- `POST /api/visitors/check-out/:qrCode` - Check out visitor

#### Admin
- `GET /api/admin/visitors` - Get all visitors
- `GET /api/admin/analytics` - Get visitor analytics
- `PATCH /api/admin/settings` - Update admin settings

## Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run docs` - Generate API documentation

### Project Structure

```
src/
├── config/         # Configuration files
├── middleware/     # Custom middleware
├── models/         # Database models
├── routes/         # API routes
├── utils/          # Utility functions
└── server.js       # Application entry point
```

## Testing

Run the test suite:
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

If you discover any security-related issues, please email security@example.com instead of using the issue tracker.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@example.com or join our Slack channel.

## Acknowledgments

- Express.js
- MongoDB
- JWT
- Swagger/OpenAPI
- All contributors who have helped shape this project 