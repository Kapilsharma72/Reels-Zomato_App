# Quick Setup Guide

## 1. Backend Setup

1. **Navigate to Backend directory:**
   ```bash
   cd Backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create .env file:**
   Create a `.env` file in the Backend directory with these contents:
   ```env
   DB_URL=mongodb://localhost:27017/reelzomato
   JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
   PORT=8000
   IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
   IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
   IMAGEKIT_URI_ENDPOINT=your_imagekit_url_endpoint
   NODE_ENV=development
   ```

4. **Start MongoDB:**
   Make sure MongoDB is running on your system

5. **Start the backend:**
   ```bash
   npm run dev
   ```

## 2. Frontend Setup

1. **Navigate to Frontend directory:**
   ```bash
   cd Frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the frontend:**
   ```bash
   npm run dev
   ```

## 3. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

## 4. Test the Setup

1. Open http://localhost:5173 in your browser
2. Try registering a new user or food partner
3. Check if the backend is receiving requests (check console logs)

## Troubleshooting

- **CORS errors**: Make sure both frontend and backend are running
- **Database connection errors**: Ensure MongoDB is running
- **File upload errors**: Configure ImageKit credentials in .env
- **Authentication errors**: Check JWT_SECRET in .env file

## Next Steps

1. Configure ImageKit for file uploads
2. Set up a production MongoDB database
3. Deploy the application to a hosting service
