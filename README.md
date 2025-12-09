# ReelZomato - Food Social Media Platform

A modern food social media platform where food partners can share reels, posts, and stories about their dishes, and users can discover and order food.

## Features
- **User Authentication**: Register/Login for Users, Food Partners, Delivery Partners, and Editors
- **Food Reels**: Video-based food content with music and descriptions
- **Posts**: Image-based posts with descriptions
- **Stories**: Short-lived video content (24 hours)
- **Food Partner Profiles**: Detailed profiles with business information
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Backend
- Node.js with Express.js
- MongoDB with Mongoose
- JWT Authentication
- ImageKit for file uploads
- Multer for file handling

### Frontend
- React 19 with Vite
- React Router for navigation
- Tailwind CSS for styling
- Framer Motion for animations

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- ImageKit account (for file uploads)

### Backend Setup

1. Navigate to the Backend directory:
```bash
cd Backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the Backend directory with the following variables:
```env
# Database Configuration
DB_URL=mongodb://localhost:27017/reelzomato

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production

# Server Configuration
PORT=8000

# ImageKit Configuration (for file uploads)
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URI_ENDPOINT=your_imagekit_url_endpoint

# Environment
NODE_ENV=development
```

4. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:8000`

### Frontend Setup

1. Navigate to the Frontend directory:
```bash
cd Frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/user/register` - Register a new user
- `POST /api/auth/user/login` - Login user
- `GET /api/auth/user/logout` - Logout user
- `POST /api/auth/foodPartner/register` - Register food partner
- `POST /api/auth/foodPartner/login` - Login food partner
- `GET /api/auth/foodPartner/logout` - Logout food partner

### Food/Reels
- `POST /api/food` - Create a new reel (Food Partner only)
- `GET /api/food` - Get all reels (Public)
- `GET /api/food/my-reels` - Get food partner's reels

### Posts
- `POST /api/posts` - Create a new post (Food Partner only)
- `GET /api/posts` - Get all posts (Public)
- `GET /api/posts/my-posts` - Get food partner's posts

### Stories
- `POST /api/stories` - Create a new story (Food Partner only)
- `GET /api/stories` - Get all stories (Public)
- `GET /api/stories/my-stories` - Get food partner's stories

### Food Partner
- `GET /api/food-partner/:id` - Get food partner profile

## Project Structure

```
ReelZomato Project/
├── Backend/
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middlewares/    # Authentication middleware
│   │   ├── services/       # External services
│   │   └── db/            # Database connection
│   ├── server.js          # Main server file
│   └── package.json
├── Frontend/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── config/       # Configuration files
│   │   ├── styles/       # CSS files
│   │   └── routes/       # React Router setup
│   └── package.json
└── README.md
```

## Usage

1. **For Users**: Register/Login and browse food content, view food partner profiles
2. **For Food Partners**: Register/Login, create reels, posts, and stories to showcase your food
3. **For Delivery Partners**: Register to handle food deliveries
4. **For Editors**: Register to help with content creation

## Development

- Backend runs on port 8000
- Frontend runs on port 5173
- MongoDB should be running on default port 27017
- Make sure to configure ImageKit for file uploads

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.
