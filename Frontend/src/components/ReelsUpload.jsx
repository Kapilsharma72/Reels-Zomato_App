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
  FaSearch,
  FaFilter,
  FaHeart,
  FaDownload
} from 'react-icons/fa';
import { reelsAPI } from '../services/uploadService';
import musicService from '../services/musicService';
import '../styles/ReelsUpload.css';

const ReelsUpload = () => {
  const [formData, setFormData] = useState({
    dishName: '',
    description: '',
    price: '',
    video: null,
    music: null,
    musicVolume: 50
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
  const [selectedCategory, setSelectedCategory] = useState('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingMusic, setPlayingMusic] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Audio refs
  const audioRef = useRef(null);
  const videoRef = useRef(null);

  // Load music library on component mount
  useEffect(() => {
    const loadMusicLibrary = () => {
      const music = musicService.getRecommendedMusic('reels');
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
      }, 30000); // Simulate 30 seconds of playback
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
      const reelData = {
        dishName: formData.dishName,
        description: formData.description,
        price: parseFloat(formData.price),
        music: formData.music,
        musicVolume: formData.musicVolume
      };

      // Upload reel
      const response = await reelsAPI.createReel(reelData, formData.video);
      
      setUploadMessage('Reel uploaded successfully!');
      
      // Reset form after successful upload
      setTimeout(() => {
        setFormData({
          dishName: '',
          description: '',
          price: '',
          video: null,
          music: null,
          musicVolume: 50
        });
        setVideoPreview(null);
        setSelectedMusic(null);
        setUploadMessage('');
      }, 2000);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Failed to upload reel. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="reels-upload">
      <div className="upload-header">
        <h2>Create New Reel</h2>
        <p>Share your delicious dishes with the world</p>
      </div>

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-grid">
          {/* Video Upload Section */}
          <div className="video-upload-section">
            <h3>Upload Video</h3>
            
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
                  <h4>Drag & Drop your video here</h4>
                  <p>or click to browse files</p>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileInput}
                    className="file-input"
                  />
                </div>
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
          </div>

          {/* Form Fields Section */}
          <div className="form-fields-section">
            <div className="form-group">
              <label htmlFor="dishName">Dish Name *</label>
              <input
                type="text"
                id="dishName"
                name="dishName"
                value={formData.dishName}
                onChange={handleInputChange}
                placeholder="Enter dish name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your dish, ingredients, cooking process..."
                rows="4"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="price">Price *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="Enter price"
                min="0"
                step="0.01"
                required
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
            disabled={!formData.dishName || !formData.description || !formData.price || !formData.video || isUploading}
          >
            {isUploading ? (
              <>
                <FaSpinner className="spinning" />
                Uploading...
              </>
            ) : (
              <>
                <FaUpload />
                Upload Reel
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
              <h3>Select Music for Your Reel</h3>
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

export default ReelsUpload;
