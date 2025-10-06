import React, { useState, useEffect } from 'react';
import { 
  FaVideo, 
  FaImage, 
  FaCircle, 
  FaEye, 
  FaHeart, 
  FaComment,
  FaTrash,
  FaEdit,
  FaSpinner
} from 'react-icons/fa';
import { reelsAPI, postsAPI, storiesAPI } from '../services/uploadService';
import '../styles/ContentManager.css';

const ContentManager = () => {
  const [activeTab, setActiveTab] = useState('reels');
  const [reels, setReels] = useState([]);
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchContent();
  }, [activeTab]);

  const fetchContent = async () => {
    setLoading(true);
    setError('');
    
    try {
      switch (activeTab) {
        case 'reels':
          const reelsResponse = await reelsAPI.getMyReels();
          setReels(reelsResponse.reels || []);
          break;
        case 'posts':
          const postsResponse = await postsAPI.getMyPosts();
          setPosts(postsResponse.posts || []);
          break;
        case 'stories':
          const storiesResponse = await storiesAPI.getMyStories();
          setStories(storiesResponse.stories || []);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      setError('Failed to fetch content. Please try again.');
    } finally {
      setLoading(false);
    }
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

  const renderReels = () => (
    <div className="content-grid">
      {reels.map((reel) => (
        <div key={reel._id} className="content-card">
          <div className="content-preview">
            <video 
              src={reel.video} 
              className="preview-media"
              muted
            />
            <div className="content-overlay">
              <FaVideo className="content-icon" />
            </div>
          </div>
          <div className="content-info">
            <h4>{reel.dishName}</h4>
            <p className="content-description">{reel.description}</p>
            <div className="content-meta">
              <span className="price">${reel.price}</span>
              <span className="date">{formatDate(reel.createdAt)}</span>
            </div>
            {reel.music && (
              <div className="music-info">
                <FaCircle className="music-indicator" />
                <span>{reel.music.name}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderPosts = () => (
    <div className="content-grid">
      {posts.map((post) => (
        <div key={post._id} className="content-card">
          <div className="content-preview">
            {post.images.length > 0 && (
              <img 
                src={post.images[0]} 
                alt="Post preview"
                className="preview-media"
              />
            )}
            <div className="content-overlay">
              <FaImage className="content-icon" />
              {post.images.length > 1 && (
                <span className="image-count">+{post.images.length - 1}</span>
              )}
            </div>
          </div>
          <div className="content-info">
            <p className="content-description">{post.description}</p>
            <div className="content-meta">
              <span className="date">{formatDate(post.createdAt)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderStories = () => (
    <div className="content-grid">
      {stories.map((story) => (
        <div key={story._id} className="content-card story-card">
          <div className="content-preview">
            <video 
              src={story.video} 
              className="preview-media"
              muted
            />
            <div className="content-overlay">
              <FaCircle className="content-icon" />
              <span className="story-duration">{story.duration}s</span>
            </div>
          </div>
          <div className="content-info">
            <p className="content-description">{story.description}</p>
            <div className="content-meta">
              {story.price && <span className="price">${story.price}</span>}
              <span className="date">{formatDate(story.createdAt)}</span>
            </div>
            {story.music && (
              <div className="music-info">
                <FaCircle className="music-indicator" />
                <span>{story.music.name}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="content-manager">
      <div className="content-header">
        <h2>My Content</h2>
        <p>Manage your uploaded reels, posts, and stories</p>
      </div>

      <div className="content-tabs">
        <button 
          className={`tab-btn ${activeTab === 'reels' ? 'active' : ''}`}
          onClick={() => setActiveTab('reels')}
        >
          <FaVideo />
          Reels ({reels.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          <FaImage />
          Posts ({posts.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'stories' ? 'active' : ''}`}
          onClick={() => setActiveTab('stories')}
        >
          <FaCircle />
          Stories ({stories.length})
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="content-body">
        {loading ? (
          <div className="loading-state">
            <FaSpinner className="spinning" />
            <p>Loading content...</p>
          </div>
        ) : (
          <>
            {activeTab === 'reels' && renderReels()}
            {activeTab === 'posts' && renderPosts()}
            {activeTab === 'stories' && renderStories()}
            
            {((activeTab === 'reels' && reels.length === 0) ||
              (activeTab === 'posts' && posts.length === 0) ||
              (activeTab === 'stories' && stories.length === 0)) && (
              <div className="empty-state">
                <div className="empty-icon">
                  {activeTab === 'reels' && <FaVideo />}
                  {activeTab === 'posts' && <FaImage />}
                  {activeTab === 'stories' && <FaCircle />}
                </div>
                <h3>No {activeTab} yet</h3>
                <p>Start creating your first {activeTab.slice(0, -1)} to engage with your audience!</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ContentManager;
