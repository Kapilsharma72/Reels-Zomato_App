import React, { useState, useRef, useEffect } from 'react';
import { 
  FaUpload, 
  FaVideo, 
  FaMusic, 
  FaPlay, 
  FaPause, 
  FaVolumeUp, 
  FaVolumeMute,
  FaTrash,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaClock,
  FaSearch,
  FaFilter,
  FaHeart,
  FaDownload
} from 'react-icons/fa';
import { storiesAPI } from '../services/uploadService';
import musicService from '../services/musicService';
import '../styles/StoriesUpload.css';

const StoriesUpload = () => {
  const [formData, setFormData] = useState({
    description: '',
    price: '',
    video: null,
    music: null,
    musicVolume: 50,
    duration: 15 // Stories duration in seconds
  });
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [videoPreview, setVideoPreview] = useState(null);
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [showMusicLibrary, setShowMusicLibrary] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState('');
  
  // Music library states
  const [musicLibrary, setMusicLibrary] = useState([]);
  const [filteredMusic, setFilteredMusic] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('stories');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingMusic, setPlayingMusic] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Audio refs
  const audioRef = useRef(null);
  const videoRef = useRef(null);

  // Load music library on component mount
  useEffect(() => {
    const loadMusicLibrary = () => {
      const music = musicService.getRecommendedMusic('stories');
      setMusicLibrary(music);
      setFilteredMusic(music);
    };
    loadMusicLibrary();
  }, []);

  // Filter music based on category and search
  useEffect(() => {
    let filtered = musicLibrary;
    
    if (selectedCategory !== 'all') {
      filtered = musicService.getMusicByCategory(selectedCategory);
    }
    
    if (searchQuery) {
      filtered = musicService.searchMusic(searchQuery);
    }
    
    setFilteredMusic(filtered);
  }, [selectedCategory, searchQuery, musicLibrary]);

  // Handle music playback
  const playMusic = (music) => {
    if (playingMusic && playingMusic.id === music.id && isPlaying) {
      // Pause current music
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      setPlayingMusic(null);
    } else {
      // Play new music
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingMusic(music);
      setIsPlaying(true);
      // In a real app, you would load the actual audio file
      // For now, we'll just simulate playback
      setTimeout(() => {
        setIsPlaying(false);
        setPlayingMusic(null);
      }, 20000); // Simulate 20 seconds of playback for stories
    }
  };

  // Stop music when modal closes
  useEffect(() => {
    if (!showMusicLibrary && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setPlayingMusic(null);
    }
  }, [showMusicLibrary]);

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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        setFormData(prev => ({ ...prev, video: file }));
        setVideoPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, video: file }));
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const removeVideo = () => {
    setFormData(prev => ({ ...prev, video: null }));
    setVideoPreview(null);
  };

  const selectMusic = (music) => {
    setSelectedMusic(music);
    setFormData(prev => ({ ...prev, music: music }));
    setShowMusicLibrary(false);
    // Stop any playing music
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setPlayingMusic(null);
  };

  const removeMusic = () => {
    setSelectedMusic(null);
    setFormData(prev => ({ ...prev, music: null }));
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSearchQuery(''); // Clear search when changing category
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadMessage('');
    setUploadError('');
    
    try {
      // Prepare data for API
      const storyData = {
        description: formData.description,
        price: formData.price ? parseFloat(formData.price) : null,
        music: formData.music,
        musicVolume: formData.musicVolume,
        duration: formData.duration
      };

      // Upload story
      const response = await storiesAPI.createStory(storyData, formData.video);
      
      setUploadMessage('Story uploaded successfully!');
      
      // Reset form after successful upload
      setTimeout(() => {
        setFormData({
          description: '',
          price: '',
          video: null,
          music: null,
          musicVolume: 50,
          duration: 15
        });
        setVideoPreview(null);
        setSelectedMusic(null);
        setUploadMessage('');
      }, 2000);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Failed to upload story. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="stories-upload">
      <div className="upload-header">
        <h2>Create New Story</h2>
        <p>Share quick food moments that disappear in 24 hours</p>
      </div>

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-grid">
          {/* Video Upload Section */}
          <div className="video-upload-section">
            <h3>Upload Story Video</h3>
            
            {!videoPreview ? (
              <div 
                className={`upload-area ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="upload-content">
                  <FaVideo className="upload-icon" />
                  <h4>Drag & Drop your story video here</h4>
                  <p>or click to browse files</p>
                  <p className="upload-hint">Stories work best with vertical videos (9:16 ratio)</p>
                </div>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileInput}
                  className="file-input"
                />
              </div>
            ) : (
              <div className="video-preview">
                <video 
                  src={videoPreview} 
                  controls 
                  className="preview-video"
                />
                <button 
                  type="button"
                  className="remove-video-btn"
                  onClick={removeVideo}
                >
                  <FaTrash />
                </button>
              </div>
            )}

            {/* Story Duration Settings */}
            <div className="duration-settings">
              <h4>Story Duration</h4>
              <div className="duration-options">
                {[15, 30, 45, 60].map((duration) => (
                  <button
                    key={duration}
                    type="button"
                    className={`duration-btn ${formData.duration === duration ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, duration }))}
                  >
                    <FaClock />
                    {duration}s
                  </button>
                ))}
              </div>
            </div>
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
                placeholder="Share your story about this dish, cooking process, or special moment..."
                rows="4"
                required
              />
              <div className="character-count">
                {formData.description.length}/200 characters
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="price">Price (Optional)</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="Enter price if applicable"
                min="0"
                step="0.01"
              />
            </div>

            {/* Music Selection */}
            <div className="music-section">
              <h3>Add Music</h3>
              
              {!selectedMusic ? (
                <button 
                  type="button"
                  className="select-music-btn"
                  onClick={() => setShowMusicLibrary(true)}
                >
                  <FaMusic />
                  Select Music
                </button>
              ) : (
                <div className="selected-music">
                  <div className="music-info">
                    <FaMusic className="music-icon" />
                    <div>
                      <h4>{selectedMusic.name}</h4>
                      <p>{selectedMusic.artist} • {selectedMusic.duration}</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    className="remove-music-btn"
                    onClick={removeMusic}
                  >
                    <FaTimes />
                  </button>
                </div>
              )}

              {selectedMusic && (
                <div className="music-controls">
                  <label htmlFor="musicVolume">Music Volume</label>
                  <div className="volume-control">
                    <FaVolumeMute />
                    <input
                      type="range"
                      id="musicVolume"
                      name="musicVolume"
                      min="0"
                      max="100"
                      value={formData.musicVolume}
                      onChange={handleInputChange}
                      className="volume-slider"
                    />
                    <FaVolumeUp />
                  </div>
                </div>
              )}
            </div>

            {/* Story Preview */}
            {videoPreview && (
              <div className="story-preview">
                <h4>Story Preview</h4>
                <div className="preview-card">
                  <div className="preview-header">
                    <div className="preview-avatar">FP</div>
                    <div className="preview-info">
                      <div className="preview-name">Your Restaurant</div>
                      <div className="preview-time">now</div>
                    </div>
                    <div className="preview-duration">{formData.duration}s</div>
                  </div>
                  
                  <div className="preview-content">
                    <div className="preview-video-container">
                      <video 
                        src={videoPreview} 
                        className="preview-story-video"
                        muted
                      />
                      {selectedMusic && (
                        <div className="preview-music-indicator">
                          <FaMusic />
                        </div>
                      )}
                    </div>
                    
                    {formData.description && (
                      <p className="preview-description">{formData.description}</p>
                    )}
                    
                    {formData.price && (
                      <div className="preview-price">${formData.price}</div>
                    )}
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
            disabled={!formData.description || !formData.video || isUploading}
          >
            {isUploading ? (
              <>
                <FaSpinner className="spinning" />
                Uploading...
              </>
            ) : (
              <>
                <FaUpload />
                Upload Story
              </>
            )}
          </button>
        </div>
      </form>

      {/* Enhanced Music Library Modal */}
      {showMusicLibrary && (
        <div className="music-library-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Select Music for Your Story</h3>
              <button 
                className="close-modal"
                onClick={() => setShowMusicLibrary(false)}
              >
                <FaTimes />
              </button>
            </div>
            
            {/* Music Search and Filter */}
            <div className="music-controls">
              <div className="search-box">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search music, artist, or genre..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="search-input"
                />
              </div>
              
              <div className="category-filters">
                {musicService.getCategories().map((category) => (
                  <button
                    key={category.id}
                    className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                    onClick={() => handleCategoryChange(category.id)}
                  >
                    <span className="category-icon">{category.icon}</span>
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="music-list">
              {filteredMusic.length === 0 ? (
                <div className="no-music-found">
                  <FaMusic className="no-music-icon" />
                  <h4>No music found</h4>
                  <p>Try adjusting your search or category filter</p>
                </div>
              ) : (
                filteredMusic.map((music) => (
                  <div 
                    key={music.id} 
                    className={`music-item ${playingMusic && playingMusic.id === music.id ? 'playing' : ''}`}
                  >
                    <div className="music-preview" onClick={() => playMusic(music)}>
                      {playingMusic && playingMusic.id === music.id && isPlaying ? (
                        <FaPause className="play-icon" />
                      ) : (
                        <FaPlay className="play-icon" />
                      )}
                    </div>
                    <div className="music-details">
                      <h4>{music.name}</h4>
                      <p>{music.artist} • {music.genre}</p>
                      <div className="music-meta">
                        <span className="duration">{music.duration}</span>
                        <span className="mood">{music.mood}</span>
                      </div>
                      <p className="music-description">{music.description}</p>
                    </div>
                    <div className="music-actions">
                      <button 
                        className="favorite-btn"
                        title="Add to favorites"
                      >
                        <FaHeart />
                      </button>
                      <button 
                        className="select-btn"
                        onClick={() => selectMusic(music)}
                      >
                        <FaCheck />
                        Select
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoriesUpload;
