import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaHome, 
  FaVideo, 
  FaEdit, 
  FaUser, 
  FaChartLine, 
  FaBell, 
  FaCog,
  FaBars,
  FaTimes,
  FaDownload,
  FaUpload,
  FaPlay,
  FaPause,
  FaEye,
  FaStar,
  FaClock,
  FaCheck,
  FaTimes as FaX,
  FaImage,
  FaMusic,
  FaTextHeight,
  FaPalette,
  FaMagic,
  FaSave,
  FaShare,
  FaSignOutAlt,
  FaPlus,
  FaHeart
} from 'react-icons/fa';
import authService from '../services/authService';
import videoSubmissionService from '../services/videoSubmissionService';
import { useWebSocket } from '../hooks/useWebSocket';
import NotificationCenter from '../components/NotificationCenter';
import VideoSubmissionsManager from '../components/VideoSubmissionsManager';
import '../styles/EditorDashboard.css';

// No mock data — all data comes from real API calls

const EditorDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  
  // Real data state
  const [availableProjects, setAvailableProjects] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [completedProjects, setCompletedProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [editorStats, setEditorStats] = useState({
    totalProjects: 0,
    completedProjects: 0,
    inProgressProjects: 0,
    totalEarnings: 0
  });
  
  // WebSocket connection
  const { socket, isConnected } = useWebSocket();
  
  const [currentEditor, setCurrentEditor] = useState(() => {
    // Get editor info from localStorage or auth context
    try {
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        return JSON.parse(storedUserData);
      }
    } catch (error) {
      console.error('Error parsing stored user data:', error);
    }
    return null;
  });

  // WebSocket event handlers for real-time video submission updates
  useEffect(() => {
    if (socket && currentEditor?._id) {
      // Listen for new video submissions
      const handleNewVideoSubmission = (data) => {
        if (data.data) {
          // Add new submission to available projects
          setAvailableProjects(prevProjects => [data.data, ...prevProjects]);
          
          // Show notification
          const notification = {
            id: Date.now(),
            type: 'info',
            message: `New video submission from ${data.data.foodPartnerName || 'Food Partner'}`,
            timestamp: new Date()
          };
          setNotifications(prev => [notification, ...prev.slice(0, 4)]);
        }
      };

      // Listen for video submission updates
      const handleVideoSubmissionUpdate = (data) => {
        if (data.data) {
          // Update the submission in available projects
          setAvailableProjects(prevProjects => 
            prevProjects.map(project => 
              (project.id === data.data.id || project._id === data.data.id) 
                ? { ...project, ...data.data } 
                : project
            )
          );
          
          // Update my projects if it's assigned to this editor
          if (data.data.assignedEditorId === currentEditor._id) {
            setMyProjects(prevProjects => 
              prevProjects.map(project => 
                (project.id === data.data.id || project._id === data.data.id) 
                  ? { ...project, ...data.data } 
                  : project
              )
            );
          }
          
          // Refresh data to get latest information
          fetchAvailableProjects();
          fetchMyProjects();
        }
      };

      // Add listeners
      socket.on('new_video_submission', handleNewVideoSubmission);
      socket.on('video_submission_update', handleVideoSubmissionUpdate);

      return () => {
        socket.off('new_video_submission', handleNewVideoSubmission);
        socket.off('video_submission_update', handleVideoSubmissionUpdate);
      };
    }
  }, [socket, currentEditor?._id]);

  const navigationItems = [
    { id: 'home', label: 'Dashboard', icon: FaHome },
    { id: 'available', label: 'Available Projects', icon: FaVideo },
    { id: 'projects', label: 'My Projects', icon: FaEdit },
    { id: 'completed', label: 'Completed', icon: FaCheck },
    { id: 'portfolio', label: 'Portfolio', icon: FaEye },
    { id: 'earnings', label: 'Earnings', icon: FaChartLine },
    { id: 'profile', label: 'Profile', icon: FaUser },
    { id: 'settings', label: 'Settings', icon: FaCog },
  ];

  // Fetch data functions
  const fetchAvailableProjects = async () => {
    try {
      setLoading(true);
      const response = await videoSubmissionService.getAvailableProjects();
      if (response.success) {
        setAvailableProjects(response.projects || []);
      }
    } catch (error) {
      console.error('Error fetching available projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyProjects = async () => {
    try {
      const response = await videoSubmissionService.getEditorProjects();
      if (response.success) {
        const projects = response.projects || [];
        setMyProjects(projects.filter(p => p.status !== 'completed'));
        setCompletedProjects(projects.filter(p => p.status === 'completed'));
      }
    } catch (error) {
      console.error('Error fetching my projects:', error);
    }
  };

  const fetchEditorStats = async () => {
    try {
      const response = await videoSubmissionService.getEditorStats();
      if (response.success) {
        setEditorStats(response.stats);
      }
    } catch (error) {
      console.error('Error fetching editor stats:', error);
    }
  };

  // Accept project function
  const handleAcceptProject = async (projectId) => {
    try {
      setLoading(true);
      const response = await videoSubmissionService.acceptProject(projectId);
      if (response.success) {
        await Promise.all([fetchAvailableProjects(), fetchMyProjects()]);
      }
    } catch (error) {
      console.error('Error accepting project:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update project status
  const handleUpdateProjectStatus = async (projectId, status, progress = null) => {
    try {
      setLoading(true);
      const response = await videoSubmissionService.updateSubmissionStatus(projectId, status, progress);
      if (response.success) {
        await fetchMyProjects();
      }
    } catch (error) {
      console.error('Error updating project status:', error);
    } finally {
      setLoading(false);
    }
  };

  // WebSocket event handlers
  useEffect(() => {
    if (socket && currentEditor) {
      // Listen for new video assignments
      socket.on('video_assigned_to_editor', (data) => {
        if (data.editorId === currentEditor._id || data.editorId === currentEditor.id) {
          fetchAvailableProjects();
        }
      });

      // Listen for video edit progress updates
      socket.on('video_edit_progress', (data) => {
        if (data.editorId === currentEditor._id || data.editorId === currentEditor.id) {
          fetchMyProjects();
        }
      });

      // Listen for video edit completion
      socket.on('video_edit_completed', (data) => {
        if (data.editorId === currentEditor._id || data.editorId === currentEditor.id) {
          fetchMyProjects();
          fetchEditorStats();
        }
      });

      // Listen for video downloads
      socket.on('video_downloaded', (data) => {
        if (data.editorId === currentEditor._id || data.editorId === currentEditor.id) {
          fetchMyProjects();
          fetchEditorStats();
        }
      });

      return () => {
        socket.off('video_assigned_to_editor');
        socket.off('video_edit_progress');
        socket.off('video_edit_completed');
        socket.off('video_downloaded');
      };
    }
  }, [socket, currentEditor]);

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        fetchAvailableProjects(),
        fetchMyProjects(),
        fetchEditorStats()
      ]);
    };

    fetchData();

    // Set up periodic refresh
    const interval = setInterval(fetchData, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  // No mock active projects — use real API data only

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

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <DashboardHome 
          activeProjects={myProjects} 
          completedProjects={completedProjects}
          stats={editorStats}
          loading={loading}
        />;
      case 'available':
        return <VideoSubmissionsManager 
          userType="editor" 
          tabType="available"
          onAcceptProject={handleAcceptProject}
          loading={loading}
        />;
      case 'projects':
        return <VideoSubmissionsManager 
          userType="editor" 
          tabType="assigned"
          onUpdateStatus={handleUpdateProjectStatus}
          loading={loading}
        />;
      case 'completed':
        return <CompletedProjects projects={completedProjects} />;
      case 'portfolio':
        return <PortfolioView projects={completedProjects} />;
      case 'earnings':
        return <EarningsView stats={editorStats} />;
      case 'profile':
        return <ProfileView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardHome 
          activeProjects={myProjects} 
          completedProjects={completedProjects}
          stats={editorStats}
          loading={loading}
        />;
    }
  };

  return (
    <div className="dashboard-layout editor-dashboard">
      {/* Sidebar Overlay */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon"><FaEdit /></div>
          <div className="logo-text">Reel<span>Zomato</span></div>
        </div>
        <nav className="sidebar-nav">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              >
                <span className="nav-icon"><Icon /></span>
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">EP</div>
            <div className="user-info">
              <div className="user-name">{currentEditor?.fullName || 'Video Editor'}</div>
              <div className="user-role">Editor</div>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: isConnected ? 'var(--success)' : 'var(--error)' }}>
              <span className={`status-dot ${isConnected ? 'online' : 'offline'}`} />
              {isConnected ? 'Live' : 'Offline'}
            </div>
            <NotificationCenter userType="editor" userId={currentEditor?._id || currentEditor?.id} />
            <button className="btn btn-ghost" style={{ gap: 8, padding: '8px 14px' }} onClick={() => setShowLogoutConfirm(true)}>
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="page-body" style={{ paddingTop: 24 }}>
          {renderContent()}
        </div>
      </main>

      {/* Project Detail Modal */}
      {selectedProject && (
        <ProjectDetailModal project={selectedProject} onClose={() => setSelectedProject(null)} />
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
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleLogout}>Logout</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Dashboard Home Component
const DashboardHome = ({ activeProjects, completedProjects, stats, loading }) => {
  const totalEarnings = stats?.totalEarnings || 0;
  const averageRating = completedProjects.length > 0
    ? completedProjects.reduce((sum, p) => sum + (p.rating || 0), 0) / completedProjects.length
    : 0;
  const activeCount = stats?.inProgressProjects || activeProjects.filter(p => p.status !== 'completed').length;

  return (
    <div className="dashboard-home">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon active-projects">
            <FaVideo />
          </div>
          <div className="stat-content">
            <div className="stat-number">{loading ? '...' : activeCount}</div>
            <div className="stat-label">Active Projects</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon earnings">
            <FaChartLine />
          </div>
          <div className="stat-content">
            <div className="stat-number">{loading ? '...' : `$${totalEarnings.toFixed(2)}`}</div>
            <div className="stat-label">Total Earnings</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon"><FaCheck /></div>
          <div className="stat-content">
            <div className="stat-number">{loading ? '...' : (stats?.completedProjects || completedProjects.length)}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FaStar /></div>
          <div className="stat-content">
            <div className="stat-number">{loading ? '...' : averageRating.toFixed(1)}</div>
            <div className="stat-label">Avg Rating</div>
          </div>
        </div>
      </div>

      {/* Active Projects */}
      <div className="content-section">
        <div className="section-header">
          <h2>Active Projects</h2>
          <button className="view-all-btn">View All</button>
        </div>
        <div className="projects-grid">
          {activeProjects.slice(0, 2).map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-thumbnail">
                <img src={project.thumbnail} alt={project.projectTitle} />
                <div className="project-overlay">
                  <FaPlay className="play-icon" />
                </div>
              </div>
              <div className="project-info">
                <h4>{project.projectTitle}</h4>
                <p className="client-name">{project.clientName}</p>
                <div className="project-meta">
                  <span className="deadline">Due: {project.deadline}</span>
                  <span className="price">${project.price}</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                <div className="project-status">
                  <span className={`status ${project.status}`}>{project.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Completions */}
      <div className="content-section">
        <div className="section-header">
          <h2>Recent Completions</h2>
          <button className="view-all-btn">View All</button>
        </div>
        <div className="completed-list">
          {completedProjects.length === 0 ? (
            <div className="empty-state" style={{padding:'32px 20px'}}>
              <div style={{fontSize:'2rem',marginBottom:8}}>🎬</div>
              <h3>No completed projects yet</h3>
              <p>Completed projects will appear here.</p>
            </div>
          ) : completedProjects.slice(0, 3).map((project) => (
            <div key={project.id} className="completed-card">
              <div className="completed-thumbnail">
                <img src={project.thumbnail} alt={project.projectTitle} />
              </div>
              <div className="completed-info">
                <h4>{project.projectTitle}</h4>
                <p className="client-name">{project.clientName}</p>
                <div className="completed-meta">
                  <span className="completed-date">{project.completedDate}</span>
                  <div className="rating">
                    {[...Array(5)].map((_, i) => (
                      <FaStar 
                        key={i} 
                        className={i < project.rating ? 'star-filled' : 'star-empty'} 
                      />
                    ))}
                  </div>
                </div>
                <div className="earnings">${project.price}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Active Projects Component
const ActiveProjects = ({ projects, onSelectProject }) => {
  const activeProjects = projects.filter(project => project.status !== 'completed');

  return (
    <div className="active-projects">
      <div className="projects-header">
        <h2>Active Projects</h2>
        <div className="project-filters">
          <button className="filter-btn active">All</button>
          <button className="filter-btn">Editing</button>
          <button className="filter-btn">Review</button>
          <button className="filter-btn">Uploaded</button>
        </div>
      </div>

      <div className="projects-grid">
        {activeProjects.map((project) => (
          <div key={project.id} className="project-card detailed">
            <div className="project-thumbnail">
              <img src={project.thumbnail} alt={project.projectTitle} />
              <div className="project-overlay">
                <FaPlay className="play-icon" />
              </div>
            </div>
            
            <div className="project-info">
              <div className="project-header">
                <h4>{project.projectTitle}</h4>
                <div className={`project-status ${project.status}`}>
                  {project.status}
                </div>
              </div>
              
              <p className="client-name">{project.clientName}</p>
              <p className="project-description">{project.description}</p>
              
              <div className="project-details">
                <div className="detail-item">
                  <FaClock />
                  <span>Duration: {project.duration}</span>
                </div>
                <div className="detail-item">
                  <FaDownload />
                  <span>File: {project.rawFootage}</span>
                </div>
                <div className="detail-item">
                  <FaClock />
                  <span>Deadline: {project.deadline}</span>
                </div>
              </div>

              <div className="requirements">
                <h5>Requirements:</h5>
                <ul>
                  {project.requirements.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>

              <div className="progress-section">
                <div className="progress-header">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="project-actions">
                <button className="action-btn edit">Continue Editing</button>
                <button className="action-btn upload">Upload Draft</button>
                <button className="action-btn complete">Mark Complete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Completed Projects Component
const CompletedProjects = ({ projects }) => (
  <div className="completed-projects">
    <div className="projects-header">
      <h2>Completed Projects</h2>
      <div className="project-filters">
        <button className="filter-btn active">All Time</button>
        <button className="filter-btn">This Month</button>
        <button className="filter-btn">This Week</button>
      </div>
    </div>

    <div className="completed-grid">
      {projects.map((project) => (
        <div key={project.id} className="completed-card detailed">
          <div className="completed-thumbnail">
            <img src={project.thumbnail} alt={project.projectTitle} />
            <div className="completed-overlay">
              <FaPlay className="play-icon" />
            </div>
          </div>
          
          <div className="completed-info">
            <div className="completed-header">
              <h4>{project.projectTitle}</h4>
              <div className="rating">
                {[...Array(5)].map((_, i) => (
                  <FaStar 
                    key={i} 
                    className={i < project.rating ? 'star-filled' : 'star-empty'} 
                  />
                ))}
              </div>
            </div>
            
            <p className="client-name">{project.clientName}</p>
            <p className="completed-date">Completed: {project.completedDate}</p>
            
            <div className="earnings-section">
              <div className="earnings-amount">${project.price}</div>
              <div className="earnings-label">Earned</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Project Detail Modal
const ProjectDetailModal = ({ project, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3>Project Details</h3>
        <button className="close-btn" onClick={onClose}>
          <FaX />
        </button>
      </div>
      
      <div className="modal-body">
        <div className="project-detail-section">
          <h4>Project Information</h4>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Title:</span>
              <span className="detail-value">{project.projectTitle}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Client:</span>
              <span className="detail-value">{project.clientName}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Duration:</span>
              <span className="detail-value">{project.duration}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Deadline:</span>
              <span className="detail-value">{project.deadline}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Price:</span>
              <span className="detail-value">${project.price}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status:</span>
              <span className={`detail-value status ${project.status}`}>{project.status}</span>
            </div>
          </div>
        </div>

        <div className="project-detail-section">
          <h4>Description</h4>
          <p className="project-description">{project.description}</p>
        </div>

        <div className="project-detail-section">
          <h4>Requirements</h4>
          <ul className="requirements-list">
            {project.requirements.map((req, index) => (
              <li key={index}>{req}</li>
            ))}
          </ul>
        </div>

        <div className="project-detail-section">
          <h4>Progress</h4>
          <div className="progress-section">
            <div className="progress-header">
              <span>Completion</span>
              <span>{project.progress}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${project.progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-footer">
        <button className="action-btn edit">Continue Editing</button>
        <button className="action-btn upload">Upload Draft</button>
        <button className="action-btn complete">Mark Complete</button>
      </div>
    </div>
  </div>
);

// Portfolio View Component
const PortfolioView = ({ projects = [] }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Use real completed projects as portfolio items
  const portfolioItems = projects.map(p => ({
    id: p._id || p.id,
    title: p.projectTitle || p.title || 'Untitled',
    category: p.category || 'food',
    thumbnail: p.thumbnail || p.editedVideoUrl || '',
    description: p.description || '',
    client: p.clientName || p.foodPartnerName || '',
    duration: p.duration || '',
    views: p.views || 0,
    likes: p.likes || 0,
    completedDate: p.completedDate || p.updatedAt || '',
    tags: p.tags || []
  }));

  const categories = [
    { id: 'all', label: 'All Work', count: portfolioItems.length },
    { id: 'food', label: 'Food Videos', count: portfolioItems.filter(i => i.category === 'food').length },
  ];

  const filteredItems = selectedCategory === 'all'
    ? portfolioItems
    : portfolioItems.filter(i => i.category === selectedCategory);

  return (
    <div className="portfolio-view">
      <div className="portfolio-header">
        <div className="header-content">
          <h2>My Portfolio</h2>
          <p>Showcase your best work and attract new clients</p>
        </div>
        <button 
          className="upload-btn"
          onClick={() => setShowUploadModal(true)}
        >
          <FaUpload />
          Add Work
        </button>
      </div>

      {/* Portfolio Stats */}
      <div className="portfolio-stats">
        <div className="stat-card">
          <div className="stat-icon">🎬</div>
          <div className="stat-content">
            <div className="stat-number">{portfolioItems.length}</div>
            <div className="stat-label">Projects Completed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👀</div>
          <div className="stat-content">
            <div className="stat-number">{portfolioItems.reduce((sum, item) => sum + (item.views || 0), 0)}</div>
            <div className="stat-label">Total Views</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❤️</div>
          <div className="stat-content">
            <div className="stat-number">{portfolioItems.reduce((sum, item) => sum + (item.likes || 0), 0)}</div>
            <div className="stat-label">Total Likes</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-number">—</div>
            <div className="stat-label">Average Rating</div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="category-filter">
        {categories.map(category => (
          <button
            key={category.id}
            className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.label}
            <span className="category-count">({category.count})</span>
          </button>
        ))}
      </div>

      {/* Portfolio Grid */}
      <div className="portfolio-grid">
        {filteredItems.map(item => (
          <div key={item.id} className="portfolio-item">
            <div className="item-thumbnail">
              <div className="thumbnail-placeholder">
                <FaPlay />
              </div>
              <div className="item-overlay">
                <button className="play-btn">
                  <FaPlay />
                </button>
                <div className="item-duration">{item.duration}</div>
              </div>
            </div>
            <div className="item-content">
              <h3 className="item-title">{item.title}</h3>
              <p className="item-description">{item.description}</p>
              <div className="item-meta">
                <div className="meta-item">
                  <FaUser />
                  <span>{item.client}</span>
                </div>
                <div className="meta-item">
                  <FaClock />
                  <span>{item.completedDate}</span>
                </div>
              </div>
              <div className="item-stats">
                <div className="stat">
                  <FaEye />
                  <span>{item.views}</span>
                </div>
                <div className="stat">
                  <FaHeart />
                  <span>{item.likes}</span>
                </div>
              </div>
              <div className="item-tags">
                {item.tags.map((tag, index) => (
                  <span key={index} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add to Portfolio</h3>
              <button className="close-btn" onClick={() => setShowUploadModal(false)}>
                <FaX />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Project Title</label>
                <input type="text" placeholder="Enter project title" />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select>
                  <option value="food">Food Video</option>
                  <option value="tutorial">Tutorial</option>
                  <option value="review">Review</option>
                  <option value="interior">Interior</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea placeholder="Describe your project" rows="3"></textarea>
              </div>
              <div className="form-group">
                <label>Client Name</label>
                <input type="text" placeholder="Enter client name" />
              </div>
              <div className="form-group">
                <label>Video File</label>
                <input type="file" accept="video/*" />
              </div>
              <div className="form-group">
                <label>Thumbnail</label>
                <input type="file" accept="image/*" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-cancel" onClick={() => setShowUploadModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary">
                Add to Portfolio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Earnings View Component
const EarningsView = ({ stats = {} }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

  // Use real stats from API
  const currentData = {
    totalEarnings: stats.totalEarnings || 0,
    completedProjects: stats.completedProjects || 0,
    averagePerProject: stats.completedProjects > 0
      ? (stats.totalEarnings || 0) / stats.completedProjects
      : 0,
    breakdown: stats.breakdown || []
  };

  return (
    <div className="earnings-view">
      <div className="earnings-header">
        <h2>Earnings Overview</h2>
        <div className="period-selector">
          <button 
            className={`period-btn ${selectedPeriod === 'month' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('month')}
          >
            This Month
          </button>
          <button 
            className={`period-btn ${selectedPeriod === 'year' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('year')}
          >
            This Year
          </button>
        </div>
      </div>

      <div className="earnings-summary">
        <div className="summary-card total">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <div className="card-amount">${currentData.totalEarnings.toFixed(2)}</div>
            <div className="card-label">Total Earnings</div>
          </div>
        </div>
        <div className="summary-card projects">
          <div className="card-icon">🎬</div>
          <div className="card-content">
            <div className="card-amount">{currentData.completedProjects}</div>
            <div className="card-label">Completed Projects</div>
          </div>
        </div>
        <div className="summary-card average">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <div className="card-amount">${currentData.averagePerProject.toFixed(2)}</div>
            <div className="card-label">Average per Project</div>
          </div>
        </div>
      </div>

      {selectedPeriod === 'month' && (
        <div className="earnings-breakdown">
          <h3>Project Breakdown</h3>
          <div className="breakdown-list">
            {currentData.breakdown.map((item, index) => (
              <div key={index} className="breakdown-item">
                <div className="item-info">
                  <h4>{item.project}</h4>
                  <span className="item-date">{item.date}</span>
                </div>
                <div className="item-amount">${item.amount.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="payment-section">
        <div className="section-header">
          <h3>Payment History</h3>
          <button 
            className="withdraw-btn"
            onClick={() => setShowWithdrawalModal(true)}
          >
            Request Payment
          </button>
        </div>
        <div className="payment-list">
          {(stats.payments || []).length === 0 ? (
            <div className="empty-state" style={{padding:'32px 0',textAlign:'center',color:'rgba(255,255,255,0.35)',fontSize:'0.88rem'}}>
              <div style={{fontSize:'2rem',marginBottom:8}}>💳</div>
              <div>No payment history yet.</div>
            </div>
          ) : (stats.payments || []).map((p, i) => (
            <div key={i} className="payment-item">
              <div className="payment-info">
                <div className="payment-date">{new Date(p.date).toLocaleDateString()}</div>
                <div className="payment-method">{p.method || 'Bank Transfer'}</div>
              </div>
              <div className="payment-amount">₹{p.amount?.toFixed(2)}</div>
              <div className={`payment-status ${p.status || 'completed'}`}>{p.status || 'Completed'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawalModal && (
        <div className="modal-overlay" onClick={() => setShowWithdrawalModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Request Payment</h3>
              <button className="close-btn" onClick={() => setShowWithdrawalModal(false)}>
                <FaX />
              </button>
            </div>
            <div className="modal-body">
              <div className="withdrawal-info">
                <p>Available Balance: <strong>${currentData.totalEarnings.toFixed(2)}</strong></p>
                <p>Minimum withdrawal: $100.00</p>
              </div>
              <div className="form-group">
                <label>Withdrawal Amount</label>
                <input 
                  type="number" 
                  placeholder="Enter amount"
                  max={currentData.totalEarnings}
                  min="100"
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
                Request Payment
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

  // Load real editor data from localStorage
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('userData') || '{}'); } catch { return {}; }
  })();

  const [profileData, setProfileData] = useState({
    fullName: storedUser.fullName || storedUser.name || '',
    email: storedUser.email || '',
    phone: storedUser.phone || '',
    experience: storedUser.experience || '',
    specialization: storedUser.specialization || '',
    hourlyRate: storedUser.hourlyRate || '',
    portfolio: storedUser.portfolio || '',
    bio: storedUser.bio || '',
    skills: storedUser.skills || [],
    rating: storedUser.rating || 0,
    completedProjects: storedUser.completedProjects || 0,
    joinDate: storedUser.createdAt ? new Date(storedUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : ''
  });

  const handleSave = () => {
    setIsEditing(false);
    // Persist changes back to localStorage
    try {
      const updated = { ...storedUser, ...profileData };
      localStorage.setItem('userData', JSON.stringify(updated));
    } catch (e) { /* ignore */ }
  };

  return (
    <div className="profile-view">
      <div className="profile-header">
        <div className="profile-avatar-large">
          <div className="avatar-circle">AE</div>
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
              <span className="stat-value">{profileData.completedProjects}</span>
              <span className="stat-label">Projects</span>
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
            <div className="field-group">
              <label>Portfolio Website</label>
              <input 
                type="url" 
                value={profileData.portfolio}
                onChange={(e) => setProfileData({...profileData, portfolio: e.target.value})}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div className="profile-section">
          <h3>Professional Information</h3>
          <div className="profile-fields">
            <div className="field-group">
              <label>Experience</label>
              <input 
                type="text" 
                value={profileData.experience}
                onChange={(e) => setProfileData({...profileData, experience: e.target.value})}
                disabled={!isEditing}
              />
            </div>
            <div className="field-group">
              <label>Specialization</label>
              <input 
                type="text" 
                value={profileData.specialization}
                onChange={(e) => setProfileData({...profileData, specialization: e.target.value})}
                disabled={!isEditing}
              />
            </div>
            <div className="field-group">
              <label>Hourly Rate ($)</label>
              <input 
                type="number" 
                value={profileData.hourlyRate}
                onChange={(e) => setProfileData({...profileData, hourlyRate: parseInt(e.target.value)})}
                disabled={!isEditing}
              />
            </div>
          </div>
          <div className="field-group full-width">
            <label>Bio</label>
            <textarea 
              value={profileData.bio}
              onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
              disabled={!isEditing}
              rows="4"
            />
          </div>
        </div>

        {/* Skills */}
        <div className="profile-section">
          <h3>Skills & Expertise</h3>
          <div className="skills-container">
            {profileData.skills.map((skill, index) => (
              <div key={index} className="skill-tag">
                {skill}
                {isEditing && (
                  <button 
                    className="remove-skill"
                    onClick={() => {
                      const newSkills = profileData.skills.filter((_, i) => i !== index);
                      setProfileData({...profileData, skills: newSkills});
                    }}
                  >
                    <FaX />
                  </button>
                )}
              </div>
            ))}
            {isEditing && (
              <button className="add-skill-btn">
                <FaPlus />
                Add Skill
              </button>
            )}
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
              <span className="info-label">Completed Projects:</span>
              <span className="info-value">{profileData.completedProjects}</span>
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
      newProjects: true,
      projectUpdates: true,
      payments: true,
      messages: true,
      promotions: false
    },
    work: {
      autoAccept: false,
      maxProjectsPerMonth: 10,
      preferredCategories: ['food', 'tutorial'],
      workingHours: {
        start: '09:00',
        end: '18:00'
      }
    },
    privacy: {
      showPortfolio: true,
      showRating: true,
      allowDirectContact: true
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

  const handleWorkChange = (key, value) => {
    setSettings({
      ...settings,
      work: {
        ...settings.work,
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
              <h4>New Projects</h4>
              <p>Get notified when new projects are available</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={settings.notifications.newProjects}
                onChange={(e) => handleNotificationChange('newProjects', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Project Updates</h4>
              <p>Receive updates about project status changes</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={settings.notifications.projectUpdates}
                onChange={(e) => handleNotificationChange('projectUpdates', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Payments</h4>
              <p>Get notified about payment updates</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={settings.notifications.payments}
                onChange={(e) => handleNotificationChange('payments', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Messages</h4>
              <p>Receive notifications for new messages</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={settings.notifications.messages}
                onChange={(e) => handleNotificationChange('messages', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* Work Settings */}
      <div className="settings-section">
        <h3>Work Preferences</h3>
        <div className="settings-group">
          <div className="setting-item">
            <div className="setting-info">
              <h4>Auto Accept Projects</h4>
              <p>Automatically accept projects that match your preferences</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={settings.work.autoAccept}
                onChange={(e) => handleWorkChange('autoAccept', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Max Projects per Month</h4>
              <p>Set your maximum workload capacity</p>
            </div>
            <div className="number-input">
              <input 
                type="number" 
                value={settings.work.maxProjectsPerMonth}
                onChange={(e) => handleWorkChange('maxProjectsPerMonth', parseInt(e.target.value))}
                min="1"
                max="50"
              />
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
                value={settings.work.workingHours.start}
                onChange={(e) => handleWorkChange('workingHours', {
                  ...settings.work.workingHours,
                  start: e.target.value
                })}
              />
              <span>to</span>
              <input 
                type="time" 
                value={settings.work.workingHours.end}
                onChange={(e) => handleWorkChange('workingHours', {
                  ...settings.work.workingHours,
                  end: e.target.value
                })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="settings-section">
        <h3>Privacy & Visibility</h3>
        <div className="settings-group">
          <div className="setting-item">
            <div className="setting-info">
              <h4>Show Portfolio</h4>
              <p>Make your portfolio visible to potential clients</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={settings.privacy.showPortfolio}
                onChange={(e) => handlePrivacyChange('showPortfolio', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Show Rating</h4>
              <p>Display your rating to clients</p>
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
              <h4>Allow Direct Contact</h4>
              <p>Allow clients to contact you directly</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={settings.privacy.allowDirectContact}
                onChange={(e) => handlePrivacyChange('allowDirectContact', e.target.checked)}
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

export default EditorDashboard;
