import React, { useState, useEffect } from 'react';
import { 
  FaUpload, 
  FaVideo, 
  FaFileVideo, 
  FaTrash, 
  FaCheck, 
  FaTimes,
  FaClock,
  FaDollarSign,
  FaEdit,
  FaPaperPlane
} from 'react-icons/fa';
import videoSubmissionService from '../services/videoSubmissionService';
import '../styles/VideoSubmission.css';

const VideoSubmission = () => {
  const [formData, setFormData] = useState({
    projectTitle: '',
    description: '',
    selectedEditor: '',
    instructions: '',
    requirements: '',
    deadline: '',
    budget: ''
  });
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editors, setEditors] = useState([]);
  const [loadingEditors, setLoadingEditors] = useState(true);

  // Fetch available editors on component mount
  useEffect(() => {
    const fetchEditors = async () => {
      try {
        setLoadingEditors(true);
        const response = await videoSubmissionService.getAvailableEditors();
        if (response.success) {
          setEditors(response.editors);
        } else {
          setError('Failed to load available editors');
        }
      } catch (error) {
        console.error('Error fetching editors:', error);
        setError('Failed to load available editors. Please try again.');
      } finally {
        setLoadingEditors(false);
      }
    };

    fetchEditors();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileSelect = (file) => {
    // Validate file type
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/mkv'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid video file (MP4, AVI, MOV, WMV, MKV)');
      return;
    }

    // Validate file size (500MB limit)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      setError('File size too large. Maximum size is 500MB');
      return;
    }

    setSelectedFile(file);
    setError('');
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Debug: Log form data to see what's missing
      console.log('Form data validation:', {
        projectTitle: formData.projectTitle,
        description: formData.description,
        selectedEditor: formData.selectedEditor,
        instructions: formData.instructions,
        deadline: formData.deadline,
        budget: formData.budget,
        selectedFile: selectedFile ? selectedFile.name : 'No file'
      });

      // Validate form
      if (!formData.projectTitle || !formData.description || !formData.selectedEditor || 
          !formData.instructions || !formData.deadline || !formData.budget) {
        const missingFields = [];
        if (!formData.projectTitle) missingFields.push('Project Title');
        if (!formData.description) missingFields.push('Description');
        if (!formData.selectedEditor) missingFields.push('Selected Editor');
        if (!formData.instructions) missingFields.push('Instructions');
        if (!formData.deadline) missingFields.push('Deadline');
        if (!formData.budget) missingFields.push('Budget');
        
        throw new Error(`Please fill in all required fields. Missing: ${missingFields.join(', ')}`);
      }

      if (!selectedFile) {
        throw new Error('Please select a video file');
      }

      // Create FormData
      const submitData = new FormData();
      submitData.append('video', selectedFile);
      submitData.append('projectTitle', formData.projectTitle);
      submitData.append('description', formData.description);
      submitData.append('selectedEditor', formData.selectedEditor);
      submitData.append('instructions', formData.instructions);
      submitData.append('requirements', formData.requirements);
      submitData.append('deadline', formData.deadline);
      submitData.append('budget', formData.budget);

      // Submit video
      const response = await videoSubmissionService.submitVideo(submitData);
      
      setSuccess('Video submitted successfully! Your selected editor has been assigned to the project.');
      
      // Reset form
      setFormData({
        projectTitle: '',
        description: '',
        selectedEditor: '',
        instructions: '',
        requirements: '',
        deadline: '',
        budget: ''
      });
      setSelectedFile(null);

    } catch (error) {
      setError(error.message || 'Failed to submit video. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="video-submission">
      <div className="submission-header">
        <h2>Submit Video for Editing</h2>
        <p>Upload your raw video footage and provide detailed instructions for our professional editors.</p>
      </div>

      <form onSubmit={handleSubmit} className="submission-form">
        {/* Project Information */}
        <div className="form-section">
          <h3>Project Information</h3>
          
          <div className="form-group">
            <label htmlFor="projectTitle">Project Title *</label>
            <input
              type="text"
              id="projectTitle"
              name="projectTitle"
              value={formData.projectTitle}
              onChange={handleInputChange}
              placeholder="e.g., Restaurant Promo Video, Food Review, Cooking Tutorial"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Project Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Brief description of your video project and its purpose"
              rows="3"
              required
            />
          </div>
        </div>

        {/* Available Editors */}
        <div className="form-section">
          <h3>Select Editor</h3>
          
          <div className="form-group">
            <label htmlFor="selectedEditor">Choose an Editor *</label>
            {loadingEditors ? (
              <div className="loading-editors">
                <div className="spinner"></div>
                <span>Loading available editors...</span>
              </div>
            ) : (
              <select
                id="selectedEditor"
                name="selectedEditor"
                value={formData.selectedEditor}
                onChange={handleInputChange}
                required
              >
                <option value="">Select an editor...</option>
                {editors.map((editor) => (
                  <option key={editor.id} value={editor.id}>
                    {editor.fullName} - {editor.experience || 'Professional Editor'}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="editor-info">
            <p>Our professional editors specialize in different areas. Choose the one that best fits your project needs.</p>
            {editors.length === 0 && !loadingEditors && (
              <p className="no-editors">No editors are currently available. Please try again later.</p>
            )}
          </div>
        </div>

        {/* Video Upload */}
        <div className="form-section">
          <h3>Video Upload</h3>
          
          <div 
            className={`upload-area ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="video/*"
              onChange={handleFileInput}
              className="file-input"
              id="video-upload"
            />
            <label htmlFor="video-upload" className="upload-label">
              <div className="upload-content">
                <FaVideo className="upload-icon" />
                <h4>Drop your video here or click to browse</h4>
                <p>Supports MP4, AVI, MOV, WMV, MKV (Max 500MB)</p>
              </div>
            </label>
          </div>

          {selectedFile && (
            <div className="file-preview">
              <div className="file-info">
                <FaFileVideo className="file-icon" />
                <div className="file-details">
                  <span className="file-name">{selectedFile.name}</span>
                  <span className="file-size">{videoSubmissionService.formatFileSize(selectedFile.size)}</span>
                </div>
              </div>
              <button type="button" onClick={removeFile} className="remove-file-btn">
                <FaTrash />
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="form-section">
          <h3>Editing Instructions</h3>
          
          <div className="form-group">
            <label htmlFor="instructions">Detailed Instructions *</label>
            <textarea
              id="instructions"
              name="instructions"
              value={formData.instructions}
              onChange={handleInputChange}
              placeholder="Provide detailed instructions for the editor. Include specific requirements like music, transitions, text overlays, color grading, etc."
              rows="6"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="requirements">Additional Requirements (Optional)</label>
            <input
              type="text"
              id="requirements"
              name="requirements"
              value={formData.requirements}
              onChange={handleInputChange}
              placeholder="e.g., Add background music, Include restaurant logo, Color correction"
            />
            <small>Separate multiple requirements with commas</small>
          </div>
        </div>

        {/* Project Timeline and Budget */}
        <div className="form-section">
          <h3>Project Timeline & Budget</h3>
          
          <div className="form-group">
            <label htmlFor="deadline">Project Deadline *</label>
            <input
              type="datetime-local"
              id="deadline"
              name="deadline"
              value={formData.deadline}
              onChange={handleInputChange}
              required
            />
            <small>When do you need the edited video back?</small>
          </div>

          <div className="form-group">
            <label htmlFor="budget">Budget (₹) *</label>
            <input
              type="number"
              id="budget"
              name="budget"
              value={formData.budget}
              onChange={handleInputChange}
              placeholder="Enter your budget for this project"
              min="1"
              required
            />
            <small>Your budget for this video editing project</small>
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

        {/* Submit Button */}
        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Submitting...
              </>
            ) : (
              <>
                <FaPaperPlane />
                Submit for Editing
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VideoSubmission;
