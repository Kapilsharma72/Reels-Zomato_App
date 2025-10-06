import React, { useState, useEffect } from 'react';
import { 
  FaHistory, 
  FaClock, 
  FaUser, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaVideo,
  FaEdit,
  FaComment,
  FaStar,
  FaSpinner,
  FaTimes,
  FaEye
} from 'react-icons/fa';
import videoSubmissionService from '../services/videoSubmissionService';
import '../styles/VideoEditingHistory.css';

const VideoEditingHistory = () => {
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await videoSubmissionService.getFoodPartnerSubmissions();
      if (response.success) {
        setSubmissions(response.data.submissions);
      } else {
        setError('Failed to fetch submissions');
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setError('Error loading submissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissionHistory = async (submissionId) => {
    try {
      setHistoryLoading(true);
      const response = await videoSubmissionService.getSubmissionHistory(submissionId);
      if (response.success) {
        setHistory(response.data.history);
      } else {
        setError('Failed to fetch history');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      setError('Error loading history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleViewHistory = async (submission) => {
    setSelectedSubmission(submission);
    setShowHistoryModal(true);
    await fetchSubmissionHistory(submission._id);
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'submitted':
        return <FaVideo className="action-icon submitted" />;
      case 'assigned':
        return <FaUser className="action-icon assigned" />;
      case 'in_progress':
        return <FaSpinner className="action-icon in-progress" />;
      case 'review':
        return <FaEye className="action-icon review" />;
      case 'completed':
        return <FaCheckCircle className="action-icon completed" />;
      case 'rejected':
        return <FaExclamationTriangle className="action-icon rejected" />;
      case 'edited_video_uploaded':
        return <FaEdit className="action-icon uploaded" />;
      case 'message_sent':
        return <FaComment className="action-icon message" />;
      case 'rating_given':
        return <FaStar className="action-icon rating" />;
      default:
        return <FaHistory className="action-icon default" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'submitted':
        return '#ffc107';
      case 'assigned':
        return '#17a2b8';
      case 'in_progress':
        return '#007bff';
      case 'review':
        return '#6f42c1';
      case 'completed':
        return '#28a745';
      case 'rejected':
        return '#dc3545';
      case 'edited_video_uploaded':
        return '#20c997';
      case 'message_sent':
        return '#6c757d';
      case 'rating_given':
        return '#fd7e14';
      default:
        return '#6c757d';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      submitted: { label: 'Submitted', color: '#ffc107' },
      assigned: { label: 'Assigned', color: '#17a2b8' },
      in_progress: { label: 'In Progress', color: '#007bff' },
      review: { label: 'Under Review', color: '#6f42c1' },
      completed: { label: 'Completed', color: '#28a745' },
      rejected: { label: 'Rejected', color: '#dc3545' }
    };

    const config = statusConfig[status] || { label: status, color: '#6c757d' };
    
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
      <div className="video-editing-history">
        <div className="loading-container">
          <FaSpinner className="loading-spinner" />
          <p>Loading video editing history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="video-editing-history">
        <div className="error-container">
          <FaExclamationTriangle className="error-icon" />
          <p>{error}</p>
          <button onClick={fetchSubmissions} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="video-editing-history">
      <div className="history-header">
        <div className="header-content">
          <FaHistory className="header-icon" />
          <div className="header-text">
            <h2>Video Editing History</h2>
            <p>Track the progress and history of your video editing projects</p>
          </div>
        </div>
        <button onClick={fetchSubmissions} className="refresh-btn">
          <FaSpinner className="refresh-icon" />
          Refresh
        </button>
      </div>

      {submissions.length === 0 ? (
        <div className="empty-state">
          <FaHistory className="empty-icon" />
          <h3>No Video Submissions Found</h3>
          <p>You haven't submitted any videos for editing yet.</p>
        </div>
      ) : (
        <div className="submissions-grid">
          {submissions.map((submission) => (
            <div key={submission._id} className="submission-card">
              <div className="card-header">
                <div className="submission-info">
                  <h3 className="project-title">{submission.projectTitle}</h3>
                  <p className="submission-date">
                    Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                  </p>
                </div>
                {getStatusBadge(submission.status)}
              </div>

              <div className="card-content">
                <div className="submission-details">
                  <div className="detail-item">
                    <span className="detail-label">Editor:</span>
                    <span className="detail-value">
                      {submission.editor ? submission.editor.fullName || submission.editor.name : 'Not assigned'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Budget:</span>
                    <span className="detail-value">₹{submission.budget}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Deadline:</span>
                    <span className="detail-value">
                      {new Date(submission.deadline).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Progress:</span>
                    <div className="progress-container">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${submission.progress}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">{submission.progress}%</span>
                    </div>
                  </div>
                </div>

                <div className="card-actions">
                  <button 
                    className="view-history-btn"
                    onClick={() => handleViewHistory(submission)}
                  >
                    <FaHistory />
                    View History
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedSubmission && (
        <div className="history-modal-overlay">
          <div className="history-modal">
            <div className="modal-header">
              <h3>Editing History - {selectedSubmission.projectTitle}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowHistoryModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-content">
              {historyLoading ? (
                <div className="loading-container">
                  <FaSpinner className="loading-spinner" />
                  <p>Loading history...</p>
                </div>
              ) : (
                <div className="history-timeline">
                  {history.length === 0 ? (
                    <div className="empty-history">
                      <FaHistory className="empty-icon" />
                      <p>No history available for this submission.</p>
                    </div>
                  ) : (
                    history.map((entry, index) => (
                      <div key={index} className="history-item">
                        <div className="timeline-marker">
                          {getActionIcon(entry.action)}
                        </div>
                        <div className="history-content">
                          <div className="history-header">
                            <h4 className="history-title">{entry.description}</h4>
                            <span className="history-time">
                              {formatTimestamp(entry.timestamp)}
                            </span>
                          </div>
                          <div className="history-meta">
                            <span className="performed-by">
                              Performed by: {entry.performedBy}
                            </span>
                            {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                              <div className="history-metadata">
                                {Object.entries(entry.metadata).map(([key, value]) => (
                                  <span key={key} className="metadata-item">
                                    {key}: {value}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoEditingHistory;
