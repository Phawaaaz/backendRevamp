# Visitor Management System Backend

A robust backend system for managing visitors, built with Node.js, Express, and MongoDB.

## Features

- User authentication and authorization
- QR code generation for visitor check-in/out
- Email notifications
- Admin dashboard with analytics
- Automated tasks (notifications, reports)
- Role-based access control (Visitor, Admin, Super Admin)

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd visitor-management-system
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/visitor-management
JWT_SECRET=your_jwt_secret
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password
```

4. Start the server:
```bash
npm run dev
```

## API Documentation

The API documentation is available through Swagger UI. Once the server is running, you can access it at:

```
http://localhost:5000/api-docs
```

The documentation includes:
- Detailed endpoint descriptions
- Request/response schemas
- Authentication requirements
- Example requests and responses

### API Endpoints

#### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/me` - Get current user information

#### Visitor Routes
- POST `/api/visitors` - Create a new visitor record
- GET `/api/visitors` - Get visitor's records
- POST `/api/visitors/check-in` - Check in a visitor
- POST `/api/visitors/check-out` - Check out a visitor
- PATCH `/api/visitors/preferences` - Update visitor preferences

#### Admin Routes
- GET `/api/admin/visitors` - Get all visitors with filtering
- GET `/api/admin/analytics` - Get visitor analytics
- PATCH `/api/admin/settings` - Update admin settings
- POST `/api/admin/register-admin` - Register new admin

#### Super Admin Routes
- GET `/api/super-admin/users` - Get all users
- POST `/api/super-admin/promote/:userId` - Promote user to admin
- POST `/api/super-admin/demote/:userId` - Demote admin to user
- DELETE `/api/super-admin/users/:userId` - Delete user
- PATCH `/api/super-admin/system-settings` - Update system settings

## Automated Tasks

The system includes several automated tasks:
- Hourly visitor notifications
- Auto-checkout for overdue visits
- Daily admin reports

## Security Features

- JWT authentication
- Password hashing
- Role-based middleware
- QR code validation
- Secure email handling

## Error Handling

All API endpoints follow a consistent error response format:
```json
{
  "success": false,
  "message": "Error message",
  "errors": [] // Optional validation errors
}
```

## Success Response Format

Successful API responses follow this format:
```json
{
  "success": true,
  "message": "Success message",
  "data": {} // Response data
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. 