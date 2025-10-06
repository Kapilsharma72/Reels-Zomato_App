const VideoSubmission = require('../models/videoSubmission.model');
const FoodPartner = require('../models/foodPartner.model');
const User = require('../models/user.model');
const storageService = require('../services/storage.service');
const websocketService = require('../services/websocket.service');

// Submit a new video for editing
const submitVideo = async (req, res) => {
  try {
    const { projectTitle, description, instructions, requirements, deadline, budget, selectedEditor } = req.body;
    const foodPartnerId = req.foodPartner._id;

    console.log('submitVideo called with selectedEditor:', selectedEditor);
    console.log('foodPartnerId:', foodPartnerId);

    // Validate required fields
    if (!projectTitle || !description || !instructions || !deadline || !budget || !selectedEditor) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided',
        missing: {
          projectTitle: !projectTitle,
          description: !description,
          instructions: !instructions,
          deadline: !deadline,
          budget: !budget,
          selectedEditor: !selectedEditor
        }
      });
    }

    // Check if video file is uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Video file is required'
      });
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/mkv'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only video files are allowed'
      });
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 500MB'
      });
    }

    // Parse requirements array
    const requirementsArray = requirements ? requirements.split(',').map(req => req.trim()).filter(req => req) : [];

    // Create video submission
    const videoSubmission = new VideoSubmission({
      foodPartner: foodPartnerId,
      editor: selectedEditor, // Assign the selected editor
      projectTitle,
      description,
      instructions,
      requirements: requirementsArray,
      deadline: new Date(deadline),
      budget: parseFloat(budget),
      status: 'assigned', // Set status to assigned since editor is selected
      assignedAt: new Date(), // Set assignedAt timestamp
      videoFile: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        filePath: req.file.path
      }
    });

    await videoSubmission.save();

    // Add initial history entry
    await videoSubmission.addHistoryEntry(
      'submitted',
      `Video submitted for editing: "${projectTitle}"`,
      'foodPartner',
      { projectTitle, budget, deadline }
    );

    console.log('Video submission saved with ID:', videoSubmission._id);
    console.log('Assigned editor ID:', videoSubmission.editor);

    // Populate food partner and editor details
    await videoSubmission.populate([
      { path: 'foodPartner', select: 'businessName name email' },
      { path: 'editor', select: 'fullName email experience' }
    ]);

    console.log('Video submission populated successfully');

    // Send real-time notification to assigned editor
    websocketService.notifyVideoAssignedToEditor(
      videoSubmission._id,
      videoSubmission.editor._id,
      videoSubmission.foodPartner._id,
      {
        projectTitle: videoSubmission.projectTitle,
        description: videoSubmission.description,
        instructions: videoSubmission.instructions,
        deadline: videoSubmission.deadline,
        budget: videoSubmission.budget,
        requirements: videoSubmission.requirements,
        foodPartner: videoSubmission.foodPartner.businessName
      }
    );

    // Also send a general notification for new video submission
    websocketService.notifyNewVideoSubmission(
      {
        id: videoSubmission._id,
        projectTitle: videoSubmission.projectTitle,
        description: videoSubmission.description,
        instructions: videoSubmission.instructions,
        deadline: videoSubmission.deadline,
        budget: videoSubmission.budget,
        requirements: videoSubmission.requirements,
        foodPartnerName: videoSubmission.foodPartner.businessName,
        foodPartnerId: videoSubmission.foodPartner._id,
        editorId: videoSubmission.editor._id,
        editorName: videoSubmission.editor.name,
        status: videoSubmission.status,
        createdAt: videoSubmission.createdAt
      },
      videoSubmission.editor._id
    );

    res.status(201).json({
      success: true,
      message: 'Video submitted successfully',
      data: videoSubmission
    });

  } catch (error) {
    console.error('Error submitting video:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all video submissions for a food partner
const getFoodPartnerSubmissions = async (req, res) => {
  try {
    const foodPartnerId = req.foodPartner._id;
    const { status, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { foodPartner: foodPartnerId };
    if (status) {
      query.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get submissions
    const submissions = await VideoSubmission.find(query)
      .populate('editor', 'name email')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await VideoSubmission.countDocuments(query);

    res.json({
      success: true,
      data: {
        submissions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });

  } catch (error) {
    console.error('Error fetching food partner submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all available video submissions for editors
const getAvailableSubmissions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get available submissions (submitted status)
    const submissions = await VideoSubmission.find({ status: 'submitted' })
      .populate('foodPartner', 'businessName name email')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await VideoSubmission.countDocuments({ status: 'submitted' });

    res.json({
      success: true,
      data: {
        submissions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });

  } catch (error) {
    console.error('Error fetching available submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get video submissions assigned to an editor
const getEditorSubmissions = async (req, res) => {
  try {
    const editorId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    console.log('getEditorSubmissions called with editorId:', editorId);
    console.log('Status filter:', status);

    // Build query
    const query = { editor: editorId };
    if (status) {
      query.status = status;
    }

    console.log('Query:', query);

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get submissions
    const submissions = await VideoSubmission.find(query)
      .populate('foodPartner', 'businessName name email')
      .populate('editor', 'fullName email')
      .sort({ assignedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    console.log('Found submissions:', submissions.length);

    // Get total count
    const total = await VideoSubmission.countDocuments(query);

    console.log('Total count:', total);

    res.json({
      success: true,
      data: {
        submissions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });

  } catch (error) {
    console.error('Error fetching editor submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Assign a video submission to an editor
const assignSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const editorId = req.user.id;

    // Find the submission
    const submission = await VideoSubmission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Video submission not found'
      });
    }

    // Check if already assigned
    if (submission.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'This submission is already assigned or processed'
      });
    }

    // Assign to editor
    submission.editor = editorId;
    submission.status = 'assigned';
    submission.assignedAt = new Date();

    await submission.save();

    // Add history entry
    await submission.addHistoryEntry(
      'assigned',
      'Video submission assigned to editor',
      'editor',
      { editorId }
    );

    // Populate details
    await submission.populate('foodPartner', 'businessName name email');
    await submission.populate('editor', 'name email');

    res.json({
      success: true,
      message: 'Video submission assigned successfully',
      data: submission
    });

  } catch (error) {
    console.error('Error assigning submission:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update submission status
const updateSubmissionStatus = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { status, progress } = req.body;
    const userId = req.user?.id || req.foodPartner?.id;
    const userType = req.user ? 'editor' : 'foodPartner';

    // Find the submission
    const submission = await VideoSubmission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Video submission not found'
      });
    }

    // Check permissions
    if (userType === 'editor' && submission.editor.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this submission'
      });
    }

    if (userType === 'foodPartner' && submission.foodPartner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this submission'
      });
    }

    // Update status
    if (status) {
      const oldStatus = submission.status;
      await submission.updateStatus(status);
      
      // Add history entry for status change
      await submission.addHistoryEntry(
        status,
        `Status changed from "${oldStatus}" to "${status}"`,
        userType,
        { oldStatus, newStatus: status }
      );
    }

    // Update progress
    if (progress !== undefined) {
      const oldProgress = submission.progress;
      await submission.updateProgress(progress);
      
      // Add history entry for progress update
      await submission.addHistoryEntry(
        'in_progress',
        `Progress updated from ${oldProgress}% to ${progress}%`,
        userType,
        { oldProgress, newProgress: progress }
      );

      // Send real-time progress notification to food partner
      websocketService.notifyVideoEditProgress(
        submission._id,
        submission.editor._id,
        submission.foodPartner._id,
        progress,
        submission.status
      );
    }

    // Populate details
    await submission.populate('foodPartner', 'businessName name email');
    await submission.populate('editor', 'name email');

    res.json({
      success: true,
      message: 'Submission updated successfully',
      data: submission
    });

  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Upload edited video
const uploadEditedVideo = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const editorId = req.user.id;

    // Check if edited video file is uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Edited video file is required'
      });
    }

    // Find the submission
    const submission = await VideoSubmission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Video submission not found'
      });
    }

    // Check if editor is assigned
    if (submission.editor.toString() !== editorId) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this submission'
      });
    }

    // Update edited video
    submission.editedVideo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      filePath: req.file.path,
      uploadedAt: new Date()
    };

    // Update status to review
    submission.status = 'review';

    await submission.save();

    // Add history entry for edited video upload
    await submission.addHistoryEntry(
      'edited_video_uploaded',
      'Edited video uploaded by editor',
      'editor',
      { 
        filename: req.file.filename,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      }
    );

    // Send real-time notification to food partner that video is ready for review
    websocketService.notifyVideoEditCompleted(
      submission._id,
      submission.editor._id,
      submission.foodPartner._id,
      {
        filename: req.file.filename,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedAt: new Date()
      }
    );

    // Populate details
    await submission.populate('foodPartner', 'businessName name email');
    await submission.populate('editor', 'name email');

    res.json({
      success: true,
      message: 'Edited video uploaded successfully',
      data: submission
    });

  } catch (error) {
    console.error('Error uploading edited video:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Add message to submission
const addMessage = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { message } = req.body;
    const userId = req.user?.id || req.foodPartner?.id;
    const userType = req.user ? 'editor' : 'foodPartner';

    // Find the submission
    const submission = await VideoSubmission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Video submission not found'
      });
    }

    // Check permissions
    if (userType === 'editor' && submission.editor.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this submission'
      });
    }

    if (userType === 'foodPartner' && submission.foodPartner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to message on this submission'
      });
    }

    // Add message
    await submission.addMessage(userType, message);

    // Add history entry for message
    await submission.addHistoryEntry(
      'message_sent',
      `Message sent by ${userType}`,
      userType,
      { message: message.substring(0, 100) + (message.length > 100 ? '...' : '') }
    );

    // Populate details
    await submission.populate('foodPartner', 'businessName name email');
    await submission.populate('editor', 'name email');

    res.json({
      success: true,
      message: 'Message added successfully',
      data: submission
    });

  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Rate and provide feedback
const rateSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { rating, feedback } = req.body;
    const foodPartnerId = req.foodPartner._id;

    // Find the submission
    const submission = await VideoSubmission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Video submission not found'
      });
    }

    // Check if food partner owns this submission
    if (submission.foodPartner.toString() !== foodPartnerId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to rate this submission'
      });
    }

    // Check if submission is completed
    if (submission.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate completed submissions'
      });
    }

    // Update rating and feedback
    submission.rating = rating;
    submission.feedback = feedback;

    await submission.save();

    // Add history entry for rating
    await submission.addHistoryEntry(
      'rating_given',
      `Rating ${rating}/5 given by food partner`,
      'foodPartner',
      { rating, feedback: feedback ? feedback.substring(0, 100) + (feedback.length > 100 ? '...' : '') : null }
    );

    // Populate details
    await submission.populate('foodPartner', 'businessName name email');
    await submission.populate('editor', 'name email');

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      data: submission
    });

  } catch (error) {
    console.error('Error rating submission:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get single submission details
const getSubmissionDetails = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user?.id || req.foodPartner?.id;
    const userType = req.user ? 'editor' : 'foodPartner';

    // Find the submission
    const submission = await VideoSubmission.findById(submissionId)
      .populate('foodPartner', 'businessName name email')
      .populate('editor', 'name email');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Video submission not found'
      });
    }

    // Check permissions
    if (userType === 'editor' && submission.editor && submission.editor._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this submission'
      });
    }

    if (userType === 'foodPartner' && submission.foodPartner._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this submission'
      });
    }

    res.json({
      success: true,
      data: submission
    });

  } catch (error) {
    console.error('Error fetching submission details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get video submission history
const getSubmissionHistory = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user?.id || req.foodPartner?.id;
    const userType = req.user ? 'editor' : 'foodPartner';

    // Find the submission
    const submission = await VideoSubmission.findById(submissionId)
      .populate('foodPartner', 'businessName name email')
      .populate('editor', 'fullName email');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Video submission not found'
      });
    }

    // Check permissions
    if (userType === 'editor' && submission.editor && submission.editor._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this submission'
      });
    }

    if (userType === 'foodPartner' && submission.foodPartner._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this submission'
      });
    }

    // Get formatted history
    const history = submission.getFormattedHistory();

    res.json({
      success: true,
      data: {
        submission: {
          _id: submission._id,
          projectTitle: submission.projectTitle,
          status: submission.status,
          progress: submission.progress
        },
        history
      }
    });

  } catch (error) {
    console.error('Error fetching submission history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get food partner's edited videos (completed submissions)
const getEditedVideos = async (req, res) => {
  try {
    const foodPartnerId = req.foodPartner._id;
    const { page = 1, limit = 10 } = req.query;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get completed submissions with edited videos
    const submissions = await VideoSubmission.find({
      foodPartner: foodPartnerId,
      status: { $in: ['review', 'completed'] },
      editedVideo: { $exists: true, $ne: null }
    })
      .populate('editor', 'fullName email')
      .sort({ 'editedVideo.uploadedAt': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await VideoSubmission.countDocuments({
      foodPartner: foodPartnerId,
      status: { $in: ['review', 'completed'] },
      editedVideo: { $exists: true, $ne: null }
    });

    res.json({
      success: true,
      data: {
        submissions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });

  } catch (error) {
    console.error('Error fetching edited videos:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Download edited video
const downloadEditedVideo = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const foodPartnerId = req.foodPartner._id;

    // Find the submission
    const submission = await VideoSubmission.findById(submissionId);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Video submission not found'
      });
    }

    // Check if food partner owns this submission
    if (submission.foodPartner.toString() !== foodPartnerId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to download this video'
      });
    }

    // Check if edited video exists
    if (!submission.editedVideo || !submission.editedVideo.filePath) {
      return res.status(404).json({
        success: false,
        message: 'Edited video not found'
      });
    }

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${submission.editedVideo.originalName}"`);
    res.setHeader('Content-Type', submission.editedVideo.mimeType);

    // Stream the file
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '../../', submission.editedVideo.filePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Video file not found on server'
      });
    }

    // Send real-time notification to editor that video was downloaded
    websocketService.notifyVideoDownloaded(
      submission._id,
      submission.foodPartner._id,
      submission.editor._id
    );

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error downloading edited video:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  submitVideo,
  getFoodPartnerSubmissions,
  getAvailableSubmissions,
  getEditorSubmissions,
  assignSubmission,
  updateSubmissionStatus,
  uploadEditedVideo,
  addMessage,
  rateSubmission,
  getSubmissionDetails,
  getSubmissionHistory,
  getEditedVideos,
  downloadEditedVideo
};
