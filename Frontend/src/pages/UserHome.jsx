import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaBell, 
  FaSearch, 
  FaHeart, 
  FaComment, 
  FaShare, 
  FaEllipsisH,
  FaHome,
  FaShoppingBag,
  FaUser,
  FaMapMarkerAlt,
  FaCog,
  FaChevronDown,
  FaPlay,
  FaShoppingCart,
  FaStar,
  FaSync,
  FaTimes,
  FaSignOutAlt,
  FaClock
} from 'react-icons/fa';
import StoriesViewer from '../components/StoriesViewer';
import { postsAPI, storiesAPI } from '../services/uploadService';
import { API_ENDPOINTS } from '../config/api';
import authService from '../services/authService';
import orderService from '../services/orderService';
import { useWebSocket } from '../hooks/useWebSocket';
import NotificationCenter from '../components/NotificationCenter';
import OrderTracking from '../components/OrderTracking';
import '../styles/UserHome.css';

const UserHome = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [expandedPosts, setExpandedPosts] = useState({});
  const [showPostMenu, setShowPostMenu] = useState({});
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [showOrderTracking, setShowOrderTracking] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState(null);
  const [currentLocation, setCurrentLocation] = useState('New York, NY');
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [showStoriesViewer, setShowStoriesViewer] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshMessage, setRefreshMessage] = useState('');
  const [stories, setStories] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [storiesError, setStoriesError] = useState('');
  const [viewedStories, setViewedStories] = useState(new Set());
  const [storyGroups, setStoryGroups] = useState([]);
  const [storyInteractions, setStoryInteractions] = useState({
    likes: new Set(),
    shares: new Set(),
    views: new Set()
  });
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Trending sections
  const [userCoords, setUserCoords] = useState(null);
  const [trendingFood, setTrendingFood] = useState([]);
  const [trendingRestaurants, setTrendingRestaurants] = useState([]);
  const [trendingStreetFood, setTrendingStreetFood] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  
  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Cart toast (shown when user adds item from StoriesViewer)
  const [cartToast, setCartToast] = useState(null); // { count: number } | null
  
  // Category filtering
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filteredPosts, setFilteredPosts] = useState([]);
  
  // Post interactions
  const [postComments, setPostComments] = useState({});
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedPostForComment, setSelectedPostForComment] = useState(null);
  
  // WebSocket connection for real-time updates
  const { socket, isConnected } = useWebSocket();
  
  const [currentUser, setCurrentUser] = useState(() => {
    // Check for stored user data on initial load
    try {
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        return JSON.parse(storedUserData);
      }
    } catch (error) {
      console.error('Error parsing stored user data:', error);
    }
    
    // Check for temporary user data from registration
    try {
      const tempUserData = localStorage.getItem('tempUserData');
      if (tempUserData) {
        return JSON.parse(tempUserData);
      }
    } catch (error) {
      console.error('Error parsing temp user data:', error);
    }
    
    // If no stored data, return null (don't check authentication here)
    // Authentication will be checked in fetchCurrentUser
    
    return null;
  });

  // WebSocket event handlers for real-time order updates
  useEffect(() => {
    if (socket && currentUser?._id) {
      // Listen for order updates — dispatch custom event so OrdersModal can refresh
      const handleOrderUpdate = (data) => {
        if (data.data) {
          window.dispatchEvent(new CustomEvent('ordersUpdated'));
          const notification = {
            id: Date.now(),
            type: 'info',
            message: `Order ${data.data.orderId} status updated to ${data.data.status}`,
            timestamp: new Date()
          };
          setNotifications(prev => [notification, ...prev.slice(0, 4)]);
        }
      };

      // Listen for order status changes
      const handleOrderStatusChange = (data) => {
        if (data.data) {
          window.dispatchEvent(new CustomEvent('ordersUpdated'));
        }
      };

      // Add listeners
      socket.on('order_update', handleOrderUpdate);
      socket.on('order_status_change', handleOrderStatusChange);

      return () => {
        socket.off('order_update', handleOrderUpdate);
        socket.off('order_status_change', handleOrderStatusChange);
      };
    }
  }, [socket, currentUser?._id]);

  const [userLoading, setUserLoading] = useState(() => {
    // If we have stored or temp data, don't show loading
    try {
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        return false;
      }
    } catch (error) {
      console.error('Error parsing stored user data:', error);
    }
    
    try {
      const tempUserData = localStorage.getItem('tempUserData');
      if (tempUserData) {
        return false;
      }
    } catch (error) {
      console.error('Error parsing temp user data:', error);
    }
    return true;
  });
  const [hasRedirected, setHasRedirected] = useState(false);

  // Reset redirect flag on component mount
  useEffect(() => {
    setHasRedirected(false);
  }, []);

  // WebSocket event handlers for order notifications
  useEffect(() => {
    if (socket && currentUser) {
      const userId = currentUser._id || currentUser.id;

      // Helper: check if this notification is for the current user (by ObjectId)
      const isForMe = (data) =>
        data.customerId && userId && data.customerId.toString() === userId.toString();

      // Listen for order status updates
      socket.on('order_accepted', (data) => {
        if (isForMe(data)) {
          addNotification({
            type: 'order',
            title: 'Order Accepted',
            message: `Your order ${data.orderId} has been accepted and is being prepared`,
            time: 'Just now',
            read: false
          });
          // Trigger order refresh
          window.dispatchEvent(new CustomEvent('ordersUpdated'));
        }
      });

      socket.on('order_rejected', (data) => {
        if (isForMe(data)) {
          addNotification({
            type: 'order',
            title: 'Order Rejected',
            message: `Your order ${data.orderId} has been rejected. Reason: ${data.reason || 'No reason provided'}`,
            time: 'Just now',
            read: false
          });
          window.dispatchEvent(new CustomEvent('ordersUpdated'));
        }
      });

      socket.on('order_preparing', (data) => {
        if (isForMe(data)) {
          addNotification({
            type: 'order',
            title: 'Order Being Prepared',
            message: `Your order ${data.orderId} is being prepared. Estimated time: ${data.estimatedTime || '30 minutes'}`,
            time: 'Just now',
            read: false
          });
          window.dispatchEvent(new CustomEvent('ordersUpdated'));
        }
      });

      socket.on('order_ready', (data) => {
        if (isForMe(data)) {
          addNotification({
            type: 'order',
            title: 'Order Ready',
            message: `Your order ${data.orderId} is ready for pickup!`,
            time: 'Just now',
            read: false
          });
          window.dispatchEvent(new CustomEvent('ordersUpdated'));
        }
      });

      socket.on('order_picked_up', (data) => {
        if (isForMe(data)) {
          addNotification({
            type: 'order',
            title: 'Order Picked Up',
            message: `Your order ${data.orderId} has been picked up and is on its way!`,
            time: 'Just now',
            read: false
          });
          window.dispatchEvent(new CustomEvent('ordersUpdated'));
        }
      });

      socket.on('order_on_the_way', (data) => {
        if (isForMe(data)) {
          addNotification({
            type: 'order',
            title: 'Order On The Way',
            message: `Your order ${data.orderId} is on the way! Estimated delivery: ${data.estimatedDeliveryTime || '15 minutes'}`,
            time: 'Just now',
            read: false
          });
          window.dispatchEvent(new CustomEvent('ordersUpdated'));
        }
      });

      socket.on('order_delivered', (data) => {
        if (isForMe(data)) {
          addNotification({
            type: 'order',
            title: 'Order Delivered',
            message: `Your order ${data.orderId} has been delivered successfully! Enjoy your meal!`,
            time: 'Just now',
            read: false
          });
          window.dispatchEvent(new CustomEvent('ordersUpdated'));
        }
      });

      return () => {
        socket.off('order_accepted');
        socket.off('order_rejected');
        socket.off('order_preparing');
        socket.off('order_ready');
        socket.off('order_picked_up');
        socket.off('order_on_the_way');
        socket.off('order_delivered');
      };
    }
  }, [socket, currentUser]);

  // Fetch current user information
  const fetchCurrentUser = async () => {
    let storedUserData = null;
    try {
      setUserLoading(true);
      
      // First, check if we have user data in localStorage
      storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        const userData = JSON.parse(storedUserData);
        setCurrentUser(userData);
        setUserLoading(false);
      }

      // Also check for temporary user data from registration
      const tempUserData = localStorage.getItem('tempUserData');
      if (tempUserData) {
        const userData = JSON.parse(tempUserData);
        setCurrentUser(userData);
        setUserLoading(false);
        // Move temp data to persistent storage
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.removeItem('tempUserData');
        return; // Don't make API call if we have temp data
      }

      // Only check authentication if we don't have stored user data and haven't redirected yet
      if (!storedUserData && !authService.isAuthenticated() && !hasRedirected) {
        setUserLoading(false);
        setHasRedirected(true);
        navigate('/login');
        return;
      }

      // Add a small delay to ensure cookie is properly set after login
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Then try to fetch from API to get the most up-to-date data
      const response = await authService.getCurrentUser();
      if (response && response.user) {
        setCurrentUser(response.user);
        // Store user data for future use
        localStorage.setItem('userData', JSON.stringify(response.user));
      }
      setUserLoading(false);
    } catch (error) {
      console.error('Error fetching current user:', error);
      setUserLoading(false);
      
      // Only redirect to login if we don't have stored user data and get auth error and haven't redirected yet
      if ((error.message.includes('401') || error.message.includes('login') || error.message.includes('Please login')) && !storedUserData && !hasRedirected) {
        setHasRedirected(true);
        navigate('/login');
      } else {
        // For other errors or if we have stored data, just log the error
        // Don't redirect, let the user continue with stored data
      }
    }
  };

  // Fetch stories from API
  const fetchStories = async (showRefreshMessage = false) => {
    try {
      setStoriesLoading(true);
      setStoriesError('');
      
      const response = await storiesAPI.getStories();
      
      if (response && response.stories) {
        
        // AGGRESSIVE GROUPING: Group stories by business name first, then by food partner ID
        const groupedStories = {};
        
        response.stories.forEach((story, index) => {
          
          // Extract business name and food partner ID
          let businessName = 'Restaurant';
          let foodPartnerId = null;
          
          if (story.foodPartner) {
            if (typeof story.foodPartner === 'object') {
              businessName = story.foodPartner.businessName || story.foodPartner.name || 'Restaurant';
              foodPartnerId = story.foodPartner._id || story.foodPartner.id;
            } else if (typeof story.foodPartner === 'string') {
              foodPartnerId = story.foodPartner;
            }
          }
          
          // Create a unique group key - try to find existing group first
          let groupKey = null;
          
          // First, try to find an existing group by business name similarity
          if (businessName !== 'Restaurant') {
            groupKey = findExistingGroup(businessName, groupedStories);
          }
          
          // If no existing group found, create a new group key
          if (!groupKey) {
            if (foodPartnerId) {
              groupKey = foodPartnerId;
            } else if (businessName !== 'Restaurant') {
              groupKey = businessName.toLowerCase().trim();
            } else {
              groupKey = `story_${story._id || index}`;
            }
          }
          
          // Create or get existing group
          if (!groupedStories[groupKey]) {
            groupedStories[groupKey] = {
              id: groupKey,
              businessName: businessName,
              avatar: '🍽️',
      isLive: false, 
      hasNewStory: false,
              time: formatTimeAgo(story.createdAt),
              createdAt: story.createdAt,
              media: []
            };
          }
          
          // Add this story to the group
          const storyId = story._id || `story_${index}`;
          const isViewed = viewedStories.has(storyId);
          
          groupedStories[groupKey].media.push({
            id: storyId,
            type: 'video',
            url: story.video || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80',
            caption: story.description,
            price: story.price ? `$${story.price}` : null,
            duration: (story.duration || 15) * 1000,
            isViewed: isViewed
          });
          
          // Update time to the most recent story
          const storyTime = new Date(story.createdAt);
          const currentTime = new Date(groupedStories[groupKey].createdAt);
          if (storyTime > currentTime) {
            groupedStories[groupKey].time = formatTimeAgo(story.createdAt);
            groupedStories[groupKey].createdAt = story.createdAt;
          }
          
          // Show red dot if any story in the group is unviewed
          if (!isViewed) {
            groupedStories[groupKey].hasNewStory = true;
          }
        });
        
        // FINAL FALLBACK: Force group stories with identical business names
        const finalGroupedStories = {};
        Object.values(groupedStories).forEach(group => {
          const normalizedName = normalizeBusinessName(group.businessName);
          const finalKey = normalizedName || group.id;
          
          if (!finalGroupedStories[finalKey]) {
            finalGroupedStories[finalKey] = group;
          } else {
            // Merge groups with same business name
            finalGroupedStories[finalKey].media = [
              ...finalGroupedStories[finalKey].media,
              ...group.media
            ];
            
            // Update time to most recent
            const groupTime = new Date(group.createdAt);
            const existingTime = new Date(finalGroupedStories[finalKey].createdAt);
            if (groupTime > existingTime) {
              finalGroupedStories[finalKey].time = group.time;
              finalGroupedStories[finalKey].createdAt = group.createdAt;
            }
            
            // Show red dot if any story is unviewed
            if (group.hasNewStory) {
              finalGroupedStories[finalKey].hasNewStory = true;
            }
          }
        });
        
        // Convert to array and sort by time (most recent first)
        const transformedStories = Object.values(finalGroupedStories).sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        
        setStories(transformedStories);
        
        if (showRefreshMessage) {
          setRefreshMessage('Content refreshed successfully!');
          setTimeout(() => setRefreshMessage(''), 3000);
        }
      } else {
        setStories([]);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        response: error.response
      });
      
      // Provide more specific error messages
      let errorMessage = 'Failed to load stories';
      if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to server. Please start the backend server by running "npm start" in the Backend folder.';
      } else if (error.message.includes('404')) {
        errorMessage = 'Stories endpoint not found.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      setStoriesError(errorMessage);
      
      // Fallback to demo stories if API fails (for development/demo purposes)
      const demoStories = [
        {
          id: 'demo-1',
          businessName: 'Demo Restaurant',
          avatar: '🍽️',
          isLive: false, 
          hasNewStory: true,
          time: '2h ago',
          media: [
            {
              id: 'demo-media-1',
              type: 'video',
              url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80',
              caption: 'Demo story - Backend connection failed',
              price: '$12.99',
              duration: 15000,
              isViewed: false
            }
          ]
        }
      ];
      setStories(demoStories);
    } finally {
      setStoriesLoading(false);
    }
  };

  // Mock data for categories
  const categories = [
    { id: 1, name: 'Pizza', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80', color: '#FF6B6B' },
    { id: 2, name: 'Chicken', image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c8?w=400&q=80', color: '#FF9F43' },
    { id: 3, name: 'Burger', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80', color: '#45B7D1' },
    { id: 4, name: 'Veg Meal', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80', color: '#96CEB4' },
    { id: 5, name: 'Thali', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80', color: '#FFEAA7' },
    { id: 6, name: 'Biryani', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80', color: '#DDA0DD' },
    { id: 7, name: 'Pasta', image: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=400&q=80', color: '#FF6B35' },
    { id: 8, name: 'Sushi', image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&q=80', color: '#10AC84' },
    { id: 9, name: 'Desserts', image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&q=80', color: '#fd79a8' },
    { id: 10, name: 'Street Food', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80', color: '#f59e0b' },
    { id: 11, name: 'Rolls', image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&q=80', color: '#6c5ce7' },
    { id: 12, name: 'Drinks', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80', color: '#00cec9' },
  ];

  // Fetch posts from API
  const fetchPosts = async (showRefreshMessage = false) => {
    try {
      setLoading(true);
      setError('');
      const response = await postsAPI.getPosts();
      if (response.posts) {
        // Transform the API response to match the expected format
        const transformedPosts = response.posts.map((post, index) => ({
          id: post._id || index + 1,
          businessName: post.foodPartner?.businessName || 'Restaurant',
          businessLogo: '🍽️', // Default emoji
          time: formatTimeAgo(post.createdAt),
          description: post.description,
          image: post.images && post.images.length > 0 ? post.images[0] : 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80',
          video: null,
          isVideo: false,
          likes: post.likes?.length || 0,
          comments: post.comments?.length || 0,
          shares: post.shares || 0,
          price: '$12.99', // Default price
          rating: 4.5, // Default rating
          deliveryTime: '25-30 min', // Default delivery time
          category: post.category || 'General', // Add category for filtering
          tags: post.tags || [] // Add tags for search
        }));
        setPosts(transformedPosts);
        setFilteredPosts(transformedPosts);
        
        if (showRefreshMessage) {
          setRefreshMessage('Content refreshed successfully!');
          setTimeout(() => setRefreshMessage(''), 3000);
        }
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to load posts');
      // Fallback to empty array if API fails
      setPosts([]);
      setFilteredPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Search functionality
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      // Search in posts, stories, and categories
      const searchInPosts = posts.filter(post => 
        post.businessName.toLowerCase().includes(query.toLowerCase()) ||
        post.description.toLowerCase().includes(query.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );

      const searchInStories = stories.filter(story =>
        story.businessName.toLowerCase().includes(query.toLowerCase())
      );

      const searchInCategories = categories.filter(category =>
        category.name.toLowerCase().includes(query.toLowerCase())
      );

      setSearchResults({
        posts: searchInPosts,
        stories: searchInStories,
        categories: searchInCategories
      });
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Filter posts by category
  const filterPostsByCategory = (category) => {
    setSelectedCategory(category);
    if (category === null) {
      setFilteredPosts(posts);
    } else {
      const filtered = posts.filter(post => 
        post.category === category.name || 
        post.businessName.toLowerCase().includes(category.name.toLowerCase())
      );
      setFilteredPosts(filtered);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      // Mock notifications for now - replace with real API call
      const mockNotifications = [
        {
          id: 1,
          type: 'order',
          title: 'Order Update',
          message: 'Your order from Spice Garden is being prepared',
          time: '5 min ago',
          read: false
        },
        {
          id: 2,
          type: 'promotion',
          title: 'Special Offer',
          message: '20% off on all pizzas at Pizza Palace',
          time: '1 hour ago',
          read: false
        },
        {
          id: 3,
          type: 'story',
          title: 'New Story',
          message: 'Burger King posted a new story',
          time: '2 hours ago',
          read: true
        }
      ];
      setNotifications(mockNotifications);
      setUnreadNotifications(mockNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Fetch trending data
  const fetchTrending = async (coords) => {
    try {
      setTrendingLoading(true);
      const params = coords ? `?lat=${coords.lat}&lng=${coords.lng}&limit=12` : '?limit=12';
      const [foodRes, restRes, streetRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.TRENDING_FOOD}${params}`, { credentials: 'include' }),
        fetch(`${API_ENDPOINTS.TRENDING_RESTAURANTS}${params}`, { credentials: 'include' }),
        fetch(`${API_ENDPOINTS.TRENDING_STREET_FOOD}${params}`, { credentials: 'include' }),
      ]);
      const [foodData, restData, streetData] = await Promise.all([
        foodRes.ok ? foodRes.json() : { items: [] },
        restRes.ok ? restRes.json() : { restaurants: [] },
        streetRes.ok ? streetRes.json() : { items: [] },
      ]);
      setTrendingFood(foodData.items || []);
      setTrendingRestaurants(foodData.restaurants || restData.restaurants || []);
      setTrendingStreetFood(streetData.items || []);
    } catch (err) {
      console.error('fetchTrending error:', err);
    } finally {
      setTrendingLoading(false);
    }
  };

  // Request geolocation then fetch trending
  const initTrending = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserCoords(coords);
          fetchTrending(coords);
        },
        () => fetchTrending(null), // permission denied — fetch without location
        { timeout: 6000 }
      );
    } else {
      fetchTrending(null);
    }
  };

  // Mark notification as read
  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadNotifications(prev => Math.max(0, prev - 1));
  };

  useEffect(() => {
    // Load viewed stories from localStorage
    const loadViewedStories = () => {
      try {
        const saved = localStorage.getItem('viewedStories');
        if (saved) {
          const viewedArray = JSON.parse(saved);
          setViewedStories(new Set(viewedArray));
        }
      } catch (error) {
        console.error('Error loading viewed stories:', error);
      }
    };

    // Test backend connectivity first
    const testBackendConnection = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.STORIES.replace('/api/stories', '')}/health`, {
          method: 'GET',
          credentials: 'include',
        });
      } catch (error) {
        // connectivity check
      }
    };
    
    loadViewedStories();
    testBackendConnection();
    fetchCurrentUser();
    fetchPosts();
    fetchStories();
    fetchNotifications();
    initTrending();
  }, []);

  // Refresh posts and stories when page becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchPosts();
        fetchStories();
      }
    };

    const handleFocus = () => {
      fetchPosts();
      fetchStories();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Listen for cart updates dispatched by StoriesViewer
  useEffect(() => {
    const handleCartUpdated = (e) => {
      const count = e.detail?.count ?? 0;
      setCartToast({ count });
      setTimeout(() => setCartToast(null), 5000);
    };
    window.addEventListener('cartUpdated', handleCartUpdated);
    return () => window.removeEventListener('cartUpdated', handleCartUpdated);
  }, []);

  // When user clicks "Order Now" in a story modal, navigate to /reels with
  // the order data so the full checkout flow (address → payment → confirmation)
  // can run there.
  useEffect(() => {
    const handleStoryOrderNow = (e) => {
      const orderData = e.detail;
      if (!orderData?.success) return;
      navigate('/reels', { state: { storyOrder: orderData } });
    };
    window.addEventListener('storyOrderNow', handleStoryOrderNow);
    return () => window.removeEventListener('storyOrderNow', handleStoryOrderNow);
  }, [navigate]);

  // Helper function to format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // Helper function to normalize business names for better grouping
  const normalizeBusinessName = (name) => {
    if (!name || name === 'Restaurant') return 'restaurant';
    return name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '') // Remove spaces
      .trim();
  };

  // Helper function to find existing group by business name similarity
  const findExistingGroup = (businessName, groupedStories) => {
    const normalizedName = normalizeBusinessName(businessName);
    
    for (const [key, group] of Object.entries(groupedStories)) {
      const existingNormalizedName = normalizeBusinessName(group.businessName);
      
      // If names are similar (at least 70% match), group them together
      if (normalizedName.length > 3 && existingNormalizedName.length > 3) {
        const similarity = calculateSimilarity(normalizedName, existingNormalizedName);
        if (similarity > 0.7) {
          return key;
        }
      }
    }
    return null;
  };

  // Helper function to calculate string similarity
  const calculateSimilarity = (str1, str2) => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  // Helper function to calculate Levenshtein distance
  const levenshteinDistance = (str1, str2) => {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  };


  const handleNavClick = (tab) => {
    try {
      setActiveTab(tab);
      // Navigation logic for different tabs
      switch(tab) {
        case 'reels':
          // Navigate to reels page
          navigate('/reels');
          break;
        case 'orders':
          setShowOrdersModal(true);
          break;
        case 'profile':
          setShowProfileModal(true);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error in navigation:', error);
      // Fallback navigation
      if (tab === 'reels') {
        window.location.href = '/reels';
      }
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.post-menu-container')) {
        setShowPostMenu({});
      }
      if (!event.target.closest('.location-dropdown-container')) {
        setShowLocationDropdown(false);
      }
      if (!event.target.closest('.settings-dropdown-container')) {
        setShowSettingsDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleCategoryClick = (category) => {
    filterPostsByCategory(category);
  };

  const handlePostAction = async (postId, action) => {
    if (action === 'like') {
      // Determine the new liked state BEFORE updating so we can use it synchronously
      const isCurrentlyLiked = likedPosts.has(postId);

      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyLiked) {
          newSet.delete(postId);
        } else {
          newSet.add(postId);
        }
        return newSet;
      });

      // Use isCurrentlyLiked (captured above) — not the stale likedPosts state
      setFilteredPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? { ...post, likes: isCurrentlyLiked ? post.likes - 1 : post.likes + 1 }
            : post
        )
      );
    } else if (action === 'comment') {
      setSelectedPostForComment(postId);
      setShowCommentModal(true);
    } else if (action === 'share') {
      // Implement share functionality
      if (navigator.share) {
        try {
          const post = filteredPosts.find(p => p.id === postId);
          await navigator.share({
            title: `Check out this post from ${post.businessName}`,
            text: post.description,
            url: window.location.href
          });
        } catch (error) {
          // share failed silently
        }
      } else {
        // Fallback: copy to clipboard
        const post = filteredPosts.find(p => p.id === postId);
        navigator.clipboard.writeText(`${post.businessName}: ${post.description}`);
        setRefreshMessage('Post link copied to clipboard!');
        setTimeout(() => setRefreshMessage(''), 2000);
      }
    }
  };


  const toggleDescription = (postId) => {
    setExpandedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const isDescriptionLong = (description) => {
    return description.length > 100;
  };

  const togglePostMenu = (postId) => {
    setShowPostMenu(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handlePostMenuAction = (postId, action) => {
    setShowPostMenu(prev => ({
      ...prev,
      [postId]: false
    }));
  };

  const handleLocationChange = (location) => {
    setCurrentLocation(location);
    setShowLocationDropdown(false);
  };

  const handleLogout = async () => {
    try {
      await authService.logoutUser();
      setCurrentUser(null);
      // Clear any stored user data
      localStorage.removeItem('tempUserData');
      localStorage.removeItem('userData');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state and redirect
      setCurrentUser(null);
      localStorage.removeItem('tempUserData');
      localStorage.removeItem('userData');
      navigate('/login');
    }
  };

  // Track order
  const handleTrackOrder = (order) => {
    setTrackingOrderId(order.orderId || order._id);
    setShowOrderTracking(true);
  };

  // Contact restaurant
  const handleContactRestaurant = (order) => {
    // Implement contact restaurant functionality
  };

  // Memoized callback to prevent infinite loops
  const handleStoryViewed = useCallback((mediaId) => {
    
    // Mark this specific media as viewed (with debouncing to prevent infinite loops)
    setViewedStories(prev => {
      // Check if already viewed to prevent unnecessary updates
      if (prev.has(mediaId)) {
        return prev;
      }
      
      const newSet = new Set([...prev, mediaId]);
      try {
        localStorage.setItem('viewedStories', JSON.stringify([...newSet]));
      } catch (error) {
        console.error('Error saving viewed stories:', error);
      }
      return newSet;
    });
  }, []);

  const handleStoryClick = async (storyIndex) => {
    const storyGroup = stories[storyIndex];

    if (!storyGroup) return;
    if (!storyGroup.media || storyGroup.media.length === 0) return;

    if (storyGroup) {
      // Mark all stories in the group as viewed
      try {
        const unviewedStories = storyGroup.media.filter(media => !media.isViewed);

        // Mark each unviewed story as viewed
        for (const media of unviewedStories) {
          try {
            await storiesAPI.markStoryAsViewed(media.id);
          } catch (error) {
            // silently ignore — don't block opening the viewer
          }
        }

        // Update local state to remove red dot for all stories in the group
        setViewedStories(prev => {
          const newSet = new Set(prev);
          storyGroup.media.forEach(media => {
            newSet.add(media.id);
          });

          try {
            localStorage.setItem('viewedStories', JSON.stringify([...newSet]));
          } catch (error) {
            // ignore storage errors
          }
          return newSet;
        });

        // Update the story group to remove red dot
        setStories(prev => prev.map(s =>
          s.id === storyGroup.id ? { ...s, hasNewStory: false } : s
        ));
      } catch (error) {
        // Continue with opening the story viewer even if marking fails
      }
    }

    setSelectedStoryIndex(storyIndex);
    setShowStoriesViewer(true);
  };

  // Group stories by business for better organization
  const groupStoriesByBusiness = useCallback((stories) => {
    const groups = {};
    stories.forEach(story => {
      const businessName = story.businessName || 'Unknown Business';
      if (!groups[businessName]) {
        groups[businessName] = {
          businessName,
          avatar: story.avatar,
          stories: [story],
          isLive: story.isLive,
          hasNewStory: story.hasNewStory,
          totalStories: 1,
          viewedStories: 0,
          lastUpdated: story.updatedAt || story.createdAt
        };
      } else {
        groups[businessName].stories.push(story);
        groups[businessName].totalStories++;
        if (story.isLive) groups[businessName].isLive = true;
        if (story.hasNewStory) groups[businessName].hasNewStory = true;
        if (story.updatedAt && story.updatedAt > groups[businessName].lastUpdated) {
          groups[businessName].lastUpdated = story.updatedAt;
        }
      }
      
      // Count viewed stories
      if (story.media) {
        const viewedCount = story.media.filter(media => media.isViewed).length;
        groups[businessName].viewedStories += viewedCount;
      }
    });
    
    // Sort groups by last updated and live status
    return Object.values(groups).sort((a, b) => {
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      return new Date(b.lastUpdated) - new Date(a.lastUpdated);
    });
  }, []);

  // Handle story interactions (like, share, etc.)
  const handleStoryInteraction = (storyId, type) => {
    setStoryInteractions(prev => ({
      ...prev,
      [type]: new Set([...prev[type], storyId])
    }));
  };

  // Update story groups when stories change
  useEffect(() => {
    if (stories.length > 0) {
      const grouped = groupStoriesByBusiness(stories);
      setStoryGroups(grouped);
    } else {
      setStoryGroups([]);
    }
  }, [stories, groupStoriesByBusiness]);

  return (
    <div className="user-home">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Floating Food Elements */}
      <div className="floating-elements">
        <div className="floating-food pizza">🍕</div>
        <div className="floating-food burger">🍔</div>
        <div className="floating-food ramen">🍜</div>
        <div className="floating-food sushi">🍣</div>
        <div className="floating-food cake">🍰</div>
        <div className="floating-food fries">🍟</div>
      </div>

      {/* Modern Top Bar */}
      <div className="modern-topbar">
        <div className="top-row">
          <div className="left">
            <span className="brand-name">ReelZomato</span>
            <span className="username">
              {userLoading ? '' : (currentUser ? currentUser.fullName : 'User')}
            </span>
          </div>

          {/* Search bar — centred */}
          <div className="search-bar">
            <div className="search-bar-container">
              <input
                type="text"
                placeholder="Search for food, restaurants..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <FaSearch className="search-icon" />
              {isSearching && <div className="search-loading">⟳</div>}
            </div>
            {showSearchResults && searchQuery && (
              <div className="search-results-dropdown">
                {searchResults.posts?.length > 0 && (
                  <div className="search-section">
                    <h4>Posts</h4>
                    {searchResults.posts.slice(0, 3).map(post => (
                      <div key={post.id} className="search-result-item" onClick={() => { setShowSearchResults(false); setSearchQuery(''); }}>
                        <img src={post.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80'} alt={post.businessName || 'Restaurant'} />
                        <div><h5>{post.businessName || 'Restaurant'}</h5><p>{(post.description || '').substring(0, 50)}...</p></div>
                      </div>
                    ))}
                  </div>
                )}
                {searchResults.stories?.length > 0 && (
                  <div className="search-section">
                    <h4>Stories</h4>
                    {searchResults.stories.slice(0, 3).map(story => (
                      <div key={story.id} className="search-result-item" onClick={() => { setShowSearchResults(false); setSearchQuery(''); const i = stories.findIndex(s => s.id === story.id); if (i !== -1) handleStoryClick(i); }}>
                        <div className="story-avatar-small"><span>{story.avatar || '🍽️'}</span></div>
                        <div><h5>{story.businessName || 'Restaurant'}</h5><p>View story</p></div>
                      </div>
                    ))}
                  </div>
                )}
                {searchResults.categories?.length > 0 && (
                  <div className="search-section">
                    <h4>Categories</h4>
                    {searchResults.categories.slice(0, 3).map(category => (
                      <div key={category.id} className="search-result-item" onClick={() => { setShowSearchResults(false); setSearchQuery(''); handleCategoryClick(category); }}>
                        <img src={category.image} alt={category.name} />
                        <div><h5>{category.name}</h5><p>Browse category</p></div>
                      </div>
                    ))}
                  </div>
                )}
                {(!searchResults.posts?.length && !searchResults.stories?.length && !searchResults.categories?.length) && (
                  <div className="no-search-results"><p>No results found for "{searchQuery}"</p></div>
                )}
              </div>
            )}
          </div>

          <div className="right">
            <div className="location-dropdown-container">
              <button className="btn location-btn" onClick={() => setShowLocationDropdown(!showLocationDropdown)} title="Location">
                <FaMapMarkerAlt />
                <span className="location-text">{currentLocation}</span>
              </button>
              {showLocationDropdown && (
                <div className="location-dropdown">
                  {['New York, NY','Los Angeles, CA','Chicago, IL','Miami, FL'].map(loc => (
                    <button key={loc} className="location-option" onClick={() => handleLocationChange(loc)}>{loc}</button>
                  ))}
                </div>
              )}
            </div>
            <button className="btn refresh-btn" title="Refresh" onClick={() => { fetchPosts(true); fetchStories(false); }} disabled={loading || storiesLoading}>
              <FaSync className={loading || storiesLoading ? 'spinning' : ''} />
            </button>
            <div className="connection-status">
              <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>{isConnected ? '🟢' : '🔴'}</div>
              <span className="status-text">{isConnected ? 'Live' : 'Offline'}</span>
            </div>
            <NotificationCenter userType="customer" userId={currentUser?.fullName || currentUser?.name} className="user-notifications" />
          </div>
        </div>
      </div>

      {/* ── 3-column desktop layout ── */}
      <div className="home-layout">

        {/* Left Sidebar Navigation */}
        <aside className="left-sidebar">
          <button className={`sidebar-nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => handleNavClick('home')}>
            <FaHome className="nav-icon" /><span className="nav-label">Home</span>
          </button>
          <button className={`sidebar-nav-item ${activeTab === 'reels' ? 'active' : ''}`} onClick={() => handleNavClick('reels')}>
            <FaPlay className="nav-icon" /><span className="nav-label">Reels</span>
          </button>
          <button className={`sidebar-nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => handleNavClick('orders')}>
            <FaShoppingBag className="nav-icon" /><span className="nav-label">Orders</span>
          </button>
          <div className="sidebar-divider" />
          <button className={`sidebar-nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => handleNavClick('profile')}>
            <FaUser className="nav-icon" /><span className="nav-label">Profile</span>
          </button>
        </aside>

        {/* Centre Feed */}
        <main className="centre-feed">

      {/* Stories Section */}
      <div className="stories-section">
        {storiesLoading ? (
          <div className="stories-loading">
            <div className="loading-spinner"></div>
            <p>Loading stories...</p>
          </div>
        ) : storiesError ? (
          <div className="stories-error">
            <p className="error-message">{storiesError}</p>
            <div className="error-actions">
              <button 
                className="retry-btn"
                onClick={() => fetchStories()}
              >
                Retry
              </button>
              {storiesError.includes('Cannot connect to server') && (
                <div className="help-text">
                  <p>💡 <strong>Quick Fix:</strong></p>
                  <p>1. Open terminal in the Backend folder</p>
                  <p>2. Run: <code>npm start</code></p>
                  <p>3. Wait for "Server is running on port 8000"</p>
                  <p>4. Refresh this page</p>
                </div>
              )}
            </div>
          </div>
        ) : stories.length === 0 ? (
          <div className="no-stories">
            <p>No stories available yet. Be the first to share a story!</p>
          </div>
        ) : (
        <div className="stories-container">
          {storyGroups.length > 0 ? (
            storyGroups.map((group, index) => (
              <div key={group.businessName} className="story-group-item" onClick={() => {
                // Since storyGroups is created from stories, we can use the group index directly
                // But first, let's find the actual story that matches this group
                const storyIndex = stories.findIndex(s => s.id === group.id);
                
                if (storyIndex !== -1) {
                  handleStoryClick(storyIndex);
                } else {
                  console.error('❌ Story not found for group:', group);
                  // Fallback: use the group index directly
                  handleStoryClick(index);
                }
              }}>
                <div className="story-group-avatar-container">
                  <div className={`story-avatar ${group.isLive ? 'live' : ''} ${group.hasNewStory ? 'has-new' : ''}`}>
                    <span className="avatar-emoji">{group.avatar}</span>
                    {group.isLive && <div className="live-indicator">LIVE</div>}
                    {group.hasNewStory && !group.isLive && <div className="new-story-indicator"></div>}
                    {group.totalStories > 1 && (
                      <div className="story-count-badge">
                        {group.totalStories}
                      </div>
                    )}
                  </div>
                  {group.viewedStories > 0 && group.viewedStories < group.totalStories && (
                    <div className="story-progress-ring">
                      <svg className="progress-ring" width="60" height="60">
                        <circle
                          className="progress-ring-circle"
                          stroke="#ff6b6b"
                          strokeWidth="2"
                          fill="transparent"
                          r="28"
                          cx="30"
                          cy="30"
                          style={{
                            strokeDasharray: `${2 * Math.PI * 28}`,
                            strokeDashoffset: `${2 * Math.PI * 28 * (1 - group.viewedStories / group.totalStories)}`
                          }}
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="story-group-info">
                  <span className="story-name">{group.businessName}</span>
                  <span className="story-stats">
                    {group.totalStories} {group.totalStories === 1 ? 'story' : 'stories'}
                    {group.viewedStories > 0 && ` • ${group.viewedStories} viewed`}
                  </span>
                </div>
              </div>
            ))
          ) : (
            stories.map((story, index) => (
              <div key={story.id} className="story-item" onClick={() => {
                handleStoryClick(index);
              }}>
                <div className={`story-avatar ${story.isLive ? 'live' : ''} ${story.hasNewStory ? 'has-new' : ''}`}>
                  <span className="avatar-emoji">{story.avatar}</span>
                  {story.isLive && <div className="live-indicator">LIVE</div>}
                  {story.hasNewStory && !story.isLive && <div className="new-story-indicator"></div>}
                </div>
                <span className="story-name">
                  {story.businessName}
                </span>
              </div>
            ))
          )}
        </div>
        )}
      </div>

      {/* Categories */}
      <div className="categories-section">
        <div className="categories-header">
          <h3>Categories</h3>
          <span className="view-all">View all</span>
        </div>
        <div className="categories-container">
          {categories.map((category) => (
            <button
              key={category.id}
              className="category-item"
              onClick={() => handleCategoryClick(category)}
            >
              <div className="category-image-container">
                <img 
                  src={category.image} 
                  alt={category.name}
                  className="category-image"
                />
                <div className="category-overlay" style={{ backgroundColor: category.color }}></div>
              </div>
              <span className="category-name">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Refresh Message */}
      {refreshMessage && (
        <div className="refresh-message">
          <p>{refreshMessage}</p>
        </div>
      )}

      {/* ── TRENDING FOOD CONTENT ── */}
      {(() => {
        const dummyFood = [
          { _id: 'f1', dishName: 'Butter Chicken', partner: 'Sharma ji Dhukhan', price: 280, likes: 142, distance: 1.2, emoji: '🍛', gradient: 'linear-gradient(135deg,#ff6b35,#f7931e)', tag: '#1 This Week' },
          { _id: 'f2', dishName: 'Masala Dosa', partner: 'South Spice', price: 120, likes: 98, distance: 2.4, emoji: '🥞', gradient: 'linear-gradient(135deg,#f7971e,#ffd200)', tag: 'Hot 🔥' },
          { _id: 'f3', dishName: 'Paneer Tikka', partner: 'Grill House', price: 220, likes: 87, distance: 0.8, emoji: '🧀', gradient: 'linear-gradient(135deg,#ee0979,#ff6a00)', tag: 'Trending' },
          { _id: 'f4', dishName: 'Chicken Biryani', partner: 'Biryani Bros', price: 350, likes: 201, distance: 3.1, emoji: '🍚', gradient: 'linear-gradient(135deg,#11998e,#38ef7d)', tag: 'Most Liked' },
          { _id: 'f5', dishName: 'Vada Pav', partner: 'Mumbai Bites', price: 40, likes: 310, distance: 0.5, emoji: '🍔', gradient: 'linear-gradient(135deg,#fc4a1a,#f7b733)', tag: 'Fan Fav' },
          { _id: 'f6', dishName: 'Chole Bhature', partner: 'Punjabi Tadka', price: 160, likes: 76, distance: 1.9, emoji: '🫓', gradient: 'linear-gradient(135deg,#8e2de2,#4a00e0)', tag: 'New' },
        ];
        const displayFood = trendingFood.length > 0 ? trendingFood.map((item, i) => ({
          _id: item._id, dishName: item.dishName, partner: item.foodPartner?.businessName,
          price: item.price, likes: item.likes?.length || 0, distance: item.distance,
          emoji: '🍽️', gradient: dummyFood[i % dummyFood.length].gradient, tag: i === 0 ? '#1 This Week' : 'Trending',
          image: item.video
        })) : dummyFood;

        return (
          <div className="ts-section">
            <div className="ts-header">
              <div className="ts-title-row">
                <span className="ts-icon">🔥</span>
                <div>
                  <h3 className="ts-title">Trending Food</h3>
                  <p className="ts-subtitle">Top picks this week near you</p>
                </div>
                <span className="ts-pill">This Week</span>
              </div>
              <button className="ts-viewall" onClick={() => navigate('/reels')}>See All →</button>
            </div>
            <div className="ts-scroll">
              {displayFood.map((item, idx) => (
                <div key={item._id} className="ts-food-card" onClick={() => navigate('/reels')}>
                  <div className="ts-food-thumb" style={{ background: item.gradient }}>
                    <span className="ts-food-emoji">{item.emoji}</span>
                    <div className="ts-food-rank">#{idx + 1}</div>
                    <div className="ts-food-tag">{item.tag}</div>
                    <div className="ts-food-gradient-overlay" />
                  </div>
                  <div className="ts-food-body">
                    <p className="ts-food-name">{item.dishName}</p>
                    <p className="ts-food-rest">{item.partner}</p>
                    <div className="ts-food-row">
                      <span className="ts-food-price">₹{item.price}</span>
                      <span className="ts-food-likes">❤️ {item.likes}</span>
                    </div>
                    {item.distance != null && <span className="ts-food-dist">📍 {typeof item.distance === 'number' ? item.distance.toFixed(1) : item.distance} km</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── TRENDING RESTAURANTS ── */}
      {(() => {
        const dummyRest = [
          { _id: 'r1', businessName: 'Sharma ji Dhukhan', slogan: 'Taste of Punjab', rating: 4.8, distance: 1.2, orders: 340, emoji: '🏆', color: '#FF6B35' },
          { _id: 'r2', businessName: 'South Spice Corner', slogan: 'Authentic South Indian', rating: 4.6, distance: 2.1, orders: 210, emoji: '🥇', color: '#f7971e' },
          { _id: 'r3', businessName: 'Biryani Bros', slogan: 'Every grain counts', rating: 4.9, distance: 0.9, orders: 520, emoji: '🥈', color: '#11998e' },
          { _id: 'r4', businessName: 'Mumbai Street Bites', slogan: 'Street food elevated', rating: 4.5, distance: 3.4, orders: 180, emoji: '🥉', color: '#8e2de2' },
          { _id: 'r5', businessName: 'Grill House', slogan: 'Flame-kissed flavors', rating: 4.7, distance: 1.8, orders: 290, emoji: '🍽️', color: '#ee0979' },
          { _id: 'r6', businessName: 'Punjabi Tadka', slogan: 'Bold & spicy', rating: 4.4, distance: 2.6, orders: 155, emoji: '🌶️', color: '#fc4a1a' },
        ];
        const displayRest = trendingRestaurants.length > 0 ? trendingRestaurants.map((r, i) => ({
          _id: r._id, businessName: r.businessName, slogan: r.slogan, rating: r.rating,
          distance: r.distance, orders: 0, emoji: dummyRest[i % dummyRest.length].emoji,
          color: dummyRest[i % dummyRest.length].color, logo: r.logo
        })) : dummyRest;

        return (
          <div className="ts-section">
            <div className="ts-header">
              <div className="ts-title-row">
                <span className="ts-icon">🏆</span>
                <div>
                  <h3 className="ts-title">Top Restaurants</h3>
                  <p className="ts-subtitle">Most loved spots near you</p>
                </div>
                <span className="ts-pill ts-pill-gold">Near You</span>
              </div>
              <button className="ts-viewall" onClick={() => navigate('/reels')}>See All →</button>
            </div>
            <div className="ts-scroll">
              {displayRest.map((r, idx) => (
                <div key={r._id} className="ts-rest-card" onClick={() => navigate(`/food-partner/${r._id}`)} style={{ '--accent': r.color }}>
                  <div className="ts-rest-cover" style={{ background: `linear-gradient(135deg, ${r.color}33, ${r.color}11)`, borderColor: `${r.color}44` }}>
                    <div className="ts-rest-avatar" style={{ background: `linear-gradient(135deg, ${r.color}, ${r.color}99)` }}>
                      {r.logo ? <img src={r.logo} alt={r.businessName} /> : <span>{r.emoji}</span>}
                    </div>
                    <div className="ts-rest-rank-badge" style={{ background: r.color }}>#{idx + 1}</div>
                  </div>
                  <div className="ts-rest-body">
                    <p className="ts-rest-name">{r.businessName}</p>
                    {r.slogan && <p className="ts-rest-slogan">{r.slogan}</p>}
                    <div className="ts-rest-stats">
                      <span className="ts-rest-rating">⭐ {typeof r.rating === 'number' ? r.rating.toFixed(1) : r.rating}</span>
                      {r.distance != null && <span className="ts-rest-dist">📍 {typeof r.distance === 'number' ? r.distance.toFixed(1) : r.distance}km</span>}
                    </div>
                    {r.orders > 0 && <div className="ts-rest-orders">{r.orders}+ orders this week</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── STREET FOOD ── */}
      {(() => {
        const dummyStreet = [
          { _id: 's1', dishName: 'Pav Bhaji', partner: 'Mumbai Bites', price: 80, likes: 234, distance: 0.4, emoji: '🍲', gradient: 'linear-gradient(135deg,#f7971e,#ffd200)', tag: 'Street King' },
          { _id: 's2', dishName: 'Aloo Tikki Chaat', partner: 'Chaat Corner', price: 60, likes: 189, distance: 1.1, emoji: '🥔', gradient: 'linear-gradient(135deg,#fc4a1a,#f7b733)', tag: 'Fan Fav' },
          { _id: 's3', dishName: 'Golgappa', partner: 'Pani Puri Wala', price: 30, likes: 412, distance: 0.7, emoji: '🫧', gradient: 'linear-gradient(135deg,#11998e,#38ef7d)', tag: '#1 Viral' },
          { _id: 's4', dishName: 'Bhel Puri', partner: 'Juhu Beach Stall', price: 50, likes: 156, distance: 2.3, emoji: '🥗', gradient: 'linear-gradient(135deg,#8e2de2,#4a00e0)', tag: 'Trending' },
          { _id: 's5', dishName: 'Dahi Puri', partner: 'Chaat Corner', price: 70, likes: 98, distance: 1.5, emoji: '🍶', gradient: 'linear-gradient(135deg,#ee0979,#ff6a00)', tag: 'New Hit' },
          { _id: 's6', dishName: 'Samosa', partner: 'Halwai Shop', price: 20, likes: 567, distance: 0.3, emoji: '🔺', gradient: 'linear-gradient(135deg,#FF6B35,#FF4500)', tag: 'All Time' },
        ];
        const displayStreet = trendingStreetFood.length > 0 ? trendingStreetFood.map((item, i) => ({
          _id: item._id, dishName: item.dishName, partner: item.foodPartner?.businessName,
          price: item.price, likes: item.likes?.length || 0, distance: item.distance,
          emoji: dummyStreet[i % dummyStreet.length].emoji,
          gradient: dummyStreet[i % dummyStreet.length].gradient,
          tag: i === 0 ? 'Street King' : 'Trending'
        })) : dummyStreet;

        return (
          <div className="ts-section">
            <div className="ts-header">
              <div className="ts-title-row">
                <span className="ts-icon">🛺</span>
                <div>
                  <h3 className="ts-title">Street Food Hits</h3>
                  <p className="ts-subtitle">Best street bites this week</p>
                </div>
                <span className="ts-pill ts-pill-amber">Near You</span>
              </div>
              <button className="ts-viewall" onClick={() => navigate('/reels')}>See All →</button>
            </div>
            <div className="ts-scroll">
              {displayStreet.map((item, idx) => (
                <div key={item._id} className="ts-food-card ts-street-card" onClick={() => navigate('/reels')}>
                  <div className="ts-food-thumb" style={{ background: item.gradient }}>
                    <span className="ts-food-emoji">{item.emoji}</span>
                    <div className="ts-food-rank ts-street-rank">#{idx + 1}</div>
                    <div className="ts-food-tag ts-street-tag">{item.tag}</div>
                    <div className="ts-food-gradient-overlay" />
                  </div>
                  <div className="ts-food-body">
                    <p className="ts-food-name">{item.dishName}</p>
                    <p className="ts-food-rest">{item.partner}</p>
                    <div className="ts-food-row">
                      <span className="ts-food-price ts-street-price">₹{item.price}</span>
                      <span className="ts-food-likes">❤️ {item.likes}</span>
                    </div>
                    {item.distance != null && <span className="ts-food-dist">📍 {typeof item.distance === 'number' ? item.distance.toFixed(1) : item.distance} km</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Posts/Reels Feed */}
      <div className="posts-section">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading posts...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button 
              className="retry-btn"
              onClick={fetchPosts}
            >
              Retry
            </button>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="no-posts-container">
            <p>{selectedCategory ? `No posts found in ${selectedCategory.name} category.` : 'No posts available yet. Be the first to share something delicious!'}</p>
            {selectedCategory && (
              <button 
                className="clear-filter-btn"
                onClick={() => filterPostsByCategory(null)}
              >
                Show all posts
              </button>
            )}
          </div>
        ) : (
          filteredPosts.map((post) => (
          <div key={post.id} className="post-card" data-post-id={post.id}>
            {/* Post Header */}
            <div className="post-header">
              <div className="post-user-info">
                <div className="post-avatar">
                  <span className="avatar-emoji">{post.businessLogo || '🍽️'}</span>
                </div>
                <div className="post-details">
                  <h4 className="business-name">{post.businessName || 'Restaurant'}</h4>
                  <div className="business-meta">
                    <span className="post-time">{post.time || 'Just now'}</span>
                    <div className="rating">
                      <FaStar className="star-icon" />
                      <span>{post.rating || '4.5'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="post-menu-container">
                <button 
                  className="post-menu-btn"
                  onClick={() => togglePostMenu(post.id)}
                >
                  <FaEllipsisH />
                </button>
                {showPostMenu[post.id] && (
                  <div className="post-menu-dropdown">
                    <button 
                      className="menu-item"
                      onClick={() => handlePostMenuAction(post.id, 'save')}
                    >
                      Save Post
                    </button>
                    <button 
                      className="menu-item"
                      onClick={() => handlePostMenuAction(post.id, 'report')}
                    >
                      Report
                    </button>
                    <button 
                      className="menu-item"
                      onClick={() => handlePostMenuAction(post.id, 'share')}
                    >
                      Share
                    </button>
                    <button 
                      className="menu-item"
                      onClick={() => handlePostMenuAction(post.id, 'follow')}
                    >
                      Follow {post.businessName}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Post Description */}
            <div className="post-description-container">
              <p 
                className={`post-description ${!expandedPosts[post.id] && isDescriptionLong(post.description || '') ? 'truncated' : ''}`}
                onClick={() => isDescriptionLong(post.description || '') && toggleDescription(post.id)}
                style={{ cursor: isDescriptionLong(post.description || '') ? 'pointer' : 'default' }}
              >
                {post.description || 'No description available'}
              </p>
            </div>

            {/* Post Media */}
            <div className="post-media-container">
              {post.isVideo ? (
                <div className="video-container">
                  <video 
                    src={post.video}
                    className="post-video"
                    poster={post.image}
                    loop
                    muted
                  />
                  <div className="video-overlay">
                    <button className="play-button">
                      <FaPlay />
                    </button>
                  </div>
                </div>
              ) : (
                <img 
                  src={post.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80'} 
                  alt={post.businessName || 'Restaurant'}
                  className="post-image"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80';
                  }}
                />
              )}
            </div>


            {/* Post Actions */}
            <div className="post-actions">
              <button 
                className={`action-btn like-btn ${likedPosts.has(post.id) ? 'liked' : ''}`}
                onClick={() => handlePostAction(post.id, 'like')}
              >
                <FaHeart />
                <span>{post.likes || 0}</span>
              </button>
              <button 
                className="action-btn comment-btn"
                onClick={() => handlePostAction(post.id, 'comment')}
              >
                <FaComment />
                <span>{post.comments || 0}</span>
              </button>
              <button 
                className="action-btn share-btn"
                onClick={() => handlePostAction(post.id, 'share')}
              >
                <FaShare />
                <span>{post.shares || 0}</span>
              </button>
            </div>
          </div>
          ))
        )}
      </div>

        </main>{/* end centre-feed */}

        {/* Right Panel — trending / suggestions */}
        <aside className="right-panel">
          <div className="right-panel-section">
            <h3>Quick Links</h3>
            <button className="sidebar-nav-item" style={{width:'100%'}} onClick={() => handleNavClick('orders')}>
              <FaShoppingBag className="nav-icon" /><span className="nav-label">My Orders</span>
            </button>
            <button className="sidebar-nav-item" style={{width:'100%'}} onClick={() => handleNavClick('reels')}>
              <FaPlay className="nav-icon" /><span className="nav-label">Browse Reels</span>
            </button>
          </div>
          <div className="right-panel-section">
            <h3>Location</h3>
            <div className="location-dropdown-container" style={{width:'100%'}}>
              <button className="location-btn" style={{width:'100%',justifyContent:'flex-start'}} onClick={() => setShowLocationDropdown(!showLocationDropdown)}>
                <FaMapMarkerAlt /><span className="location-text">{currentLocation}</span>
              </button>
              {showLocationDropdown && (
                <div className="location-dropdown" style={{width:'100%'}}>
                  {['New York, NY','Los Angeles, CA','Chicago, IL','Miami, FL'].map(loc => (
                    <button key={loc} className="location-option" onClick={() => handleLocationChange(loc)}>{loc}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>

      </div>{/* end home-layout */}

      {/* Creative Bottom Navigation Bar (mobile only) */}
      <div className="bottom-nav-container">
        <div className="nav-particles">
          <div className="particle particle-1"></div>
          <div className="particle particle-2"></div>
          <div className="particle particle-3"></div>
          <div className="particle particle-4"></div>
        </div>
        
        <div className="bottom-nav-bar">
          <button 
            className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => handleNavClick('home')}
          >
            <FaHome className="nav-icon" />
            <span className="nav-label">Home</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'reels' ? 'active' : ''}`}
            onClick={() => handleNavClick('reels')}
          >
            <FaPlay className="nav-icon" />
            <span className="nav-label">Reels</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => handleNavClick('orders')}
          >
            <FaShoppingBag className="nav-icon" />
            <span className="nav-label">Orders</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleNavClick('profile')}
          >
            <FaUser className="nav-icon" />
            <span className="nav-label">Profile</span>
          </button>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="decorative-elements">
        <div className="deco-circle circle-1"></div>
        <div className="deco-circle circle-2"></div>
        <div className="deco-line line-1"></div>
        <div className="deco-line line-2"></div>
      </div>

      {/* Stories Viewer */}
      <StoriesViewer
        stories={stories}
        isOpen={showStoriesViewer}
        onClose={() => setShowStoriesViewer(false)}
        initialStoryIndex={selectedStoryIndex}
        onStoryViewed={handleStoryViewed}
      />

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal 
          user={currentUser}
          onClose={() => setShowProfileModal(false)}
          onLogout={handleLogout}
        />
      )}

      {/* Orders Modal */}
      {showOrdersModal && (
        <OrdersModal 
          onClose={() => setShowOrdersModal(false)}
          onOpen={() => {
            // Refresh orders when modal is opened
            if (window.refreshUserOrders) {
              window.refreshUserOrders();
            }
          }}
          onTrackOrder={handleTrackOrder}
        />
      )}

      {/* Order Tracking Modal */}
      {showOrderTracking && trackingOrderId && (
        <OrderTracking 
          orderId={trackingOrderId}
          onClose={() => {
            setShowOrderTracking(false);
            setTrackingOrderId(null);
          }}
        />
      )}

      {/* Comment Modal */}
      {showCommentModal && selectedPostForComment && (
        <CommentModal 
          post={filteredPosts.find(p => p.id === selectedPostForComment)}
          onClose={() => {
            setShowCommentModal(false);
            setSelectedPostForComment(null);
          }}
          onAddComment={(comment) => {
            setPostComments(prev => ({
              ...prev,
              [selectedPostForComment]: [
                ...(prev[selectedPostForComment] || []),
                {
                  id: Date.now(),
                  user: currentUser?.fullName || 'You',
                  text: comment,
                  time: 'Just now'
                }
              ]
            }));
            // Also increment the comment count shown on the post card
            setFilteredPosts(prev =>
              prev.map(post =>
                post.id === selectedPostForComment
                  ? { ...post, comments: post.comments + 1 }
                  : post
              )
            );
          }}
          comments={postComments[selectedPostForComment] || []}
        />
      )}

      {/* Cart toast — shown after adding item from StoriesViewer */}
      {cartToast && (
        <div className="cart-toast" onClick={() => { setCartToast(null); navigate('/reels'); }}>
          <span className="cart-toast-icon">🛒</span>
          <span className="cart-toast-text">
            {cartToast.count} item{cartToast.count !== 1 ? 's' : ''} in cart · <strong>View Cart</strong>
          </span>
          <button
            className="cart-toast-close"
            aria-label="Dismiss"
            onClick={(e) => { e.stopPropagation(); setCartToast(null); }}
          >×</button>
        </div>
      )}
    </div>
  );
};

// Comment Modal Component
const CommentModal = ({ post, onClose, onAddComment, comments }) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(newComment.trim());
      setNewComment('');
    }
  };

  return (
    <div className="comment-modal-overlay">
      <div className="comment-modal">
        <div className="comment-modal-header">
          <h3>Comments</h3>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="comment-modal-content">
          <div className="post-preview">
            <img src={post.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80'} alt={post.businessName || 'Restaurant'} />
            <div>
              <h4>{post.businessName || 'Restaurant'}</h4>
              <p>{post.description || 'No description available'}</p>
            </div>
          </div>
          
          <div className="comments-list">
            {comments.length === 0 ? (
              <div className="no-comments">
                <p>No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-avatar">
                    {comment.user.charAt(0).toUpperCase()}
                  </div>
                  <div className="comment-content">
                    <div className="comment-header">
                      <span className="comment-user">{comment.user}</span>
                      <span className="comment-time">{comment.time}</span>
                    </div>
                    <p className="comment-text">{comment.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <form className="comment-form" onSubmit={handleSubmitComment}>
            <input
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button type="submit" disabled={!newComment.trim()}>
              Post
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Profile Modal Component
const ProfileModal = ({ user, onClose, onLogout }) => {
  const [activeSection, setActiveSection] = useState('profile');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || 'New York, NY',
    bio: user?.bio || '',
    dateOfBirth: user?.dateOfBirth || '',
    gender: user?.gender || ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [preferences, setPreferences] = useState({
    pushNotifications: user?.preferences?.pushNotifications ?? true,
    emailNotifications: user?.preferences?.emailNotifications ?? true,
    smsNotifications: user?.preferences?.smsNotifications ?? false,
    showActivity: user?.preferences?.showActivity ?? true,
    locationTracking: user?.preferences?.locationTracking ?? false,
    theme: user?.preferences?.theme || 'light'
  });
  const [saveMessage, setSaveMessage] = useState('');

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Phone number is invalid';
    }
    
    if (formData.dateOfBirth && new Date(formData.dateOfBirth) > new Date()) {
      errors.dateOfBirth = 'Date of birth cannot be in the future';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle preference changes
  const handlePreferenceChange = (field, value) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update localStorage
      const updatedUser = {
        ...user,
        ...formData,
        preferences,
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      
      setSaveMessage('Profile updated successfully!');
      setIsEditing(false);
      
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(''), 3000);
      
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveMessage('Error saving profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setFormData({
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      location: user?.location || 'New York, NY',
      bio: user?.bio || '',
      dateOfBirth: user?.dateOfBirth || '',
      gender: user?.gender || ''
    });
    setFormErrors({});
    setIsEditing(false);
    setSaveMessage('');
  };

  const profileSections = [
    { id: 'profile', label: 'Profile Info', icon: FaUser },
    { id: 'preferences', label: 'Preferences', icon: FaCog },
    { id: 'help', label: 'Help & Support', icon: FaBell },
  ];

  const renderProfileContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="profile-section">
            <div className="profile-header">
              <div className="profile-avatar-large">
                {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <h3>{formData.fullName || 'User'}</h3>
              <p>{formData.email || 'user@example.com'}</p>
              {saveMessage && (
                <div className={`save-message ${saveMessage.includes('successfully') ? 'success' : 'error'}`}>
                  {saveMessage}
                </div>
              )}
            </div>
            
            <div className="profile-details">
              <div className="detail-item">
                <label>Full Name *</label>
                <input 
                  type="text" 
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  disabled={!isEditing}
                  className={formErrors.fullName ? 'error' : ''}
                />
                {formErrors.fullName && <span className="error-message">{formErrors.fullName}</span>}
              </div>
              
              <div className="detail-item">
                <label>Email *</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!isEditing}
                  className={formErrors.email ? 'error' : ''}
                />
                {formErrors.email && <span className="error-message">{formErrors.email}</span>}
              </div>
              
              <div className="detail-item">
                <label>Phone</label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!isEditing}
                  className={formErrors.phone ? 'error' : ''}
                  placeholder="+1 (555) 123-4567"
                />
                {formErrors.phone && <span className="error-message">{formErrors.phone}</span>}
              </div>
              
              <div className="detail-item">
                <label>Location</label>
                <input 
                  type="text" 
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              
              <div className="detail-item">
                <label>Bio</label>
                <textarea 
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Tell us about yourself..."
                  rows="3"
                />
              </div>
              
              <div className="detail-item">
                <label>Date of Birth</label>
                <input 
                  type="date" 
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  disabled={!isEditing}
                  className={formErrors.dateOfBirth ? 'error' : ''}
                />
                {formErrors.dateOfBirth && <span className="error-message">{formErrors.dateOfBirth}</span>}
              </div>
              
              <div className="detail-item">
                <label>Gender</label>
                <select 
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  disabled={!isEditing}
                >
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="profile-actions">
              {!isEditing ? (
                <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </button>
              ) : (
                <>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button className="btn btn-secondary" onClick={handleCancelEdit}>
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        );
      
      case 'preferences':
        return (
          <div className="preferences-section">
            <h3>Preferences</h3>
            
            <div className="preference-group">
              <h4>Notifications</h4>
              <div className="preference-item">
                <label>
                  <input 
                    type="checkbox" 
                    checked={preferences.pushNotifications}
                    onChange={(e) => handlePreferenceChange('pushNotifications', e.target.checked)}
                  />
                  Push Notifications
                </label>
                <span className="preference-description">Receive push notifications for new posts and updates</span>
              </div>
              <div className="preference-item">
                <label>
                  <input 
                    type="checkbox" 
                    checked={preferences.emailNotifications}
                    onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                  />
                  Email Notifications
                </label>
                <span className="preference-description">Receive email updates about your account</span>
              </div>
              <div className="preference-item">
                <label>
                  <input 
                    type="checkbox" 
                    checked={preferences.smsNotifications}
                    onChange={(e) => handlePreferenceChange('smsNotifications', e.target.checked)}
                  />
                  SMS Notifications
                </label>
                <span className="preference-description">Receive text messages for important updates</span>
              </div>
            </div>
            
            <div className="preference-group">
              <h4>Privacy</h4>
              <div className="preference-item">
                <label>
                  <input 
                    type="checkbox" 
                    checked={preferences.showActivity}
                    onChange={(e) => handlePreferenceChange('showActivity', e.target.checked)}
                  />
                  Show my activity to friends
                </label>
                <span className="preference-description">Allow friends to see your posts and activity</span>
              </div>
              <div className="preference-item">
                <label>
                  <input 
                    type="checkbox" 
                    checked={preferences.locationTracking}
                    onChange={(e) => handlePreferenceChange('locationTracking', e.target.checked)}
                  />
                  Allow location tracking
                </label>
                <span className="preference-description">Use your location to show nearby restaurants and offers</span>
              </div>
            </div>
            
            <div className="preference-group">
              <h4>Appearance</h4>
              <div className="preference-item">
                <label>Theme</label>
                <select 
                  value={preferences.theme}
                  onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
                <span className="preference-description">Choose your preferred app theme</span>
              </div>
            </div>
            
            <div className="preference-actions">
              <button 
                className="btn btn-primary" 
                onClick={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        );
      
      case 'help':
        return (
          <div className="help-section">
            <h3>Help & Support</h3>
            
            <div className="help-categories">
              <div className="help-category">
                <h4>Frequently Asked Questions</h4>
                <p>Find answers to common questions about using the app.</p>
                <button className="btn btn-outline">View FAQ</button>
              </div>
              
              <div className="help-category">
                <h4>Contact Support</h4>
                <p>Get help from our support team.</p>
                <button className="btn btn-outline">Contact Us</button>
              </div>
              
              <div className="help-category">
                <h4>Report a Problem</h4>
                <p>Report bugs or issues you're experiencing.</p>
                <button className="btn btn-outline">Report Issue</button>
              </div>
              
              <div className="help-category">
                <h4>About</h4>
                <p>App version 1.0.0</p>
                <button className="btn btn-outline">Check Updates</button>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="profile-modal-overlay">
      <div className="profile-modal">
        <div className="profile-modal-header">
          <h2>Profile & Settings</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="profile-modal-content">
          <div className="profile-sidebar">
            {profileSections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  className={`sidebar-item ${activeSection === section.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <Icon />
                  {section.label}
                </button>
              );
            })}
            
            <div className="logout-section">
              <button 
                className="logout-btn"
                onClick={() => setShowLogoutConfirm(true)}
              >
                <FaSignOutAlt />
                Logout
              </button>
            </div>
          </div>
          
          <div className="profile-main-content">
            {renderProfileContent()}
          </div>
        </div>
      </div>

      {/* Logout Confirmation */}
      {showLogoutConfirm && (
        <div className="logout-confirm-overlay">
          <div className="logout-confirm-dialog">
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to logout?</p>
            <div className="logout-actions">
              <button 
                className="btn btn-cancel"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-logout"
                onClick={onLogout}
              >
                <FaSignOutAlt />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Orders Modal Component
const OrdersModal = ({ onClose, onOpen, onTrackOrder }) => {
  const [activeTab, setActiveTab] = useState('active');
  const [orders, setOrders] = useState({ active: [], past: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');
  
  // WebSocket connection for real-time updates
  const { socket, isConnected } = useWebSocket();

  // Fetch orders from backend
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get user data from localStorage
      const userData = localStorage.getItem('userData');
      if (!userData) {
        throw new Error('User not logged in');
      }
      
      const user = JSON.parse(userData);
      
      // Use the MongoDB ObjectId (_id) to query orders — using a name string causes a CastError 500
      const userId = user._id || user.id;
      
      if (!userId) {
        setError('Unable to identify user. Please log out and log in again.');
        setLoading(false);
        return;
      }
      
      const response = await orderService.getOrdersByUserId(userId);
      
      if (response.success || response.message === "Orders retrieved successfully") {
        const allOrders = response.data || [];
        
        // Separate active and past orders based on actual status values from backend
        const activeOrders = allOrders.filter(order => 
          ['pending', 'preparing', 'ready'].includes(order.status)
        );
        const pastOrders = allOrders.filter(order => 
          ['completed', 'cancelled', 'rejected'].includes(order.status)
        );
        
        setOrders({
          active: activeOrders,
          past: pastOrders
        });
      } else {
        throw new Error(response.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.message || 'Failed to load orders');
      
      // Don't fallback to mock data - show empty state instead
      setOrders({
        active: [],
        past: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Refresh orders
  const handleRefresh = async () => {
    setRefreshing(true);
    setError(''); // Clear any previous errors
    setRefreshMessage(''); // Clear any previous messages
    try {
      await fetchOrders();
      setRefreshMessage('Orders updated successfully!');
      setTimeout(() => setRefreshMessage(''), 3000);
    } catch (error) {
      console.error('Error refreshing orders:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle order details
  const handleOrderDetails = async (order) => {
    try {
      if (order.orderId) {
        const response = await orderService.getOrderById(order.orderId);
        if (response.success || response.message === "Order retrieved successfully") {
          setSelectedOrder(response.order);
          setShowOrderDetails(true);
        }
      } else {
        setSelectedOrder(order);
        setShowOrderDetails(true);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      setSelectedOrder(order);
      setShowOrderDetails(true);
    }
  };



  // WebSocket event listeners for real-time order updates
  useEffect(() => {
    if (socket) {
      const handleOrderUpdate = () => {
        fetchOrders();
      };

      // Listen for all order-related events
      socket.on('order_accepted', handleOrderUpdate);
      socket.on('order_rejected', handleOrderUpdate);
      socket.on('order_preparing', handleOrderUpdate);
      socket.on('order_ready', handleOrderUpdate);
      socket.on('order_picked_up', handleOrderUpdate);
      socket.on('order_on_the_way', handleOrderUpdate);
      socket.on('order_delivered', handleOrderUpdate);

      return () => {
        socket.off('order_accepted', handleOrderUpdate);
        socket.off('order_rejected', handleOrderUpdate);
        socket.off('order_preparing', handleOrderUpdate);
        socket.off('order_ready', handleOrderUpdate);
        socket.off('order_picked_up', handleOrderUpdate);
        socket.off('order_on_the_way', handleOrderUpdate);
        socket.off('order_delivered', handleOrderUpdate);
      };
    }
  }, [socket]);

  // Load orders on component mount
  useEffect(() => {
    fetchOrders();
    
    // Call onOpen if provided (to trigger refresh when modal opens)
    if (onOpen) {
      onOpen();
    }
    
    // Set up periodic refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchOrders();
    }, 30000); // 30 seconds
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [onOpen]);

  // Listen for order creation events to refresh orders
  useEffect(() => {
    const handleOrderCreated = () => {
      // Add a small delay to ensure the order is saved in the database
      setTimeout(() => {
        fetchOrders();
      }, 1000);
    };

    const handleOrderSuccess = () => {
      // Add a small delay to ensure the order is saved in the database
      setTimeout(() => {
        fetchOrders();
      }, 2000);
    };

    // Listen for order creation events
    window.addEventListener('orderCreated', handleOrderCreated);
    window.addEventListener('orderSuccess', handleOrderSuccess);
    
    // Also listen for custom events from the home component
    window.addEventListener('ordersUpdated', handleOrderCreated);

    // Make fetchOrders globally available for manual refresh
    window.refreshUserOrders = fetchOrders;

    return () => {
      window.removeEventListener('orderCreated', handleOrderCreated);
      window.removeEventListener('orderSuccess', handleOrderSuccess);
      window.removeEventListener('ordersUpdated', handleOrderCreated);
      delete window.refreshUserOrders;
    };
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'preparing': return '#ffa726';
      case 'on-the-way': return '#42a5f5';
      case 'delivered': return '#66bb6a';
      default: return '#9e9e9e';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'preparing': return 'Preparing';
      case 'on-the-way': return 'On the way';
      case 'delivered': return 'Delivered';
      default: return status;
    }
  };

  return (
    <div className="orders-modal-overlay">
      <div className="orders-modal">
        <div className="orders-modal-header">
          <h2>My Orders</h2>
          <div className="header-actions">
            <div className="connection-status">
              <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
                {isConnected ? '🟢' : '🔴'}
              </div>
              <span className="status-text">
                {isConnected ? 'Live Updates' : 'Offline'}
              </span>
            </div>
            
            <button 
              className="refresh-btn" 
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh orders"
            >
              <FaSync className={refreshing ? 'spinning' : ''} />
            </button>
            <button className="close-btn" onClick={onClose}>
              <FaTimes />
            </button>
          </div>
        </div>
        
        {error && (
          <div className="orders-error">
            <p>{error}</p>
            <button className="retry-btn" onClick={fetchOrders}>
              Try Again
            </button>
          </div>
        )}
        
        {refreshMessage && (
          <div className="orders-success">
            <p>{refreshMessage}</p>
          </div>
        )}
        
        
        <div className="orders-tabs">
          <button 
            className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active Orders ({orders.active.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`}
            onClick={() => setActiveTab('past')}
          >
            Order History ({orders.past.length})
          </button>
        </div>
        
        <div className="orders-content">
          {loading ? (
            <div className="orders-loading">
              <div className="loading-spinner"></div>
              <p>Loading orders...</p>
            </div>
          ) : orders[activeTab].length === 0 ? (
            <div className="empty-orders">
              <FaShoppingBag className="empty-icon" />
              <h3>No {activeTab === 'active' ? 'active' : 'past'} orders</h3>
              <p>{activeTab === 'active' ? 'Your active orders will appear here' : 'Your order history will appear here'}</p>
              {activeTab === 'active' && (
                <button className="btn btn-primary" onClick={() => window.location.href = '/reels'}>
                  Browse Food
                </button>
              )}
            </div>
          ) : (
            <div className="orders-list">
              {orders[activeTab].map((order) => (
                <div key={order.id || order.orderId} className="order-card" onClick={() => handleOrderDetails(order)}>
                  <div className="order-header">
                    <div className="restaurant-info">
                      <h4>{order.restaurant || order.foodPartner?.businessName || 'Restaurant'}</h4>
                      <span className="order-time">
                        {order.orderTime || (order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Unknown time')}
                      </span>
                      {order.orderId && (
                        <span className="order-id">#{order.orderId}</span>
                      )}
                    </div>
                    <div 
                      className="order-status"
                      style={{ color: getStatusColor(order.status) }}
                    >
                      {getStatusText(order.status)}
                    </div>
                  </div>
                  
                  <div className="order-items">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, index) => (
                        <span key={index} className="order-item">
                          {typeof item === 'string' ? item : (item.name || 'Unknown item')}
                          {index < order.items.length - 1 && ', '}
                        </span>
                      ))
                    ) : (
                      <span className="order-item">Order details loading...</span>
                    )}
                  </div>
                  
                  <div className="order-footer">
                    <div className="order-total">
                      <strong>${order.total || order.totalAmount || 0}</strong>
                    </div>
                    
                    {order.estimatedTime && (
                      <div className="estimated-time">
                        <FaClock />
                        {order.estimatedTime}
                      </div>
                    )}
                    
                    {order.rating && (
                      <div className="order-rating">
                        {[...Array(5)].map((_, i) => (
                          <FaStar 
                            key={i} 
                            className={i < order.rating ? 'filled' : 'empty'} 
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {['pending', 'confirmed', 'preparing', 'on-the-way'].includes(order.status) && (
                    <div className="order-actions">
                      <button 
                        className="btn btn-outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTrackOrder(order);
                        }}
                      >
                        Track Order
                      </button>
                      <button 
                        className="btn btn-outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContactRestaurant(order);
                        }}
                      >
                        Contact Restaurant
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Order Details Modal */}
        {showOrderDetails && selectedOrder && (
          <div className="order-details-modal-overlay" onClick={() => setShowOrderDetails(false)}>
            <div className="order-details-modal" onClick={(e) => e.stopPropagation()}>
              <div className="order-details-header">
                <h3>Order Details</h3>
                <button className="close-btn" onClick={() => setShowOrderDetails(false)}>
                  <FaTimes />
                </button>
              </div>
              
              <div className="order-details-content">
                <div className="order-info-section">
                  <h4>Order Information</h4>
                  <div className="info-row">
                    <span className="label">Order ID:</span>
                    <span className="value">{selectedOrder.orderId || selectedOrder.id}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Status:</span>
                    <span className="value" style={{ color: getStatusColor(selectedOrder.status) }}>
                      {getStatusText(selectedOrder.status)}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">Order Time:</span>
                    <span className="value">
                      {selectedOrder.orderTime || new Date(selectedOrder.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">Total:</span>
                    <span className="value">${selectedOrder.total || selectedOrder.totalAmount || 0}</span>
                  </div>
                </div>
                
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div className="order-items-section">
                    <h4>Items</h4>
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="order-item-detail">
                        <span className="item-name">
                          {typeof item === 'string' ? item : item.name}
                        </span>
                        {typeof item === 'object' && item.quantity && (
                          <span className="item-quantity">x{item.quantity}</span>
                        )}
                        {typeof item === 'object' && item.price && (
                          <span className="item-price">${item.price}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserHome;
