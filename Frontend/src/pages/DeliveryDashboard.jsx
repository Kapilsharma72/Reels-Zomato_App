import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaHome, 
  FaMapMarkerAlt, 
  FaClock, 
  FaPhone, 
  FaUser, 
  FaBell, 
  FaCog,
  FaBars,
  FaTimes,
  FaCheckCircle,
  FaTruck,
  FaRoute,
  FaStar,
  FaMap,
  FaLocationArrow,
  FaExclamationTriangle,
  FaCheck,
  FaTimes as FaX,
  FaSignOutAlt,
  FaPlay,
  FaPause,
  FaDownload
} from 'react-icons/fa';
import authService from '../services/authService';
import deliveryService from '../services/deliveryService';
import { useWebSocket } from '../hooks/useWebSocket';
import NotificationCenter from '../components/NotificationCenter';
import '../styles/DeliveryDashboard.css';

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Real data state
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [deliveryStats, setDeliveryStats] = useState({
    total: 0,
    delivered: 0,
    onTheWay: 0,
    pickedUp: 0,
    totalEarnings: 0
  });
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  
  // WebSocket connection
  const { socket, isConnected } = useWebSocket();
  const notificationRef = useRef(null);
  
  // WebSocket event handlers for real-time delivery updates
  useEffect(() => {
    if (socket) {
      console.log('Setting up WebSocket listeners for delivery partner');
      
      // Listen for new available orders
      const handleNewOrder = (data) => {
        console.log('New order available for delivery via WebSocket:', data);
        if (data.data) {
          // Add new order to available orders
          setAvailableOrders(prevOrders => [data.data, ...prevOrders]);
          
          // Show notification
          const notification = {
            id: Date.now(),
            type: 'info',
            message: `New delivery order available from ${data.data.restaurantName || 'Restaurant'}`,
            timestamp: new Date()
          };
          setNotifications(prev => [notification, ...prev.slice(0, 4)]);
        }
      };

      // Listen for order assignments
      const handleOrderAssigned = (data) => {
        console.log('Order assigned to delivery partner via WebSocket:', data);
        if (data.data) {
          // Add order to my orders
          setMyOrders(prevOrders => [data.data, ...prevOrders]);
          
          // Remove from available orders
          setAvailableOrders(prevOrders => 
            prevOrders.filter(order => order.id !== data.data.id && order._id !== data.data.id)
          );
          
          // Show notification
          const notification = {
            id: Date.now(),
            type: 'success',
            message: `Order ${data.data.orderId} assigned to you`,
            timestamp: new Date()
          };
          setNotifications(prev => [notification, ...prev.slice(0, 4)]);
        }
      };

      // Listen for order updates
      const handleOrderUpdate = (data) => {
        console.log('Order update received via WebSocket:', data);
        if (data.data) {
          // Update the order in my orders
          setMyOrders(prevOrders => 
            prevOrders.map(order => 
              (order.id === data.data.id || order._id === data.data.id) 
                ? { ...order, ...data.data } 
                : order
            )
          );
          
          // Refresh data to get latest information
          fetchMyOrders();
          fetchAvailableOrders();
        }
      };

      // Add listeners
      socket.on('new_order', handleNewOrder);
      socket.on('order_assigned', handleOrderAssigned);
      socket.on('order_update', handleOrderUpdate);

      return () => {
        console.log('Cleaning up WebSocket listeners for delivery partner');
        socket.off('new_order', handleNewOrder);
        socket.off('order_assigned', handleOrderAssigned);
        socket.off('order_update', handleOrderUpdate);
      };
    }
  }, [socket]);

  const navigationItems = [
    { id: 'home', label: 'Dashboard', icon: FaHome },
    { id: 'orders', label: 'Active Orders', icon: FaTruck },
    { id: 'available', label: 'Available Orders', icon: FaMap },
    { id: 'history', label: 'Delivery History', icon: FaRoute },
    { id: 'earnings', label: 'Earnings', icon: FaStar },
    { id: 'profile', label: 'Profile', icon: FaUser },
    { id: 'settings', label: 'Settings', icon: FaCog },
  ];

  // Fetch data functions
  const fetchAvailableOrders = async () => {
    try {
      setLoading(true);
      const response = await deliveryService.getAvailableOrders();
      if (response.success) {
        setAvailableOrders(response.orders);
      }
    } catch (error) {
      console.error('Error fetching available orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyOrders = async () => {
    try {
      const response = await deliveryService.getDeliveryPartnerOrders();
      if (response.success) {
        setMyOrders(response.orders);
      }
    } catch (error) {
      console.error('Error fetching my orders:', error);
    }
  };

  const fetchDeliveryStats = async () => {
    try {
      const response = await deliveryService.getDeliveryStats();
      if (response.success) {
        setDeliveryStats(response.stats);
      }
    } catch (error) {
      console.error('Error fetching delivery stats:', error);
    }
  };

  // Accept order function
  const handleAcceptOrder = async (orderId) => {
    try {
      setLoading(true);
      const response = await deliveryService.acceptOrder(orderId);
      if (response.success) {
        // Refresh data
        await Promise.all([fetchAvailableOrders(), fetchMyOrders()]);
        addNotification('Order accepted successfully!', 'success');
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      addNotification('Failed to accept order', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update delivery status
  const handleUpdateStatus = async (orderId, status) => {
    try {
      setLoading(true);
      const response = await deliveryService.updateDeliveryStatus(orderId, status);
      if (response.success) {
        await fetchMyOrders();
        addNotification(`Order status updated to ${status}`, 'success');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      addNotification('Failed to update status', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Notification system
  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 9)]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // WebSocket event handlers
  useEffect(() => {
    if (socket) {
      // Listen for new orders
      socket.on('new_order', (data) => {
        addNotification(`New order available: ${data.orderId}`, 'info');
        fetchAvailableOrders();
      });

      // Listen for order updates
      socket.on('order_update', (data) => {
        addNotification(`Order ${data.orderId} status updated`, 'info');
        fetchMyOrders();
      });

      // Listen for order assigned
      socket.on('order_assigned', (data) => {
        addNotification(`Order ${data.orderId} assigned to you`, 'success');
        fetchMyOrders();
      });

      // Listen for order ready
      socket.on('order_ready', (data) => {
        addNotification(`Order ${data.orderId} is ready for pickup`, 'info');
        fetchAvailableOrders();
      });

      return () => {
        socket.off('new_order');
        socket.off('order_update');
        socket.off('order_assigned');
        socket.off('order_ready');
      };
    }
  }, [socket]);

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        fetchAvailableOrders(),
        fetchMyOrders(),
        fetchDeliveryStats()
      ]);
    };

    fetchData();

    // Set up periodic refresh
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Mock data for assigned orders
  const assignedOrders = [
    {
      id: 1,
      customerName: 'John Doe',
      restaurantName: 'Spice Garden',
      restaurantAddress: '123 Main St, New York, NY',
      customerAddress: '456 Oak Ave, New York, NY',
      items: ['Chicken Biryani', 'Raita'],
      total: 24.99,
      status: 'pickup',
      estimatedTime: '15 min',
      distance: '2.3 km',
      phone: '+1 234-567-8900',
      specialInstructions: 'Ring doorbell twice',
      orderTime: '2:30 PM',
      pickupTime: '2:45 PM',
      deliveryTime: '3:00 PM'
    },
    {
      id: 2,
      customerName: 'Jane Smith',
      restaurantName: 'Pizza Corner',
      restaurantAddress: '789 Pine St, New York, NY',
      customerAddress: '321 Elm St, New York, NY',
      items: ['Margherita Pizza', 'Coca Cola'],
      total: 18.99,
      status: 'delivery',
      estimatedTime: '8 min',
      distance: '1.8 km',
      phone: '+1 234-567-8901',
      specialInstructions: 'Leave at door if no answer',
      orderTime: '2:15 PM',
      pickupTime: '2:30 PM',
      deliveryTime: '2:45 PM'
    },
    {
      id: 3,
      customerName: 'Mike Johnson',
      restaurantName: 'Burger Palace',
      restaurantAddress: '555 Broadway, New York, NY',
      customerAddress: '777 5th Ave, New York, NY',
      items: ['Cheeseburger', 'Fries', 'Milkshake'],
      total: 22.99,
      status: 'completed',
      estimatedTime: '0 min',
      distance: '3.1 km',
      phone: '+1 234-567-8902',
      specialInstructions: 'Call when arrived',
      orderTime: '1:45 PM',
      pickupTime: '2:00 PM',
      deliveryTime: '2:20 PM'
    }
  ];

  // Mock data for delivery history
  const deliveryHistory = [
    {
      id: 1,
      customerName: 'Sarah Wilson',
      restaurantName: 'Sushi Master',
      total: 32.99,
      deliveryTime: '1:30 PM',
      rating: 5,
      tip: 5.00,
      date: 'Today'
    },
    {
      id: 2,
      customerName: 'David Brown',
      restaurantName: 'Taco Fiesta',
      total: 16.99,
      deliveryTime: '12:45 PM',
      rating: 4,
      tip: 3.00,
      date: 'Today'
    },
    {
      id: 3,
      customerName: 'Lisa Davis',
      restaurantName: 'Cafe Delight',
      total: 12.99,
      deliveryTime: '11:20 AM',
      rating: 5,
      tip: 2.50,
      date: 'Today'
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <DashboardHome 
          assignedOrders={myOrders} 
          deliveryStats={deliveryStats}
          deliveryHistory={deliveryHistory}
          loading={loading}
        />;
      case 'orders':
        return <ActiveOrders 
          orders={myOrders} 
          onSelectOrder={setSelectedOrder}
          onUpdateStatus={handleUpdateStatus}
          loading={loading}
        />;
      case 'available':
        return <AvailableOrders 
          orders={availableOrders}
          onAcceptOrder={handleAcceptOrder}
          loading={loading}
        />;
      case 'history':
        return <DeliveryHistory history={myOrders.filter(order => order.status === 'delivered')} />;
      case 'earnings':
        return <EarningsView stats={deliveryStats} />;
      case 'profile':
        return <ProfileView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardHome 
          assignedOrders={myOrders} 
          deliveryStats={deliveryStats}
          deliveryHistory={deliveryHistory}
          loading={loading}
        />;
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logoutUser();
      // Clear any stored user data
      localStorage.removeItem('userData');
      localStorage.removeItem('tempUserData');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state and redirect
      localStorage.removeItem('userData');
      localStorage.removeItem('tempUserData');
      navigate('/login');
    }
  };

  return (
    <div className="delivery-dashboard">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Sidebar */}
      <div className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">🚚</div>
            <span className="logo-text">DeliveryPro</span>
          </div>
          <div className="sidebar-subtitle">Driver Dashboard</div>
        </div>
        
        <nav className="sidebar-nav">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
              >
                <div className="nav-icon">
                  <Icon />
                </div>
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="dashboard-main">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-left">
            <button 
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <h1 className="dashboard-title">
              {navigationItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
            </h1>
          </div>
          
          <div className="header-actions">
            <div className="connection-status">
              <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
                {isConnected ? <FaCheck /> : <FaX />}
              </div>
              <span className="status-text">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <NotificationCenter 
              userType="delivery_partner" 
              userId="delivery_partner_id" // You might want to get this from auth context
              className="delivery-notifications"
            />
            
            <button 
              className="logout-btn"
              onClick={() => setShowLogoutConfirm(true)}
              title="Logout"
            >
              <FaSignOutAlt />
            </button>
            
            <button className="profile-btn">
              <div className="profile-avatar">DP</div>
              <div className="profile-info">
                <div className="profile-name">Delivery Driver</div>
                <div className={`profile-status ${isOnline ? 'online' : 'offline'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="dashboard-content">
          {renderContent()}
        </div>
      </div>


      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="logout-confirm-overlay">
          <div className="logout-confirm-dialog">
            <div className="logout-confirm-header">
              <h3>Confirm Logout</h3>
            </div>
            <div className="logout-confirm-body">
              <p>Are you sure you want to logout?</p>
            </div>
            <div className="logout-confirm-actions">
              <button 
                className="btn btn-cancel"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-logout"
                onClick={handleLogout}
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

// Dashboard Home Component
const DashboardHome = ({ assignedOrders, deliveryStats, deliveryHistory, loading }) => {
  const activeOrders = assignedOrders.filter(order => order.status !== 'delivered');
  const todayEarnings = deliveryStats.totalEarnings || 0;
  const todayDeliveries = deliveryStats.delivered || 0;
  const onTheWayOrders = deliveryStats.onTheWay || 0;
  const pickedUpOrders = deliveryStats.pickedUp || 0;

  return (
    <div className="dashboard-home">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon active-orders">
            <FaTruck />
          </div>
          <div className="stat-content">
            <div className="stat-number">{activeOrders.length}</div>
            <div className="stat-label">Active Orders</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon earnings">
            <FaStar />
          </div>
          <div className="stat-content">
            <div className="stat-number">${todayEarnings.toFixed(2)}</div>
            <div className="stat-label">Total Earnings</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon deliveries">
            <FaCheckCircle />
          </div>
          <div className="stat-content">
            <div className="stat-number">{todayDeliveries}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon on-the-way">
            <FaRoute />
          </div>
          <div className="stat-content">
            <div className="stat-number">{onTheWayOrders}</div>
            <div className="stat-label">On The Way</div>
          </div>
        </div>
      </div>

      {/* Active Orders */}
      <div className="content-section">
        <div className="section-header">
          <h2>Active Orders</h2>
          <button className="view-all-btn">View All</button>
        </div>
        <div className="orders-list">
          {activeOrders.slice(0, 2).map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h4>{order.customerName}</h4>
                  <span className="order-restaurant">{order.restaurantName}</span>
                </div>
                <div className={`order-status ${order.status}`}>
                  {order.status}
                </div>
              </div>
              <div className="order-details">
                <div className="order-location">
                  <FaMapMarkerAlt />
                  <span>{order.distance}</span>
                </div>
                <div className="order-time">
                  <FaClock />
                  <span>{order.estimatedTime}</span>
                </div>
                <div className="order-total">${order.total}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Deliveries */}
      <div className="content-section">
        <div className="section-header">
          <h2>Recent Deliveries</h2>
          <button className="view-all-btn">View All</button>
        </div>
        <div className="deliveries-list">
          {deliveryHistory.slice(0, 3).map((delivery) => (
            <div key={delivery.id} className="delivery-card">
              <div className="delivery-header">
                <div className="delivery-info">
                  <h4>{delivery.customerName}</h4>
                  <span className="delivery-restaurant">{delivery.restaurantName}</span>
                </div>
                <div className="delivery-rating">
                  {[...Array(5)].map((_, i) => (
                    <FaStar 
                      key={i} 
                      className={i < delivery.rating ? 'star-filled' : 'star-empty'} 
                    />
                  ))}
                </div>
              </div>
              <div className="delivery-details">
                <div className="delivery-time">{delivery.deliveryTime}</div>
                <div className="delivery-tip">Tip: ${delivery.tip.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Active Orders Component
const ActiveOrders = ({ orders, onSelectOrder, onUpdateStatus, loading }) => {
  const activeOrders = orders.filter(order => order.status !== 'delivered');

  return (
    <div className="active-orders">
      <div className="orders-header">
        <h2>Active Orders</h2>
        <div className="order-filters">
          <button className="filter-btn active">All</button>
          <button className="filter-btn">Pickup</button>
          <button className="filter-btn">Delivery</button>
        </div>
      </div>

      <div className="orders-list">
        {activeOrders.map((order) => (
          <div key={order.id} className="order-card detailed">
            <div className="order-header">
              <div className="order-info">
                <h4>{order.customerName}</h4>
                <span className="order-restaurant">{order.restaurantName}</span>
              </div>
              <div className={`order-status ${order.status}`}>
                {order.status}
              </div>
            </div>
            
            <div className="order-details">
              <div className="order-items">
                {order.items.map((item, index) => (
                  <span key={index} className="order-item">{item}</span>
                ))}
              </div>
              <div className="order-total">${order.total}</div>
            </div>

            <div className="order-location-info">
              <div className="location-item">
                <FaMapMarkerAlt />
                <div className="location-details">
                  <span className="location-label">Pickup:</span>
                  <span className="location-address">{order.restaurantAddress}</span>
                </div>
              </div>
              <div className="location-item">
                <FaLocationArrow />
                <div className="location-details">
                  <span className="location-label">Delivery:</span>
                  <span className="location-address">{order.customerAddress}</span>
                </div>
              </div>
            </div>

            <div className="order-meta">
              <div className="meta-item">
                <FaClock />
                <span>ETA: {order.estimatedTime}</span>
              </div>
              <div className="meta-item">
                <FaMap />
                <span>{order.distance}</span>
              </div>
              <div className="meta-item">
                <FaPhone />
                <span>{order.phone}</span>
              </div>
            </div>

            {order.specialInstructions && (
              <div className="special-instructions">
                <FaExclamationTriangle />
                <span>{order.specialInstructions}</span>
              </div>
            )}

            <div className="order-actions">
              {order.status === 'picked_up' && (
                <button 
                  className="action-btn delivery"
                  onClick={() => onUpdateStatus(order.id, 'on_the_way')}
                  disabled={loading}
                >
                  <FaPlay />
                  Start Delivery
                </button>
              )}
              {order.status === 'on_the_way' && (
                <button 
                  className="action-btn complete"
                  onClick={() => onUpdateStatus(order.id, 'delivered')}
                  disabled={loading}
                >
                  <FaCheck />
                  Mark Delivered
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Available Orders Component
const AvailableOrders = ({ orders, onAcceptOrder, loading }) => {
  return (
    <div className="available-orders">
      <div className="orders-header">
        <h2>Available Orders</h2>
        <div className="order-filters">
          <button className="filter-btn active">All</button>
          <button className="filter-btn">Nearby</button>
          <button className="filter-btn">High Value</button>
        </div>
      </div>

      <div className="orders-list">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading available orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <FaMap />
            <h3>No Available Orders</h3>
            <p>Check back later for new delivery opportunities</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="order-card available">
              <div className="order-header">
                <div className="order-info">
                  <h4>{order.customerName}</h4>
                  <span className="order-restaurant">{order.foodPartner?.businessName}</span>
                </div>
                <div className="order-value">${order.total}</div>
              </div>
              
              <div className="order-details">
                <div className="order-items">
                  {order.items.map((item, index) => (
                    <span key={index} className="order-item">{item.name}</span>
                  ))}
                </div>
              </div>

              <div className="order-location-info">
                <div className="location-item">
                  <FaMapMarkerAlt />
                  <div className="location-details">
                    <span className="location-label">Pickup:</span>
                    <span className="location-address">{order.foodPartner?.businessAddress}</span>
                  </div>
                </div>
                <div className="location-item">
                  <FaLocationArrow />
                  <div className="location-details">
                    <span className="location-label">Delivery:</span>
                    <span className="location-address">{order.customerAddress}</span>
                  </div>
                </div>
              </div>

              <div className="order-meta">
                <div className="meta-item">
                  <FaClock />
                  <span>Ordered: {new Date(order.orderTime).toLocaleTimeString()}</span>
                </div>
                <div className="meta-item">
                  <FaPhone />
                  <span>{order.customerPhone}</span>
                </div>
              </div>

              {order.orderNotes && (
                <div className="special-instructions">
                  <FaExclamationTriangle />
                  <span>{order.orderNotes}</span>
                </div>
              )}

              <div className="order-actions">
                <button 
                  className="action-btn accept"
                  onClick={() => onAcceptOrder(order.id)}
                  disabled={loading}
                >
                  <FaCheck />
                  Accept Order
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Delivery History Component
const DeliveryHistory = ({ history }) => (
  <div className="delivery-history">
    <div className="history-header">
      <h2>Delivery History</h2>
      <div className="history-filters">
        <button className="filter-btn active">Today</button>
        <button className="filter-btn">This Week</button>
        <button className="filter-btn">This Month</button>
      </div>
    </div>

    <div className="deliveries-list">
      {history.map((delivery) => (
        <div key={delivery.id} className="delivery-card detailed">
          <div className="delivery-header">
            <div className="delivery-info">
              <h4>{delivery.customerName}</h4>
              <span className="delivery-restaurant">{delivery.restaurantName}</span>
            </div>
            <div className="delivery-rating">
              {[...Array(5)].map((_, i) => (
                <FaStar 
                  key={i} 
                  className={i < delivery.rating ? 'star-filled' : 'star-empty'} 
                />
              ))}
            </div>
          </div>
          
          <div className="delivery-details">
            <div className="delivery-time">
              <FaClock />
              <span>{delivery.deliveryTime}</span>
            </div>
            <div className="delivery-total">${delivery.total}</div>
          </div>

          <div className="delivery-earnings">
            <div className="earnings-item">
              <span className="earnings-label">Base Pay:</span>
              <span className="earnings-amount">$5.00</span>
            </div>
            <div className="earnings-item">
              <span className="earnings-label">Tip:</span>
              <span className="earnings-amount">${delivery.tip.toFixed(2)}</span>
            </div>
            <div className="earnings-item total">
              <span className="earnings-label">Total:</span>
              <span className="earnings-amount">${(5.00 + delivery.tip).toFixed(2)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Order Detail Modal
const OrderDetailModal = ({ order, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3>Order Details</h3>
        <button className="close-btn" onClick={onClose}>
          <FaX />
        </button>
      </div>
      
      <div className="modal-body">
        <div className="order-info-section">
          <h4>Customer Information</h4>
          <div className="info-item">
            <FaUser />
            <span>{order.customerName}</span>
          </div>
          <div className="info-item">
            <FaPhone />
            <span>{order.phone}</span>
          </div>
        </div>

        <div className="order-info-section">
          <h4>Order Details</h4>
          <div className="order-items">
            {order.items.map((item, index) => (
              <div key={index} className="order-item">{item}</div>
            ))}
          </div>
          <div className="order-total">Total: ${order.total}</div>
        </div>

        <div className="order-info-section">
          <h4>Locations</h4>
          <div className="location-item">
            <FaMapMarkerAlt />
            <div className="location-details">
              <span className="location-label">Pickup:</span>
              <span className="location-address">{order.restaurantAddress}</span>
            </div>
          </div>
          <div className="location-item">
            <FaLocationArrow />
            <div className="location-details">
              <span className="location-label">Delivery:</span>
              <span className="location-address">{order.customerAddress}</span>
            </div>
          </div>
        </div>

        {order.specialInstructions && (
          <div className="order-info-section">
            <h4>Special Instructions</h4>
            <div className="special-instructions">
              <FaExclamationTriangle />
              <span>{order.specialInstructions}</span>
            </div>
          </div>
        )}
      </div>

      <div className="modal-footer">
        <button className="action-btn pickup">Start Pickup</button>
        <button className="action-btn delivery">Start Delivery</button>
        <button className="action-btn complete">Mark Complete</button>
      </div>
    </div>
  </div>
);

// Earnings View Component
const EarningsView = ({ stats }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

  // Use real stats data
  const currentData = {
    totalEarnings: stats.totalEarnings || 0,
    basePay: (stats.totalEarnings || 0) * 0.7, // Assuming 70% base pay
    tips: (stats.totalEarnings || 0) * 0.3, // Assuming 30% tips
    deliveries: stats.delivered || 0,
    averagePerDelivery: stats.delivered > 0 ? (stats.totalEarnings || 0) / stats.delivered : 0
  };

  return (
    <div className="earnings-view">
      {/* Earnings Summary */}
      <div className="earnings-summary">
        <div className="summary-header">
          <h2>Earnings Summary</h2>
          <div className="period-selector">
            <button 
              className={`period-btn ${selectedPeriod === 'week' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('week')}
            >
              This Week
            </button>
            <button 
              className={`period-btn ${selectedPeriod === 'month' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('month')}
            >
              This Month
            </button>
    </div>
    </div>

        <div className="earnings-cards">
          <div className="earnings-card total">
            <div className="card-icon">💰</div>
            <div className="card-content">
              <div className="card-amount">${currentData.totalEarnings.toFixed(2)}</div>
              <div className="card-label">Total Earnings</div>
            </div>
          </div>

          <div className="earnings-card base">
            <div className="card-icon">💼</div>
            <div className="card-content">
              <div className="card-amount">${currentData.basePay.toFixed(2)}</div>
              <div className="card-label">Base Pay</div>
            </div>
          </div>

          <div className="earnings-card tips">
            <div className="card-icon">⭐</div>
            <div className="card-content">
              <div className="card-amount">${currentData.tips.toFixed(2)}</div>
              <div className="card-label">Tips</div>
            </div>
          </div>

          <div className="earnings-card deliveries">
            <div className="card-icon">🚚</div>
            <div className="card-content">
              <div className="card-amount">{currentData.deliveries}</div>
              <div className="card-label">Deliveries</div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Breakdown (for week view) */}
      {selectedPeriod === 'week' && (
        <div className="daily-breakdown">
          <h3>Daily Breakdown</h3>
          <div className="breakdown-chart">
            {currentData.breakdown.map((day, index) => (
              <div key={day.day} className="day-bar">
                <div className="bar-container">
                  <div 
                    className="earnings-bar"
                    style={{ 
                      height: `${(day.earnings / Math.max(...currentData.breakdown.map(d => d.earnings))) * 100}%` 
                    }}
                  ></div>
                </div>
                <div className="day-info">
                  <div className="day-name">{day.day}</div>
                  <div className="day-amount">${day.earnings.toFixed(2)}</div>
                  <div className="day-deliveries">{day.deliveries} deliveries</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="payment-history">
        <div className="history-header">
          <h3>Recent Payments</h3>
          <button 
            className="withdraw-btn"
            onClick={() => setShowWithdrawalModal(true)}
          >
            Request Withdrawal
          </button>
        </div>

        <div className="payment-list">
          <div className="payment-item">
            <div className="payment-info">
              <div className="payment-date">Dec 15, 2024</div>
              <div className="payment-method">Bank Transfer</div>
            </div>
            <div className="payment-amount">$245.50</div>
            <div className="payment-status completed">Completed</div>
          </div>
          <div className="payment-item">
            <div className="payment-info">
              <div className="payment-date">Dec 8, 2024</div>
              <div className="payment-method">Bank Transfer</div>
            </div>
            <div className="payment-amount">$198.75</div>
            <div className="payment-status completed">Completed</div>
          </div>
          <div className="payment-item">
            <div className="payment-info">
              <div className="payment-date">Dec 1, 2024</div>
              <div className="payment-method">Bank Transfer</div>
            </div>
            <div className="payment-amount">$312.25</div>
            <div className="payment-status completed">Completed</div>
          </div>
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawalModal && (
        <div className="modal-overlay" onClick={() => setShowWithdrawalModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Request Withdrawal</h3>
              <button className="close-btn" onClick={() => setShowWithdrawalModal(false)}>
                <FaX />
              </button>
            </div>
            <div className="modal-body">
              <div className="withdrawal-info">
                <p>Available Balance: <strong>${currentData.totalEarnings.toFixed(2)}</strong></p>
                <p>Minimum withdrawal: $50.00</p>
              </div>
              <div className="form-group">
                <label>Withdrawal Amount</label>
                <input 
                  type="number" 
                  placeholder="Enter amount"
                  max={currentData.totalEarnings}
                  min="50"
                />
              </div>
              <div className="form-group">
                <label>Bank Account</label>
                <select>
                  <option>****1234 - Chase Bank</option>
                  <option>Add New Account</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-cancel" onClick={() => setShowWithdrawalModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary">
                Request Withdrawal
              </button>
            </div>
          </div>
        </div>
      )}
  </div>
);
};

// Profile View Component
const ProfileView = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: 'John Delivery Driver',
    email: 'john.driver@email.com',
    phone: '+1 (555) 123-4567',
    licenseNumber: 'DL123456789',
    vehicleType: 'Motorcycle',
    vehicleModel: 'Honda CB350',
    vehicleColor: 'Red',
    experience: '2 years',
    rating: 4.8,
    totalDeliveries: 1247,
    joinDate: 'January 2023'
  });

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically save to backend
    console.log('Profile saved:', profileData);
  };

  return (
    <div className="profile-view">
      <div className="profile-header">
        <div className="profile-avatar-large">
          <div className="avatar-circle">JD</div>
          <div className="avatar-status online">Online</div>
    </div>
        <div className="profile-info">
          <h2>{profileData.fullName}</h2>
          <div className="profile-stats">
            <div className="stat">
              <span className="stat-value">{profileData.rating}</span>
              <span className="stat-label">Rating</span>
            </div>
            <div className="stat">
              <span className="stat-value">{profileData.totalDeliveries}</span>
              <span className="stat-label">Deliveries</span>
            </div>
            <div className="stat">
              <span className="stat-value">{profileData.experience}</span>
              <span className="stat-label">Experience</span>
            </div>
          </div>
        </div>
        <button 
          className={`edit-btn ${isEditing ? 'save' : 'edit'}`}
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
        >
          {isEditing ? 'Save Changes' : 'Edit Profile'}
        </button>
      </div>

      <div className="profile-sections">
        {/* Personal Information */}
        <div className="profile-section">
          <h3>Personal Information</h3>
          <div className="profile-fields">
            <div className="field-group">
              <label>Full Name</label>
              <input 
                type="text" 
                value={profileData.fullName}
                onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                disabled={!isEditing}
              />
            </div>
            <div className="field-group">
              <label>Email</label>
              <input 
                type="email" 
                value={profileData.email}
                onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                disabled={!isEditing}
              />
            </div>
            <div className="field-group">
              <label>Phone Number</label>
              <input 
                type="tel" 
                value={profileData.phone}
                onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="profile-section">
          <h3>Vehicle Information</h3>
          <div className="profile-fields">
            <div className="field-group">
              <label>License Number</label>
              <input 
                type="text" 
                value={profileData.licenseNumber}
                onChange={(e) => setProfileData({...profileData, licenseNumber: e.target.value})}
                disabled={!isEditing}
              />
            </div>
            <div className="field-group">
              <label>Vehicle Type</label>
              <select 
                value={profileData.vehicleType}
                onChange={(e) => setProfileData({...profileData, vehicleType: e.target.value})}
                disabled={!isEditing}
              >
                <option value="Motorcycle">Motorcycle</option>
                <option value="Car">Car</option>
                <option value="Bicycle">Bicycle</option>
                <option value="Scooter">Scooter</option>
              </select>
            </div>
            <div className="field-group">
              <label>Vehicle Model</label>
              <input 
                type="text" 
                value={profileData.vehicleModel}
                onChange={(e) => setProfileData({...profileData, vehicleModel: e.target.value})}
                disabled={!isEditing}
              />
            </div>
            <div className="field-group">
              <label>Vehicle Color</label>
              <input 
                type="text" 
                value={profileData.vehicleColor}
                onChange={(e) => setProfileData({...profileData, vehicleColor: e.target.value})}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="profile-section">
          <h3>Account Information</h3>
          <div className="account-info">
            <div className="info-item">
              <span className="info-label">Member Since:</span>
              <span className="info-value">{profileData.joinDate}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Total Deliveries:</span>
              <span className="info-value">{profileData.totalDeliveries}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Average Rating:</span>
              <span className="info-value">
                {profileData.rating} ⭐
              </span>
            </div>
          </div>
        </div>
    </div>
  </div>
);
};

// Settings View Component
const SettingsView = () => {
  const [settings, setSettings] = useState({
    notifications: {
      newOrders: true,
      orderUpdates: true,
      earnings: true,
      promotions: false
    },
    delivery: {
      maxDistance: 10,
      preferredAreas: ['Downtown', 'Midtown', 'Uptown'],
      workingHours: {
        start: '09:00',
        end: '21:00'
      },
      autoAccept: false
    },
    privacy: {
      shareLocation: true,
      showRating: true,
      allowContact: true
    }
  });

  const handleNotificationChange = (key, value) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: value
      }
    });
  };

  const handleDeliveryChange = (key, value) => {
    setSettings({
      ...settings,
      delivery: {
        ...settings.delivery,
        [key]: value
      }
    });
  };

  const handlePrivacyChange = (key, value) => {
    setSettings({
      ...settings,
      privacy: {
        ...settings.privacy,
        [key]: value
      }
    });
  };

  return (
    <div className="settings-view">
      {/* Notification Settings */}
      <div className="settings-section">
        <h3>Notifications</h3>
        <div className="settings-group">
          <div className="setting-item">
            <div className="setting-info">
              <h4>New Orders</h4>
              <p>Get notified when new orders are available</p>
    </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={settings.notifications.newOrders}
                onChange={(e) => handleNotificationChange('newOrders', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Order Updates</h4>
              <p>Receive updates about order status changes</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={settings.notifications.orderUpdates}
                onChange={(e) => handleNotificationChange('orderUpdates', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Earnings</h4>
              <p>Get notified about payment and earnings updates</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={settings.notifications.earnings}
                onChange={(e) => handleNotificationChange('earnings', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Promotions</h4>
              <p>Receive promotional offers and bonuses</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={settings.notifications.promotions}
                onChange={(e) => handleNotificationChange('promotions', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* Delivery Settings */}
      <div className="settings-section">
        <h3>Delivery Preferences</h3>
        <div className="settings-group">
          <div className="setting-item">
            <div className="setting-info">
              <h4>Maximum Distance</h4>
              <p>Maximum distance you're willing to travel for deliveries</p>
            </div>
            <div className="distance-selector">
              <input 
                type="range" 
                min="1" 
                max="20" 
                value={settings.delivery.maxDistance}
                onChange={(e) => handleDeliveryChange('maxDistance', parseInt(e.target.value))}
              />
              <span className="distance-value">{settings.delivery.maxDistance} km</span>
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Working Hours</h4>
              <p>Set your preferred working hours</p>
            </div>
            <div className="time-selector">
              <input 
                type="time" 
                value={settings.delivery.workingHours.start}
                onChange={(e) => handleDeliveryChange('workingHours', {
                  ...settings.delivery.workingHours,
                  start: e.target.value
                })}
              />
              <span>to</span>
              <input 
                type="time" 
                value={settings.delivery.workingHours.end}
                onChange={(e) => handleDeliveryChange('workingHours', {
                  ...settings.delivery.workingHours,
                  end: e.target.value
                })}
              />
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Auto Accept Orders</h4>
              <p>Automatically accept orders within your preferences</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={settings.delivery.autoAccept}
                onChange={(e) => handleDeliveryChange('autoAccept', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="settings-section">
        <h3>Privacy & Security</h3>
        <div className="settings-group">
          <div className="setting-item">
            <div className="setting-info">
              <h4>Share Location</h4>
              <p>Allow the app to track your location for better order matching</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={settings.privacy.shareLocation}
                onChange={(e) => handlePrivacyChange('shareLocation', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Show Rating</h4>
              <p>Display your rating to customers</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={settings.privacy.showRating}
                onChange={(e) => handlePrivacyChange('showRating', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Allow Customer Contact</h4>
              <p>Allow customers to contact you directly</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={settings.privacy.allowContact}
                onChange={(e) => handlePrivacyChange('allowContact', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="settings-section">
        <h3>Account Actions</h3>
        <div className="account-actions">
          <button className="action-btn danger">
            <FaSignOutAlt />
            Deactivate Account
          </button>
          <button className="action-btn danger">
            Delete Account
          </button>
        </div>
    </div>
  </div>
);
};

export default DeliveryDashboard;
