const express = require("express");
const router = express.Router();

//Product controller functions
const {
  handlePurchase,
  validateCart,
} = require("../controllers/checkoutController");

const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

router
  .route("/checkout/:userid")
  .post(isAuthenticatedUser, authorizeRoles("user", "admin"), handlePurchase);

router.route("/validate-cart").get(isAuthenticatedUser, validateCart);

module.exports = router;
