import React, { useState, useEffect, useRef } from 'react';
import { 
  FaVideo, 
  FaPlay, 
  FaDownload, 
  FaClock, 
  FaDollarSign, 
  FaUser, 
  FaCheck, 
  FaTimes,
  FaEdit,
  FaUpload,
  FaComment,
  FaStar,
  FaEye,
  FaSearch
} from 'react-icons/fa';
import videoSubmissionService from '../services/videoSubmissionService';
import '../styles/VideoSubmissionsManager.css';

const VideoSubmissionsManager = ({ userType = 'editor', tabType = 'assigned' }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [uploadModalSubmission, setUploadModalSubmission] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    fetchSubmissions();
  }, [filter, tabType]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      let response;
      
      if (userType === 'editor') {
        const params = filter === 'all' ? {} : { status: filter };
        
        // Use different API calls based on tab type
        if (tabType === 'available') {
          response = await videoSubmissionService.getAvailableSubmissions(params);
        } else {
          response = await videoSubmissionService.getEditorSubmissions(params);
        }
      } else {
        const params = filter === 'all' ? {} : { status: filter };
        response = await videoSubmissionService.getFoodPartnerSubmissions(params);
      }
      
      setSubmissions(response.data.submissions || []);
    } catch (error) {
      setError(error.message || 'Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSubmission = async (submissionId) => {
    try {
      await videoSubmissionService.assignSubmission(submissionId);
      setSuccess('Submission assigned successfully!');
      fetchSubmissions();
    } catch (error) {
      setError(error.message || 'Failed to assign submission');
    }
  };

  const handleStatusUpdate = async (submissionId, newStatus, progress) => {
    try {
      await videoSubmissionService.updateSubmissionStatus(submissionId, newStatus, progress, userType);
      setSuccess('Status updated successfully!');
      fetchSubmissions();
    } catch (error) {
      setError(error.message || 'Failed to update status');
    }
  };

  const handleSubmitForReview = (submission) => {
    setUploadModalSubmission(submission);
    setUploadFile(null);
  };

  const handleUploadEditedVideo = async () => {
    if (!uploadFile) {
      setError('Please select a video file');
      return;
    }
    const formData = new FormData();
    formData.append('editedVideo', uploadFile);
    try {
      setUploading(true);
      await videoSubmissionService.uploadEditedVideo(uploadModalSubmission._id, formData);
      setUploadSuccess(true);
      closeTimerRef.current = setTimeout(() => {
        setUploadModalSubmission(null);
        setUploadSuccess(false);
      }, 2000);
      fetchSubmissions();
    } catch (error) {
      setError(error.message || 'Failed to upload edited video');
    } finally {
      setUploading(false);
    }
  };

  const handleViewDetails = async (submissionId) => {
    try {
      const response = await videoSubmissionService.getSubmissionDetails(submissionId, userType);
      setSelectedSubmission(response.data);
      setShowModal(true);
    } catch (error) {
      setError(error.message || 'Failed to fetch submission details');
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = submission.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.foodPartner?.businessName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      submitted: { color: '#ffc107', label: 'Submitted' },
      assigned: { color: '#17a2b8', label: 'Assigned' },
      in_progress: { color: '#007bff', label: 'In Progress' },
      review: { color: '#6f42c1', label: 'Under Review' },
      completed: { color: '#28a745', label: 'Completed' },
      rejected: { color: '#dc3545', label: 'Rejected' }
    };

    const config = statusConfig[status] || { color: '#6c757d', label: status };
    
    return (
      <span 
        className="status-badge"
        style={{ backgroundColor: config.color }}
      >
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="video-submissions-manager">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="video-submissions-manager">
      <div className="manager-header">
        <h2>
          {userType === 'editor' 
            ? (tabType === 'available' ? 'Available Projects' : 'My Projects')
            : 'My Video Submissions'
          }
        </h2>
        <p>
          {userType === 'editor' 
            ? (tabType === 'available' 
                ? 'Browse and assign available video editing projects'
                : 'Manage video editing projects assigned to you'
              )
            : 'Track your video editing requests and their progress'
          }
        </p>
      </div>

      {/* Filters and Search */}
      <div className="controls-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by project title or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          {userType === 'editor' && tabType === 'available' ? (
            // For available projects, only show submitted status
            <button 
              className={`filter-tab ${filter === 'submitted' ? 'active' : ''}`}
              onClick={() => setFilter('submitted')}
            >
              Available
            </button>
          ) : (
            // For assigned projects, show all statuses except submitted
            <>
              <button 
                className={`filter-tab ${filter === 'assigned' ? 'active' : ''}`}
                onClick={() => setFilter('assigned')}
              >
                Assigned
              </button>
              <button 
                className={`filter-tab ${filter === 'in_progress' ? 'active' : ''}`}
                onClick={() => setFilter('in_progress')}
              >
                In Progress
              </button>
              <button 
                className={`filter-tab ${filter === 'review' ? 'active' : ''}`}
                onClick={() => setFilter('review')}
              >
                Review
              </button>
              <button 
                className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
                onClick={() => setFilter('completed')}
              >
                Completed
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="message error">
          <FaTimes />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="message success">
          <FaCheck />
          <span>{success}</span>
        </div>
      )}

      {/* Submissions Grid */}
      <div className="submissions-grid">
        {filteredSubmissions.length === 0 ? (
          <div className="empty-state">
            <FaVideo className="empty-icon" />
            <h3>No submissions found</h3>
            <p>
              {userType === 'editor' 
                ? (tabType === 'available' 
                    ? 'No video submissions are available for assignment at the moment.'
                    : 'No video projects have been assigned to you yet.'
                  )
                : 'You haven\'t submitted any videos for editing yet.'
              }
            </p>
          </div>
        ) : (
          filteredSubmissions.map((submission) => (
            <div key={submission._id} className="submission-card">
              <div className="card-header">
                <div className="project-info">
                  <h4>{submission.projectTitle}</h4>
                  <p className="client-name">
                    {userType === 'editor' 
                      ? submission.foodPartner?.businessName || 'Unknown Client'
                      : 'Your Project'
                    }
                  </p>
                </div>
                {getStatusBadge(submission.status)}
              </div>

              <div className="card-content">
                <p className="description">{submission.description}</p>
                
                <div className="project-meta">
                  <div className="meta-item">
                    <FaClock />
                    <span>{videoSubmissionService.formatTimeRemaining(submission.deadline)}</span>
                  </div>
                  <div className="meta-item">
                    <FaDollarSign />
                    <span>₹{submission.budget}</span>
                  </div>
                  {submission.progress > 0 && (
                    <div className="meta-item">
                      <FaEdit />
                      <span>{submission.progress}%</span>
                    </div>
                  )}
                </div>

                {submission.progress > 0 && (
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${submission.progress}%` }}
                    ></div>
                  </div>
                )}
              </div>

              <div className="card-actions">
                <button 
                  className="action-btn view"
                  onClick={() => handleViewDetails(submission._id)}
                >
                  <FaEye />
                  View Details
                </button>

                {userType === 'editor' && tabType === 'available' && submission.status === 'submitted' && (
                  <button 
                    className="action-btn assign"
                    onClick={() => handleAssignSubmission(submission._id)}
                  >
                    <FaCheck />
                    Assign to Me
                  </button>
                )}

                {userType === 'editor' && tabType === 'assigned' && submission.status === 'assigned' && (
                  <button 
                    className="action-btn start"
                    onClick={() => handleStatusUpdate(submission._id, 'in_progress', 10)}
                  >
                    <FaEdit />
                    Start Editing
                  </button>
                )}

                {userType === 'editor' && tabType === 'assigned' && submission.status === 'in_progress' && (
                  <button 
                    className="action-btn upload"
                    onClick={() => handleSubmitForReview(submission)}
                  >
                    <FaUpload />
                    Submit for Review
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {uploadModalSubmission && (
        <div className="modal-overlay" onClick={() => {
          clearTimeout(closeTimerRef.current);
          setUploadModalSubmission(null);
          setUploadSuccess(false);
        }}>
          <div className="modal-content upload-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload Edited Video</h3>
              <button className="close-btn" onClick={() => {
                clearTimeout(closeTimerRef.current);
                setUploadModalSubmission(null);
                setUploadSuccess(false);
              }}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              {uploadSuccess ? (
                <div className="upload-success-banner">
                  <FaCheck className="success-icon" />
                  <span>Sent to Food Partner</span>
                </div>
              ) : (
                <>
                  <p className="upload-modal-desc">
                    Upload your edited video for: <strong>{uploadModalSubmission.projectTitle}</strong>
                  </p>
                  <p className="upload-modal-client">
                    Client: {uploadModalSubmission.foodPartner?.businessName || 'Unknown Client'}
                  </p>
                  <div className="upload-file-area">
                    <FaUpload className="upload-icon" />
                    <p>Select your edited video file</p>
                    <p className="upload-hint">Supported: MP4, AVI, MOV, WMV, MKV (max 500MB)</p>
                    <input
                      type="file"
                      accept="video/mp4,video/avi,video/quicktime,video/x-msvideo,video/x-matroska,.mp4,.avi,.mov,.wmv,.mkv"
                      onChange={(e) => setUploadFile(e.target.files[0] || null)}
                      className="file-input"
                    />
                  </div>
                  {uploadFile && (
                    <div className="selected-file">
                      <FaVideo />
                      <span>{uploadFile.name}</span>
                      <span className="file-size">({(uploadFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
                    </div>
                  )}
                </>
              )}
            </div>
            {!uploadSuccess && (
              <div className="modal-footer-actions">
                <button className="action-btn view" onClick={() => {
                  clearTimeout(closeTimerRef.current);
                  setUploadModalSubmission(null);
                  setUploadSuccess(false);
                }}>
                  Cancel
                </button>
                <button
                  className="action-btn assign"
                  onClick={handleUploadEditedVideo}
                  disabled={!uploadFile || uploading}
                >
                  {uploading ? 'Uploading...' : <><FaUpload /> Send to Food Partner</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submission Details Modal */}
      {showModal && selectedSubmission && (
        <SubmissionDetailsModal
          submission={selectedSubmission}
          userType={userType}
          onClose={() => setShowModal(false)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
};

// Submission Details Modal Component
const SubmissionDetailsModal = ({ submission, userType, onClose, onStatusUpdate }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      await videoSubmissionService.addMessage(submission._id, newMessage, userType);
      setNewMessage('');
      // Refresh submission data
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{submission.projectTitle}</h3>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-tabs">
          <button 
            className={`tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Project Details
          </button>
          <button 
            className={`tab ${activeTab === 'instructions' ? 'active' : ''}`}
            onClick={() => setActiveTab('instructions')}
          >
            Instructions
          </button>
          <button 
            className={`tab ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            Messages
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'details' && (
            <div className="details-tab">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Client:</label>
                  <span>{submission.foodPartner?.businessName}</span>
                </div>
                <div className="detail-item">
                  <label>Deadline:</label>
                  <span>{new Date(submission.deadline).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <label>Budget:</label>
                  <span>₹{submission.budget}</span>
                </div>
                <div className="detail-item">
                  <label>Status:</label>
                  <span className="status-text">{submission.status}</span>
                </div>
                <div className="detail-item">
                  <label>Progress:</label>
                  <span>{submission.progress}%</span>
                </div>
              </div>

              <div className="video-info">
                <h4>Original Video</h4>
                <div className="file-info">
                  <FaVideo />
                  <span>{submission.videoFile.originalName}</span>
                  <span className="file-size">
                    {videoSubmissionService.formatFileSize(submission.videoFile.fileSize)}
                  </span>
                </div>
              </div>

              {submission.editedVideo && (
                <div className="video-info">
                  <h4>Edited Video</h4>
                  <div className="file-info">
                    <FaVideo />
                    <span>{submission.editedVideo.originalName}</span>
                    <span className="file-size">
                      {videoSubmissionService.formatFileSize(submission.editedVideo.fileSize)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'instructions' && (
            <div className="instructions-tab">
              <div className="instructions-content">
                <h4>Editing Instructions</h4>
                <p>{submission.instructions}</p>
              </div>

              {submission.requirements && submission.requirements.length > 0 && (
                <div className="requirements-content">
                  <h4>Additional Requirements</h4>
                  <ul>
                    {submission.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="messages-tab">
              <div className="messages-list">
                {submission.messages && submission.messages.length > 0 ? (
                  submission.messages.map((message, index) => (
                    <div key={index} className={`message ${message.sender}`}>
                      <div className="message-header">
                        <span className="sender">
                          {message.sender === 'editor' ? 'Editor' : 'Client'}
                        </span>
                        <span className="timestamp">
                          {new Date(message.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p>{message.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="no-messages">No messages yet</p>
                )}
              </div>

              <div className="message-input">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows="3"
                />
                <button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                  <FaComment />
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoSubmissionsManager;
