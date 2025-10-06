const express = require("express");
const { authUserMiddleware } = require("../middlewares/auth.middleware");
const foodPartnerVisitController = require("../controllers/foodPartnerVisit.controller");
const router = express.Router();

router.get("/:id", 
    authUserMiddleware, 
    foodPartnerVisitController.getFoodPartnerById);


module.exports = router;