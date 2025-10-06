const express = require('express');
const authController = require('../controllers/auth.controller');
const { authUserMiddleware, authFoodPartnerMiddleware } = require('../middlewares/auth.middleware');


const router = express.Router();

//user auth routers

router.post('/user/register' , authController.registerUser);
router.post('/user/login' , authController.loginUser);
router.get('/user/logout' , authController.logoutUser);
router.get('/user/me' , authUserMiddleware, authController.getCurrentUser);

//foodPartner auth routers

router.post('/foodPartner/register' , authController.registerFoodPartner);
router.post('/foodPartner/login' , authController.loginFoodPartner);
router.get('/foodPartner/logout' , authController.logoutFoodPartner);
router.get('/foodPartner/me' , authFoodPartnerMiddleware, authController.getCurrentFoodPartner);
router.put('/foodPartner/profile' , authFoodPartnerMiddleware, authController.updateFoodPartnerProfile);
router.get('/foodPartner/all' , authController.getAllFoodPartners); // Debug endpoint
router.get('/foodPartner/debug/:id' , authController.debugFoodPartnerById); // Debug endpoint
router.post('/foodPartner/create-test' , authController.createTestFoodPartner); // Debug endpoint

// Editor routes
router.get('/editors/available' , authController.getAvailableEditors);



module.exports = router;