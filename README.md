# ReelZomato 🍔🎬

> A social food-ordering platform where restaurants share short video reels of their dishes — users discover, order, and track food in real time, while delivery partners and video editors collaborate in a unified ecosystem.

---

## 💡 The Idea

ReelZomato combines the viral appeal of short-form video (like Instagram Reels / TikTok) with food ordering. Instead of static menus, restaurants post video reels of their dishes. Users scroll through a TikTok-style feed, see food being prepared or plated, and order directly from the video — no navigation required.

The platform connects **four types of users** in one real-time system:

| Role | What they do |
|------|-------------|
| 👤 **Customer** | Browse reels, order food, track delivery |
| 🍽️ **Food Partner** | Post reels, manage orders, hire video editors |
| 🛵 **Delivery Partner** | Accept and deliver orders, update status live |
| 🎬 **Video Editor** | Accept editing projects from restaurants, upload edited videos |

---

## ✨ Features

### Customer
- TikTok-style vertical reel feed with snap-scroll
- Order directly from a reel with one tap
- Cart with multi-restaurant support
- Real-time order tracking (WebSocket)
- Stories from restaurants (24h format)
- Trending food, top restaurants, street food sections (location-aware)
- Search restaurants and dishes
- Order history and rating system
- Password reset via email

### Food Partner
- Dashboard with live order notifications
- Upload food reels (video + dish info + price)
- Manage menu items
- Accept / reject / prepare orders
- Hire video editors and track editing progress
- View edited videos and download them
- Profile and business settings

### Delivery Partner
- Available orders feed (ready-for-pickup orders)
- Accept orders and update delivery status live
- Earnings tracker (10% commission model)
- Real-time WebSocket notifications

### Video Editor
- Browse available editing projects from restaurants
- Accept projects, upload edited videos
- Progress tracking and messaging with food partner
- Earnings dashboard

---

## 🏗️ Tech Stack

### Frontend
- **React 18** + Vite
- **React Router v6** — client-side routing
- **CSS** — custom dark-theme design system (no UI library)
- **WebSocket** — real-time order and notification updates
- **Geolocation API** — location-aware trending sections

### Backend
- **Node.js** + **Express 5**
- **MongoDB** + **Mongoose** — database and ODM
- **JWT** — authentication via HTTP-only cookies
- **WebSocket (ws)** — real-time bidirectional communication
- **Multer** — video/image file uploads
- **ImageKit** — cloud media storage (falls back to local)
- **Razorpay** — payment gateway integration
- **Nodemailer** — password reset emails
- **bcrypt** — password hashing
- **Helmet** + custom sanitizer — security middleware

---

## 📁 Project Structure

```
ReelZomato/
├── Backend/
│   ├── src/
│   │   ├── controllers/     # Business logic for each domain
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express route definitions
│   │   ├── middlewares/     # Auth, rate limiting
│   │   ├── services/        # WebSocket, storage, Razorpay
│   │   └── db/              # MongoDB connection
│   ├── uploads/             # Local video/image storage fallback
│   ├── config.js            # Centralised config
│   ├── server.js            # Entry point
│   ├── .env.example         # Environment variable template
│   └── package.json
│
├── Frontend/
│   ├── src/
│   │   ├── pages/           # Full page components
│   │   ├── components/      # Reusable UI components
│   │   ├── services/        # API service classes
│   │   ├── hooks/           # Custom React hooks
│   │   ├── styles/          # Per-page CSS files
│   │   ├── config/          # API base URL config
│   │   └── routes/          # App routing
│   └── package.json
│
├── start-project.bat        # Windows one-click start
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Git

### 1. Clone the repo

```bash
git clone https://github.com/your-username/reelzomato.git
cd reelzomato
```

### 2. Backend setup

```bash
cd Backend
npm install
cp .env.example .env
# Fill in your values in .env
npm start
```

### 3. Frontend setup

```bash
cd Frontend
npm install
npm run dev
```

The app will be at `http://localhost:5173` and the API at `http://localhost:3001`.

---

## ⚙️ Environment Variables

Copy `Backend/.env.example` to `Backend/.env` and fill in:

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/reelzomato
JWT_SECRET=your_strong_random_secret
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Optional — ImageKit for cloud video storage
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URI_ENDPOINT=

# Optional — Razorpay for online payments
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Optional — Email for password reset
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
```

---

## 🔌 API Overview

| Domain | Base Path | Auth |
|--------|-----------|------|
| Auth (users & food partners) | `/api/auth` | — |
| Food reels | `/api/food` | Food Partner |
| Orders | `/api/orders` | User / Food Partner |
| Delivery | `/api/delivery` | Delivery Partner |
| Video submissions | `/api/video-submissions` | Food Partner / Editor |
| Stories | `/api/stories` | Food Partner |
| Posts | `/api/posts` | Food Partner |
| Search | `/api/search` | — |
| Trending | `/api/trending` | — |
| Menu | `/api/food-partner/menu` | Food Partner |
| Admin | `/api/admin` | Admin |
| Health check | `/health` | — |

---

## 🔄 Real-Time Flow (WebSocket)

All four user types connect to `ws://host:port/ws` on login. Events flow like this:

```
Customer places order
    → Food Partner receives "new_order" notification
    → Food Partner accepts → Customer gets "order_accepted"
    → Food Partner marks ready → Delivery Partner gets "order_ready"
    → Delivery Partner accepts → Customer gets "order_picked_up"
    → Delivery Partner delivers → Customer + Food Partner get "order_delivered"

Food Partner submits video
    → Editor gets "video_assigned_to_editor"
    → Editor updates progress → Food Partner gets "video_edit_progress"
    → Editor uploads edited video → Food Partner gets "video_edit_completed"
    → Food Partner downloads → Editor gets "video_downloaded"
```

---

## 🗺️ Trending & Location

The three trending sections (Trending Food, Top Restaurants, Street Food) use the browser's Geolocation API to request the user's coordinates. Results are filtered to within **50 km** and scored by:

- Likes × 3 + Comments × 2 + Views (food items)
- Aggregated engagement per restaurant (restaurants)
- Same as food but filtered by `category: street_food` (street food)

Food partners can set their `lat/lng` in their profile to appear in location-based results.

---

## 👥 User Roles & Registration

| Role | Register at |
|------|------------|
| Customer | `/register` → select "User" |
| Delivery Partner | `/register` → select "Delivery Partner" |
| Video Editor | `/editor/register` |
| Food Partner | `/food-partner/login` → Register tab |

---

## 🔐 Security

- JWT stored in **HTTP-only cookies** (not localStorage)
- Passwords hashed with **bcrypt** (10 rounds)
- Rate limiting on auth and password reset endpoints
- Helmet.js security headers
- MongoDB injection sanitization
- Input validation on all auth endpoints
- Debug endpoints blocked in production (`NODE_ENV=production`)

---

## 📱 Pages

| Page | Route |
|------|-------|
| Landing | `/` |
| Login | `/login` |
| Register | `/register` |
| User Home (feed + trending) | `/user/home` |
| Reels Feed | `/reels` |
| Food Partner Profile | `/food-partner/:id` |
| Food Partner Dashboard | `/food-partner/dashboard` |
| Delivery Dashboard | `/delivery/dashboard` |
| Editor Dashboard | `/editor/dashboard` |
| Admin Dashboard | `/admin/dashboard` |
| Forgot / Reset Password | `/forgot-password`, `/reset-password/:token` |

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

MIT — feel free to use, modify, and distribute.

---

*Built with ❤️ — ReelZomato*
