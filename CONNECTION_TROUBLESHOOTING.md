# Connection Troubleshooting Guide

## 🔍 Error Analysis

The error you're seeing indicates that the frontend cannot connect to the backend server:

```
POST http://localhost:8000/api/auth/user/login net::ERR_CONNECTION_REFUSED
```

This happens because:
1. **Port Mismatch**: Frontend was trying to connect to port `8000`, but backend runs on port `3001`
2. **Server Not Running**: The backend server might not be started

## ✅ Fixes Applied

### 1. Fixed Port Configuration
- **Frontend**: Updated `Frontend/src/config/api.js` to use port `3001` instead of `8000`
- **Backend**: Confirmed it runs on port `3001` (from `Backend/config.js`)

### 2. Created Server Startup Script
- Added `Backend/start-server.js` for easy server startup
- Updated `Backend/package.json` with new scripts

## 🚀 How to Start the Backend Server

### Option 1: Using the new startup script
```bash
cd Backend
npm run start:dev
```

### Option 2: Direct start
```bash
cd Backend
npm start
```

### Option 3: Development mode (with auto-restart)
```bash
cd Backend
npm run dev
```

## 🔧 Step-by-Step Setup

1. **Start the Backend Server:**
   ```bash
   cd Backend
   npm run start:dev
   ```
   You should see:
   ```
   🚀 ReelZomato server running on 127.0.0.1:3001
   ✅ MongoDB connected successfully
   ```

2. **Start the Frontend:**
   ```bash
   cd Frontend
   npm run dev
   ```
   You should see:
   ```
   Local:   http://localhost:5173/
   ```

3. **Test the Connection:**
   - Open http://localhost:5173 in your browser
   - Try to login - it should now connect to the backend

## 🔍 Verification Steps

### Check if Backend is Running
```bash
# Check if port 3001 is in use
netstat -an | grep 3001
# or
lsof -i :3001
```

### Test Backend Health
```bash
curl http://localhost:3001/health
```
Should return:
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2024-12-15T..."
}
```

### Check Frontend Configuration
Open browser console and check:
```javascript
console.log('API Base URL:', window.location.origin);
// Should show the frontend URL (e.g., http://localhost:5173)
```

## 🐛 Common Issues & Solutions

### Issue 1: "ERR_CONNECTION_REFUSED"
**Cause**: Backend server not running
**Solution**: Start the backend server using the steps above

### Issue 2: "CORS Error"
**Cause**: Frontend and backend on different ports
**Solution**: Backend is configured to allow CORS from frontend ports

### Issue 3: "MongoDB Connection Failed"
**Cause**: MongoDB not running
**Solution**: 
```bash
# Start MongoDB (varies by OS)
# Windows: MongoDB should start automatically as service
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

### Issue 4: "Port Already in Use"
**Cause**: Another process using port 3001
**Solution**: 
```bash
# Find and kill the process
lsof -ti:3001 | xargs kill -9
# or change the port in Backend/config.js
```

## 📊 Expected Flow

1. **Backend starts** → Listens on `http://localhost:3001`
2. **Frontend starts** → Runs on `http://localhost:5173`
3. **Frontend makes API calls** → To `http://localhost:3001/api/*`
4. **Backend responds** → With JSON data
5. **Frontend displays** → The response data

## 🔗 URLs to Remember

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Backend Health**: http://localhost:3001/health
- **WebSocket**: ws://localhost:3001/ws

## 📝 Environment Variables

If you need to customize ports, create a `.env` file in the Backend directory:

```env
PORT=3001
HOST=127.0.0.1
MONGODB_URI=mongodb://localhost:27017/reelzomato_dev
```

## 🆘 Still Having Issues?

1. **Check the console logs** for both frontend and backend
2. **Verify MongoDB is running** with `npm run test-mongodb`
3. **Check firewall settings** - ensure ports 3001 and 5173 are not blocked
4. **Try different browsers** - clear cache and cookies
5. **Restart both servers** - stop and start again

## 📞 Quick Commands

```bash
# Start everything
cd Backend && npm run start:dev &
cd Frontend && npm run dev

# Check if servers are running
curl http://localhost:3001/health
curl http://localhost:5173

# Test MongoDB connection
cd Backend && npm run test-mongodb
```
