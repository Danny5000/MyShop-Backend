const express = require("express");
const router = express.Router();

//Product controller functions
const {
  getCart,
  addToCart,
  updateCart,
  deleteFromCart,
} = require("../controllers/cartController");

const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

router
  .route("/cart/:userid")
  .get(isAuthenticatedUser, authorizeRoles("user", "admin"), getCart);

router
  .route("/cart/:userid/:productid")
  .post(isAuthenticatedUser, authorizeRoles("user", "admin"), addToCart)
  .put(isAuthenticatedUser, authorizeRoles("user", "admin"), updateCart)
  .delete(isAuthenticatedUser, authorizeRoles("user", "admin"), deleteFromCart);

module.exports = router;
