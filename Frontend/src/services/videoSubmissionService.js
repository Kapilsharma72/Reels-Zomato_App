import { API_BASE_URL } from '../config/api.js';

class VideoSubmissionService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/video-submissions`;
  }

  // Generic API call method
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const defaultOptions = {
      credentials: 'include', // Include cookies for authentication
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const config = { ...defaultOptions, ...options };
    
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          message: errorData.message || `HTTP error! status: ${response.status}`,
          ...errorData
        };
      }
      
      return await response.json();
    } catch (error) {
      if (error.status) {
        throw error;
      }
      throw {
        status: 0,
        message: 'Network error or server unavailable'
      };
    }
  }

  // Submit a new video for editing
  async submitVideo(formData) {
    try {
      const response = await this.makeRequest('/submit', {
        method: 'POST',
        body: formData,
        headers: {} // Let browser set Content-Type for FormData
      });
      return response;
    } catch (error) {
      console.error('Error submitting video:', error);
      throw error;
    }
  }

  // Get food partner's video submissions
  async getFoodPartnerSubmissions(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = `/food-partner/submissions${queryString ? `?${queryString}` : ''}`;
      const response = await this.makeRequest(endpoint);
      return response;
    } catch (error) {
      console.error('Error fetching food partner submissions:', error);
      throw error;
    }
  }

  // Get available video submissions for editors
  async getAvailableSubmissions(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = `/available${queryString ? `?${queryString}` : ''}`;
      const response = await this.makeRequest(endpoint);
      return response;
    } catch (error) {
      console.error('Error fetching available submissions:', error);
      throw error;
    }
  }

  // Get editor's assigned submissions
  async getEditorSubmissions(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = `/editor/submissions${queryString ? `?${queryString}` : ''}`;
      const response = await this.makeRequest(endpoint);
      return response;
    } catch (error) {
      console.error('Error fetching editor submissions:', error);
      throw error;
    }
  }

  // Get single submission details
  async getSubmissionDetails(submissionId, userType = 'food-partner') {
    try {
      const endpoint = userType === 'editor' 
        ? `/editor/${submissionId}`
        : `/food-partner/${submissionId}`;
      
      const response = await this.makeRequest(endpoint);
      return response;
    } catch (error) {
      console.error('Error fetching submission details:', error);
      throw error;
    }
  }

  // Assign submission to editor
  async assignSubmission(submissionId) {
    try {
      const response = await this.makeRequest(`/editor/${submissionId}/assign`, {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('Error assigning submission:', error);
      throw error;
    }
  }

  // Update submission status
  async updateSubmissionStatus(submissionId, status, progress, userType = 'food-partner') {
    try {
      const endpoint = userType === 'editor' 
        ? `/editor/${submissionId}/status`
        : `/food-partner/${submissionId}/status`;
      
      const response = await this.makeRequest(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({ status, progress })
      });
      return response;
    } catch (error) {
      console.error('Error updating submission status:', error);
      throw error;
    }
  }

  // Upload edited video
  async uploadEditedVideo(submissionId, formData) {
    try {
      const response = await this.makeRequest(`/editor/${submissionId}/upload-edited`, {
        method: 'POST',
        body: formData,
        headers: {} // Let browser set Content-Type for FormData
      });
      return response;
    } catch (error) {
      console.error('Error uploading edited video:', error);
      throw error;
    }
  }

  // Add message to submission
  async addMessage(submissionId, message, userType = 'food-partner') {
    try {
      const endpoint = userType === 'editor' 
        ? `/editor/${submissionId}/message`
        : `/food-partner/${submissionId}/message`;
      
      const response = await this.makeRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ message })
      });
      return response;
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  // Rate and provide feedback
  async rateSubmission(submissionId, rating, feedback) {
    try {
      const response = await this.makeRequest(`/food-partner/${submissionId}/rate`, {
        method: 'POST',
        body: JSON.stringify({ rating, feedback })
      });
      return response;
    } catch (error) {
      console.error('Error rating submission:', error);
      throw error;
    }
  }

  // Helper function to format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Helper function to format time remaining
  formatTimeRemaining(deadline) {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) {
      return 'Overdue';
    } else if (days === 0) {
      return 'Due today';
    } else if (days === 1) {
      return 'Due tomorrow';
    } else {
      return `${days} days remaining`;
    }
  }

  // Helper function to get status color
  getStatusColor(status) {
    const statusColors = {
      submitted: '#ffc107',
      assigned: '#17a2b8',
      in_progress: '#007bff',
      review: '#6f42c1',
      completed: '#28a745',
      rejected: '#dc3545'
    };
    return statusColors[status] || '#6c757d';
  }

  // Helper function to get status label
  getStatusLabel(status) {
    const statusLabels = {
      submitted: 'Submitted',
      assigned: 'Assigned',
      in_progress: 'In Progress',
      review: 'Under Review',
      completed: 'Completed',
      rejected: 'Rejected'
    };
    return statusLabels[status] || status;
  }

  // Get submission history
  async getSubmissionHistory(submissionId) {
    try {
      const response = await this.makeRequest(`/${submissionId}/history`);
      return response;
    } catch (error) {
      console.error('Error fetching submission history:', error);
      throw error;
    }
  }

  // Get food partner's edited videos
  async getEditedVideos(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = `/food-partner/edited-videos${queryString ? `?${queryString}` : ''}`;
      const response = await this.makeRequest(endpoint);
      return response;
    } catch (error) {
      console.error('Error fetching edited videos:', error);
      throw error;
    }
  }

  // Download edited video
  async downloadEditedVideo(submissionId) {
    try {
      const response = await fetch(`${this.baseURL}/food-partner/${submissionId}/download`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          message: errorData.message || `HTTP error! status: ${response.status}`,
          ...errorData
        };
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'edited-video.mp4';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { success: true, filename };
    } catch (error) {
      console.error('Error downloading edited video:', error);
      throw error;
    }
  }

  // Get available editors
  async getAvailableEditors() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/editors/available`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          message: errorData.message || `HTTP error! status: ${response.status}`,
          ...errorData
        };
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching available editors:', error);
      throw error;
    }
  }
}

export default new VideoSubmissionService();
