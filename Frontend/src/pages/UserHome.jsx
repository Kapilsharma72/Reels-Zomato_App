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
  
  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  
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
      console.log('Setting up WebSocket listeners for user:', currentUser._id);
      
      // Listen for order updates
      const handleOrderUpdate = (data) => {
        console.log('Order update received via WebSocket:', data);
        if (data.data) {
          // Update the order in the orders list
          setOrders(prevOrders => 
            prevOrders.map(order => 
              (order.id === data.data.id || order._id === data.data.id) 
                ? { ...order, ...data.data } 
                : order
            )
          );
          
          // Show notification
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
        console.log('Order status change received via WebSocket:', data);
        if (data.data) {
          // Update the order status
          setOrders(prevOrders => 
            prevOrders.map(order => 
              (order.id === data.data.id || order._id === data.data.id) 
                ? { ...order, status: data.data.status } 
                : order
            )
          );
          
          // Refresh orders to get latest data
          fetchOrders();
        }
      };

      // Add listeners
      socket.on('order_update', handleOrderUpdate);
      socket.on('order_status_change', handleOrderStatusChange);

      return () => {
        console.log('Cleaning up WebSocket listeners for user');
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
      // Listen for order status updates
      socket.on('order_accepted', (data) => {
        if (data.customerId === currentUser.fullName || data.customerId === currentUser.name) {
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
        if (data.customerId === currentUser.fullName || data.customerId === currentUser.name) {
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
        if (data.customerId === currentUser.fullName || data.customerId === currentUser.name) {
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
        if (data.customerId === currentUser.fullName || data.customerId === currentUser.name) {
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
        if (data.customerId === currentUser.fullName || data.customerId === currentUser.name) {
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
        if (data.customerId === currentUser.fullName || data.customerId === currentUser.name) {
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
        if (data.customerId === currentUser.fullName || data.customerId === currentUser.name) {
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
    try {
      setUserLoading(true);
      
      // First, check if we have user data in localStorage
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        const userData = JSON.parse(storedUserData);
        setCurrentUser(userData);
        setUserLoading(false);
        console.log('Using stored user data:', userData);
      }

      // Also check for temporary user data from registration
      const tempUserData = localStorage.getItem('tempUserData');
      if (tempUserData) {
        const userData = JSON.parse(tempUserData);
        setCurrentUser(userData);
        setUserLoading(false);
        console.log('Using temporary user data:', userData);
        // Move temp data to persistent storage
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.removeItem('tempUserData');
        return; // Don't make API call if we have temp data
      }

      // Only check authentication if we don't have stored user data and haven't redirected yet
      if (!storedUserData && !authService.isAuthenticated() && !hasRedirected) {
        console.log('User not authenticated and no stored data, redirecting to login');
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
        console.log('Current user loaded from API:', response.user);
      }
      setUserLoading(false);
    } catch (error) {
      console.error('Error fetching current user:', error);
      setUserLoading(false);
      
      // Only redirect to login if we don't have stored user data and get auth error and haven't redirected yet
      if ((error.message.includes('401') || error.message.includes('login') || error.message.includes('Please login')) && !storedUserData && !hasRedirected) {
        console.log('Authentication failed and no stored data, redirecting to login');
        setHasRedirected(true);
        navigate('/login');
      } else {
        // For other errors or if we have stored data, just log the error
        console.log('API error, but user might still be authenticated or have stored data');
        // Don't redirect, let the user continue with stored data
      }
    }
  };

  // Fetch stories from API
  const fetchStories = async (showRefreshMessage = false) => {
    try {
      setStoriesLoading(true);
      setStoriesError('');
      console.log('Fetching stories from API...');
      
      const response = await storiesAPI.getStories();
      console.log('Stories API response:', response);
      
      if (response && response.stories) {
        console.log('Raw stories from API:', response.stories);
        
        // AGGRESSIVE GROUPING: Group stories by business name first, then by food partner ID
        const groupedStories = {};
        
        response.stories.forEach((story, index) => {
          console.log(`Processing story ${index}:`, story);
          
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
          
          console.log(`Group key for story ${index}:`, groupKey, 'Business:', businessName, 'FoodPartner ID:', foodPartnerId);
          
          // Create or get existing group
          if (!groupedStories[groupKey]) {
            groupedStories[groupKey] = {
              id: groupKey,
              businessName: businessName,
              avatar: '🍽️',
      isLive: false, 
      hasNewStory: false,
              time: formatTimeAgo(story.createdAt),
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
          const currentTime = new Date(groupedStories[groupKey].time);
          if (storyTime > currentTime) {
            groupedStories[groupKey].time = formatTimeAgo(story.createdAt);
          }
          
          // Show red dot if any story in the group is unviewed
          if (!isViewed) {
            groupedStories[groupKey].hasNewStory = true;
          }
        });
        
        console.log('Grouped stories result:', groupedStories);
        
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
            const groupTime = new Date(group.time);
            const existingTime = new Date(finalGroupedStories[finalKey].time);
            if (groupTime > existingTime) {
              finalGroupedStories[finalKey].time = group.time;
            }
            
            // Show red dot if any story is unviewed
            if (group.hasNewStory) {
              finalGroupedStories[finalKey].hasNewStory = true;
            }
          }
        });
        
        // Convert to array and sort by time (most recent first)
        const transformedStories = Object.values(finalGroupedStories).sort((a, b) => {
          return new Date(b.time) - new Date(a.time);
        });
        
        console.log('Final transformed stories:', transformedStories);
        console.log(`Total groups: ${transformedStories.length}, Total stories: ${response.stories.length}`);
        
        setStories(transformedStories);
        console.log('Stories loaded successfully:', transformedStories.length);
        
        if (showRefreshMessage) {
          setRefreshMessage('Content refreshed successfully!');
          setTimeout(() => setRefreshMessage(''), 3000);
        }
      } else {
        console.log('No stories found in response');
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
      console.log('🎬 Setting demo stories:', demoStories);
      setStories(demoStories);
    } finally {
      setStoriesLoading(false);
    }
  };

  // Mock data for categories
  const categories = [
    { id: 1, name: 'Pizza', image: '/images/pizza.jpg', color: '#FF6B6B' },
    { id: 2, name: 'Chicken', image: '/images/chicken.jpg', color: '#4ECDC4' },
    { id: 3, name: 'Burger', image: '/images/burger.jpg', color: '#45B7D1' },
    { id: 4, name: 'Veg Meal', image: '/images/veg-meal.jpg', color: '#96CEB4' },
    { id: 5, name: 'Thali', image: '/images/thali.jpg', color: '#FFEAA7' },
    { id: 6, name: 'Biryani', image: '/images/biryani.jpg', color: '#DDA0DD' },
    { id: 7, name: 'Pasta', image: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=2000&q=80', color: '#FF9F43' },
    { id: 8, name: 'Sushi', image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=2000&q=80', color: '#10AC84' },
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
          likes: Math.floor(Math.random() * 200) + 50, // Random likes for demo
          comments: Math.floor(Math.random() * 50) + 10, // Random comments for demo
          shares: Math.floor(Math.random() * 20) + 5, // Random shares for demo
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
        console.log('Backend connectivity test:', response.ok);
      } catch (error) {
        console.log('Backend connectivity test failed:', error.message);
      }
    };
    
    loadViewedStories();
    testBackendConnection();
    fetchCurrentUser();
    fetchPosts();
    fetchStories();
    fetchNotifications();
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
    console.log('Category clicked:', category);
    filterPostsByCategory(category);
  };

  const handlePostAction = async (postId, action) => {
    if (action === 'like') {
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (newSet.has(postId)) {
          newSet.delete(postId);
        } else {
          newSet.add(postId);
        }
        return newSet;
      });
      
      // Update post likes count
      setFilteredPosts(prev => 
        prev.map(post => 
          post.id === postId 
            ? { ...post, likes: likedPosts.has(postId) ? post.likes - 1 : post.likes + 1 }
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
          console.log('Error sharing:', error);
        }
      } else {
        // Fallback: copy to clipboard
        const post = filteredPosts.find(p => p.id === postId);
        navigator.clipboard.writeText(`${post.businessName}: ${post.description}`);
        setRefreshMessage('Post link copied to clipboard!');
        setTimeout(() => setRefreshMessage(''), 2000);
      }
    }
    console.log(`${action} clicked for post ${postId}`);
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
    console.log(`${action} clicked for post ${postId}`);
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
    console.log('Contact restaurant for order:', order);
  };

  // Memoized callback to prevent infinite loops
  const handleStoryViewed = useCallback((mediaId) => {
    console.log('Story media viewed in viewer:', mediaId);
    
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
    console.log('🎬 Story clicked!', { storyIndex, totalStories: stories.length });
    console.log('📚 Available stories:', stories);
    
    const storyGroup = stories[storyIndex];
    console.log('📖 Selected story group:', storyGroup);
    
    if (!storyGroup) {
      console.error('❌ No story group found at index:', storyIndex);
      return;
    }
    
    if (!storyGroup.media || storyGroup.media.length === 0) {
      console.error('❌ Story group has no media:', storyGroup);
      return;
    }
    
    console.log('🎥 Story group media:', storyGroup.media);
    
    if (storyGroup) {
      // Mark all stories in the group as viewed
      try {
        const unviewedStories = storyGroup.media.filter(media => !media.isViewed);
        console.log('👀 Unviewed stories:', unviewedStories);
        
        // Mark each unviewed story as viewed
        for (const media of unviewedStories) {
          try {
            await storiesAPI.markStoryAsViewed(media.id);
            console.log('✅ Marked story as viewed:', media.id);
          } catch (error) {
            console.error('❌ Error marking story as viewed:', media.id, error);
          }
        }
        
        // Update local state to remove red dot for all stories in the group
        setViewedStories(prev => {
          const newSet = new Set(prev);
          storyGroup.media.forEach(media => {
            newSet.add(media.id);
          });
          
          // Save to localStorage
          try {
            localStorage.setItem('viewedStories', JSON.stringify([...newSet]));
          } catch (error) {
            console.error('Error saving viewed stories:', error);
          }
          return newSet;
        });
        
        // Update the story group to remove red dot
        setStories(prev => prev.map(s => 
          s.id === storyGroup.id ? { ...s, hasNewStory: false } : s
        ));
        
        console.log('✅ Stories marked as viewed:', unviewedStories.map(m => m.id));
      } catch (error) {
        console.error('❌ Error marking stories as viewed:', error);
        // Continue with opening the story viewer even if marking fails
      }
    }
    
    console.log('🚀 Setting selected story index:', storyIndex);
    console.log('🚀 Setting show stories viewer to true');
    
    setSelectedStoryIndex(storyIndex);
    setShowStoriesViewer(true);
    
    // Verify state changes
    setTimeout(() => {
      console.log('🔍 State after click:', {
        selectedStoryIndex: storyIndex,
        showStoriesViewer: true,
        storiesLength: stories.length
      });
    }, 100);
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
      console.log('🔄 Grouping stories:', stories.map(s => ({ id: s.id, businessName: s.businessName })));
      const grouped = groupStoriesByBusiness(stories);
      console.log('📦 Grouped stories result:', grouped.map(g => ({ id: g.id, businessName: g.businessName })));
      setStoryGroups(grouped);
    } else {
      console.log('📭 No stories to group');
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
        {/* Top row: username (left) and icons (right) */}
        <div className="top-row">
          <div className="left">
            <span className="username">
              {userLoading ? 'Loading...' : (currentUser ? currentUser.fullName : 'User')}
            </span>
          </div>
          
          <div className="right">
            <div className="location-dropdown-container">
              <button 
                className="btn location-btn"
                onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                title="Location"
              >
                <FaMapMarkerAlt />
                <span className="location-text">{currentLocation}</span>
              </button>
              {showLocationDropdown && (
                <div className="location-dropdown">
                  <button 
                    className="location-option"
                    onClick={() => handleLocationChange('New York, NY')}
                  >
                    New York, NY
                  </button>
                  <button 
                    className="location-option"
                    onClick={() => handleLocationChange('Los Angeles, CA')}
                  >
                    Los Angeles, CA
                  </button>
                  <button 
                    className="location-option"
                    onClick={() => handleLocationChange('Chicago, IL')}
                  >
                    Chicago, IL
                  </button>
                  <button 
                    className="location-option"
                    onClick={() => handleLocationChange('Miami, FL')}
                  >
                    Miami, FL
                  </button>
                </div>
              )}
            </div>
            
            
            <button 
              className="btn refresh-btn" 
              title="Refresh Content"
              onClick={() => {
                // Only show refresh message once
                fetchPosts(true);
                fetchStories(false); // Don't show duplicate message
              }}
              disabled={loading || storiesLoading}
            >
              <FaSync className={loading || storiesLoading ? 'spinning' : ''} />
            </button>
            
            <div className="connection-status">
              <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
                {isConnected ? '🟢' : '🔴'}
              </div>
              <span className="status-text">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
            
            <NotificationCenter 
              userType="customer" 
              userId={currentUser?.fullName || currentUser?.name}
              className="user-notifications"
            />
          </div>
        </div>
        
        {/* Enhanced search bar with icon */}
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
          
          {/* Search Results Dropdown */}
          {showSearchResults && searchQuery && (
            <div className="search-results-dropdown">
              {searchResults.posts.length > 0 && (
                <div className="search-section">
                  <h4>Posts</h4>
                  {searchResults.posts.slice(0, 3).map(post => (
                    <div key={post.id} className="search-result-item" onClick={() => {
                      setShowSearchResults(false);
                      setSearchQuery('');
                      // Scroll to post
                      const postElement = document.querySelector(`[data-post-id="${post.id}"]`);
                      if (postElement) {
                        postElement.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}>
                      <img src={post.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80'} alt={post.businessName || 'Restaurant'} />
                      <div>
                        <h5>{post.businessName || 'Restaurant'}</h5>
                        <p>{(post.description || 'No description').substring(0, 50)}...</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {searchResults.stories.length > 0 && (
                <div className="search-section">
                  <h4>Stories</h4>
                  {searchResults.stories.slice(0, 3).map(story => (
                    <div key={story.id} className="search-result-item" onClick={() => {
                      setShowSearchResults(false);
                      setSearchQuery('');
                      const storyIndex = stories.findIndex(s => s.id === story.id);
                      if (storyIndex !== -1) {
                        handleStoryClick(storyIndex);
                      }
                    }}>
                      <div className="story-avatar-small">
                        <span>{story.avatar || '🍽️'}</span>
                      </div>
                      <div>
                        <h5>{story.businessName || 'Restaurant'}</h5>
                        <p>View story</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {searchResults.categories.length > 0 && (
                <div className="search-section">
                  <h4>Categories</h4>
                  {searchResults.categories.slice(0, 3).map(category => (
                    <div key={category.id} className="search-result-item" onClick={() => {
                      setShowSearchResults(false);
                      setSearchQuery('');
                      handleCategoryClick(category);
                    }}>
                      <img src={category.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80'} alt={category.name || 'Category'} />
                      <div>
                        <h5>{category.name || 'Category'}</h5>
                        <p>Browse category</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {Object.values(searchResults).every(arr => arr.length === 0) && (
                <div className="no-search-results">
                  <p>No results found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
                console.log('🎯 Story group click:', { 
                  groupId: group.id, 
                  groupIndex: index,
                  storyIndex, 
                  totalStories: stories.length,
                  groupBusinessName: group.businessName
                });
                
                if (storyIndex !== -1) {
                  handleStoryClick(storyIndex);
                } else {
                  console.error('❌ Story not found for group:', group);
                  console.log('📚 Available stories:', stories.map(s => ({ id: s.id, businessName: s.businessName })));
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
                console.log('🎯 Direct story click:', { storyId: story.id, index, totalStories: stories.length });
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

      {/* Creative Bottom Navigation Bar */}
      <div className="bottom-nav-container">
        {/* Floating particles around nav */}
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
      {console.log('🎬 Rendering StoriesViewer with props:', {
        storiesCount: stories.length,
        isOpen: showStoriesViewer,
        selectedStoryIndex,
        stories: stories.map(s => ({ id: s.id, businessName: s.businessName, mediaCount: s.media?.length }))
      })}
      <StoriesViewer
        stories={stories}
        isOpen={showStoriesViewer}
        onClose={() => {
          console.log('🚪 Closing stories viewer');
          setShowStoriesViewer(false);
        }}
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
          }}
          comments={postComments[selectedPostForComment] || []}
        />
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
      
      // Debug: Log the user object to see what fields are available
      console.log('User object from localStorage:', user);
      console.log('Available user fields:', Object.keys(user));
      
      // The backend searches by customer name or phone, so we can use either
      // Priority: fullName -> name -> email -> phone (same as order creation)
      let searchIdentifier = user.fullName || user.name || user.email || user.phone;
      
      // Fallback: If no standard fields found, try to use any string field
      if (!searchIdentifier) {
        const stringFields = Object.values(user).filter(value => 
          typeof value === 'string' && value.trim().length > 0
        );
        if (stringFields.length > 0) {
          searchIdentifier = stringFields[0];
          console.log('Using fallback identifier:', searchIdentifier);
        }
      }
      
      // Final fallback: Use a default identifier
      if (!searchIdentifier) {
        searchIdentifier = 'John Doe'; // Use same default as order creation
        console.log('Using default identifier:', searchIdentifier);
      }
      
      console.log('Searching orders for user:', searchIdentifier);
      const response = await orderService.getOrdersByUserId(searchIdentifier);
      
      if (response.success || response.message === "Orders retrieved successfully") {
        const allOrders = response.data || [];
        console.log('Fetched orders from backend:', allOrders);
        
        // Separate active and past orders based on actual status values from backend
        const activeOrders = allOrders.filter(order => 
          ['pending', 'preparing', 'ready'].includes(order.status)
        );
        const pastOrders = allOrders.filter(order => 
          ['completed', 'cancelled', 'rejected'].includes(order.status)
        );
        
        console.log('Active orders:', activeOrders);
        console.log('Past orders:', pastOrders);
        
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
        console.log('Order update received via WebSocket, refreshing orders...');
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
      console.log('Auto-refreshing orders...');
      fetchOrders();
    }, 30000); // 30 seconds
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [onOpen]);

  // Listen for order creation events to refresh orders
  useEffect(() => {
    const handleOrderCreated = () => {
      console.log('Order created event received, refreshing orders...');
      // Add a small delay to ensure the order is saved in the database
      setTimeout(() => {
        fetchOrders();
      }, 1000);
    };

    const handleOrderSuccess = () => {
      console.log('Order success event received, refreshing orders...');
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
