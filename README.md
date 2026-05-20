# 🍽️ ReelZomato — India's First Food Reels Platform

A full-stack food delivery app where users discover food through short video reels — like Instagram Reels but for ordering food.

**Built to showcase full-stack development skills for CV/portfolio.**

---

## 🚀 Live Demo

> Browse without logging in — just click **Get Started** on the landing page.

**Backend API:** `https://reelzomato-backend.onrender.com`

**Demo Login Credentials:**
| Role | Email | Password |
|------|-------|----------|
| User | `demo@user.com` | `Demo@1234` |
| Food Partner | `sharma@dhukhan.com` | (your password) |

---

## ✨ Features

- 🎬 **Food Reels** — Scroll through short food videos, auto-play on scroll
- 🛒 **Order System** — Add to cart, checkout with address & payment
- 📍 **Live Order Tracking** — Real-time status via WebSocket
- 📖 **Stories** — Instagram-style food stories from restaurants
- 👤 **Multi-role Auth** — User, Food Partner, Delivery Partner, Editor, Admin
- 🔍 **Search** — Search restaurants and dishes
- 🔥 **Trending** — Trending food and restaurants near you
- 💳 **Razorpay Payments** — UPI, cards, wallets
- 🎥 **Video Editing Workflow** — Food partners submit videos, editors edit them
- 👁️ **Guest Browsing** — Browse all content without login; login required only for actions

---

## 🛠️ Tech Stack

**Frontend**
- React 19 + Vite
- React Router v7
- Framer Motion (animations)
- WebSocket (real-time updates)

**Backend**
- Node.js + Express 5
- MongoDB + Mongoose
- JWT Authentication (HTTP-only cookies)
- Multer (file uploads)
- ImageKit (cloud media storage)
- Razorpay (payments)
- WebSocket (ws library)

---

## 📁 Project Structure

```
Reels-Zomato_App/
├── Frontend/          # React + Vite app (port 3000)
│   ├── src/
│   │   ├── pages/     # All page components
│   │   ├── components/# Reusable components
│   │   ├── services/  # API service layer
│   │   ├── contexts/  # React contexts
│   │   └── styles/    # CSS files
│   └── public/        # Static assets
│
└── Backend/           # Express API (port 3001)
    ├── src/
    │   ├── controllers/
    │   ├── models/
    │   ├── routes/
    │   ├── middlewares/
    │   └── services/
    └── uploads/       # Local file storage
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the repo
```bash
git clone https://github.com/Kapilsharma72/Reels-Zomato_App.git
cd Reels-Zomato_App
```

### 2. Backend setup
```bash
cd Backend
npm install
cp .env.example .env
# Fill in your MongoDB URI and JWT secret in .env
npm run dev
```

### 3. Frontend setup
```bash
cd Frontend
npm install
npm run dev
```

### 4. Open in browser
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

---

## 🔐 Environment Variables

Copy `Backend/.env.example` to `Backend/.env` and fill in:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_random_secret_key
PORT=3001
```

---

## 👨‍💻 Author

**Kapil Sharma**
- GitHub: [@Kapilsharma72](https://github.com/Kapilsharma72)

---

*Built with ❤️ as a portfolio project to demonstrate full-stack development skills.*
