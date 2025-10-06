# ReelZomato - Instagram Reels + Zomato Frontend Application

A modern, creative frontend application that combines the concept of Instagram Reels with Zomato's food delivery platform. The system allows restaurants, cafes, and hotels (food partners) to upload reels of their food, and users can watch these reels, like them, and order the food directly.

## 🚀 Features

### User Experience
- **Modern Landing Page**: Engaging design with animated backgrounds and floating food elements
- **Unified Login System**: Single login supporting multiple roles (User, Food Partner, Delivery Partner, Editor)
- **Instagram-like Stories**: Full stories functionality with interactive elements
- **User Home Feed**: Top bar with search, notifications, location, and settings
- **Categories Section**: Visual food categories with hover effects
- **Posts/Reels Feed**: Video and image content with like, comment, and share functionality
- **Unique Bottom Navigation**: Expandable semi-circle navigation with smooth animations

### Food Partner Dashboard
- **Order Management**: Track and manage all incoming orders
- **Reel Upload**: Upload raw footage and send to editors
- **Editor Network**: Browse and hire professional video editors
- **Analytics**: Performance metrics and insights
- **Profile Management**: Update restaurant information

### Delivery Partner Dashboard
- **Active Orders**: View assigned orders with pickup and delivery locations
- **Order Tracking**: Real-time order status updates
- **Delivery History**: Track completed deliveries and earnings
- **Navigation**: Integrated maps and route optimization
- **Earnings**: Track tips and delivery fees

### Editor Dashboard
- **Project Management**: View and manage editing projects
- **Client Communication**: Interact with food partners
- **Portfolio**: Showcase completed work
- **Earnings**: Track project payments and ratings
- **Creative Tools**: Access to editing resources

## 🎨 Design Features

### Modern UI/UX
- **Glassmorphism Design**: Frosted glass effects with backdrop blur
- **Gradient Backgrounds**: Dynamic animated gradients
- **Floating Elements**: Animated food emojis and decorative elements
- **Smooth Animations**: CSS transitions and keyframe animations
- **Responsive Design**: Mobile-first approach with breakpoints

### Interactive Elements
- **Stories Viewer**: Full-screen story experience with progress bars
- **Circular Navigation**: Unique expandable bottom navigation
- **Hover Effects**: Interactive buttons and cards
- **Loading States**: Smooth loading animations
- **Modal Dialogs**: Overlay components for detailed views

## 🛠️ Technology Stack

- **React 19.1.1**: Latest React with hooks and functional components
- **React Router DOM 7.8.2**: Client-side routing
- **Framer Motion 12.23.12**: Advanced animations
- **React Icons 5.5.0**: Comprehensive icon library
- **Lucide React 0.543.0**: Modern icon set
- **Vite 7.1.2**: Fast build tool and dev server
- **CSS3**: Custom styling with modern features

## 📁 Project Structure

```
Frontend/
├── src/
│   ├── components/
│   │   ├── StoriesViewer.jsx          # Instagram-like stories component
│   │   └── AuthCard.jsx               # Authentication card component
│   ├── pages/
│   │   ├── LandingPage.jsx            # Modern landing page
│   │   ├── UnifiedLogin.jsx           # Multi-role login system
│   │   ├── UserHome.jsx               # User home feed
│   │   ├── FoodPartnerDashboard.jsx   # Food partner dashboard
│   │   ├── DeliveryDashboard.jsx      # Delivery partner dashboard
│   │   ├── EditorDashboard.jsx        # Editor dashboard
│   │   └── [Other existing pages]
│   ├── styles/
│   │   ├── UnifiedLogin.css           # Login page styles
│   │   ├── UserHome.css               # User home styles
│   │   ├── FoodPartnerDashboard.css   # Food partner styles
│   │   ├── DeliveryDashboard.css      # Delivery partner styles
│   │   ├── EditorDashboard.css        # Editor dashboard styles
│   │   ├── StoriesViewer.css          # Stories viewer styles
│   │   └── [Other existing styles]
│   ├── routes/
│   │   └── appRoutes.jsx              # Application routing
│   └── App.jsx                        # Main app component
├── public/
│   ├── images/                        # Food category images
│   └── Videos/                        # Sample video content
└── package.json                       # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "Reel-Zomato Project/Frontend"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎯 User Roles & Navigation

### 1. User
- **Landing Page** → **Unified Login** → **User Home**
- Features: Browse reels, view stories, order food, like/share content

### 2. Food Partner
- **Landing Page** → **Unified Login** → **Food Partner Dashboard**
- Features: Manage orders, upload reels, hire editors, track analytics

### 3. Delivery Partner
- **Landing Page** → **Unified Login** → **Delivery Dashboard**
- Features: View orders, track deliveries, manage earnings

### 4. Editor
- **Landing Page** → **Unified Login** → **Editor Dashboard**
- Features: Manage projects, edit videos, communicate with clients

## 🎨 Key Components

### StoriesViewer
- Full-screen story experience
- Progress bars for each story
- Interactive elements (like, comment, share, order)
- Keyboard navigation support
- Responsive design

### Circular Navigation
- Unique expandable bottom navigation
- Semi-circle animation
- Role-based navigation items
- Smooth transitions

### Dashboard Components
- Modern card-based layouts
- Interactive data visualization
- Real-time updates
- Mobile-responsive design

## 🔧 Customization

### Styling
- CSS custom properties for easy theming
- Modular CSS architecture
- Responsive breakpoints
- Animation keyframes

### Content
- Mock data can be easily replaced with API calls
- Configurable story durations
- Customizable color schemes
- Flexible component props

## 📱 Responsive Design

The application is fully responsive with breakpoints for:
- **Desktop**: 1024px and above
- **Tablet**: 768px - 1023px
- **Mobile**: 480px - 767px
- **Small Mobile**: Below 480px

## 🎭 Animations

- **Floating Elements**: Continuous floating animations
- **Gradient Orbs**: Rotating background elements
- **Hover Effects**: Interactive button and card animations
- **Page Transitions**: Smooth route transitions
- **Loading States**: Skeleton loaders and spinners

## 🔮 Future Enhancements

- **Real-time Chat**: Communication between users and partners
- **Push Notifications**: Order updates and new content alerts
- **Advanced Analytics**: Detailed performance metrics
- **Payment Integration**: In-app payment processing
- **Social Features**: User profiles and following system
- **AI Recommendations**: Personalized content suggestions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Design inspiration from Instagram and Zomato
- React community for excellent documentation
- Open source icon libraries
- Modern CSS techniques and best practices

---

**Built with ❤️ using React, modern CSS, and creative design principles.**