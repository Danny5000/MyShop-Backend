const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  logout,
  //forgotPassword,
  //resetPassword,
} = require("../controllers/authController");

const { isAuthenticatedUser } = require("../middleware/auth");

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").get(isAuthenticatedUser, logout);

module.exports = router;
