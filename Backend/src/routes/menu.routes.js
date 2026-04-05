const express = require('express');
const menuController = require('../controllers/menu.controller');
const { authFoodPartnerMiddleware } = require('../middlewares/auth.middleware');
const router = express.Router();

router.post('/', authFoodPartnerMiddleware, menuController.createMenuItem);
router.get('/', authFoodPartnerMiddleware, menuController.getMenuItems);
router.put('/:itemId', authFoodPartnerMiddleware, menuController.updateMenuItem);
router.delete('/:itemId', authFoodPartnerMiddleware, menuController.deleteMenuItem);

module.exports = router;
