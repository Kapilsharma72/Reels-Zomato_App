# Authentication Setup Guide

This document explains how the unified authentication system works in the ReelZomato project.

## Overview

The authentication system supports multiple user types:
- **User**: Regular customers who browse and order food
- **Food Partner**: Restaurant/cafe owners
- **Delivery Partner**: Delivery drivers
- **Editor**: Content editors

## Backend API Endpoints

### User Authentication
- `POST /api/auth/user/register` - Register a new user
- `POST /api/auth/user/login` - Login as a user
- `GET /api/auth/user/logout` - Logout user

### Food Partner Authentication
- `POST /api/auth/foodPartner/register` - Register a new food partner
- `POST /api/auth/foodPartner/login` - Login as a food partner
- `GET /api/auth/foodPartner/logout` - Logout food partner

## Frontend Components

### UnifiedRegister.jsx
- Multi-step registration form
- Role-based field validation
- Real-time error handling
- Success/error message display

### UnifiedLogin.jsx
- Role selection for login
- Credential validation
- Error handling and user feedback

### AuthService
- Centralized API communication
- Cookie-based authentication
- Error handling and response processing

## Database Models

### User Model
```javascript
{
  fullName: String (required),
  email: String (required, unique),
  password: String (required),
  phoneNumber: String (optional),
  role: String (enum: ['user', 'delivery-partner', 'editor']),
  vehicleType: String (for delivery partners),
  licenseNumber: String (for delivery partners),
  experience: String (for editors),
  portfolio: String (for editors)
}
```

### Food Partner Model
```javascript
{
  businessName: String (required),
  name: String (required),
  email: String (required, unique),
  password: String (required),
  address: String (required),
  phoneNumber: String (required),
  totalCustomers: Number (default: 0),
  rating: Number (default: 0)
}
```

## Authentication Flow

1. **Registration**:
   - User selects role (User, Food Partner, Delivery Partner, Editor)
   - Fills basic information (name, email, password)
   - Fills role-specific information
   - Backend validates and creates account
   - JWT token is generated and stored in HTTP-only cookie
   - User is redirected to appropriate dashboard

2. **Login**:
   - User selects role
   - Enters email and password
   - Backend validates credentials
   - JWT token is generated and stored in HTTP-only cookie
   - User is redirected to appropriate dashboard

3. **Session Management**:
   - JWT tokens are stored in HTTP-only cookies
   - Tokens include user ID and are signed with JWT_SECRET
   - Frontend checks authentication status via cookie presence

## Security Features

- Password hashing using bcrypt
- JWT token-based authentication
- HTTP-only cookies for token storage
- CORS configuration for cross-origin requests
- Input validation and sanitization

## Testing

Run the authentication test script:
```bash
cd Backend
node test-auth.js
```

This will test:
- User registration and login
- Food partner registration and login
- Error handling for invalid credentials

## Environment Variables

Make sure these are set in your `.env` file:
```
JWT_SECRET=your_jwt_secret_key
MONGODB_URI=your_mongodb_connection_string
PORT=8000
```

## Error Handling

The system provides comprehensive error handling:
- Validation errors for missing required fields
- Duplicate email detection
- Invalid credential feedback
- Network error handling
- User-friendly error messages

## Future Enhancements

- Password reset functionality
- Email verification
- Two-factor authentication
- Social login integration
- Role-based access control middleware
- Session timeout handling
