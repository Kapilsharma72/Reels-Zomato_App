const express = require('express');
const adminController = require('../controllers/admin.controller');
const { authUserMiddleware, adminMiddleware } = require('../middlewares/auth.middleware');
const router = express.Router();

router.use(authUserMiddleware, adminMiddleware);
router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.put('/users/:userId/role', adminController.updateUserRole);
router.delete('/users/:userId', adminController.deactivateUser);

module.exports = router;
