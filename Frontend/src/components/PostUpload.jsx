import React, { useState } from 'react';
import { 
  FaUpload, 
  FaImage, 
  FaTrash, 
  FaCheck,
  FaSpinner,
  FaPlus,
  FaTimes
} from 'react-icons/fa';
import { postsAPI } from '../services/uploadService';
import '../styles/PostUpload.css';

const PostUpload = () => {
  const [formData, setFormData] = useState({
    description: '',
    images: []
  });
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      
      if (imageFiles.length > 0) {
        const newImages = [...formData.images, ...imageFiles];
        setFormData(prev => ({ ...prev, images: newImages }));
        
        // Create previews for new images
        const newPreviews = imageFiles.map(file => URL.createObjectURL(file));
        setImagePreviews(prev => [...prev, ...newPreviews]);
      }
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newImages = [...formData.images, ...files];
      setFormData(prev => ({ ...prev, images: newImages }));
      
      // Create previews for new images
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    setFormData(prev => ({ ...prev, images: newImages }));
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadMessage('');
    setUploadError('');
    
    try {
      // Prepare data for API
      const postData = {
        description: formData.description
      };

      // Upload post
      const response = await postsAPI.createPost(postData, formData.images);
      
      setUploadMessage('Post uploaded successfully!');
      
      // Reset form after successful upload
      setTimeout(() => {
        setFormData({
          description: '',
          images: []
        });
        setImagePreviews([]);
        setUploadMessage('');
      }, 2000);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Failed to upload post. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="post-upload">
      <div className="upload-header">
        <h2>Create New Post</h2>
        <p>Share your food moments with beautiful images</p>
      </div>

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-layout">
          {/* Image Upload Section */}
          <div className="image-upload-section">
            <h3>Upload Images</h3>
            
            {imagePreviews.length === 0 ? (
              <div 
                className={`upload-area ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="upload-content">
                  <FaImage className="upload-icon" />
                  <h4>Drag & Drop your images here</h4>
                  <p>or click to browse files</p>
                  <p className="upload-hint">You can upload multiple images at once</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileInput}
                    className="file-input"
                  />
                </div>
              </div>
            ) : (
              <div className="images-preview">
                <div className="images-grid">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="image-item">
                      <img 
                        src={preview} 
                        alt={`Preview ${index + 1}`}
                        className="preview-image"
                      />
                      <button 
                        type="button"
                        className="remove-image-btn"
                        onClick={() => removeImage(index)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                  
                  {/* Add more images button */}
                  {imagePreviews.length < 10 && (
                    <div 
                      className="add-more-images"
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <div className="add-more-content">
                        <FaPlus className="add-icon" />
                        <span>Add More</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileInput}
                          className="file-input"
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="images-info">
                  <p>{imagePreviews.length} image(s) selected</p>
                  <p className="upload-hint">Maximum 10 images per post</p>
                </div>
              </div>
            )}
          </div>

          {/* Form Fields Section */}
          <div className="form-fields-section">
            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Share your thoughts about this dish, cooking tips, or any story you'd like to tell..."
                rows="8"
                required
              />
              <div className="character-count">
                {formData.description.length}/500 characters
              </div>
            </div>

            {/* Post Preview */}
            {imagePreviews.length > 0 && (
              <div className="post-preview">
                <h4>Post Preview</h4>
                <div className="preview-card">
                  <div className="preview-header">
                    <div className="preview-avatar">FP</div>
                    <div className="preview-info">
                      <div className="preview-name">Your Restaurant</div>
                      <div className="preview-time">now</div>
                    </div>
                  </div>
                  
                  <div className="preview-content">
                    {formData.description && (
                      <p className="preview-description">{formData.description}</p>
                    )}
                    
                    <div className="preview-images">
                      {imagePreviews.slice(0, 3).map((preview, index) => (
                        <img 
                          key={index}
                          src={preview} 
                          alt={`Preview ${index + 1}`}
                          className="preview-thumbnail"
                        />
                      ))}
                      {imagePreviews.length > 3 && (
                        <div className="more-images">
                          +{imagePreviews.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="submit-section">
          {uploadMessage && (
            <div className="success-message">
              {uploadMessage}
            </div>
          )}
          {uploadError && (
            <div className="error-message">
              {uploadError}
            </div>
          )}
          <button 
            type="submit" 
            className="upload-btn"
            disabled={!formData.description || formData.images.length === 0 || isUploading}
          >
            {isUploading ? (
              <>
                <FaSpinner className="spinning" />
                Uploading...
              </>
            ) : (
              <>
                <FaUpload />
                Upload Post
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostUpload;
