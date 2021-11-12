const express = require("express");
const router = express.Router();

//Stripe controller functions
const {
  makeSeller,
  getAccountStatus,
  processStripeCheckout,
  stripeSuccess,
} = require("../controllers/stripeController");

const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

router
  .route("/make-seller")
  .post(isAuthenticatedUser, authorizeRoles("user"), makeSeller);

router
  .route("/get-account-status")
  .post(isAuthenticatedUser, authorizeRoles("user"), getAccountStatus);

router
  .route("/stripe-checkout")
  .post(isAuthenticatedUser, authorizeRoles("user"), processStripeCheckout);

router
  .route("/stripe-success")
  .post(isAuthenticatedUser, authorizeRoles("user"), stripeSuccess);

module.exports = router;
