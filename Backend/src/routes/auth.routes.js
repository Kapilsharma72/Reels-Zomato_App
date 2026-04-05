const express = require('express');
const authController = require('../controllers/auth.controller');
const { authUserMiddleware, authFoodPartnerMiddleware } = require('../middlewares/auth.middleware');
const { authLimiter, forgotPasswordLimiter } = require('../middlewares/rateLimiter.middleware');

const router = express.Router();

//user auth routers

router.post('/user/register' , authController.registerUser);
router.post('/user/login' , authLimiter, authController.loginUser);
router.get('/user/logout' , authController.logoutUser);
router.get('/user/me' , authUserMiddleware, authController.getCurrentUser);

//foodPartner auth routers

router.post('/foodPartner/register' , authController.registerFoodPartner);
router.post('/foodPartner/login' , authLimiter, authController.loginFoodPartner);
router.get('/foodPartner/logout' , authController.logoutFoodPartner);
router.get('/foodPartner/me' , authFoodPartnerMiddleware, authController.getCurrentFoodPartner);
router.put('/foodPartner/profile' , authFoodPartnerMiddleware, authController.updateFoodPartnerProfile);
// Editor routes
router.get('/editors/available' , authController.getAvailableEditors);

// User profile & address routes
router.put('/user/profile', authUserMiddleware, authController.updateUserProfile);
router.put('/user/password', authUserMiddleware, authController.changePassword);
router.get('/user/addresses', authUserMiddleware, authController.getUserAddresses);
router.post('/user/addresses', authUserMiddleware, authController.addAddress);
router.delete('/user/addresses/:addressId', authUserMiddleware, authController.deleteAddress);

// Password reset routes
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

module.exports = router;