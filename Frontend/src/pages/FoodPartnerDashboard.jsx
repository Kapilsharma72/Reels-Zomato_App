import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaHome, 
  FaVideo, 
  FaShoppingCart, 
  FaUser, 
  FaChartLine, 
  FaBell, 
  FaCog,
  FaBars,
  FaTimes,
  FaUpload,
  FaEdit,
  FaEye,
  FaStar,
  FaClock,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaPlus,
  FaTrash,
  FaPlay,
  FaPause,
  FaDownload,
  FaImage,
  FaCircle,
  FaSignOutAlt,
  FaLock,
  FaHistory,
  FaUtensils
} from 'react-icons/fa';
import '../styles/FoodPartnerDashboard.css';
import ReelsUpload from '../components/ReelsUpload';
import PostUpload from '../components/PostUpload';
import StoriesUpload from '../components/StoriesUpload';
import ContentManager from '../components/ContentManager';
import VideoSubmission from '../components/VideoSubmission';
import VideoEditingHistory from '../components/VideoEditingHistory';
import EditedVideos from '../components/EditedVideos';
import ProfileManagement from '../components/ProfileManagement';
import { FoodPartnerProvider, useFoodPartner } from '../contexts/FoodPartnerContext';
import authService from '../services/authService';
import orderService from '../services/orderService';
import NotificationCenter from '../components/NotificationCenter';
import { useWebSocket } from '../hooks/useWebSocket';

// Dashboard Content Component (uses context)
const DashboardContent = () => {
  const navigate = useNavigate();
  const { foodPartnerData, loading } = useFoodPartner();
  const [activeTab, setActiveTab] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Order Management State
  const [orders, setOrders] = useState([]);
  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    preparing: 0,
    completed: 0
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // WebSocket connection
  const { socket, isConnected } = useWebSocket();

  // Edited Videos WebSocket state
  const [editedVideosBadge, setEditedVideosBadge] = useState(0);
  const [editedVideosRefreshTrigger, setEditedVideosRefreshTrigger] = useState(0);
  const [toastNotification, setToastNotification] = useState(null);

  // Order Management Functions
  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      setOrdersError(null);
      const response = await orderService.getFoodPartnerOrders();
      
      if (response && response.orders) {
        setOrders(response.orders);
        updateOrderStats(response.orders);
      } else {
        setOrders([]);
        updateOrderStats([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      
      // Check if it's an authentication error
      if (error.message.includes('401') || error.message.includes('Please login') || error.message.includes('Food partner not found')) {
        setOrdersError('Authentication required. Please login as a food partner to view orders.');
        setOrders([]);
        updateOrderStats([]);
        return;
      }
      
      // For other errors, set empty orders and show error
      setOrdersError('Failed to load orders. Please try again.');
      setOrders([]);
      updateOrderStats([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const updateOrderStats = (ordersList) => {
    const stats = {
      total: ordersList.length,
      pending: ordersList.filter(order => order.status === 'pending').length,
      preparing: ordersList.filter(order => order.status === 'preparing').length,
      completed: ordersList.filter(order => order.status === 'completed').length
    };
    setOrderStats(stats);
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(prevOrders => prevOrders.map(order => 
      (order.id === orderId || order._id === orderId)
        ? { ...order, status: newStatus }
        : order
    ));
    
    // Update stats
    setOrders(prevOrders => {
      const updatedOrders = prevOrders.map(order => 
        (order.id === orderId || order._id === orderId)
          ? { ...order, status: newStatus }
          : order
      );
      updateOrderStats(updatedOrders);
      return updatedOrders;
    });
  };

  const handleOrderAction = async (orderId, action) => {
    let newStatus;
    switch (action) {
      case 'accept':
        newStatus = 'preparing';
        break;
      case 'reject':
        newStatus = 'rejected';
        break;
      case 'complete':
        newStatus = 'completed';
        break;
      default:
        return;
    }

    try {
      setActionLoading(true);
      
      // Find the order to get the correct ID format
      const order = orders.find(o => o.id === orderId || o._id === orderId);
      const actualOrderId = order?._id || order?.id || orderId;
      
      await orderService.updateOrderStatus(actualOrderId, newStatus);
      
      // Update local state
      updateOrderStatus(orderId, newStatus);
      
      // Refresh orders from database to get latest data
      await fetchOrders();
      
      // Show success notification
      const notification = {
        id: Date.now(),
        type: 'success',
        message: `Order ${action}ed successfully`,
        timestamp: new Date()
      };
      setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep only last 5 notifications
    } catch (error) {
      console.error('Error updating order status:', error);
      setOrdersError(`Failed to ${action} order. Please try again.`);
    } finally {
      setActionLoading(false);
    }
    
    setShowOrderModal(false);
  };

  // WebSocket: video_edit_completed listener
  useEffect(() => {
    if (!socket) return;
    const handleVideoEditCompleted = (data) => {
      if (activeTab === 'edited-videos') {
        setEditedVideosRefreshTrigger(prev => prev + 1);
      } else {
        setEditedVideosBadge(prev => prev + 1);
      }
      setToastNotification({
        id: Date.now(),
        message: data?.projectTitle
          ? `"${data.projectTitle}" has been edited and is ready for review`
          : 'A new edited video is ready for review',
      });
    };
    socket.on('video_edit_completed', handleVideoEditCompleted);
    return () => {
      socket.off('video_edit_completed', handleVideoEditCompleted);
    };
  }, [socket, activeTab]);

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (!toastNotification) return;
    const timer = setTimeout(() => setToastNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [toastNotification?.id]);

  // WebSocket event handlers for real-time order updates
  useEffect(() => {
    if (socket && foodPartnerData?._id) {
      
      // Listen for new orders
      const handleNewOrder = (data) => {
        if (data.data && data.data.foodPartnerId === foodPartnerData._id) {
          // Add new order to the list
          setOrders(prevOrders => [data.data, ...prevOrders]);
          
          // Show notification
          const notification = {
            id: Date.now(),
            type: 'success',
            message: `New order received from ${data.data.customerName}`,
            timestamp: new Date()
          };
          setNotifications(prev => [notification, ...prev.slice(0, 4)]);
          
          // Refresh orders to get updated stats
          fetchOrders();
        }
      };

      // Listen for order updates
      const handleOrderUpdate = (data) => {
        if (data.data && data.data.foodPartnerId === foodPartnerData._id) {
          // Update the order in the list
          setOrders(prevOrders => 
            prevOrders.map(order => 
              (order.id === data.data.id || order._id === data.data.id) 
                ? { ...order, ...data.data } 
                : order
            )
          );
          
          // Refresh orders to get latest data
          fetchOrders();
        }
      };

      // Add listeners
      socket.on('new_order', handleNewOrder);
      socket.on('order_update', handleOrderUpdate);

      return () => {
        socket.off('new_order', handleNewOrder);
        socket.off('order_update', handleOrderUpdate);
      };
    }
  }, [socket, foodPartnerData?._id]);

  // Initialize WebSocket connection when food partner data is available
  useEffect(() => {
    if (foodPartnerData?._id && socket) {
      // WebSocket connection is handled by the useWebSocket hook
    }
  }, [foodPartnerData?._id, socket]);

  // Fetch orders when component mounts
  useEffect(() => {
    fetchOrders();
  }, []);

  // Fetch orders periodically to get new orders
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'orders' || activeTab === 'home') {
        fetchOrders();
      }
    }, 30000); // Fetch every 30 seconds

    return () => clearInterval(interval);
  }, [activeTab]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notification-container')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const navigationItems = [
    { id: 'home', label: 'Dashboard', icon: FaHome },
    { id: 'reels', label: 'Upload Reels', icon: FaVideo },
    { id: 'posts', label: 'Upload Posts', icon: FaImage },
    { id: 'stories', label: 'Upload Stories', icon: FaCircle },
    { id: 'menu', label: 'Menu Management', icon: FaPlus },
    { id: 'video-submission', label: 'Submit for Editing', icon: FaEdit },
    { id: 'editing-history', label: 'Editing History', icon: FaHistory },
    { id: 'edited-videos', label: 'Edited Videos', icon: FaDownload },
    { id: 'content', label: 'My Content', icon: FaEye },
    { id: 'orders', label: 'Orders', icon: FaShoppingCart },
    { id: 'analytics', label: 'Analytics', icon: FaChartLine },
    { id: 'profile', label: 'Profile', icon: FaUser },
    { id: 'settings', label: 'Settings', icon: FaCog },
  ];

  // Real reels data fetched from API
  const [uploadedReels, setUploadedReels] = useState([]);
  const [reelsLoading, setReelsLoading] = useState(false);

  const fetchReels = async () => {
    try {
      setReelsLoading(true);
      const { reelsAPI } = await import('../services/uploadService');
      const response = await reelsAPI.getMyReels();
      if (response && response.reels) {
        setUploadedReels(response.reels.map(r => ({
          id: r._id,
          title: r.dishName || r.title || 'Untitled',
          thumbnail: r.thumbnail || r.video || '',
          status: r.status || 'published',
          views: r.views || 0,
          likes: r.likes?.length || 0,
          uploadDate: r.createdAt,
        })));
      } else {
        setUploadedReels([]);
      }
    } catch (err) {
      console.error('Error fetching reels:', err);
      setUploadedReels([]);
    } finally {
      setReelsLoading(false);
    }
  };

  useEffect(() => { fetchReels(); }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <DashboardHome orders={orders} uploadedReels={uploadedReels} reelsLoading={reelsLoading} />;
      case 'reels':
        return <ReelsUpload />;
      case 'posts':
        return <PostUpload />;
      case 'stories':
        return <StoriesUpload />;
      case 'menu':
        return <MenuManagement />;
      case 'video-submission':
        return <VideoSubmission />;
      case 'editing-history':
        return <VideoEditingHistory />;
      case 'edited-videos':
        return <EditedVideos refreshTrigger={editedVideosRefreshTrigger} />;
      case 'content':
        return <ContentManager />;
      case 'orders':
        return (
          <OrdersManagement 
            orders={orders} 
            orderStats={orderStats}
            onOrderAction={handleOrderAction}
            onOrderSelect={(order) => {
              setSelectedOrder(order);
              setShowOrderModal(true);
            }}
            onRefresh={fetchOrders}
            loading={ordersLoading}
            error={ordersError}
            actionLoading={actionLoading}
          />
        );
      case 'analytics':
        return <AnalyticsView orders={orders} uploadedReels={uploadedReels} />;
      case 'profile':
        return <ProfileManagement />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardHome orders={orders} uploadedReels={uploadedReels} reelsLoading={reelsLoading} />;
    }
  };

  return (
    <div className="dashboard-layout fp-dashboard">
      {/* Sidebar Overlay */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon"><FaHome /></div>
          <div className="logo-text">Reel<span>Zomato</span></div>
        </div>
        <nav className="sidebar-nav">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => {
                  if (item.id === 'edited-videos') setEditedVideosBadge(0);
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
              >
                <span className="nav-icon"><Icon /></span>
                {item.label}
                {item.id === 'edited-videos' && editedVideosBadge > 0 && (
                  <span className="nav-badge">{editedVideosBadge}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">{foodPartnerData?.businessName?.charAt(0)?.toUpperCase() || 'FP'}</div>
            <div className="user-info">
              <div className="user-name">{foodPartnerData?.businessName || 'Food Partner'}</div>
              <div className="user-role">Food Partner</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-left">
            <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              {navigationItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="topbar-right">
            <NotificationCenter
              userType="food_partner"
              userId={foodPartnerData?._id}
            />
            <button
              className="btn btn-ghost"
              style={{ gap: 8, padding: '8px 14px' }}
              onClick={() => setShowLogoutConfirm(true)}
            >
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="page-body" style={{ paddingTop: 24 }}>
          {renderContent()}
        </div>
      </main>


      {/* Order Detail Modal */}
      {showOrderModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Order Details</h2>
              <button className="modal-close" onClick={() => setShowOrderModal(false)}><FaTimes /></button>
            </div>
            <div className="modal-body">
              <div className="order-modal-address">
                <h4>Customer</h4>
                <p><strong>{selectedOrder.customerName}</strong> · {selectedOrder.customerPhone}</p>
                <p>{selectedOrder.customerAddress?.address}, {selectedOrder.customerAddress?.city}</p>
                <p style={{ marginTop: 4, color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  Payment: {selectedOrder.paymentMethod}
                </p>
              </div>

              <div className="order-modal-items">
                {selectedOrder.items?.map((item, i) => (
                  <div key={i} className="order-modal-item">
                    <span className="item-name">{item.name}</span>
                    <span className="item-qty">×{item.quantity}</span>
                    <span className="item-price">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                {[
                  ['Subtotal', `₹${selectedOrder.subtotal}`],
                  ['Delivery Fee', `₹${selectedOrder.deliveryFee}`],
                  ['Tax', `₹${selectedOrder.tax}`],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{l}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--primary)' }}>₹{selectedOrder.total}</span>
                </div>
              </div>

              {selectedOrder.orderNotes && (
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '12px', marginBottom: 16, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  📝 {selectedOrder.orderNotes}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                {selectedOrder.status === 'pending' && (
                  <>
                    <button className="order-action-btn accept" style={{ flex: 1, padding: '10px' }} onClick={() => handleOrderAction(selectedOrder._id || selectedOrder.id, 'accept')} disabled={actionLoading}>
                      {actionLoading ? '...' : '✓ Accept'}
                    </button>
                    <button className="order-action-btn reject" style={{ flex: 1, padding: '10px' }} onClick={() => handleOrderAction(selectedOrder._id || selectedOrder.id, 'reject')} disabled={actionLoading}>
                      {actionLoading ? '...' : '✗ Reject'}
                    </button>
                  </>
                )}
                {selectedOrder.status === 'preparing' && (
                  <button className="order-action-btn complete" style={{ flex: 1, padding: '10px' }} onClick={() => handleOrderAction(selectedOrder._id || selectedOrder.id, 'complete')} disabled={actionLoading}>
                    {actionLoading ? '...' : '✓ Mark Ready'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastNotification && (
        <div className="toast-notification">
          {toastNotification.message}
        </div>
      )}

      {/* Logout Confirmation */}
      {showLogoutConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 360 }}>
            <div className="modal-header">
              <h2>Confirm Logout</h2>
              <button className="modal-close" onClick={() => setShowLogoutConfirm(false)}><FaTimes /></button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 20, color: 'var(--text-secondary)' }}>Are you sure you want to logout?</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={async () => { const authService = (await import('../services/authService')).default; await authService.logout(); window.location.href = '/login'; }}>Logout</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
const DashboardHome = ({ orders, uploadedReels, reelsLoading = false }) => {
  const formatTime = (timeString) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / 60000);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalViews = uploadedReels.reduce((sum, r) => sum + (r.views || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  return (
  <div className="dashboard-home">
    {/* Stats */}
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon"><FaShoppingCart /></div>
        <div className="stat-value">{orders.length}</div>
        <div className="stat-label">Total Orders</div>
        {pendingOrders > 0 && <div className="stat-trend">⚡ {pendingOrders} pending</div>}
      </div>
      <div className="stat-card">
        <div className="stat-icon"><FaChartLine /></div>
        <div className="stat-value">₹{totalRevenue.toFixed(0)}</div>
        <div className="stat-label">Revenue</div>
      </div>
      <div className="stat-card">
        <div className="stat-icon"><FaVideo /></div>
        <div className="stat-value">{uploadedReels.length}</div>
        <div className="stat-label">Reels</div>
      </div>
      <div className="stat-card">
        <div className="stat-icon"><FaEye /></div>
        <div className="stat-value">{totalViews.toLocaleString()}</div>
        <div className="stat-label">Total Views</div>
      </div>
    </div>

    {/* Recent Orders */}
    <div className="content-section">
      <div className="section-header">
        <h2>Recent Orders</h2>
        <button className="view-all-btn">View All</button>
      </div>
      <div className="orders-list">
        {orders.length === 0 ? (
          <div className="empty-orders" style={{padding:'32px 20px'}}>
            <div className="empty-icon">📦</div>
            <h3>No orders yet</h3>
            <p>Orders will appear here when customers place them.</p>
          </div>
        ) : orders.slice(0, 5).map((order) => (
          <div key={order.id || order._id} className="order-card">
            <div className="order-card-header">
              <div>
                <div className="order-card-customer">{order.customerName}</div>
                <div className="order-card-time">{formatTime(order.orderTime || order.createdAt)}</div>
              </div>
              <span className={`badge badge-${order.status === 'pending' ? 'warning' : order.status === 'completed' ? 'success' : order.status === 'rejected' ? 'error' : 'info'}`}>
                {order.status}
              </span>
            </div>
            <div className="order-card-items">
              {order.items?.map(i => `${i.name} ×${i.quantity}`).join(', ')}
            </div>
            <div className="order-card-footer">
              <span className="order-card-total">₹{order.total}</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Recent Reels */}
    <div className="content-section">
      <div className="section-header">
        <h2>Recent Reels</h2>
      </div>
      <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {reelsLoading ? (
          <div style={{ gridColumn: '1/-1', padding: '32px 0', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '0.88rem' }}>Loading reels...</div>
        ) : uploadedReels.length === 0 ? (
          <div style={{ gridColumn: '1/-1', padding: '32px 0', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '0.88rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎬</div>
            <div>No reels uploaded yet.</div>
          </div>
        ) : uploadedReels.slice(0, 4).map((reel) => (
          <div key={reel.id} className="project-card">
            <img src={reel.thumbnail} alt={reel.title} />
            <div className="project-body">
              <div className="project-title">{reel.title}</div>
              <div className="project-meta">
                <span className="project-meta-item"><FaEye /> {reel.views.toLocaleString()}</span>
                <span className="project-meta-item">❤️ {reel.likes}</span>
              </div>
              <span className={`badge badge-${reel.status === 'published' ? 'success' : reel.status === 'editing' ? 'warning' : 'info'}`}>{reel.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
  );
};


// Orders Management Component
const OrdersManagement = ({ orders, orderStats, onOrderAction, onOrderSelect, onRefresh, loading, error, actionLoading }) => {
  const [filter, setFilter] = useState('all');
  
  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ffa726';
      case 'preparing': return '#42a5f5';
      case 'completed': return '#66bb6a';
      case 'rejected': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const formatTime = (timeString) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / 60000);
    
    if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`;
    } else if (diffMinutes < 1440) {
      return `${Math.floor(diffMinutes / 60)} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="orders-management">
      <div className="orders-header">
        <h2>Order Management</h2>
        <button 
          className="refresh-btn"
          onClick={onRefresh}
          title="Refresh Orders"
          disabled={loading}
        >
          {loading ? '⏳ Loading...' : '🔄 Refresh'}
        </button>
        <div className="order-stats">
          <div className="stat-item">
            <span className="stat-number">{orderStats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{orderStats.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{orderStats.preparing}</span>
            <span className="stat-label">Preparing</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{orderStats.completed}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
      </div>

      <div className="order-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({orderStats.total})
        </button>
        <button 
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({orderStats.pending})
        </button>
        <button 
          className={`filter-btn ${filter === 'preparing' ? 'active' : ''}`}
          onClick={() => setFilter('preparing')}
        >
          Preparing ({orderStats.preparing})
        </button>
        <button 
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed ({orderStats.completed})
        </button>
    </div>

    <div className="orders-list">
        {error ? (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>Error Loading Orders</h3>
            <p>{error}</p>
            <button 
              className="btn btn-primary"
              onClick={onRefresh}
              disabled={loading}
            >
              Try Again
            </button>
          </div>
        ) : loading ? (
          <div className="loading-state">
            <div className="loading-icon">⏳</div>
            <h3>Loading Orders...</h3>
            <p>Please wait while we fetch your orders.</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-orders">
            <div className="empty-icon">📦</div>
            <h3>No orders found</h3>
            <p>Orders will appear here when customers place them.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
        <div key={order.id || order._id} className="order-card detailed">
          <div className="order-header">
            <div className="order-info">
              <h4>{order.customerName}</h4>
                  <span className="order-time">{formatTime(order.orderTime)}</span>
            </div>
                <div 
                  className={`order-status ${order.status}`}
                  style={{ color: getStatusColor(order.status) }}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </div>
          </div>
          
          <div className="order-details">
            <div className="order-items">
              {order.items.map((item, index) => (
                    <div key={index} className="order-item">
                      <span className="item-name">{item.name}</span>
                      <span className="item-quantity">x{item.quantity}</span>
                      <span className="item-price">₹{item.price}</span>
                    </div>
              ))}
            </div>
                <div className="order-summary">
                  <div className="summary-line">
                    <span>Subtotal:</span>
                    <span>₹{order.subtotal}</span>
                  </div>
                  <div className="summary-line">
                    <span>Delivery:</span>
                    <span>₹{order.deliveryFee}</span>
                  </div>
                  <div className="summary-line">
                    <span>Tax:</span>
                    <span>₹{order.tax}</span>
                  </div>
                  <div className="summary-total">
                    <span>Total:</span>
                    <span>₹{order.total}</span>
                  </div>
                </div>
          </div>

          <div className="order-contact">
            <div className="contact-item">
              <FaMapMarkerAlt />
                  <span>{order.customerAddress.address}</span>
            </div>
            <div className="contact-item">
              <FaPhone />
                  <span>{order.customerPhone}</span>
                </div>
                {order.orderNotes && (
                  <div className="contact-item">
                    <FaEnvelope />
                    <span>Notes: {order.orderNotes}</span>
            </div>
                )}
          </div>

          <div className="order-actions">
                {order.status === 'pending' && (
                  <>
                    <button 
                      className="action-btn accept"
                      onClick={() => onOrderAction(order.id || order._id, 'accept')}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Processing...' : 'Accept Order'}
                    </button>
                    <button 
                      className="action-btn reject"
                      onClick={() => onOrderAction(order.id || order._id, 'reject')}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Processing...' : 'Reject'}
                    </button>
                  </>
                )}
                {order.status === 'preparing' && (
                  <button 
                    className="action-btn complete"
                    onClick={() => onOrderAction(order.id || order._id, 'complete')}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Processing...' : 'Mark as Ready'}
                  </button>
                )}
                <button 
                  className="action-btn view"
                  onClick={() => onOrderSelect(order)}
                  disabled={actionLoading}
                >
                  View Details
                </button>
          </div>
        </div>
          ))
        )}
      </div>
  </div>
);
};


// Analytics View Component
const AnalyticsView = ({ orders, uploadedReels }) => {
  // Calculate basic analytics from orders and reels data
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  const completedOrders = orders.filter(order => order.status === 'completed').length;
  const completionRate = orders.length > 0 ? (completedOrders / orders.length) * 100 : 0;
  
  // Calculate content metrics
  const totalViews = uploadedReels.reduce((sum, reel) => sum + (reel.views || 0), 0);
  const totalLikes = uploadedReels.reduce((sum, reel) => sum + (reel.likes || 0), 0);
  const publishedReels = uploadedReels.filter(reel => reel.status === 'published').length;

  return (
    <div className="analytics-view">
      <div className="analytics-header">
        <h2>Analytics Dashboard</h2>
        <p>Track your business performance and content metrics</p>
      </div>

      {/* Revenue Analytics */}
      <div className="analytics-section">
        <h3>Revenue Analytics</h3>
        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="analytics-icon">💰</div>
            <div className="analytics-content">
              <div className="analytics-number">₹{totalRevenue.toFixed(2)}</div>
              <div className="analytics-label">Total Revenue</div>
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon">📊</div>
            <div className="analytics-content">
              <div className="analytics-number">₹{averageOrderValue.toFixed(2)}</div>
              <div className="analytics-label">Average Order Value</div>
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon">✅</div>
            <div className="analytics-content">
              <div className="analytics-number">{completionRate.toFixed(1)}%</div>
              <div className="analytics-label">Order Completion Rate</div>
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon">📦</div>
            <div className="analytics-content">
              <div className="analytics-number">{completedOrders}</div>
              <div className="analytics-label">Completed Orders</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Analytics */}
      <div className="analytics-section">
        <h3>Content Analytics</h3>
        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="analytics-icon">👁️</div>
            <div className="analytics-content">
              <div className="analytics-number">{totalViews.toLocaleString()}</div>
              <div className="analytics-label">Total Views</div>
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon">❤️</div>
            <div className="analytics-content">
              <div className="analytics-number">{totalLikes.toLocaleString()}</div>
              <div className="analytics-label">Total Likes</div>
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon">📹</div>
            <div className="analytics-content">
              <div className="analytics-number">{publishedReels}</div>
              <div className="analytics-label">Published Reels</div>
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon">📈</div>
            <div className="analytics-content">
              <div className="analytics-number">
                {totalViews > 0 ? (totalLikes / totalViews * 100).toFixed(1) : 0}%
              </div>
              <div className="analytics-label">Engagement Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Performance */}
      <div className="analytics-section">
        <h3>Recent Performance</h3>
        <div className="performance-chart">
          <div className="chart-placeholder">
            <div className="chart-icon">📊</div>
            <h4>Performance Chart</h4>
            <p>Detailed performance charts and trends will be available soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
};


const SettingsView = () => {
  const { foodPartnerData } = useFoodPartner();
  const navigate = useNavigate();
  const [activeSettingsTab, setActiveSettingsTab] = useState('account');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [settings, setSettings] = useState({
    // Account Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    
    // Business Settings
    operatingHours: {
      monday: { open: '09:00', close: '22:00', isOpen: true },
      tuesday: { open: '09:00', close: '22:00', isOpen: true },
      wednesday: { open: '09:00', close: '22:00', isOpen: true },
      thursday: { open: '09:00', close: '22:00', isOpen: true },
      friday: { open: '09:00', close: '22:00', isOpen: true },
      saturday: { open: '09:00', close: '22:00', isOpen: true },
      sunday: { open: '09:00', close: '22:00', isOpen: true }
    },
    deliveryRadius: 5, // km
    minimumOrderAmount: 100,
    estimatedPrepTime: 30, // minutes
    autoAcceptOrders: false,
    
    // Privacy Settings
    showContactInfo: true,
    showBusinessAddress: true,
    allowDirectMessages: true,
    
    // Security Settings
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: 24 // hours
  });

  const settingsTabs = [
    { id: 'account', label: 'Account', icon: FaUser },
    { id: 'business', label: 'Business', icon: FaCog },
    { id: 'notifications', label: 'Notifications', icon: FaBell },
    { id: 'privacy', label: 'Privacy', icon: FaEye },
    { id: 'security', label: 'Security', icon: FaLock },
    { id: 'data', label: 'Data & Export', icon: FaDownload }
  ];

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleSaveSettings = async () => {
    try {
      // Here you would typically save settings to backend
      // Show success message
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    }
  };

  const handleChangePassword = async () => {
    try {
      setPasswordError('');
      setPasswordLoading(true);

      // Validate passwords
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        setPasswordError('All fields are required');
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordError('New passwords do not match');
        return;
      }

      if (passwordData.newPassword.length < 6) {
        setPasswordError('New password must be at least 6 characters long');
        return;
      }

      // Here you would call the API to change password
      // await authService.changePassword(passwordData);
      
      // For now, just simulate success
      alert('Password changed successfully!');
      
      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowChangePassword(false);
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError('Failed to change password. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logoutFoodPartner();
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

  const renderAccountSettings = () => (
    <div className="settings-section">
      <h3>Account Information</h3>
      <div className="settings-grid">
        <div className="setting-item">
          <label>Business Name</label>
          <input 
            type="text" 
            value={foodPartnerData.businessName || ''} 
            disabled 
            className="disabled-input"
          />
    </div>
        <div className="setting-item">
          <label>Contact Name</label>
          <input 
            type="text" 
            value={foodPartnerData.name || ''} 
            disabled 
            className="disabled-input"
          />
        </div>
        <div className="setting-item">
          <label>Email Address</label>
          <input 
            type="email" 
            value={foodPartnerData.email || ''} 
            disabled 
            className="disabled-input"
          />
        </div>
        <div className="setting-item">
          <label>Phone Number</label>
          <input 
            type="tel" 
            value={foodPartnerData.phoneNumber || ''} 
            disabled 
            className="disabled-input"
          />
        </div>
      </div>
      
      <div className="settings-actions">
        <button 
          className="btn btn-primary"
          onClick={() => setShowChangePassword(true)}
        >
          Change Password
        </button>
        <button 
          className="btn btn-secondary"
          onClick={() => {/* Navigate to profile management */}}
        >
          Edit Profile
        </button>
        <button 
          className="btn btn-danger"
          onClick={() => setShowLogoutConfirm(true)}
        >
          <FaSignOutAlt />
          Logout
        </button>
      </div>
    </div>
  );

  const renderBusinessSettings = () => (
    <div className="settings-section">
      <h3>Business Operations</h3>
      
      <div className="setting-group">
        <h4>Operating Hours</h4>
        <div className="operating-hours">
          {Object.entries(settings.operatingHours).map(([day, hours]) => (
            <div key={day} className="day-schedule">
              <div className="day-info">
                <input 
                  type="checkbox" 
                  checked={hours.isOpen}
                  onChange={(e) => handleSettingChange('operatingHours', day, {
                    ...hours,
                    isOpen: e.target.checked
                  })}
                />
                <label>{day.charAt(0).toUpperCase() + day.slice(1)}</label>
              </div>
              {hours.isOpen && (
                <div className="time-inputs">
                  <input 
                    type="time" 
                    value={hours.open}
                    onChange={(e) => handleSettingChange('operatingHours', day, {
                      ...hours,
                      open: e.target.value
                    })}
                  />
                  <span>to</span>
                  <input 
                    type="time" 
                    value={hours.close}
                    onChange={(e) => handleSettingChange('operatingHours', day, {
                      ...hours,
                      close: e.target.value
                    })}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="setting-group">
        <h4>Delivery Settings</h4>
        <div className="settings-grid">
          <div className="setting-item">
            <label>Delivery Radius (km)</label>
            <input 
              type="number" 
              value={settings.deliveryRadius}
              onChange={(e) => handleSettingChange('business', 'deliveryRadius', parseInt(e.target.value))}
              min="1"
              max="20"
            />
          </div>
          <div className="setting-item">
            <label>Minimum Order Amount (₹)</label>
            <input 
              type="number" 
              value={settings.minimumOrderAmount}
              onChange={(e) => handleSettingChange('business', 'minimumOrderAmount', parseInt(e.target.value))}
              min="0"
            />
          </div>
          <div className="setting-item">
            <label>Estimated Prep Time (minutes)</label>
            <input 
              type="number" 
              value={settings.estimatedPrepTime}
              onChange={(e) => handleSettingChange('business', 'estimatedPrepTime', parseInt(e.target.value))}
              min="5"
              max="120"
            />
          </div>
        </div>
      </div>

      <div className="setting-group">
        <h4>Order Management</h4>
        <div className="toggle-setting">
          <label>
            <input 
              type="checkbox" 
              checked={settings.autoAcceptOrders}
              onChange={(e) => handleSettingChange('business', 'autoAcceptOrders', e.target.checked)}
            />
            Auto-accept orders
          </label>
          <p className="setting-description">
            Automatically accept incoming orders without manual approval
          </p>
        </div>
    </div>
  </div>
);

  const renderNotificationSettings = () => (
    <div className="settings-section">
      <h3>Notification Preferences</h3>
      
      <div className="setting-group">
        <h4>Order Notifications</h4>
        <div className="toggle-setting">
          <label>
            <input 
              type="checkbox" 
              checked={settings.emailNotifications}
              onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
            />
            Email notifications
          </label>
          <p className="setting-description">
            Receive order updates and important notifications via email
          </p>
        </div>
        
        <div className="toggle-setting">
          <label>
            <input 
              type="checkbox" 
              checked={settings.smsNotifications}
              onChange={(e) => handleSettingChange('notifications', 'smsNotifications', e.target.checked)}
            />
            SMS notifications
          </label>
          <p className="setting-description">
            Receive urgent notifications via SMS
          </p>
        </div>
        
        <div className="toggle-setting">
          <label>
            <input 
              type="checkbox" 
              checked={settings.pushNotifications}
              onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
            />
            Push notifications
          </label>
          <p className="setting-description">
            Receive real-time notifications in your browser
          </p>
        </div>
      </div>
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="settings-section">
      <h3>Privacy & Visibility</h3>
      
      <div className="setting-group">
        <h4>Public Information</h4>
        <div className="toggle-setting">
          <label>
            <input 
              type="checkbox" 
              checked={settings.showContactInfo}
              onChange={(e) => handleSettingChange('privacy', 'showContactInfo', e.target.checked)}
            />
            Show contact information
          </label>
          <p className="setting-description">
            Display your phone number and email to customers
          </p>
        </div>
        
        <div className="toggle-setting">
          <label>
            <input 
              type="checkbox" 
              checked={settings.showBusinessAddress}
              onChange={(e) => handleSettingChange('privacy', 'showBusinessAddress', e.target.checked)}
            />
            Show business address
          </label>
          <p className="setting-description">
            Display your business address on your profile
          </p>
        </div>
        
        <div className="toggle-setting">
          <label>
            <input 
              type="checkbox" 
              checked={settings.allowDirectMessages}
              onChange={(e) => handleSettingChange('privacy', 'allowDirectMessages', e.target.checked)}
            />
            Allow direct messages
          </label>
          <p className="setting-description">
            Allow customers to send you direct messages
          </p>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="settings-section">
      <h3>Security Settings</h3>
      
      <div className="setting-group">
        <h4>Authentication</h4>
        <div className="toggle-setting">
          <label>
            <input 
              type="checkbox" 
              checked={settings.twoFactorAuth}
              onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
            />
            Two-factor authentication
          </label>
          <p className="setting-description">
            Add an extra layer of security to your account
          </p>
        </div>
        
        <div className="toggle-setting">
          <label>
            <input 
              type="checkbox" 
              checked={settings.loginAlerts}
              onChange={(e) => handleSettingChange('security', 'loginAlerts', e.target.checked)}
            />
            Login alerts
          </label>
          <p className="setting-description">
            Get notified when someone logs into your account
          </p>
        </div>
        
        <div className="setting-item">
          <label>Session Timeout (hours)</label>
          <select 
            value={settings.sessionTimeout}
            onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
          >
            <option value={1}>1 hour</option>
            <option value={4}>4 hours</option>
            <option value={8}>8 hours</option>
            <option value={24}>24 hours</option>
            <option value={168}>7 days</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderDataSettings = () => (
    <div className="settings-section">
      <h3>Data & Export</h3>
      
      <div className="setting-group">
        <h4>Data Export</h4>
        <p className="setting-description">
          Download your business data including orders, analytics, and content.
        </p>
        <div className="settings-actions">
          <button className="btn btn-secondary">
            <FaDownload />
            Export Orders Data
          </button>
          <button className="btn btn-secondary">
            <FaDownload />
            Export Analytics
          </button>
          <button className="btn btn-secondary">
            <FaDownload />
            Export All Data
          </button>
        </div>
      </div>
      
      <div className="setting-group danger-zone">
        <h4>Danger Zone</h4>
        <p className="setting-description">
          These actions are irreversible. Please proceed with caution.
        </p>
        <div className="settings-actions">
          <button 
            className="btn btn-danger"
            onClick={() => setShowDeleteAccount(true)}
          >
            <FaTrash />
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );

  const renderSettingsContent = () => {
    switch (activeSettingsTab) {
      case 'account':
        return renderAccountSettings();
      case 'business':
        return renderBusinessSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'privacy':
        return renderPrivacySettings();
      case 'security':
        return renderSecuritySettings();
      case 'data':
        return renderDataSettings();
      default:
        return renderAccountSettings();
    }
  };

  return (
    <div className="settings-view">
      <div className="settings-container">
        <div className="settings-sidebar">
          <h2>Settings</h2>
          <nav className="settings-nav">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`settings-nav-item ${activeSettingsTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveSettingsTab(tab.id)}
                >
                  <Icon />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
        
        <div className="settings-content">
          <div className="settings-header">
            <h3>{settingsTabs.find(tab => tab.id === activeSettingsTab)?.label} Settings</h3>
            <button 
              className="btn btn-primary"
              onClick={handleSaveSettings}
            >
              Save Changes
            </button>
          </div>
          
          {renderSettingsContent()}
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Change Password</h3>
              <button 
                className="close-btn"
                onClick={() => setShowChangePassword(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-content">
              {passwordError && (
                <div className="error-message">
                  <p>{passwordError}</p>
                </div>
              )}
              <div className="form-group">
                <label>Current Password</label>
                <input 
                  type="password" 
                  placeholder="Enter current password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input 
                  type="password" 
                  placeholder="Enter new password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input 
                  type="password" 
                  placeholder="Confirm new password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowChangePassword(false);
                  setPasswordError('');
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                }}
                disabled={passwordLoading}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleChangePassword}
                disabled={passwordLoading}
              >
                {passwordLoading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteAccount && (
        <div className="modal-overlay">
          <div className="modal danger-modal">
            <div className="modal-header">
              <h3>Delete Account</h3>
              <button 
                className="close-btn"
                onClick={() => setShowDeleteAccount(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-content">
              <div className="warning-message">
                <FaTrash className="warning-icon" />
                <h4>This action cannot be undone</h4>
                <p>
                  This will permanently delete your account and remove all your data 
                  including orders, content, and business information.
                </p>
              </div>
              <div className="form-group">
                <label>Type "DELETE" to confirm</label>
                <input type="text" placeholder="Type DELETE to confirm" />
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowDeleteAccount(false)}
              >
                Cancel
              </button>
              <button className="btn btn-danger">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Confirm Logout</h3>
              <button 
                className="close-btn"
                onClick={() => setShowLogoutConfirm(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-content">
              <div className="warning-message">
                <FaSignOutAlt className="warning-icon" />
                <h4>Are you sure you want to logout?</h4>
                <p>
                  You will be redirected to the login page and will need to sign in again to access your dashboard.
                </p>
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
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

// Menu Management Component
const MenuManagement = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ dishName: '', description: '', price: '', category: 'main', imageUrl: '' });
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState('');
  const { API_BASE_URL } = { API_BASE_URL: window.location.origin.includes('localhost') ? 'http://localhost:3001' : '' };
  const menuUrl = `${API_BASE_URL || 'http://localhost:3001'}/api/food-partner/menu`;

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000); };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(menuUrl, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) setItems(data.items || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${menuUrl}/${editingId}` : menuUrl;
    const res = await fetch(url, {
      method, credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      flash(editingId ? 'Item updated' : 'Item added');
      setForm({ dishName: '', description: '', price: '', category: 'main', imageUrl: '' });
      setEditingId(null);
      fetchItems();
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    const res = await fetch(`${menuUrl}/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) { flash('Item deleted'); fetchItems(); }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({ dishName: item.dishName, description: item.description, price: item.price, category: item.category || 'main', imageUrl: item.video || '' });
  };

  const s = {
    container: { padding: '24px', color: '#e0e0e0' },
    card: { background: '#16213e', borderRadius: '12px', padding: '20px', marginBottom: '20px', border: '1px solid #0f3460' },
    title: { color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '16px' },
    row: { display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' },
    field: { display: 'flex', flexDirection: 'column', flex: '1', minWidth: '180px' },
    label: { fontSize: '12px', color: '#888', marginBottom: '4px', textTransform: 'uppercase' },
    input: { background: '#0f3460', border: '1px solid #1a4a8a', borderRadius: '8px', padding: '10px 12px', color: '#e0e0e0', fontSize: '14px', outline: 'none' },
    btn: { padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
    itemCard: { background: '#0f3460', borderRadius: '8px', padding: '14px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    msg: { padding: '10px', background: '#1a4731', color: '#68d391', borderRadius: '8px', marginBottom: '12px', border: '1px solid #2f855a' }
  };

  return (
    <div style={s.container}>
      {msg && <div style={s.msg}>{msg}</div>}
      <div style={s.card}>
        <div style={s.title}>{editingId ? 'Edit Menu Item' : 'Add Menu Item'}</div>
        <form onSubmit={handleSubmit}>
          <div style={s.row}>
            <div style={s.field}><label style={s.label}>Dish Name *</label><input style={s.input} value={form.dishName} onChange={e => setForm(p => ({ ...p, dishName: e.target.value }))} required /></div>
            <div style={s.field}><label style={s.label}>Price (₹) *</label><input style={s.input} type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} required /></div>
            <div style={s.field}><label style={s.label}>Category</label>
              <select style={s.input} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {['main', 'starter', 'dessert', 'beverage', 'snack', 'other'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={s.row}>
            <div style={{ ...s.field, minWidth: '100%' }}><label style={s.label}>Description *</label><input style={s.input} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required /></div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" style={{ ...s.btn, background: '#667eea', color: '#fff' }}>{editingId ? 'Update Item' : 'Add Item'}</button>
            {editingId && <button type="button" style={{ ...s.btn, background: '#2d3748', color: '#e0e0e0' }} onClick={() => { setEditingId(null); setForm({ dishName: '', description: '', price: '', category: 'main', imageUrl: '' }); }}>Cancel</button>}
          </div>
        </form>
      </div>
      <div style={s.card}>
        <div style={s.title}>Menu Items ({items.length})</div>
        {loading ? <p style={{ color: '#888' }}>Loading...</p> : items.length === 0 ? <p style={{ color: '#888' }}>No menu items yet.</p> : items.map(item => (
          <div key={item._id} style={s.itemCard}>
            <div>
              <div style={{ fontWeight: '600', color: '#fff' }}>{item.dishName}</div>
              <div style={{ fontSize: '13px', color: '#aaa' }}>{item.description}</div>
              <div style={{ fontSize: '13px', color: '#667eea', marginTop: '4px' }}>₹{item.price} · {item.category}</div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ ...s.btn, background: '#2d3748', color: '#e0e0e0', padding: '6px 12px' }} onClick={() => handleEdit(item)}>Edit</button>
              <button style={{ ...s.btn, background: '#e53e3e', color: '#fff', padding: '6px 12px' }} onClick={() => handleDelete(item._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Dashboard Component (provides context)
const FoodPartnerDashboard = () => {
  return (
    <FoodPartnerProvider>
      <DashboardContent />
    </FoodPartnerProvider>
  );
};

export default FoodPartnerDashboard;
