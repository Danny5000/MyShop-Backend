const express = require("express");
const router = express.Router();

//Product controller functions
const {
  makeSeller,
  getAccountStatus,
} = require("../controllers/stripeController");

const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

router
  .route("/make-seller")
  .post(isAuthenticatedUser, authorizeRoles("user"), makeSeller);

router
  .route("/get-account-status")
  .post(isAuthenticatedUser, authorizeRoles("user"), getAccountStatus);

module.exports = router;
