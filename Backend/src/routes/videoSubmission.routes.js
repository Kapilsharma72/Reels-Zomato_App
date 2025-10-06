const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const videoSubmissionController = require('../controllers/videoSubmission.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/videos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = /mp4|avi|mov|wmv|mkv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith('video/');

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'));
    }
  }
});

// Food Partner Routes
// Submit a new video for editing
router.post('/submit', 
  authMiddleware.authFoodPartnerMiddleware,
  upload.single('video'),
  videoSubmissionController.submitVideo
);

// Get food partner's video submissions
router.get('/food-partner/submissions',
  authMiddleware.authFoodPartnerMiddleware,
  videoSubmissionController.getFoodPartnerSubmissions
);

// Get single submission details (food partner)
router.get('/food-partner/:submissionId',
  authMiddleware.authFoodPartnerMiddleware,
  videoSubmissionController.getSubmissionDetails
);

// Update submission status (food partner)
router.patch('/food-partner/:submissionId/status',
  authMiddleware.authFoodPartnerMiddleware,
  videoSubmissionController.updateSubmissionStatus
);

// Add message to submission (food partner)
router.post('/food-partner/:submissionId/message',
  authMiddleware.authFoodPartnerMiddleware,
  videoSubmissionController.addMessage
);

// Rate and provide feedback (food partner)
router.post('/food-partner/:submissionId/rate',
  authMiddleware.authFoodPartnerMiddleware,
  videoSubmissionController.rateSubmission
);

// Editor Routes
// Get available video submissions
router.get('/available',
  authMiddleware.authUserMiddleware,
  videoSubmissionController.getAvailableSubmissions
);

// Get editor's assigned submissions
router.get('/editor/submissions',
  authMiddleware.authUserMiddleware,
  videoSubmissionController.getEditorSubmissions
);

// Get single submission details (editor)
router.get('/editor/:submissionId',
  authMiddleware.authUserMiddleware,
  videoSubmissionController.getSubmissionDetails
);

// Assign submission to editor
router.post('/editor/:submissionId/assign',
  authMiddleware.authUserMiddleware,
  videoSubmissionController.assignSubmission
);

// Update submission status (editor)
router.patch('/editor/:submissionId/status',
  authMiddleware.authUserMiddleware,
  videoSubmissionController.updateSubmissionStatus
);

// Upload edited video
router.post('/editor/:submissionId/upload-edited',
  authMiddleware.authUserMiddleware,
  upload.single('editedVideo'),
  videoSubmissionController.uploadEditedVideo
);

// Add message to submission (editor)
router.post('/editor/:submissionId/message',
  authMiddleware.authUserMiddleware,
  videoSubmissionController.addMessage
);

// Get submission history (both food partner and editor)
router.get('/:submissionId/history',
  authMiddleware.profileDataMiddleware,
  videoSubmissionController.getSubmissionHistory
);

// Get food partner's edited videos
router.get('/food-partner/edited-videos',
  authMiddleware.authFoodPartnerMiddleware,
  videoSubmissionController.getEditedVideos
);

// Download edited video
router.get('/food-partner/:submissionId/download',
  authMiddleware.authFoodPartnerMiddleware,
  videoSubmissionController.downloadEditedVideo
);

module.exports = router;
