import React, { useState, useEffect } from 'react';
import { 
  FaDownload, 
  FaPlay, 
  FaEye, 
  FaStar, 
  FaClock, 
  FaUser, 
  FaSpinner,
  FaExclamationTriangle,
  FaVideo,
  FaCheckCircle,
  FaTimes,
  FaCheck
} from 'react-icons/fa';
import videoSubmissionService from '../services/videoSubmissionService';
import '../styles/EditedVideos.css';

const EditedVideos = () => {
  const [editedVideos, setEditedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [downloading, setDownloading] = useState({});
  const [rating, setRating] = useState({});
  const [feedback, setFeedback] = useState({});
  const [submittingRating, setSubmittingRating] = useState({});

  useEffect(() => {
    fetchEditedVideos();
  }, []);

  const fetchEditedVideos = async () => {
    try {
      setLoading(true);
      const response = await videoSubmissionService.getEditedVideos();
      if (response.success) {
        setEditedVideos(response.data.submissions);
      } else {
        setError('Failed to fetch edited videos');
      }
    } catch (error) {
      console.error('Error fetching edited videos:', error);
      setError('Error loading edited videos');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (submissionId, filename) => {
    try {
      setDownloading(prev => ({ ...prev, [submissionId]: true }));
      await videoSubmissionService.downloadEditedVideo(submissionId);
    } catch (error) {
      console.error('Error downloading video:', error);
      alert('Failed to download video. Please try again.');
    } finally {
      setDownloading(prev => ({ ...prev, [submissionId]: false }));
    }
  };

  const handleViewVideo = (submission) => {
    setSelectedVideo(submission);
    setShowVideoModal(true);
  };

  const handleRateVideo = async (submissionId) => {
    if (!rating[submissionId] || rating[submissionId] < 1 || rating[submissionId] > 5) {
      alert('Please select a rating between 1 and 5 stars');
      return;
    }

    try {
      setSubmittingRating(prev => ({ ...prev, [submissionId]: true }));
      await videoSubmissionService.rateSubmission(
        submissionId, 
        rating[submissionId], 
        feedback[submissionId] || ''
      );
      
      // Update local state
      setEditedVideos(prev => prev.map(video => 
        video._id === submissionId 
          ? { ...video, rating: rating[submissionId], feedback: feedback[submissionId] }
          : video
      ));

      // Clear form
      setRating(prev => ({ ...prev, [submissionId]: null }));
      setFeedback(prev => ({ ...prev, [submissionId]: '' }));
      
      alert('Rating submitted successfully!');
    } catch (error) {
      console.error('Error rating video:', error);
      alert('Failed to submit rating. Please try again.');
    } finally {
      setSubmittingRating(prev => ({ ...prev, [submissionId]: false }));
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      review: { label: 'Under Review', color: '#6f42c1', icon: FaEye },
      completed: { label: 'Completed', color: '#28a745', icon: FaCheckCircle }
    };

    const config = statusConfig[status] || { label: status, color: '#6c757d', icon: FaVideo };
    const Icon = config.icon;
    
    return (
      <span 
        className="status-badge"
        style={{ backgroundColor: config.color }}
      >
        <Icon className="status-icon" />
        {config.label}
      </span>
    );
  };

  const renderStars = (submissionId, currentRating = null) => {
    const stars = [];
    const ratingValue = currentRating || rating[submissionId] || 0;
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          className={`star-btn ${i <= ratingValue ? 'active' : ''}`}
          onClick={() => setRating(prev => ({ ...prev, [submissionId]: i }))}
          disabled={currentRating !== null}
        >
          <FaStar />
        </button>
      );
    }
    
    return stars;
  };

  if (loading) {
    return (
      <div className="edited-videos">
        <div className="loading-container">
          <FaSpinner className="loading-spinner" />
          <p>Loading edited videos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="edited-videos">
        <div className="error-container">
          <FaExclamationTriangle className="error-icon" />
          <p>{error}</p>
          <button onClick={fetchEditedVideos} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="edited-videos">
      <div className="videos-header">
        <div className="header-content">
          <FaVideo className="header-icon" />
          <div className="header-text">
            <h2>Edited Videos</h2>
            <p>Download and review your professionally edited videos</p>
          </div>
        </div>
        <button onClick={fetchEditedVideos} className="refresh-btn">
          <FaSpinner className="refresh-icon" />
          Refresh
        </button>
      </div>

      {editedVideos.length === 0 ? (
        <div className="empty-state">
          <FaVideo className="empty-icon" />
          <h3>No Edited Videos Available</h3>
          <p>Your edited videos will appear here once editors complete your projects.</p>
        </div>
      ) : (
        <div className="videos-grid">
          {editedVideos.map((video) => (
            <div key={video._id} className="video-card">
              <div className="card-header">
                <div className="video-info">
                  <h3 className="project-title">{video.projectTitle}</h3>
                  <p className="upload-date">
                    Edited: {formatDate(video.editedVideo.uploadedAt)}
                  </p>
                </div>
                {getStatusBadge(video.status)}
              </div>

              <div className="card-content">
                <div className="video-details">
                  <div className="detail-item">
                    <span className="detail-label">Editor:</span>
                    <span className="detail-value">
                      {video.editor ? video.editor.fullName || video.editor.name : 'Unknown'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">File Size:</span>
                    <span className="detail-value">
                      {formatFileSize(video.editedVideo.fileSize)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Original Budget:</span>
                    <span className="detail-value">₹{video.budget}</span>
                  </div>
                  {video.rating && (
                    <div className="detail-item">
                      <span className="detail-label">Your Rating:</span>
                      <div className="rating-display">
                        {renderStars(video._id, video.rating)}
                        <span className="rating-text">({video.rating}/5)</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="card-actions">
                  <button 
                    className="view-btn"
                    onClick={() => handleViewVideo(video)}
                  >
                    <FaEye />
                    View Details
                  </button>
                  <button 
                    className="download-btn"
                    onClick={() => handleDownload(video._id, video.editedVideo.originalName)}
                    disabled={downloading[video._id]}
                  >
                    {downloading[video._id] ? (
                      <FaSpinner className="download-spinner" />
                    ) : (
                      <FaDownload />
                    )}
                    Download
                  </button>
                </div>

                {video.status === 'review' && !video.rating && (
                  <div className="rating-section">
                    <div className="rating-form">
                      <div className="rating-input">
                        <label>Rate this video:</label>
                        <div className="stars-container">
                          {renderStars(video._id)}
                        </div>
                      </div>
                      <div className="feedback-input">
                        <label>Feedback (optional):</label>
                        <textarea
                          value={feedback[video._id] || ''}
                          onChange={(e) => setFeedback(prev => ({ 
                            ...prev, 
                            [video._id]: e.target.value 
                          }))}
                          placeholder="Share your thoughts about the edited video..."
                          rows="3"
                        />
                      </div>
                      <button 
                        className="submit-rating-btn"
                        onClick={() => handleRateVideo(video._id)}
                        disabled={submittingRating[video._id] || !rating[video._id]}
                      >
                        {submittingRating[video._id] ? (
                          <FaSpinner className="submit-spinner" />
                        ) : (
                          <FaCheck />
                        )}
                        Submit Rating
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Details Modal */}
      {showVideoModal && selectedVideo && (
        <div className="video-modal-overlay">
          <div className="video-modal">
            <div className="modal-header">
              <h3>Video Details - {selectedVideo.projectTitle}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowVideoModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-content">
              <div className="video-info-section">
                <h4>Project Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Project Title:</label>
                    <span>{selectedVideo.projectTitle}</span>
                  </div>
                  <div className="info-item">
                    <label>Description:</label>
                    <span>{selectedVideo.description}</span>
                  </div>
                  <div className="info-item">
                    <label>Editor:</label>
                    <span>{selectedVideo.editor ? selectedVideo.editor.fullName || selectedVideo.editor.name : 'Unknown'}</span>
                  </div>
                  <div className="info-item">
                    <label>Budget:</label>
                    <span>₹{selectedVideo.budget}</span>
                  </div>
                  <div className="info-item">
                    <label>Deadline:</label>
                    <span>{formatDate(selectedVideo.deadline)}</span>
                  </div>
                  <div className="info-item">
                    <label>Status:</label>
                    {getStatusBadge(selectedVideo.status)}
                  </div>
                </div>
              </div>

              <div className="video-file-section">
                <h4>Edited Video</h4>
                <div className="file-info">
                  <div className="file-details">
                    <div className="file-item">
                      <label>Filename:</label>
                      <span>{selectedVideo.editedVideo.originalName}</span>
                    </div>
                    <div className="file-item">
                      <label>File Size:</label>
                      <span>{formatFileSize(selectedVideo.editedVideo.fileSize)}</span>
                    </div>
                    <div className="file-item">
                      <label>Uploaded:</label>
                      <span>{formatDate(selectedVideo.editedVideo.uploadedAt)}</span>
                    </div>
                  </div>
                  <div className="file-actions">
                    <button 
                      className="download-btn"
                      onClick={() => handleDownload(selectedVideo._id, selectedVideo.editedVideo.originalName)}
                      disabled={downloading[selectedVideo._id]}
                    >
                      {downloading[selectedVideo._id] ? (
                        <FaSpinner className="download-spinner" />
                      ) : (
                        <FaDownload />
                      )}
                      Download Video
                    </button>
                  </div>
                </div>
              </div>

              {selectedVideo.instructions && (
                <div className="instructions-section">
                  <h4>Original Instructions</h4>
                  <p>{selectedVideo.instructions}</p>
                </div>
              )}

              {selectedVideo.requirements && selectedVideo.requirements.length > 0 && (
                <div className="requirements-section">
                  <h4>Requirements</h4>
                  <ul>
                    {selectedVideo.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedVideo.rating && (
                <div className="rating-section">
                  <h4>Your Rating</h4>
                  <div className="rating-display">
                    {renderStars(selectedVideo._id, selectedVideo.rating)}
                    <span className="rating-text">({selectedVideo.rating}/5)</span>
                  </div>
                  {selectedVideo.feedback && (
                    <div className="feedback-display">
                      <label>Your Feedback:</label>
                      <p>{selectedVideo.feedback}</p>
                    </div>
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

export default EditedVideos;
