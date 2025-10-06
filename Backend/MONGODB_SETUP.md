# MongoDB Setup Guide

This guide will help you set up MongoDB for the ReelZomato backend application.

## Quick Setup

1. **Set up environment variables:**
   ```bash
   npm run setup-env
   ```

2. **Test MongoDB connection:**
   ```bash
   npm run test-mongodb
   ```

3. **Start the server:**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

## MongoDB Installation

### Windows
1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Install with default settings
3. MongoDB will be installed as a Windows service and start automatically

### macOS
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Linux (Ubuntu/Debian)
```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Create list file
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package database
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

## Manual MongoDB Start

If MongoDB is not running as a service:

### Windows
```bash
# Navigate to MongoDB bin directory
cd "C:\Program Files\MongoDB\Server\6.0\bin"
mongod
```

### macOS/Linux
```bash
mongod
```

## Environment Variables

The application uses the following environment variables (configured in `.env` file):

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/reelzomato_dev
DB_URL=mongodb://localhost:27017/reel-zomato

# JWT Configuration
JWT_SECRET=your-development-jwt-secret-key-change-this-in-production

# Server Configuration
PORT=3001
HOST=127.0.0.1
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Upload Configuration
UPLOAD_PATH=./uploads
```

## Troubleshooting

### Common Issues

1. **"ECONNREFUSED" Error**
   - MongoDB is not running
   - Solution: Start MongoDB with `mongod`

2. **"Authentication Failed" Error**
   - Wrong credentials in connection string
   - Solution: Check your MongoDB username/password

3. **"Timeout" Error**
   - MongoDB is not accessible
   - Solution: Check if MongoDB is running and accessible

4. **"Database not found" Warning**
   - This is normal - MongoDB creates databases automatically when first used

### Testing Connection

Run the MongoDB connection test:
```bash
npm run test-mongodb
```

This will test different connection strings and provide detailed error information.

### Manual Connection Test

You can also test MongoDB connection manually:
```bash
# Connect to MongoDB shell
mongosh

# Or with specific database
mongosh mongodb://localhost:27017/reelzomato_dev
```

## Database Structure

The application will automatically create the following collections when first used:
- `users` - User accounts and profiles
- `foods` - Food items and menus
- `orders` - Order management
- `posts` - Social media posts
- `stories` - Story content
- `videosubmissions` - Video submissions
- `foodpartners` - Food partner information

## Production Setup

For production deployment:

1. **Use MongoDB Atlas** (recommended):
   - Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Create a cluster
   - Get connection string
   - Update `MONGODB_URI` in your environment variables

2. **Self-hosted MongoDB**:
   - Set up MongoDB on your server
   - Configure authentication
   - Update connection string with credentials
   - Use environment variables for sensitive data

## Security Notes

- Never commit `.env` files to version control
- Use strong JWT secrets in production
- Enable MongoDB authentication in production
- Use MongoDB Atlas for production deployments
- Regularly backup your database

## Support

If you encounter issues:
1. Check MongoDB logs
2. Run `npm run test-mongodb`
3. Verify MongoDB is running: `mongosh --eval "db.runCommand('ping')"`
4. Check firewall settings
5. Verify connection string format
